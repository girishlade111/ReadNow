import express from "express";
import { createServer as createViteServer } from "vite";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import path from "path";
import { db, Article } from "./server/db.js";
import { generateArticleAnalysis, askArticleCopilot, translateArticleText, askWorkspaceRAG, generateTeamDigest, maskPII } from "./server/ai.js";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to calculate reading time in minutes
function calculateReadingTime(textContent: string): number {
  const words = textContent ? textContent.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

// Outbound Webhook Dispatcher
async function dispatchWebhook(event: string, payload: any) {
  try {
    const webhooks = db.getWebhooks().filter(w => w.enabled && w.events.includes(event));
    for (const wh of webhooks) {
      fetch(wh.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, timestamp: new Date().toISOString(), payload })
      }).catch(err => console.warn(`Webhook ${wh.name} dispatch failed:`, err.message));
    }
  } catch (err) {
    console.error("Error dispatching webhook:", err);
  }
}

// 1. Article Parsing & Persistence
app.post("/api/parse", async (req, res) => {
  const { url, tags, collectionId } = req.body;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    let urlObj: URL;
    try {
      urlObj = new URL(targetUrl);
    } catch {
      return res.status(400).json({ error: "Invalid URL syntax. Please enter a valid web address." });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let html = "";
    try {
      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "Sec-Ch-Ua": '"Chromium";v="123", "Not:A-Brand";v="8"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "cross-site",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1"
        }
      });

      html = await response.text();

      if (!response.ok && !html.trim()) {
        throw new Error(`Failed to fetch webpage (HTTP ${response.status} ${response.statusText})`);
      }
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        throw new Error("Request timed out while connecting to the target website (15s limit).");
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!html || !html.trim()) {
      throw new Error("Target webpage returned an empty response.");
    }

    const doc = new JSDOM(html, { url: targetUrl });
    const document = doc.window.document;

    // Remove unwanted interactive/script elements before parsing
    const scripts = document.querySelectorAll("script, style, noscript, svg, iframe, form");
    scripts.forEach(s => s.remove());

    const reader = new Readability(document);
    const parsed = reader.parse();

    let title = parsed?.title?.trim() || "";
    let content = parsed?.content?.trim() || "";
    let textContent = parsed?.textContent?.trim() || "";
    let byline = parsed?.byline?.trim() || null;
    let excerpt = parsed?.excerpt?.trim() || null;
    let siteName = parsed?.siteName?.trim() || null;
    let publishedTime = parsed?.publishedTime || null;

    // Fallback extraction if Readability failed or returned very minimal content
    if (!content || textContent.length < 80) {
      // 1. Extract Title Fallback
      if (!title) {
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
        const twTitle = document.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
        const docTitle = document.title;
        const h1Title = document.querySelector('h1')?.textContent?.trim();
        title = ogTitle || twTitle || docTitle || h1Title || urlObj.hostname;
      }

      // 2. Extract Site Name Fallback
      if (!siteName) {
        const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
        const hostname = urlObj.hostname.replace(/^www\./, '');
        siteName = ogSiteName || (hostname.charAt(0).toUpperCase() + hostname.slice(1));
      }

      // 3. Extract Excerpt Fallback
      if (!excerpt) {
        const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
        const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content');
        excerpt = ogDesc || metaDesc || null;
      }

      // 4. Extract Author Fallback
      if (!byline) {
        const metaAuthor = document.querySelector('meta[name="author"]')?.getAttribute('content') ||
                           document.querySelector('meta[property="article:author"]')?.getAttribute('content');
        byline = metaAuthor || null;
      }

      // 5. Extract Main DOM Content
      const mainContainer = document.querySelector('main, article, #content, .content, .post-content, .entry-content, .article-body, body');
      if (mainContainer) {
        const paragraphs = Array.from(mainContainer.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote'));
        if (paragraphs.length > 0) {
          content = paragraphs.map(p => p.outerHTML).join('\n');
          textContent = paragraphs.map(p => p.textContent?.trim() || '').filter(Boolean).join('\n\n');
        } else {
          textContent = mainContainer.textContent?.trim() || "";
          content = `<p>${textContent.replace(/\n\n+/g, '</p><p>')}</p>`;
        }
      }

      // Final safety check
      if (!textContent) {
        textContent = document.body?.textContent?.trim() || "No text content available.";
        content = `<p>${textContent.replace(/\n\n+/g, '</p><p>')}</p>`;
      }

      if (!excerpt) {
        excerpt = textContent.slice(0, 200) + '...';
      }
    }

    const hostname = urlObj.hostname.replace(/^www\./, '');
    if (!siteName) {
      siteName = hostname.charAt(0).toUpperCase() + hostname.slice(1);
    }
    if (!title) {
      title = `Article from ${siteName}`;
    }

    const id = Math.random().toString(36).substring(2, 15);

    // Apply DLP PII Masking if enabled
    const settings = db.getSettings();
    if (settings.dlpEnabled) {
      textContent = maskPII(textContent);
    }

    const readingTime = calculateReadingTime(textContent);
    const aiAnalysis = await generateArticleAnalysis(title, textContent);

    // Combine user-provided tags with AI tags
    const combinedTags = Array.isArray(tags) && tags.length > 0
      ? Array.from(new Set([...tags, ...(aiAnalysis.suggestedTags || [])]))
      : (aiAnalysis.suggestedTags || [siteName]);

    const newArticle: Article = {
      id,
      url: targetUrl,
      title,
      byline,
      dir: null,
      content,
      textContent,
      length: textContent.length,
      excerpt,
      siteName,
      publishedTime,
      savedAt: new Date().toISOString(),
      isArchived: false,
      isFavorite: false,
      readProgress: 0,
      tags: combinedTags,
      collectionId: collectionId || undefined,
      mediaType: 'web',
      aiAnalysis: {
        ...aiAnalysis,
        readingTimeMinutes: readingTime
      }
    };

    const saved = db.saveArticle(newArticle);
    db.addAuditLog('ARTICLE_SAVED', 'Enterprise User', `Saved web article: "${newArticle.title}"`);
    dispatchWebhook('ARTICLE_SAVED', { id: saved.id, title: saved.title, url: saved.url });

    res.json({ success: true, article: saved });

  } catch (error: any) {
    console.error("Error parsing URL:", error);
    res.status(500).json({ error: error.message || "Failed to parse URL" });
  }
});

