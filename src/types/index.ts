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
  collectionId?: string;
  mediaType?: 'web' | 'text' | 'audio' | 'video';
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
  collectionId?: string;
  readingTimeMinutes: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  articleCount?: number;
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

export interface WorkspaceRAGCitation {
  articleId: string;
  articleTitle: string;
  siteName: string | null;
  snippet: string;
  relevanceScore: number;
}

export interface WorkspaceRAGResponse {
  answer: string;
  citations: WorkspaceRAGCitation[];
  query: string;
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

