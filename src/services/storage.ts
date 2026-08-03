import { ReaderSettings } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'readnow_user_settings',
  ACTIVE_TAB: 'readnow_active_tab',
  SEARCH_QUERY: 'readnow_last_search',
  SELECTED_COLLECTION: 'readnow_selected_collection',
  SELECTED_TAG: 'readnow_selected_tag',
  LEGACY_ARTICLES: 'readnow_articles'
};

const DEFAULT_SETTINGS: ReaderSettings = {
  fontFamily: 'sans',
  fontSize: 18,
  lineHeight: 1.6,
  columnWidth: 'normal',
  theme: 'brutal-light',
  bionicReading: false,
  autoSpeechRate: 1.0
};

export const localStorageService = {
  getReaderSettings(): ReaderSettings {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return item ? { ...DEFAULT_SETTINGS, ...JSON.parse(item) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveReaderSettings(settings: Partial<ReaderSettings>): ReaderSettings {
    try {
      const current = this.getReaderSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.warn('LocalStorage save error:', e);
      return DEFAULT_SETTINGS;
    }
  },

  getActiveTab(): 'all' | 'favorites' | 'archive' | 'analytics' {
    try {
      return (localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) as any) || 'all';
    } catch {
      return 'all';
    }
  },

  saveActiveTab(tab: 'all' | 'favorites' | 'archive' | 'analytics'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tab);
    } catch (e) {
      console.warn(e);
    }
  },

  getSearchQuery(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.SEARCH_QUERY) || '';
    } catch {
      return '';
    }
  },

  saveSearchQuery(query: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SEARCH_QUERY, query);
    } catch (e) {
      console.warn(e);
    }
  },

  // Migrate any legacy articles stored in localStorage to IndexedDB
  getLegacyArticles(): any[] {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.LEGACY_ARTICLES);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  },

  clearLegacyArticles(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.LEGACY_ARTICLES);
    } catch (e) {
      console.warn(e);
    }
  }
};
