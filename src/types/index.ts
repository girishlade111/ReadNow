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
  readProgress: number; // 0 to 100
  tags: string[];
  aiAnalysis?: AiAnalysis;
  translations?: Record<string, { title: string; content: string; summary?: string }>;
}

export interface ArticleSummary {
  id: string;
  url: string;
  title: string;
  excerpt: string | null;
  siteName: string | null;
  savedAt: string;
  byline: string | null;
  isArchived: boolean;
  isFavorite: boolean;
  readProgress: number;
  tags: string[];
  readingTimeMinutes: number;
}

export interface ReaderSettings {
  fontFamily: 'sans' | 'serif' | 'mono' | 'dyslexic';
  fontSize: number; // 14 to 28
  lineHeight: number; // 1.2 to 2.2
  columnWidth: 'narrow' | 'normal' | 'wide';
  theme: 'brutal-light' | 'brutal-dark' | 'sepia' | 'cyberpunk';
  bionicReading: boolean;
  autoSpeechRate: number;
}

export interface AnalyticsData {
  totalArticles: number;
  articlesRead: number;
  totalReadingTimeMinutes: number;
  timeSavedMinutes: number;
  readingStreakDays: number;
  highlightsCount: number;
  topCategories: { category: string; count: number }[];
}
