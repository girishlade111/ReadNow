import React, { useState } from 'react';
import { X, Sparkles, Send, BookOpen, ExternalLink, Bot, Cpu } from 'lucide-react';
import { WorkspaceRAGResponse } from '../types';
import { api } from '../services/api';

interface GlobalRAGDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArticle: (articleId: string) => void;
}

export const GlobalRAGDrawer: React.FC<GlobalRAGDrawerProps> = ({
  isOpen,
  onClose,
  onSelectArticle
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ type: 'user' | 'ai'; text: string; citations?: any[] }>>([
    {
      type: 'ai',
      text: 'Hello! I am your **ReadNow Enterprise Knowledge Copilot**.\nAsk me any question across your entire team library of articles, whitepapers, and documents.'
    }
  ]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userText = query.trim();
    setQuery('');
    setHistory(prev => [...prev, { type: 'user', text: userText }]);
    setLoading(true);

    try {
      const response: WorkspaceRAGResponse = await api.askWorkspaceRAG(userText);
      setHistory(prev => [
        ...prev,
        {
          type: 'ai',
          text: response.answer,
          citations: response.citations
        }
      ]);
    } catch (err: any) {
      setHistory(prev => [
        ...prev,
        {
          type: 'ai',
          text: `⚠️ **Workspace AI Error**: ${err.message || 'Failed to process workspace RAG query.'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white border-l-4 border-black shadow-[ -8px_0_0_0_rgba(0,0,0,1)] z-50 flex flex-col font-sans">
      {/* Header */}
      <div className="p-4 bg-purple-600 text-white border-b-4 border-black flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-yellow-300 border-2 border-black rounded-none flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-extrabold text-xl tracking-tight uppercase">Workspace AI Copilot (RAG)</h2>
            <p className="text-xs text-purple-100 font-medium">Multi-document Retrieval & Knowledge Synthesis</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-white text-black border-2 border-black hover:bg-yellow-300 font-bold transition-transform active:translate-y-0.5"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested Prompts */}
      <div className="px-4 py-2 bg-purple-50 border-b-2 border-black flex items-center gap-2 overflow-x-auto text-xs">
        <span className="font-bold uppercase text-purple-900 flex items-center gap-1 shrink-0">
          <Cpu className="w-3.5 h-3.5" /> Suggested:
        </span>
        <button
          onClick={() => setQuery("What are the key technology trends discussed in our saved articles?")}
          className="px-2.5 py-1 bg-white border border-black hover:bg-yellow-200 text-left font-medium shrink-0"
        >
          Tech Trends
        </button>
        <button
          onClick={() => setQuery("Summarize core market recommendations across all documents")}
          className="px-2.5 py-1 bg-white border border-black hover:bg-yellow-200 text-left font-medium shrink-0"
        >
          Market Insights
        </button>
        <button
          onClick={() => setQuery("What are key decision points or action items mentioned?")}
          className="px-2.5 py-1 bg-white border border-black hover:bg-yellow-200 text-left font-medium shrink-0"
        >
          Action Items
        </button>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-yellow-50/40">
        {history.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${
              msg.type === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[90%] p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                msg.type === 'user'
                  ? 'bg-blue-500 text-white font-medium'
                  : 'bg-white text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-black/20 text-xs font-bold uppercase tracking-wider">
                {msg.type === 'user' ? (
                  <span>You</span>
                ) : (
                  <span className="flex items-center gap-1 text-purple-700">
                    <Bot className="w-4 h-4" /> Global Knowledge Synthesis
                  </span>
                )}
              </div>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap font-mono text-xs leading-relaxed">
                {msg.text}
              </div>

              {/* Citations block */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t-2 border-dashed border-black/30">
                  <p className="text-xs font-black uppercase text-purple-900 mb-2 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> Referenced Workspace Articles:
                  </p>
                  <div className="space-y-1.5">
                    {msg.citations.map((cite, cIdx) => (
                      <div
                        key={cIdx}
                        onClick={() => {
                          onSelectArticle(cite.articleId);
                          onClose();
                        }}
                        className="p-2 bg-yellow-100 border border-black hover:bg-yellow-300 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="truncate pr-2">
                          <span className="font-bold text-black">{cite.articleTitle}</span>
                          <span className="text-gray-600 block text-[10px] truncate">{cite.snippet}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 text-black" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-sm font-bold text-purple-800 p-3 bg-purple-100 border-2 border-black animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Scanning team documents & synthesizing response...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t-4 border-black flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything across your team library..."
          className="flex-1 px-4 py-3 border-2 border-black font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-yellow-400 text-black font-extrabold border-2 border-black hover:bg-yellow-300 disabled:opacity-50 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5"
        >
          <Send className="w-4 h-4" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};
