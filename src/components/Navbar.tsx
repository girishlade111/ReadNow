import React from 'react';
import { BookOpen, Sparkles, BarChart3, Settings, Bookmark, Archive, Star } from 'lucide-react';

interface NavbarProps {
  activeTab: 'all' | 'favorites' | 'archive' | 'analytics';
  setActiveTab: (tab: 'all' | 'favorites' | 'archive' | 'analytics') => void;
  openSettings: () => void;
  articleCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openSettings,
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
              <span className="text-xs bg-black text-white px-2 py-0.5 ml-2 font-mono tracking-normal">ENTERPRISE</span>
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 hidden sm:block">
              AI-Powered Executive Reader
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`brutal-button !py-1.5 !px-3 text-sm font-bold uppercase flex items-center gap-1.5 ${
              activeTab === 'all' ? '!bg-black !text-white' : '!bg-white !text-black'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Library</span>
            <span className="ml-1 bg-red-600 text-white text-xs px-1.5 py-0.2 rounded-none font-mono">
              {articleCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`brutal-button !py-1.5 !px-3 text-sm font-bold uppercase flex items-center gap-1.5 ${
              activeTab === 'favorites' ? '!bg-yellow-400 !text-black' : '!bg-white !text-black'
            }`}
          >
            <Star className="w-4 h-4 text-yellow-600 fill-current" />
            <span className="hidden sm:inline">Favorites</span>
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`brutal-button !py-1.5 !px-3 text-sm font-bold uppercase flex items-center gap-1.5 ${
              activeTab === 'archive' ? '!bg-gray-800 !text-white' : '!bg-white !text-black'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span className="hidden sm:inline">Archive</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`brutal-button !py-1.5 !px-3 text-sm font-bold uppercase flex items-center gap-1.5 ${
              activeTab === 'analytics' ? '!bg-red-600 !text-white' : '!bg-white !text-black'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
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
