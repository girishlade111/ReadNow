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
  aiAnalysis?: AiAnalysis;
  translations?: Record<string, { title: string; content: string; summary?: string }>;
}

interface DatabaseSchema {
  articles: Article[];
  highlights: Highlight[];
  analytics: {
    readingStreakDays: number;
    lastReadDate: string | null;
  };
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'readnow_db.json');

// Ensure database directory and file exist
function initDb(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      articles: [],
      highlights: [],
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
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse database file, resetting:', err);
    const initialData: DatabaseSchema = { articles: [], highlights: [], analytics: { readingStreakDays: 1, lastReadDate: new Date().toISOString() } };
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
