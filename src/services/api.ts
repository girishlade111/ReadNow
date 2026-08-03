import { Article, Highlight, AiAnalysis, AnalyticsData, Collection, Comment, AuditLog, EnterpriseSettings, WebhookConfig, WorkspaceRAGResponse } from '../types';
import { idb } from './db';
import { localStorageService } from './storage';

export const api = {
  async getArticles(): Promise<Article[]> {
    try {
      const res = await fetch('/api/articles');
      if (!res.ok) throw new Error('Failed to fetch articles');
      const data = await res.json();
      const articles: Article[] = data.articles || [];

      // Async cache into IndexedDB
      idb.saveArticlesBulk(articles).catch(err => console.warn('IndexedDB bulk save error:', err));
      
      // Auto-migrate legacy localStorage articles if present
      const legacy = localStorageService.getLegacyArticles();
      if (legacy.length > 0) {
        idb.saveArticlesBulk(legacy).catch(() => {});
        localStorageService.clearLegacyArticles();
      }

      return articles;
    } catch (e) {
      console.warn('API fetch failed, reading fallback from IndexedDB:', e);
      const cached = await idb.getAllArticles();
      if (cached.length > 0) return cached;
      
      // Secondary fallback to legacy localStorage
      return localStorageService.getLegacyArticles();
    }
  },

  async getArticleById(id: string): Promise<Article | null> {
    try {
      const res = await fetch(`/api/articles/${id}`);
      if (!res.ok) throw new Error('Article not found');
      const data = await res.json();
      if (data.article) {
        idb.saveArticle(data.article).catch(() => {});
      }
      return data.article;
    } catch (e) {
      console.warn(`Fetch article ${id} failed, reading from IndexedDB fallback`);
      const cached = await idb.getArticleById(id);
      if (cached) return cached;

      const articles = await this.getArticles();
      return articles.find(a => a.id === id) || null;
    }
  },

  async parseUrl(url: string, tags?: string[], collectionId?: string): Promise<Article> {
    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, tags, collectionId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to parse URL');
    
    if (data.article) {
      await idb.saveArticle(data.article);
    }
    return data.article;
  },

  async quickSave(doc: { title: string; content: string; url?: string; mediaType?: 'web' | 'text' | 'audio' | 'video'; collectionId?: string }): Promise<Article> {
    const res = await fetch('/api/quick-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save document');
    
    if (data.article) {
      await idb.saveArticle(data.article);
    }
    return data.article;
  },

  async updateArticle(id: string, updates: Partial<Article>): Promise<Article> {
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.article) {
        await idb.saveArticle(data.article);
      }
      return data.article;
    } catch (e) {
      const cached = await idb.getArticleById(id);
      if (cached) {
        const updated = { ...cached, ...updates };
        await idb.saveArticle(updated);
        return updated;
      }
      throw e;
    }
  },

  async deleteArticle(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      await idb.deleteArticle(id);
      return res.ok;
    } catch (e) {
      await idb.deleteArticle(id);
      return true;
    }
  },

  async askAiCopilot(articleId: string, question: string): Promise<string> {
    const res = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, question })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'AI Copilot failed');
    return data.answer;
  },

  async askWorkspaceRAG(query: string): Promise<WorkspaceRAGResponse> {
    const res = await fetch('/api/ai/workspace-ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Workspace RAG query failed');
    return data;
  },

  async generateTeamDigest() {
    const res = await fetch('/api/ai/digest', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate digest');
    return data.digest;
  },

  async translateArticle(articleId: string, targetLanguage: string) {
    const res = await fetch('/api/ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, targetLanguage })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Translation failed');
    return data;
  },

  async getHighlights(articleId: string): Promise<Highlight[]> {
    try {
      const res = await fetch(`/api/highlights?articleId=${articleId}`);
      const data = await res.json();
      const highlights: Highlight[] = data.highlights || [];
      highlights.forEach(h => idb.saveHighlight(h).catch(() => {}));
      return highlights;
    } catch (e) {
      return idb.getHighlights(articleId);
    }
  },

  async addHighlight(articleId: string, text: string, color: 'yellow' | 'green' | 'pink' | 'blue', note?: string): Promise<Highlight> {
    const res = await fetch('/api/highlights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, text, color, note })
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Failed to save highlight');
    if (data.highlight) {
      await idb.saveHighlight(data.highlight);
    }
    return data.highlight;
  },

  async deleteHighlight(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/highlights/${id}`, { method: 'DELETE' });
      await idb.deleteHighlight(id);
      return res.ok;
    } catch (e) {
      await idb.deleteHighlight(id);
      return true;
    }
  },

  // Collaborative Comments
  async getComments(articleId: string): Promise<Comment[]> {
    try {
      const res = await fetch(`/api/comments?articleId=${articleId}`);
      const data = await res.json();
      const comments = data.comments || [];
      comments.forEach((c: Comment) => idb.saveComment(c).catch(() => {}));
      return comments;
    } catch (e) {
      return idb.getComments(articleId);
    }
  },

  async addComment(articleId: string, author: string, text: string): Promise<Comment> {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId, author, text })
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Failed to add comment');
    if (data.comment) {
      await idb.saveComment(data.comment);
    }
    return data.comment;
  },

  // Shared Collections
  async getCollections(): Promise<Collection[]> {
    try {
      const res = await fetch('/api/collections');
      const data = await res.json();
      const collections = data.collections || [];
      collections.forEach((c: Collection) => idb.saveCollection(c).catch(() => {}));
      return collections;
    } catch (e) {
      return idb.getCollections();
    }
  },

  async createCollection(name: string, description?: string, color?: string): Promise<Collection> {
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, color })
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Failed to create collection');
    if (data.collection) {
      await idb.saveCollection(data.collection);
    }
    return data.collection;
  },

  async deleteCollection(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
      await idb.deleteCollection(id);
      return res.ok;
    } catch (e) {
      await idb.deleteCollection(id);
      return true;
    }
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      const auditLogs = data.auditLogs || [];
      auditLogs.forEach((log: AuditLog) => idb.saveAuditLog(log).catch(() => {}));
      return auditLogs;
    } catch (e) {
      return idb.getAuditLogs();
    }
  },

  // Settings & Governance
  async getSettings(): Promise<EnterpriseSettings> {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) {
        idb.saveSettings(data.settings).catch(() => {});
      }
      return data.settings;
    } catch (e) {
      const cached = await idb.getSettings();
      return cached || { dlpEnabled: false, zeroDataRetention: true, autoDigestSchedule: 'weekly', retentionDays: 365 };
    }
  },

  async updateSettings(settings: Partial<EnterpriseSettings>): Promise<EnterpriseSettings> {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Failed to update settings');
    if (data.settings) {
      await idb.saveSettings(data.settings);
    }
    return data.settings;
  },

  // Webhooks
  async getWebhooks(): Promise<WebhookConfig[]> {
    try {
      const res = await fetch('/api/webhooks');
      const data = await res.json();
      return data.webhooks || [];
    } catch (e) {
      return [];
    }
  },

  async createWebhook(name: string, url: string, events?: string[]): Promise<WebhookConfig> {
    const res = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, url, events })
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Failed to save webhook');
    return data.webhook;
  },

  async deleteWebhook(id: string): Promise<boolean> {
    const res = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  async testWebhook(url: string): Promise<string> {
    const res = await fetch('/api/webhooks/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Webhook ping failed');
    return data.message;
  },

  async getAnalytics(): Promise<AnalyticsData> {
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      return data.analytics;
    } catch (e) {
      const articles = await idb.getAllArticles();
      const highlights = await idb.getHighlights();
      const readArticles = articles.filter(a => a.readProgress >= 80);
      const totalWords = readArticles.reduce((acc, a) => acc + (a.textContent ? a.textContent.split(/\s+/).length : 0), 0);

      return {
        totalArticles: articles.length,
        articlesRead: readArticles.length,
        totalReadingTimeMinutes: Math.round(totalWords / 200),
        timeSavedMinutes: readArticles.length * 3,
        readingStreakDays: 1,
        highlightsCount: highlights.length,
        topCategories: []
      };
    }
  }
};
