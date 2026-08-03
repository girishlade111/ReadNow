import { Article, Highlight, AiAnalysis, AnalyticsData, Collection, Comment, AuditLog, EnterpriseSettings, WebhookConfig, WorkspaceRAGResponse } from '../types';

export const api = {
  async getArticles(): Promise<Article[]> {
    try {
      const res = await fetch('/api/articles');
      if (!res.ok) throw new Error('Failed to fetch articles');
      const data = await res.json();
      return data.articles || [];
    } catch (e) {
      console.warn('API fetch failed, reading fallback from localStorage:', e);
      const saved = localStorage.getItem('readnow_articles');
      return saved ? JSON.parse(saved) : [];
    }
  },

  async getArticleById(id: string): Promise<Article | null> {
    try {
      const res = await fetch(`/api/articles/${id}`);
      if (!res.ok) throw new Error('Article not found');
      const data = await res.json();
      return data.article;
    } catch (e) {
      const articles = await this.getArticles();
      return articles.find(a => a.id === id) || null;
    }
  },

  async parseUrl(url: string): Promise<Article> {
    const res = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to parse URL');
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
      return data.article;
    } catch (e) {
      const articles = await this.getArticles();
      const idx = articles.findIndex(a => a.id === id);
      if (idx >= 0) {
        articles[idx] = { ...articles[idx], ...updates };
        localStorage.setItem('readnow_articles', JSON.stringify(articles));
        return articles[idx];
      }
      throw e;
    }
  },

  async deleteArticle(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch (e) {
      const articles = await this.getArticles();
      const filtered = articles.filter(a => a.id !== id);
      localStorage.setItem('readnow_articles', JSON.stringify(filtered));
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
      return data.highlights || [];
    } catch (e) {
      return [];
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
    return data.highlight;
  },

  async deleteHighlight(id: string): Promise<boolean> {
    const res = await fetch(`/api/highlights/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // Collaborative Comments
  async getComments(articleId: string): Promise<Comment[]> {
    try {
      const res = await fetch(`/api/comments?articleId=${articleId}`);
      const data = await res.json();
      return data.comments || [];
    } catch (e) {
      return [];
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
    return data.comment;
  },

  // Shared Collections
  async getCollections(): Promise<Collection[]> {
    try {
      const res = await fetch('/api/collections');
      const data = await res.json();
      return data.collections || [];
    } catch (e) {
      return [];
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
    return data.collection;
  },

  async deleteCollection(id: string): Promise<boolean> {
    const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      return data.auditLogs || [];
    } catch (e) {
      return [];
    }
  },

  // Settings & Governance
  async getSettings(): Promise<EnterpriseSettings> {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      return data.settings;
    } catch (e) {
      return { dlpEnabled: false, zeroDataRetention: true, autoDigestSchedule: 'weekly', retentionDays: 365 };
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
      return {
        totalArticles: 0,
        articlesRead: 0,
        totalReadingTimeMinutes: 0,
        timeSavedMinutes: 0,
        readingStreakDays: 1,
        highlightsCount: 0,
        topCategories: []
      };
    }
  }
};

