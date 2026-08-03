import React, { useState } from 'react';
import { Article } from '../types';
import { api } from '../services/api';
import { X, Sparkles, Send, Globe, CheckCircle2, Lightbulb, ListOrdered, Bot, Loader2, ArrowRight } from 'lucide-react';

interface AiCopilotDrawerProps {
  article: Article;
  isOpen: boolean;
  onClose: () => void;
  onTranslationChange?: (lang: string, translatedData: any) => void;
}

export const AiCopilotDrawer: React.FC<AiCopilotDrawerProps> = ({
  article,
  isOpen,
  onClose,
  onTranslationChange
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'copilot' | 'translate'>('summary');
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [asking, setAsking] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [selectedLang, setSelectedLang] = useState('Marathi');

  if (!isOpen) return null;

  const handleAsk = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim() || asking) return;

    setChatHistory(prev => [...prev, { sender: 'user', text: q }]);
    setQuestion('');
    setAsking(true);

    try {
      const answer = await api.askAiCopilot(article.id, q);
      setChatHistory(prev => [...prev, { sender: 'ai', text: answer }]);
    } catch (e: any) {
      setChatHistory(prev => [...prev, { sender: 'ai', text: `Error: ${e.message || 'Failed to get answer'}` }]);
    } finally {
      setAsking(false);
    }
  };

  const handleTranslate = async (lang: string) => {
    setSelectedLang(lang);
    setTranslating(true);
    try {
      const res = await api.translateArticle(article.id, lang);
      if (onTranslationChange) {
        onTranslationChange(lang, res.translation);
      }
    } catch (e) {
      alert('Translation failed.');
    } finally {
      setTranslating(false);
    }
  };

  const quickPrompts = [
    "What are the main conclusions?",
    "Summarize this in 3 simple sentences.",
    "What are key decisions or action points?",
    "Explain key technical terms in simple language."
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-white h-full brutal-border border-l-8 border-black flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-6 bg-black text-white flex justify-between items-center border-b-4 border-black">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 text-white border-2 border-white">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                Gemini AI Copilot
              </h3>
              <p className="text-xs font-mono text-gray-300">Article Intelligence & Insights</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 brutal-button !bg-white !text-black hover:!bg-red-600 hover:!text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-4 border-black bg-gray-100 font-bold uppercase text-sm">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-r-2 border-black ${
              activeTab === 'summary' ? 'bg-white text-black border-b-4 border-b-red-600' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Summary
          </button>

          <button
            onClick={() => setActiveTab('copilot')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-r-2 border-black ${
              activeTab === 'copilot' ? 'bg-white text-black border-b-4 border-b-red-600' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Bot className="w-4 h-4 text-blue-600" />
            Ask AI
          </button>

          <button
            onClick={() => setActiveTab('translate')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
              activeTab === 'translate' ? 'bg-white text-black border-b-4 border-b-red-600' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Globe className="w-4 h-4 text-green-600" />
            Translate
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: EXECUTIVE SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="brutal-card !bg-red-50/60 !border-4">
                <h4 className="text-lg font-black uppercase mb-3 text-red-600 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Executive Summary
                </h4>
                <p className="text-black leading-relaxed font-medium text-base">
                  {article.aiAnalysis?.summary || "Analyzing article content..."}
                </p>
              </div>

              {/* Key Takeaways */}
              {article.aiAnalysis?.keyTakeaways && (
                <div className="brutal-card !border-4">
                  <h4 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                    <ListOrdered className="w-5 h-5 text-black" /> Key Takeaways
                  </h4>
                  <ul className="space-y-3">
                    {article.aiAnalysis.keyTakeaways.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm font-medium">
                        <span className="bg-black text-white font-mono font-bold text-xs px-2 py-0.5 mt-0.5">
                          0{idx + 1}
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {article.aiAnalysis?.actionItems && article.aiAnalysis.actionItems.length > 0 && (
                <div className="brutal-card !bg-amber-50 !border-4">
                  <h4 className="text-lg font-black uppercase mb-3 text-amber-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-amber-700" /> Executive Action Points
                  </h4>
                  <ul className="space-y-2 text-sm font-semibold text-amber-950">
                    {article.aiAnalysis.actionItems.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-amber-700 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ASK AI COPILOT */}
          {activeTab === 'copilot' && (
            <div className="flex flex-col h-full justify-between space-y-4">
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-8 brutal-card !bg-gray-50">
                    <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h5 className="font-bold uppercase text-lg mb-2">Article Copilot Active</h5>
                    <p className="text-sm text-gray-600 mb-4">Ask any questions or request specific explanations about this article.</p>
                    
                    <div className="flex flex-wrap gap-2 justify-center">
                      {quickPrompts.map((qp, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAsk(qp)}
                          className="bg-white border-2 border-black px-3 py-1.5 text-xs font-bold hover:bg-black hover:text-white transition-colors"
                        >
                          {qp}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-4 brutal-border border-2 ${
                        msg.sender === 'user' ? 'bg-black text-white ml-8' : 'bg-red-50 text-black mr-8'
                      }`}
                    >
                      <span className="text-xs font-mono font-bold uppercase block mb-1 opacity-75">
                        {msg.sender === 'user' ? 'You' : 'Gemini Copilot'}
                      </span>
                      <p className="text-sm whitespace-pre-line leading-relaxed font-medium">{msg.text}</p>
                    </div>
                  ))
                )}

                {asking && (
                  <div className="p-4 bg-gray-100 border-2 border-black flex items-center gap-2 font-bold text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                    Thinking & analyzing article text...
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="pt-4 border-t-4 border-black">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAsk();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Ask AI about this article..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="brutal-input flex-1 text-sm font-medium"
                    disabled={asking}
                  />
                  <button
                    type="submit"
                    className="brutal-button !bg-black !text-white"
                    disabled={asking || !question.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: TRANSLATION */}
          {activeTab === 'translate' && (
            <div className="space-y-6">
              <div className="brutal-card !border-4">
                <h4 className="text-lg font-black uppercase mb-3 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-600" /> Multi-Language Translator
                </h4>
                <p className="text-sm text-gray-600 mb-6">
                  Select a language to dynamically translate the article with Gemini AI.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { name: 'Marathi', label: 'मराठी (Marathi)' },
                    { name: 'Hindi', label: 'हिंदी (Hindi)' },
                    { name: 'Spanish', label: 'Español (Spanish)' },
                    { name: 'French', label: 'Français (French)' },
                    { name: 'German', label: 'Deutsch (German)' },
                    { name: 'Japanese', label: '日本語 (Japanese)' }
                  ].map((lang) => (
                    <button
                      key={lang.name}
                      onClick={() => handleTranslate(lang.name)}
                      disabled={translating}
                      className={`p-3 border-2 border-black font-bold text-sm text-left transition-all ${
                        selectedLang === lang.name ? 'bg-green-500 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>

                {translating && (
                  <div className="p-4 bg-green-50 border-2 border-green-600 text-green-900 font-bold flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-green-700" />
                    Translating article content to {selectedLang}...
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
