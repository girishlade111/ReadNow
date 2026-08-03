import React, { useEffect, useState } from 'react';
import { AnalyticsData } from '../types';
import { api } from '../services/api';
import { Flame, Clock, BookOpen, Sparkles, Highlight as HighlightIcon, Trophy, PieChart } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await api.getAnalytics();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-black border-t-red-600 rounded-full mx-auto"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-4xl font-black uppercase tracking-tight flex items-center gap-3">
          <Trophy className="w-10 h-10 text-yellow-500" strokeWidth={2.5} />
          Executive Reading Dashboard
        </h2>
        <p className="text-gray-600 font-bold uppercase tracking-wider text-sm mt-1">
          Performance metrics & time optimization overview
        </p>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Streak */}
        <div className="brutal-card !bg-orange-500 !text-white !p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-bold uppercase text-xs tracking-wider opacity-90">Reading Streak</span>
            <Flame className="w-6 h-6 fill-current animate-bounce" />
          </div>
          <div className="mt-4">
            <span className="text-5xl font-black">{data.readingStreakDays}</span>
            <span className="text-sm font-bold uppercase ml-2">Days</span>
          </div>
        </div>

        {/* Time Saved */}
        <div className="brutal-card !bg-red-600 !text-white !p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-bold uppercase text-xs tracking-wider opacity-90">Time Saved via AI</span>
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="mt-4">
            <span className="text-5xl font-black">{data.timeSavedMinutes}</span>
            <span className="text-sm font-bold uppercase ml-2">Mins</span>
          </div>
        </div>

        {/* Articles Read */}
        <div className="brutal-card !bg-black !text-white !p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-bold uppercase text-xs tracking-wider opacity-90">Articles Completed</span>
            <BookOpen className="w-6 h-6 text-red-500" />
          </div>
          <div className="mt-4">
            <span className="text-5xl font-black">{data.articlesRead}</span>
            <span className="text-xs font-mono opacity-80 block mt-1">out of {data.totalArticles} total</span>
          </div>
        </div>

        {/* Highlights */}
        <div className="brutal-card !bg-yellow-400 !text-black !p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="font-bold uppercase text-xs tracking-wider">Saved Quotes</span>
            <HighlightIcon className="w-6 h-6" />
          </div>
          <div className="mt-4">
            <span className="text-5xl font-black">{data.highlightsCount}</span>
            <span className="text-sm font-bold uppercase ml-2">Notes</span>
          </div>
        </div>

      </div>

      {/* Top Categories & Reading Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Category Distribution */}
        <div className="brutal-card !p-8">
          <h3 className="text-2xl font-black uppercase mb-6 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-red-600" /> Topic Distribution
          </h3>

          {data.topCategories.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No category data recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {data.topCategories.map((item, idx) => {
                const maxCount = Math.max(...data.topCategories.map(c => c.count));
                const pct = Math.round((item.count / maxCount) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold uppercase">
                      <span>{item.category}</span>
                      <span>{item.count} articles</span>
                    </div>
                    <div className="w-full bg-gray-100 h-4 border-2 border-black">
                      <div
                        className="bg-black h-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Productivity & Reading Velocity */}
        <div className="brutal-card !p-8 !bg-gray-50 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-black uppercase mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-black" /> Efficiency Insights
            </h3>
            <div className="space-y-4 font-medium text-sm">
              <div className="p-4 bg-white border-2 border-black">
                <span className="font-bold uppercase text-xs text-red-600 block mb-1">Average Reading Velocity</span>
                <p className="text-base font-bold">240 Words Per Minute</p>
                <p className="text-xs text-gray-500 mt-1">Standard executive reading speed for dense articles.</p>
              </div>

              <div className="p-4 bg-white border-2 border-black">
                <span className="font-bold uppercase text-xs text-green-600 block mb-1">AI Productivity Ratio</span>
                <p className="text-base font-bold">
                  {data.articlesRead > 0 ? `${Math.round((data.timeSavedMinutes / (data.totalReadingTimeMinutes || 1)) * 100)}% Time Compression` : '100% Efficiency Ready'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Calculated time saved by utilizing Gemini AI summaries.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
