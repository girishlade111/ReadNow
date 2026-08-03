import express from "express";
import { createServer as createViteServer } from "vite";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import path from "path";
import { db, Article } from "./server/db.js";
import { generateArticleAnalysis, askArticleCopilot, translateArticleText } from "./server/ai.js";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to calculate reading time in minutes
function calculateReadingTime(textContent: string): number {
  const words = textContent ? textContent.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

// 1. Article Parsing & Persistence
app.post("/api/parse", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    new URL(url); // Validate URL syntax

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const doc = new JSDOM(html, { url });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error("Could not parse article content from this web page.");
    }

    const id = Math.random().toString(36).substring(2, 15);
    const readingTime = calculateReadingTime(article.textContent);
    
    // Default site name fallback
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const siteName = article.siteName || hostname.charAt(0).toUpperCase() + hostname.slice(1);

    // Initial AI analysis
    const aiAnalysis = await generateArticleAnalysis(article.title || "Untitled Article", article.textContent || "");

    const newArticle: Article = {
      id,
      url,
      title: article.title || "Untitled Article",
      byline: article.byline || null,
      dir: article.dir || null,
      content: article.content || "",
      textContent: article.textContent || "",
      length: article.length || 0,
      excerpt: article.excerpt || article.textContent?.slice(0, 200) || null,
      siteName,
      publishedTime: article.publishedTime || null,
      savedAt: new Date().toISOString(),
      isArchived: false,
      isFavorite: false,
      readProgress: 0,
      tags: aiAnalysis.suggestedTags || [siteName],
      aiAnalysis: {
        ...aiAnalysis,
        readingTimeMinutes: readingTime
      }
    };

    const saved = db.saveArticle(newArticle);
    res.json({ success: true, article: saved });

  } catch (error: any) {
    console.error("Error parsing URL:", error);
    res.status(500).json({ error: error.message || "Failed to parse URL" });
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
    const success = db.deleteArticle(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Article not found" });
    }
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

// 4. Highlights & Annotations
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
  res.json({ highlight: saved });
});

app.delete("/api/highlights/:id", (req, res) => {
  const success = db.deleteHighlight(req.params.id);
  res.json({ success });
});

// 5. Enterprise Analytics
app.get("/api/analytics", (req, res) => {
  try {
    const analytics = db.getAnalytics();
    res.json({ analytics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Export API
app.post("/api/export", (req, res) => {
  const { articleId, format } = req.body;
  const article = db.getArticleById(articleId);
  if (!article) return res.status(404).json({ error: "Article not found" });

  const highlights = db.getHighlights(articleId);

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
    res.setHeader('Content-Disposition', `attachment; filename="${article.title.replace(/[^a-[#a-zA-Z0-9]/g, '_')}.md"`);
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
