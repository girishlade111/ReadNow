import { Article, Highlight, Collection, Comment, AuditLog, EnterpriseSettings } from '../types';

const DB_NAME = 'ReadNowDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('articles')) {
        const articleStore = db.createObjectStore('articles', { keyPath: 'id' });
        articleStore.createIndex('savedAt', 'savedAt', { unique: false });
        articleStore.createIndex('isFavorite', 'isFavorite', { unique: false });
        articleStore.createIndex('isArchived', 'isArchived', { unique: false });
      }

      if (!db.objectStoreNames.contains('highlights')) {
        const highlightStore = db.createObjectStore('highlights', { keyPath: 'id' });
        highlightStore.createIndex('articleId', 'articleId', { unique: false });
      }

      if (!db.objectStoreNames.contains('collections')) {
        db.createObjectStore('collections', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('comments')) {
        const commentStore = db.createObjectStore('comments', { keyPath: 'id' });
        commentStore.createIndex('articleId', 'articleId', { unique: false });
      }

      if (!db.objectStoreNames.contains('auditLogs')) {
        const logStore = db.createObjectStore('auditLogs', { keyPath: 'id' });
        logStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

export const idb = {
  // Articles Store
  async getAllArticles(): Promise<Article[]> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('articles', 'readonly');
        const store = tx.objectStore('articles');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('IndexedDB getAllArticles error:', e);
      return [];
    }
  },

  async getArticleById(id: string): Promise<Article | null> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('articles', 'readonly');
        const store = tx.objectStore('articles');
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return null;
    }
  },

  async saveArticle(article: Article): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('articles', 'readwrite');
        const store = tx.objectStore('articles');
        const request = store.put(article);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB saveArticle error:', e);
    }
  },

  async saveArticlesBulk(articles: Article[]): Promise<void> {
    try {
      const db = await getDB();
      const tx = db.transaction('articles', 'readwrite');
      const store = tx.objectStore('articles');
      articles.forEach(art => store.put(art));
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.error('IndexedDB saveArticlesBulk error:', e);
    }
  },

  async deleteArticle(id: string): Promise<void> {
    try {
      const db = await getDB();
      const tx = db.transaction(['articles', 'highlights', 'comments'], 'readwrite');
      
      tx.objectStore('articles').delete(id);
      
      const hlStore = tx.objectStore('highlights');
      const hlIndex = hlStore.index('articleId');
      const hlReq = hlIndex.getAllKeys(id);
      hlReq.onsuccess = () => {
        (hlReq.result || []).forEach(key => hlStore.delete(key));
      };

      const cmtStore = tx.objectStore('comments');
      const cmtIndex = cmtStore.index('articleId');
      const cmtReq = cmtIndex.getAllKeys(id);
      cmtReq.onsuccess = () => {
        (cmtReq.result || []).forEach(key => cmtStore.delete(key));
      };

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.error('IndexedDB deleteArticle error:', e);
    }
  },

  // Highlights Store
  async getHighlights(articleId?: string): Promise<Highlight[]> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('highlights', 'readonly');
        const store = tx.objectStore('highlights');
        if (articleId) {
          const index = store.index('articleId');
          const request = index.getAll(articleId);
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        } else {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        }
      });
    } catch (e) {
      return [];
    }
  },

  async saveHighlight(highlight: Highlight): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('highlights', 'readwrite');
        const store = tx.objectStore('highlights');
        const request = store.put(highlight);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB saveHighlight error:', e);
    }
  },

  async deleteHighlight(id: string): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('highlights', 'readwrite');
        const store = tx.objectStore('highlights');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB deleteHighlight error:', e);
    }
  },

  // Collections Store
  async getCollections(): Promise<Collection[]> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('collections', 'readonly');
        const store = tx.objectStore('collections');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return [];
    }
  },

  async saveCollection(col: Collection): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('collections', 'readwrite');
        const store = tx.objectStore('collections');
        const request = store.put(col);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB saveCollection error:', e);
    }
  },

  async deleteCollection(id: string): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('collections', 'readwrite');
        const store = tx.objectStore('collections');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB deleteCollection error:', e);
    }
  },

  // Comments Store
  async getComments(articleId: string): Promise<Comment[]> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('comments', 'readonly');
        const store = tx.objectStore('comments');
        const index = store.index('articleId');
        const request = index.getAll(articleId);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return [];
    }
  },

  async saveComment(comment: Comment): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('comments', 'readwrite');
        const store = tx.objectStore('comments');
        const request = store.put(comment);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB saveComment error:', e);
    }
  },

  // Audit Logs Store
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('auditLogs', 'readonly');
        const store = tx.objectStore('auditLogs');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return [];
    }
  },

  async saveAuditLog(log: AuditLog): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('auditLogs', 'readwrite');
        const store = tx.objectStore('auditLogs');
        const request = store.put(log);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB saveAuditLog error:', e);
    }
  },

  // Settings Store
  async getSettings(): Promise<EnterpriseSettings | null> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');
        const request = store.get('enterprise_settings');
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return null;
    }
  },

  async saveSettings(settings: EnterpriseSettings): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');
        const request = store.put({ id: 'enterprise_settings', ...settings });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB saveSettings error:', e);
    }
  }
};
