import { Article, Highlight, AiAnalysis, AnalyticsData } from '../types';

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
