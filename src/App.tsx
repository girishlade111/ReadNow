import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Plus, Trash2, ExternalLink, ArrowLeft, Loader2, Search } from 'lucide-react';
import { useState, useEffect, FormEvent, MouseEvent } from 'react';
import DOMPurify from 'dompurify';
import { formatDistanceToNow } from 'date-fns';

interface ArticleSummary {
  id: string;
  url: string;
  title: string;
  excerpt: string | null;
  siteName: string | null;
  savedAt: string;
  byline: string | null;
}

interface Article extends ArticleSummary {
  content: string;
  textContent: string;
  length: number;
  dir: string | null;
  publishedTime: string | null;
}

const STORAGE_KEY = 'readnow_articles';

function Home() {
  const [url, setUrl] = useState('');
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = articles.filter(article => {
    const query = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(query) ||
      (article.excerpt && article.excerpt.toLowerCase().includes(query)) ||
      (article.siteName && article.siteName.toLowerCase().includes(query))
    );
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Sort by savedAt desc
        const sorted = (parsed as Article[]).sort((a, b) => 
          new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        );
        setArticles(sorted);
      } catch (e) {
        console.error('Failed to parse saved articles', e);
      }
    }
    setInitialLoading(false);
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse article');
      }

      const id = Math.random().toString(36).substring(2, 15);
      const newArticle: Article = {
        ...data.article,
        id,
        savedAt: new Date().toISOString()
      };

      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const updated = [newArticle, ...existing];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      setArticles(updated);
      setUrl('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this saved link?')) return;

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const updated = (existing as Article[]).filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setArticles(updated);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-6xl font-black uppercase tracking-tighter flex items-center gap-4">
            <BookOpen className="w-12 h-12 text-red-600" strokeWidth={3} />
            Read<span className="text-red-600">Now</span>
          </h1>
          <p className="text-xl font-bold mt-2 uppercase tracking-widest text-gray-600">
            Brutal Reading Mode
          </p>
        </div>
        
        <div className="flex flex-col w-full md:w-auto gap-4">
          <form onSubmit={handleSave} className="flex w-full gap-2">
            <input
              type="url"
              placeholder="Paste URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="brutal-input flex-1 md:w-80 font-mono"
              disabled={loading}
            />
            <button 
              type="submit" 
              className="brutal-button flex items-center gap-2"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              <span className="hidden sm:inline">Save</span>
            </button>
          </form>
        </div>
      </header>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-black" strokeWidth={3} />
          <input
            type="text"
            placeholder="SEARCH ARTICLES..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="brutal-input w-full pl-12 py-4 text-xl font-bold uppercase tracking-wider"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-4 border-red-600 text-red-800 p-4 mb-8 font-bold uppercase flex items-center gap-4">
          <span className="text-2xl">!</span>
          {error}
        </div>
      )}

      {initialLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-12 h-12 animate-spin text-red-600" />
        </div>
      ) : articles.length === 0 ? (
        <div className="brutal-card text-center py-24">
          <h2 className="text-3xl font-black uppercase mb-4">Nothing here yet</h2>
          <p className="text-xl">Paste a link above to start reading without distractions.</p>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="brutal-card text-center py-24">
          <h2 className="text-3xl font-black uppercase mb-4">No matches found</h2>
          <p className="text-xl">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article) => (
            <Link to={`/read/${article.id}`} key={article.id} className="block group">
              <article className="brutal-card h-full flex flex-col hover:bg-red-50 transition-colors">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-black text-white text-xs font-bold uppercase px-2 py-1 brutal-border border-2">
                      {article.siteName || (article.url ? new URL(article.url).hostname.replace('www.', '') : 'Unknown')}
                    </span>
                    <button 
                      onClick={(e) => handleDelete(article.id, e)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <h2 className="text-2xl font-bold leading-tight mb-3 group-hover:text-red-600 transition-colors line-clamp-3">
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="text-gray-700 line-clamp-3 mb-4">
                      {article.excerpt}
                    </p>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t-4 border-black flex justify-between items-center text-sm font-bold uppercase text-gray-600">
                  <span>{formatDistanceToNow(new Date(article.savedAt), { addSuffix: true })}</span>
                  <span className="flex items-center gap-1 hover:text-red-600">
                    Read <ArrowLeft className="w-4 h-4 rotate-180" />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Reader() {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchArticle(id);
    }
  }, [id]);

  const fetchArticle = (articleId: string) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) throw new Error('Article not found');
      
      const articles = JSON.parse(saved) as Article[];
      const found = articles.find(a => a.id === articleId);
      
      if (!found) {
        throw new Error('Article not found');
      }
      
      setArticle(found);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  // Sanitize HTML before rendering
  const cleanHtml = DOMPurify.sanitize(article.content || '', {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'iframe', 'img', 'video', 'source', 'figure', 'figcaption'],
    ALLOWED_ATTR: ['href', 'name', 'target', 'src', 'alt', 'title', 'class', 'id', 'controls', 'width', 'height', 'allowfullscreen', 'frameborder'],
  });

  return (
    <div className="min-h-screen bg-[#f4f4f0]">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-2 bg-gray-200 z-50">
        <div className="h-full bg-red-600" style={{ width: '0%' }} id="progress-bar"></div>
      </div>

      <div className="max-w-4xl mx-auto p-6 md:p-12">
        <nav className="mb-12 flex justify-between items-center">
          <Link to="/" className="inline-flex items-center gap-2 font-bold uppercase tracking-wider hover:text-red-600 transition-colors border-b-4 border-transparent hover:border-red-600 pb-1">
            <ArrowLeft className="w-5 h-5" /> Back to list
          </Link>
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
            title="Open original"
          >
            Original <ExternalLink className="w-5 h-5" />
          </a>
        </nav>

        <article dir={article.dir || 'auto'} className="brutal-card !p-8 md:!p-16 !bg-white">
          <header className="mb-12 border-b-8 border-black pb-12">
            <div className="flex flex-wrap gap-4 mb-6">
              <span className="bg-red-600 text-white font-bold uppercase px-3 py-1 brutal-border border-2">
                {article.siteName || (article.url ? new URL(article.url).hostname.replace('www.', '') : 'Unknown')}
              </span>
              {article.publishedTime && (
                <span className="bg-black text-white font-bold uppercase px-3 py-1 brutal-border border-2">
                  {new Date(article.publishedTime).toLocaleDateString()}
                </span>
              )}
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tighter mb-8">
              {article.title}
            </h1>
            
            {article.byline && (
              <div className="text-xl font-bold uppercase tracking-widest text-gray-600">
                By {article.byline}
              </div>
            )}
          </header>

          <div 
            className="reader-content"
            dangerouslySetInnerHTML={{ __html: cleanHtml }}
          />
        </article>
      </div>
    </div>
  );
}

export default function App() {
  // Simple scroll progress effect
  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      const bar = document.getElementById('progress-bar');
      if (bar) bar.style.width = scrolled + '%';
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/read/:id" element={<Reader />} />
      </Routes>
    </Router>
  );
}
