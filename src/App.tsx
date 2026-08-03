import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, FormEvent, MouseEvent, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { formatDistanceToNow } from 'date-fns';
import {
  BookOpen, Plus, Search, ArrowLeft, ExternalLink, Loader2, Sparkles,
  Volume2, Highlighting as HighlightIcon, Sliders, Download, CheckCircle2, Star, Archive
} from 'lucide-react';

import { Article, Highlight, ReaderSettings } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { ArticleCard } from './components/ArticleCard';
import { AudioPlayer } from './components/AudioPlayer';
import { AiCopilotDrawer } from './components/AiCopilotDrawer';
import { HighlightsManager } from './components/HighlightsManager';
import { ReaderSettingsModal } from './components/ReaderSettingsModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ExportModal } from './components/ExportModal';

const DEFAULT_SETTINGS: ReaderSettings = {
  fontFamily: 'sans',
  fontSize: 18,
  lineHeight: 1.6,
  columnWidth: 'normal',
  theme: 'brutal-light',
  bionicReading: false,
  autoSpeechRate: 1.0
};

function Home() {
  const [url, setUrl] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'archive' | 'analytics'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const fetched = await api.getArticles();
      setArticles(fetched);
    } catch (e: any) {
      setError('Failed to load articles');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');

    try {
      const newArticle = await api.parseUrl(url);
      setArticles(prev => [newArticle, ...prev]);
      setUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to parse URL');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this article?')) return;

    await api.deleteArticle(id);
    setArticles(prev => prev.filter(a => a.id !== id));
  };

  const handleToggleFavorite = async (id: string, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const article = articles.find(a => a.id === id);
    if (!article) return;

    const updated = await api.updateArticle(id, { isFavorite: !article.isFavorite });
    setArticles(prev => prev.map(a => a.id === id ? updated : a));
  };

  const handleToggleArchive = async (id: string, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const article = articles.find(a => a.id === id);
    if (!article) return;

    const updated = await api.updateArticle(id, { isArchived: !article.isArchived });
    setArticles(prev => prev.map(a => a.id === id ? updated : a));
  };

  // Filter logic
  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      // Tab filter
      if (activeTab === 'favorites' && !a.isFavorite) return false;
      if (activeTab === 'archive' && !a.isArchived) return false;
      if (activeTab === 'all' && a.isArchived) return false;

      // Tag filter
      if (selectedTag && (!a.tags || !a.tags.includes(selectedTag))) return false;

      // Search query
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        (a.excerpt && a.excerpt.toLowerCase().includes(q)) ||
        (a.siteName && a.siteName.toLowerCase().includes(q)) ||
        (a.tags && a.tags.some(t => t.toLowerCase().includes(q)))
      );
    });
  }, [articles, activeTab, selectedTag, searchQuery]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    articles.forEach(a => {
      (a.tags || []).forEach(t => tagsSet.add(t));
    });
    return Array.from(tagsSet);
  }, [articles]);

  if (activeTab === 'analytics') {
    return (
      <div className="min-h-screen bg-[#f4f4f0]">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openSettings={() => setIsSettingsOpen(true)}
          articleCount={articles.filter(a => !a.isArchived).length}
        />
        <AnalyticsDashboard />
        <ReaderSettingsModal
          settings={settings}
          onUpdateSettings={(s) => setSettings(prev => ({ ...prev, ...s }))}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f0]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSettings={() => setIsSettingsOpen(true)}
        articleCount={articles.filter(a => !a.isArchived).length}
      />

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        
        {/* Quick URL Save Box */}
        <div className="brutal-card !bg-black !text-white !p-8 shadow-[8px_8px_0px_0px_rgba(220,38,38,1)]">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black uppercase tracking-tight mb-2 flex items-center gap-2 text-white">
              <Sparkles className="w-7 h-7 text-red-600 animate-pulse" />
              Save Any Web Article
            </h2>
            <p className="text-gray-300 text-sm font-medium mb-6">
              Paste a website URL to extract distraction-free reading content and auto-generate Gemini AI summaries.
            </p>

            <form onSubmit={handleSave} className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                placeholder="https://example.com/article-slug..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="brutal-input flex-1 !bg-white !text-black text-base font-mono"
                disabled={loading}
              />
              <button
                type="submit"
                className="brutal-button flex items-center justify-center gap-2 !py-3 !px-8 hover:!bg-red-700"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                <span>{loading ? 'Parsing...' : 'Save Article'}</span>
              </button>
            </form>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-4 border-red-600 text-red-900 p-4 font-bold uppercase flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black">!</span>
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="underline text-xs">Dismiss</button>
          </div>
        )}

        {/* Search & Tag Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="SEARCH ARTICLES BY TITLE, KEYWORDS, SITE OR TAGS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="brutal-input w-full pl-12 py-3 text-sm font-bold uppercase tracking-wider"
            />
          </div>

          {/* Tag Filter Chips */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full md:max-w-md">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 border-2 border-black text-xs font-mono font-bold uppercase ${
                  selectedTag === null ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                }`}
              >
                All Tags
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-2.5 py-1.5 border-2 border-black text-xs font-mono font-bold uppercase ${
                    selectedTag === tag ? 'bg-red-600 text-white' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Articles Grid */}
        {initialLoading ? (
          <div className="flex justify-center p-24">
            <Loader2 className="w-12 h-12 animate-spin text-red-600" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="brutal-card text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black uppercase mb-2">No Articles Found</h2>
            <p className="text-gray-600 font-medium">
              {searchQuery || selectedTag ? 'Try adjusting your search query or tag filters.' : 'Paste a URL above to save your first article.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onDelete={handleDelete}
                onToggleFavorite={handleToggleFavorite}
                onToggleArchive={handleToggleArchive}
              />
            ))}
          </div>
        )}

      </main>

      <ReaderSettingsModal
        settings={settings}
        onUpdateSettings={(s) => setSettings(prev => ({ ...prev, ...s }))}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

function Reader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isAudioOpen, setIsAudioOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [selectedText, setSelectedText] = useState('');
  const [activeTranslation, setActiveTranslation] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    if (id) loadArticleData(id);
  }, [id]);

  const loadArticleData = async (articleId: string) => {
    try {
      const art = await api.getArticleById(articleId);
      if (!art) throw new Error('Article not found');
      setArticle(art);

      const hls = await api.getHighlights(articleId);
      setHighlights(hls);
    } catch (err: any) {
      setError(err.message || 'Error loading article');
    } finally {
      setLoading(false);
    }
  };

  // Text selection handler
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 3) {
      setSelectedText(selection.toString().trim());
    }
  };

  const handleAddHighlight = async (text: string, color: 'yellow' | 'green' | 'pink' | 'blue', note?: string) => {
    if (!article) return;
    try {
      const newH = await api.addHighlight(article.id, text, color, note);
      setHighlights(prev => [...prev, newH]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteHighlight = async (hId: string) => {
    await api.deleteHighlight(hId);
    setHighlights(prev => prev.filter(h => h.id !== hId));
  };

  // Update read progress on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!article) return;
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (height <= 0) return;

      const progress = Math.min(100, Math.round((winScroll / height) * 100));
      const bar = document.getElementById('progress-bar');
      if (bar) bar.style.width = `${progress}%`;

      if (progress > article.readProgress + 10) {
        api.updateArticle(article.id, { readProgress: progress });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f0]">
        <Loader2 className="w-16 h-16 animate-spin text-red-600" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-3xl mx-auto p-6 mt-12">
        <div className="brutal-card text-center py-12">
          <h2 className="text-4xl font-black uppercase text-red-600 mb-6">Error</h2>
          <p className="text-xl mb-8">{error || 'Article not found'}</p>
          <button onClick={() => navigate('/')} className="brutal-button inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Back Home
          </button>
        </div>
      </div>
    );
  }

  const activeTitle = activeTranslation ? activeTranslation.title : article.title;
  const rawContent = activeTranslation ? activeTranslation.content : article.content;

  // Sanitize HTML
  const cleanHtml = DOMPurify.sanitize(rawContent || '', {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'iframe', 'img', 'video', 'source', 'figure', 'figcaption'],
    ALLOWED_ATTR: ['href', 'name', 'target', 'src', 'alt', 'title', 'class', 'id', 'controls', 'width', 'height', 'allowfullscreen', 'frameborder'],
  });

  // Apply typography classes based on reader settings
  const fontClass =
    settings.fontFamily === 'serif' ? 'font-serif' :
    settings.fontFamily === 'mono' ? 'font-mono' :
    settings.fontFamily === 'dyslexic' ? 'font-mono tracking-wide' :
    'font-sans';

  const widthClass =
    settings.columnWidth === 'narrow' ? 'max-w-2xl' :
    settings.columnWidth === 'wide' ? 'max-w-5xl' :
    'max-w-4xl';

  const themeClass = `theme-${settings.theme}`;

  return (
    <div className={`min-h-screen ${themeClass} transition-colors duration-200`}>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-2.5 bg-gray-300 z-50">
        <div className="h-full bg-red-600 transition-all duration-150" style={{ width: '0%' }} id="progress-bar" />
      </div>

      <div className={`${widthClass} mx-auto p-4 md:p-8 pt-8`}>
        
        {/* Navigation Toolbar */}
        <nav className="mb-8 flex flex-wrap justify-between items-center gap-4 bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-black uppercase tracking-wider hover:text-red-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Library
          </Link>

          {/* Reader Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAudioOpen(!isAudioOpen)}
              className={`brutal-button !py-1.5 !px-3 text-xs font-bold uppercase flex items-center gap-1.5 ${
                isAudioOpen ? '!bg-red-600 !text-white' : '!bg-black !text-white'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>Audio</span>
            </button>

            <button
              onClick={() => setIsCopilotOpen(true)}
              className="brutal-button !py-1.5 !px-3 text-xs font-bold uppercase flex items-center gap-1.5 !bg-amber-400 !text-black"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Copilot</span>
            </button>

            <button
              onClick={() => setIsExportOpen(true)}
              className="brutal-button !py-1.5 !px-3 text-xs font-bold uppercase flex items-center gap-1.5 !bg-gray-100 !text-black"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="brutal-button !py-1.5 !px-2.5 !bg-gray-100 !text-black"
              title="Reader Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-600 hover:text-black"
              title="Open Original Source URL"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </nav>

        {/* Audio Player Dock */}
        {isAudioOpen && (
          <AudioPlayer title={activeTitle} text={article.textContent} />
        )}

        {/* Article Body Card */}
        <article
          onMouseUp={handleMouseUp}
          className={`brutal-card !p-8 md:!p-14 ${fontClass}`}
          style={{
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight
          }}
        >
          {/* Article Header */}
          <header className="mb-10 border-b-8 border-black pb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-red-600 text-white font-bold uppercase px-3 py-1 brutal-border border-2 text-xs">
                {article.siteName || (article.url ? new URL(article.url).hostname.replace('www.', '') : 'Web')}
              </span>
              {article.publishedTime && (
                <span className="bg-black text-white font-bold uppercase px-3 py-1 brutal-border border-2 text-xs">
                  {new Date(article.publishedTime).toLocaleDateString()}
                </span>
              )}
              {article.aiAnalysis?.readingTimeMinutes && (
                <span className="bg-yellow-400 text-black font-bold uppercase px-3 py-1 brutal-border border-2 text-xs">
                  {article.aiAnalysis.readingTimeMinutes} min read
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight mb-6 uppercase">
              {activeTitle}
            </h1>

            {article.byline && (
              <div className="text-lg font-bold uppercase tracking-wider text-gray-600">
                By {article.byline}
              </div>
            )}
          </header>

          {/* AI Executive Summary Callout */}
          {article.aiAnalysis?.summary && (
            <div className="mb-10 bg-red-50/80 border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(220,38,38,1)]">
              <h3 className="text-base font-black uppercase text-red-600 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Executive Summary
              </h3>
              <p className="text-base font-semibold leading-relaxed text-black">
                {article.aiAnalysis.summary}
              </p>
            </div>
          )}

          {/* Article Content Render */}
          <div
            className="reader-content"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />

          {/* Highlights & Sticky Notes Section */}
          <div className="mt-16 pt-8 border-t-8 border-black">
            <HighlightsManager
              highlights={highlights}
              onAddHighlight={handleAddHighlight}
              onDeleteHighlight={handleDeleteHighlight}
              selectedText={selectedText}
              clearSelection={() => setSelectedText('')}
            />
          </div>
        </article>
      </div>

      {/* AI Copilot Slideover Drawer */}
      <AiCopilotDrawer
        article={article}
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onTranslationChange={(lang, data) => setActiveTranslation(data)}
      />

      {/* Reader Preferences Modal */}
      <ReaderSettingsModal
        settings={settings}
        onUpdateSettings={(s) => setSettings(prev => ({ ...prev, ...s }))}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Export Options Modal */}
      <ExportModal
        article={article}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/read/:id" element={<Reader />} />
      </Routes>
    </Router>
  );
}
