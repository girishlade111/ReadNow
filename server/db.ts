import fs from 'fs';
import path from 'path';

export interface Highlight {
  id: string;
  articleId: string;
  text: string;
  color: 'yellow' | 'green' | 'pink' | 'blue';
  note?: string;
  createdAt: string;
}

export interface AiAnalysis {
  summary?: string;
  keyTakeaways?: string[];
  actionItems?: string[];
  sentiment?: 'Positive' | 'Neutral' | 'Analytical' | 'Critical';
  readingTimeMinutes?: number;
  suggestedTags?: string[];
}

export interface Article {
  id: string;
  url: string;
  title: string;
  content: string;
  textContent: string;
  excerpt: string | null;
  siteName: string | null;
  byline: string | null;
  publishedTime: string | null;
  length: number;
  dir: string | null;
  savedAt: string;
  isArchived: boolean;
  isFavorite: boolean;
  readProgress: number;
  tags: string[];
  collectionId?: string;
  mediaType?: 'web' | 'text' | 'audio' | 'video';
  aiAnalysis?: AiAnalysis;
  translations?: Record<string, { title: string; content: string; summary?: string }>;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  articleId: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'ARTICLE_SAVED' | 'ARTICLE_DELETED' | 'HIGHLIGHT_ADDED' | 'EXPORT_PERFORMED' | 'AI_RAG_QUERY' | 'DIGEST_GENERATED' | 'SETTINGS_UPDATED';
  actor: string;
  details: string;
  ipAddress?: string;
}

export interface EnterpriseSettings {
  dlpEnabled: boolean;
  zeroDataRetention: boolean;
  autoDigestSchedule: 'none' | 'daily' | 'weekly';
  retentionDays: number;
  slackWebhookUrl?: string;
  customWebhookUrl?: string;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
}

interface DatabaseSchema {
  articles: Article[];
  highlights: Highlight[];
  collections: Collection[];
  comments: Comment[];
  auditLogs: AuditLog[];
  settings: EnterpriseSettings;
  webhooks: WebhookConfig[];
  analytics: {
    readingStreakDays: number;
    lastReadDate: string | null;
  };
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'readnow_db.json');

const DEFAULT_SETTINGS: EnterpriseSettings = {
  dlpEnabled: false,
  zeroDataRetention: true,
  autoDigestSchedule: 'weekly',
  retentionDays: 365,
  slackWebhookUrl: '',
  customWebhookUrl: ''
};

const DEFAULT_COLLECTIONS: Collection[] = [
  { id: 'col-engineering', name: 'Engineering & Tech', description: 'Technical whitepapers and docs', color: '#3B82F6', createdAt: new Date().toISOString() },
  { id: 'col-research', name: 'Market Research', description: 'Industry reports and competitor analysis', color: '#10B981', createdAt: new Date().toISOString() },
  { id: 'col-strategy', name: 'Product Strategy', description: 'Product roadmaps & framework articles', color: '#8B5CF6', createdAt: new Date().toISOString() }
];