// Quick Save API (for Bookmarklet, Chrome Extension, Text, Video/Audio transcription ingest)
app.post("/api/quick-save", async (req, res) => {
  const { title, content, url, mediaType, collectionId } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  try {
    const id = Math.random().toString(36).substring(2, 15);
    let textContent = content.replace(/<[^>]*>?/gm, '');
    
    const settings = db.getSettings();
    if (settings.dlpEnabled) {
      textContent = maskPII(textContent);
    }

    const readingTime = calculateReadingTime(textContent);
    const aiAnalysis = await generateArticleAnalysis(title, textContent);

    const newArticle: Article = {
      id,
      url: url || 'https://readnow.internal/custom-doc',
      title,
      byline: 'Enterprise Contributor',
      dir: null,
      content: `<p>${content.replace(/\n\n/g, '</p><p>')}</p>`,
      textContent,
      length: textContent.length,
      excerpt: textContent.slice(0, 200),
      siteName: mediaType === 'audio' ? 'Podcast' : mediaType === 'video' ? 'Video Transcript' : 'Internal Doc',
      publishedTime: new Date().toISOString(),
      savedAt: new Date().toISOString(),
      isArchived: false,
      isFavorite: false,
      readProgress: 0,
      tags: aiAnalysis.suggestedTags || ['QuickSave'],
      collectionId: collectionId || undefined,
      mediaType: mediaType || 'text',
      aiAnalysis: {
        ...aiAnalysis,
        readingTimeMinutes: readingTime
      }
    };

    const saved = db.saveArticle(newArticle);
    db.addAuditLog('ARTICLE_SAVED', 'Enterprise Extension/QuickSave', `Ingested quick document: "${title}"`);
    dispatchWebhook('ARTICLE_SAVED', { id: saved.id, title: saved.title, url: saved.url });

    res.json({ success: true, article: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Article CRUD Endpoints
app.get("/api/articles", (req, res) => {
  try {
    const articles = db.getArticles();
    res.json({ articles });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/articles/:id", (req, res) => {
  try {
    const article = db.getArticleById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }
    res.json({ article });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/articles/:id", (req, res) => {
  try {
    const existing = db.getArticleById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Article not found" });
    }
    const updated = db.saveArticle({ ...existing, ...req.body });
    res.json({ article: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/articles/:id", (req, res) => {
  try {
    const existing = db.getArticleById(req.params.id);
    const title = existing ? existing.title : req.params.id;
    const success = db.deleteArticle(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Article not found" });
    }
    db.addAuditLog('ARTICLE_DELETED', 'Enterprise User', `Deleted article: "${title}"`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. AI Endpoints
app.post("/api/ai/summarize", async (req, res) => {
  const { articleId } = req.body;
  if (!articleId) return res.status(400).json({ error: "Article ID required" });

  const article = db.getArticleById(articleId);
  if (!article) return res.status(404).json({ error: "Article not found" });

  try {
    const analysis = await generateArticleAnalysis(article.title, article.textContent);
    const updated = db.saveArticle({
      ...article,
      aiAnalysis: {
        ...analysis,
        readingTimeMinutes: calculateReadingTime(article.textContent)
      }
    });
    res.json({ aiAnalysis: updated.aiAnalysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/ai/ask", async (req, res) => {
  const { articleId, question } = req.body;
  if (!articleId || !question) {
    return res.status(400).json({ error: "articleId and question are required" });
  }

  const article = db.getArticleById(articleId);
  if (!article) return res.status(404).json({ error: "Article not found" });

  try {
    const answer = await askArticleCopilot(article.title, article.textContent, question);
    res.json({ answer });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Workspace-Wide RAG AI Search Endpoint
app.post("/api/ai/workspace-ask", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query is required." });

  try {
    const articles = db.getArticles();
    const result = await askWorkspaceRAG(articles, query);
    db.addAuditLog('AI_RAG_QUERY', 'Enterprise User', `Queried Workspace AI: "${query}"`);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Team AI Digest Generator Endpoint
app.post("/api/ai/digest", async (req, res) => {
  try {
    const articles = db.getArticles();
    const digest = await generateTeamDigest(articles);
    db.addAuditLog('DIGEST_GENERATED', 'Enterprise System', `Generated Team Knowledge Digest: "${digest.digestTitle}"`);
    dispatchWebhook('DIGEST_GENERATED', digest);
    res.json({ digest });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/ai/translate", async (req, res) => {
  const { articleId, targetLanguage } = req.body;
  if (!articleId || !targetLanguage) {
    return res.status(400).json({ error: "articleId and targetLanguage required" });
  }

  const article = db.getArticleById(articleId);
  if (!article) return res.status(404).json({ error: "Article not found" });

  try {
    const translation = await translateArticleText(article.title, article.content, targetLanguage);
    const translations = article.translations || {};
    translations[targetLanguage] = translation;

    const updated = db.saveArticle({ ...article, translations });
    res.json({ translation, article: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Highlights & Comments
app.get("/api/highlights", (req, res) => {
  const { articleId } = req.query;
  const highlights = db.getHighlights(articleId as string);
  res.json({ highlights });
});

app.post("/api/highlights", (req, res) => {
  const { articleId, text, color, note } = req.body;
  if (!articleId || !text) {
    return res.status(400).json({ error: "articleId and text are required" });
  }

  const id = Math.random().toString(36).substring(2, 15);
  const newHighlight = {
    id,
    articleId,
    text,
    color: color || 'yellow',
    note: note || '',
    createdAt: new Date().toISOString()
  };

  const saved = db.saveHighlight(newHighlight);
  db.addAuditLog('HIGHLIGHT_ADDED', 'Enterprise User', `Highlighted text in article ${articleId}`);
  res.json({ highlight: saved });
});

app.delete("/api/highlights/:id", (req, res) => {
  const success = db.deleteHighlight(req.params.id);
  res.json({ success });
});

// Collaborative Comments
app.get("/api/comments", (req, res) => {
  const { articleId } = req.query;
  if (!articleId) return res.status(400).json({ error: "articleId required" });
  const comments = db.getComments(articleId as string);
  res.json({ comments });
});

app.post("/api/comments", (req, res) => {
  const { articleId, author, text } = req.body;
  if (!articleId || !text) return res.status(400).json({ error: "articleId and text required" });

  const comment = {
    id: `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    articleId,
    author: author || 'Team Member',
    text,
    createdAt: new Date().toISOString()
  };

  const saved = db.addComment(comment);
  res.json({ comment: saved });
});

// 5. Shared Collections API
app.get("/api/collections", (req, res) => {
  const collections = db.getCollections();
  res.json({ collections });
});

app.post("/api/collections", (req, res) => {
  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ error: "Collection name required" });

  const newCol = {
    id: `col-${Math.random().toString(36).substring(2, 9)}`,
    name,
    description: description || '',
    color: color || '#3B82F6',
    createdAt: new Date().toISOString()
  };

  const saved = db.saveCollection(newCol);
  res.json({ collection: saved });
});

app.delete("/api/collections/:id", (req, res) => {
  const success = db.deleteCollection(req.params.id);
  res.json({ success });
});

// 6. Audit Logs API
app.get("/api/audit-logs", (req, res) => {
  const auditLogs = db.getAuditLogs();
  res.json({ auditLogs });
});

// 7. Settings & Governance API
app.get("/api/settings", (req, res) => {
  const settings = db.getSettings();
  res.json({ settings });
});

app.patch("/api/settings", (req, res) => {
  const updated = db.saveSettings(req.body);
  db.addAuditLog('SETTINGS_UPDATED', 'Admin', 'Updated Enterprise Data Governance Settings');
  res.json({ settings: updated });
});

// 8. Webhooks API
app.get("/api/webhooks", (req, res) => {
  const webhooks = db.getWebhooks();
  res.json({ webhooks });
});

app.post("/api/webhooks", (req, res) => {
  const { name, url, events, enabled } = req.body;
  if (!name || !url) return res.status(400).json({ error: "Name and Webhook URL required" });

  const wh = {
    id: `wh-${Math.random().toString(36).substring(2, 9)}`,
    name,
    url,
    events: events || ['ARTICLE_SAVED', 'DIGEST_GENERATED'],
    enabled: enabled !== false
  };

  const saved = db.saveWebhook(wh);
  res.json({ webhook: saved });
});

app.delete("/api/webhooks/:id", (req, res) => {
  const success = db.deleteWebhook(req.params.id);
  res.json({ success });
});

app.post("/api/webhooks/test", (req, res) => {
  const { url } = req.body;
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'TEST_PING',
      timestamp: new Date().toISOString(),
      message: 'ReadNow Enterprise Webhook Connection Verified Successfully.'
    })
  })
  .then(() => res.json({ success: true, message: "Webhook ping sent successfully." }))
  .catch(err => res.status(500).json({ error: `Webhook ping failed: ${err.message}` }));
});

// 9. Enterprise Analytics
app.get("/api/analytics", (req, res) => {
  try {
    const analytics = db.getAnalytics();
    res.json({ analytics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Export API
app.post("/api/export", (req, res) => {
  const { articleId, format } = req.body;
  const article = db.getArticleById(articleId);
  if (!article) return res.status(404).json({ error: "Article not found" });

  const highlights = db.getHighlights(articleId);
  db.addAuditLog('EXPORT_PERFORMED', 'Enterprise User', `Exported article "${article.title}" as ${format}`);

  if (format === 'markdown') {
    let md = `# ${article.title}\n\n`;
    md += `* **Source**: [${article.siteName || article.url}](${article.url})\n`;
    if (article.byline) md += `* **Author**: ${article.byline}\n`;
    md += `* **Saved**: ${new Date(article.savedAt).toLocaleDateString()}\n\n`;

    if (article.aiAnalysis?.summary) {
      md += `## Executive Summary\n\n> ${article.aiAnalysis.summary}\n\n`;
    }

    if (article.aiAnalysis?.keyTakeaways?.length) {
      md += `## Key Takeaways\n\n`;
      article.aiAnalysis.keyTakeaways.forEach(t => md += `- ${t}\n`);
      md += `\n`;
    }

    if (highlights.length > 0) {
      md += `## Highlights & Notes\n\n`;
      highlights.forEach(h => {
        md += `> "${h.text}"\n`;
        if (h.note) md += `*Note: ${h.note}*\n`;
        md += `\n`;
      });
    }

    md += `## Article Content\n\n${article.textContent}\n`;

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${article.title.replace(/[^a-zA-Z0-9]/g, '_')}.md"`);
    return res.send(md);
  }

  res.json({ article, highlights });
});


async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ReadNow Enterprise Server running on http://localhost:${PORT}`);
  });
}

startServer();
