import React from 'react';
import { Article } from '../types';
import { Link } from 'react-router-dom'; // Note: react-router-dom
import { Star, Trash2, Archive, Clock, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ArticleCardProps {
  article: Article;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onToggleArchive: (id: string, e: React.MouseEvent) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onDelete,
  onToggleFavorite,
  onToggleArchive,
}) => {
  const domain = article.siteName || (article.url ? new URL(article.url).hostname.replace('www.', '') : 'Web');
  const readTime = article.aiAnalysis?.readingTimeMinutes || Math.max(1, Math.ceil((article.length || 500) / 1000));
  const isRead = article.readProgress >= 85;

  return (
    <div className="brutal-card h-full flex flex-col justify-between hover:bg-red-50/50 transition-all group relative">
      <div>
        {/* Header badges and actions */}
        <div className="flex justify-between items-start mb-4 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-black text-white text-xs font-bold uppercase px-2.5 py-1 brutal-border border-2">
              {domain}
            </span>
            {isRead && (
              <span className="bg-green-500 text-black text-xs font-bold uppercase px-2 py-0.5 border-2 border-black flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Read
              </span>
            )}
            {article.aiAnalysis?.sentiment && (
              <span className="bg-amber-100 text-amber-900 text-xs font-semibold px-2 py-0.5 border-2 border-black">
                {article.aiAnalysis.sentiment}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 bg-white border-2 border-black p-1">
            <button
              onClick={(e) => onToggleFavorite(article.id, e)}
              className={`p-1 hover:text-yellow-500 transition-colors ${article.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`}
              title={article.isFavorite ? "Remove Favorite" : "Mark Favorite"}
            >
              <Star className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={(e) => onToggleArchive(article.id, e)}
              className={`p-1 hover:text-blue-600 transition-colors ${article.isArchived ? 'text-blue-600' : 'text-gray-400'}`}
              title={article.isArchived ? "Unarchive" : "Archive"}
            >
              <Archive className="w-4 h-4" />
            </button>

            <button
              onClick={(e) => onDelete(article.id, e)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <Link to={`/read/${article.id}`} className="block">
          <h2 className="text-2xl font-black leading-tight mb-3 group-hover:text-red-600 transition-colors line-clamp-2">
            {article.title}
          </h2>
        </Link>

        {/* Excerpt / AI Summary */}
        <p className="text-gray-700 text-sm line-clamp-3 mb-4 leading-relaxed font-normal">
          {article.aiAnalysis?.summary || article.excerpt || article.textContent.slice(0, 180)}
        </p>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {article.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="bg-gray-100 text-gray-800 text-xs font-mono font-bold px-2 py-0.5 border border-black">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info & Progress */}
      <div>
        {/* Progress bar if partially read */}
        {article.readProgress > 0 && article.readProgress < 100 && (
          <div className="w-full bg-gray-200 h-2 border-2 border-black mb-3">
            <div className="bg-red-600 h-full" style={{ width: `${article.readProgress}%` }}></div>
          </div>
        )}

        <div className="pt-3 border-t-4 border-black flex justify-between items-center text-xs font-bold uppercase text-gray-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {readTime} min
            </span>
            <span>{formatDistanceToNow(new Date(article.savedAt), { addSuffix: true })}</span>
          </div>

          <Link
            to={`/read/${article.id}`}
            className="inline-flex items-center gap-1 text-black font-black hover:text-red-600 uppercase tracking-wider"
          >
            Read <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
