import React from 'react';
import { BookOpen, Sparkles, BarChart3, Settings, Bookmark, Archive, Star, FolderPlus, ShieldCheck, Webhook, Newspaper } from 'lucide-react';

interface NavbarProps {
  activeTab: 'all' | 'favorites' | 'archive' | 'analytics';
  setActiveTab: (tab: 'all' | 'favorites' | 'archive' | 'analytics') => void;
  openSettings: () => void;
  openGlobalRAG: () => void;
  openCollections: () => void;
  openAuditLogs: () => void;
  openIntegrations: () => void;
  openDigest: () => void;
  articleCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openSettings,
  openGlobalRAG,
  openCollections,
  openAuditLogs,
  openIntegrations,
  openDigest,
  articleCount
}) => {
  return (
    <header className="border-b-4 border-black bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('all')}>
          <div className="bg-red-600 text-white p-2 brutal-border border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <BookOpen className="w-7 h-7" strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none flex items-center gap-1">
              Read<span className="text-red-600">Now</span>
              <span className="text-xs bg-black text-yellow-300 px-2 py-0.5 ml-2 font-mono tracking-normal">ENTERPRISE</span>
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 hidden sm:block">
              AI Knowledge Platform & Enterprise Reader
            </p>
          </div>
        </div>

        {/* Navigation Tabs & Enterprise Actions */}
        <nav className="flex items-center gap-2 overflow-x-auto py-1">
          {/* Ask Workspace AI RAG Button */}
          <button
            onClick={openGlobalRAG}
            className="px-3 py-1.5 bg-purple-600 text-white font-extrabold text-xs uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-purple-700 flex items-center gap-1.5 active:translate-y-0.5"
            title="Ask AI across all workspace articles"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span>Workspace AI</span>
          </button>

          <button
            onClick={openCollections}
            className="px-3 py-1.5 bg-emerald-600 text-white font-extrabold text-xs uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-700 flex items-center gap-1.5 active:translate-y-0.5"
            title="Team Folders & Collections"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden lg:inline">Folders</span>
          </button>

          <button
            onClick={openDigest}
            className="px-3 py-1.5 bg-amber-400 text-black font-extrabold text-xs uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-amber-300 flex items-center gap-1.5 active:translate-y-0.5"
            title="Weekly Team AI Digest"
          >
            <Newspaper className="w-4 h-4" />
            <span className="hidden md:inline">Digest</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`brutal-button !py-1.5 !px-3 text-xs font-bold uppercase flex items-center gap-1.5 ${
              activeTab === 'all' ? '!bg-black !text-white' : '!bg-white !text-black'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Library</span>
            <span className="ml-1 bg-red-600 text-white text-xs px-1.5 py-0.2 rounded-none font-mono">
              {articleCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`brutal-button !py-1.5 !px-3 text-xs font-bold uppercase flex items-center gap-1.5 ${
              activeTab === 'favorites' ? '!bg-yellow-400 !text-black' : '!bg-white !text-black'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-yellow-600 fill-current" />
            <span className="hidden lg:inline">Favorites</span>
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`brutal-button !py-1.5 !px-3 text-xs font-bold uppercase flex items-center gap-1.5 ${
              activeTab === 'archive' ? '!bg-gray-800 !text-white' : '!bg-white !text-black'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Archive</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`brutal-button !py-1.5 !px-3 text-xs font-bold uppercase flex items-center gap-1.5 ${
              activeTab === 'analytics' ? '!bg-red-600 !text-white' : '!bg-white !text-black'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Analytics</span>
          </button>

          <button
            onClick={openIntegrations}
            className="p-1.5 bg-indigo-100 border-2 border-black hover:bg-indigo-200 text-black font-bold text-xs uppercase"
            title="Integrations & Bookmarklet"
          >
            <Webhook className="w-4 h-4 text-indigo-700" />
          </button>

          <button
            onClick={openAuditLogs}
            className="p-1.5 bg-slate-100 border-2 border-black hover:bg-slate-200 text-black font-bold text-xs uppercase"
            title="Audit Trail & Data Governance"
          >
            <ShieldCheck className="w-4 h-4 text-slate-800" />
          </button>

          <button
            onClick={openSettings}
            className="brutal-button !py-1.5 !px-2.5 !bg-gray-100 text-black hover:!bg-black hover:!text-white"
            title="Reader Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </header>
  );
};