// Ensure database directory and file exist
function initDb(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      articles: [],
      highlights: [],
      collections: DEFAULT_COLLECTIONS,
      comments: [],
      auditLogs: [
        {
          id: 'log-init',
          timestamp: new Date().toISOString(),
          action: 'SETTINGS_UPDATED',
          actor: 'System Admin',
          details: 'Enterprise Data Governance Database Initialized'
        }
      ],
      settings: DEFAULT_SETTINGS,
      webhooks: [
        {
          id: 'wh-slack',
          name: 'Corporate Slack Channel',
          url: 'https://hooks.slack.com/services/demo/channel',
          events: ['ARTICLE_SAVED', 'DIGEST_GENERATED'],
          enabled: false
        }
      ],
      analytics: {
        readingStreakDays: 1,
        lastReadDate: new Date().toISOString()
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      articles: parsed.articles || [],
      highlights: parsed.highlights || [],
      collections: parsed.collections || DEFAULT_COLLECTIONS,
      comments: parsed.comments || [],
      auditLogs: parsed.auditLogs || [],
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      webhooks: parsed.webhooks || [],
      analytics: parsed.analytics || { readingStreakDays: 1, lastReadDate: new Date().toISOString() }
    };
  } catch (err) {
    console.error('Failed to parse database file, resetting:', err);
    const initialData: DatabaseSchema = {
      articles: [],
      highlights: [],
      collections: DEFAULT_COLLECTIONS,
      comments: [],
      auditLogs: [],
      settings: DEFAULT_SETTINGS,
      webhooks: [],
      analytics: { readingStreakDays: 1, lastReadDate: new Date().toISOString() }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

function saveDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

export const db = {
  getArticles(): Article[] {
    const data = initDb();
    return data.articles || [];
  },

  getArticleById(id: string): Article | undefined {
    const articles = this.getArticles();
    return articles.find(a => a.id === id);
  },

  saveArticle(article: Article): Article {
    const data = initDb();
    const index = data.articles.findIndex(a => a.id === article.id);
    if (index >= 0) {
      data.articles[index] = { ...data.articles[index], ...article };
    } else {
      data.articles.unshift(article);
    }
    saveDb(data);
    return article;
  },

  deleteArticle(id: string): boolean {
    const data = initDb();
    const initialLen = data.articles.length;
    data.articles = data.articles.filter(a => a.id !== id);
    data.highlights = data.highlights.filter(h => h.articleId !== id);
    data.comments = data.comments.filter(c => c.articleId !== id);
    saveDb(data);
    return data.articles.length < initialLen;
  },

  getHighlights(articleId?: string): Highlight[] {
    const data = initDb();
    if (articleId) {
      return (data.highlights || []).filter(h => h.articleId === articleId);
    }
    return data.highlights || [];
  },

  saveHighlight(highlight: Highlight): Highlight {
    const data = initDb();
    data.highlights.push(highlight);
    saveDb(data);
    return highlight;
  },

  deleteHighlight(id: string): boolean {
    const data = initDb();
    const initialLen = data.highlights.length;
    data.highlights = data.highlights.filter(h => h.id !== id);
    saveDb(data);
    return data.highlights.length < initialLen;
  },

  // Collections
  getCollections(): Collection[] {
    const data = initDb();
    const articles = data.articles || [];
    return (data.collections || []).map(col => ({
      ...col,
      articleCount: articles.filter(a => a.collectionId === col.id).length
    }));
  },

  saveCollection(col: Collection): Collection {
    const data = initDb();
    const idx = data.collections.findIndex(c => c.id === col.id);
    if (idx >= 0) {
      data.collections[idx] = col;
    } else {
      data.collections.push(col);
    }
    saveDb(data);
    return col;
  },

  deleteCollection(id: string): boolean {
    const data = initDb();
    data.collections = data.collections.filter(c => c.id !== id);
    // Unassign articles from deleted collection
    data.articles = data.articles.map(a => a.collectionId === id ? { ...a, collectionId: undefined } : a);
    saveDb(data);
    return true;
  },

  // Comments & Collaborative Annotations
  getComments(articleId: string): Comment[] {
    const data = initDb();
    return (data.comments || []).filter(c => c.articleId === articleId);
  },

  addComment(comment: Comment): Comment {
    const data = initDb();
    data.comments.push(comment);
    saveDb(data);
    return comment;
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    const data = initDb();
    return data.auditLogs || [];
  },

  addAuditLog(action: AuditLog['action'], actor: string, details: string): AuditLog {
    const data = initDb();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      actor,
      details
    };
    data.auditLogs.unshift(newLog);
    // Keep max 500 logs
    if (data.auditLogs.length > 500) {
      data.auditLogs = data.auditLogs.slice(0, 500);
    }
    saveDb(data);
    return newLog;
  },

  // Settings & Governance
  getSettings(): EnterpriseSettings {
    const data = initDb();
    return data.settings || DEFAULT_SETTINGS;
  },

  saveSettings(newSettings: Partial<EnterpriseSettings>): EnterpriseSettings {
    const data = initDb();
    data.settings = { ...data.settings, ...newSettings };
    saveDb(data);
    return data.settings;
  },

  // Webhooks
  getWebhooks(): WebhookConfig[] {
    const data = initDb();
    return data.webhooks || [];
  },

  saveWebhook(wh: WebhookConfig): WebhookConfig {
    const data = initDb();
    const idx = data.webhooks.findIndex(w => w.id === wh.id);
    if (idx >= 0) {
      data.webhooks[idx] = wh;
    } else {
      data.webhooks.push(wh);
    }
    saveDb(data);
    return wh;
  },

  deleteWebhook(id: string): boolean {
    const data = initDb();
    data.webhooks = data.webhooks.filter(w => w.id !== id);
    saveDb(data);
    return true;
  },

  getAnalytics() {
    const data = initDb();
    const articles = data.articles || [];
    const highlights = data.highlights || [];
    
    const readArticles = articles.filter(a => a.readProgress >= 80);
    const totalWords = readArticles.reduce((acc, a) => acc + (a.textContent ? a.textContent.split(/\s+/).length : 0), 0);
    const totalReadingTimeMinutes = Math.round(totalWords / 200); // 200 wpm standard
    
    // Time saved calculation (AI summary reading takes ~1 min vs full article)
    const timeSavedMinutes = readArticles.reduce((acc, a) => {
      const fullEst = Math.ceil((a.textContent ? a.textContent.split(/\s+/).length : 0) / 200);
      return acc + Math.max(0, fullEst - 1);
    }, 0);

    // Categories breakdown
    const categoryCounts: Record<string, number> = {};
    articles.forEach(a => {
      const site = a.siteName || (a.url ? new URL(a.url).hostname.replace('www.', '') : 'Web');
      categoryCounts[site] = (categoryCounts[site] || 0) + 1;
      (a.tags || []).forEach(t => {
        categoryCounts[t] = (categoryCounts[t] || 0) + 1;
      });
    });

    const topCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      totalArticles: articles.length,
      articlesRead: readArticles.length,
      totalReadingTimeMinutes: Math.max(totalReadingTimeMinutes, readArticles.length * 4),
      timeSavedMinutes: Math.max(timeSavedMinutes, readArticles.length * 3),
      readingStreakDays: data.analytics?.readingStreakDays || 3,
      highlightsCount: highlights.length,
      topCategories
    };
  }
};

