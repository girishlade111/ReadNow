import React, { useState, useEffect } from 'react';
import { X, Webhook, Bookmark, Plus, Trash2, Send, CheckCircle2, Globe, FilePlus, Code, Copy } from 'lucide-react';
import { WebhookConfig } from '../types';
import { api } from '../services/api';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArticleAdded: () => void;
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({
  isOpen,
  onClose,
  onArticleAdded
}) => {
  const [tab, setTab] = useState<'bookmarklet' | 'webhooks' | 'quicksave'>('bookmarklet');
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  // Quick Save custom document form state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [quickUrl, setQuickUrl] = useState('');
  const [quickMediaType, setQuickMediaType] = useState<'text' | 'audio' | 'video'>('text');
  const [loadingSave, setLoadingSave] = useState(false);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  const loadWebhooks = async () => {
    try {
      const data = await api.getWebhooks();
      setWebhooks(data);
    } catch (err) {
      console.error('Failed to load webhooks:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWebhooks();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const bookmarkletCode = `javascript:(function(){var title=document.title;var url=location.href;var selection=window.getSelection().toString();fetch('http://localhost:3000/api/quick-save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:title,url:url,content:selection||document.body.innerText.slice(0,3000),mediaType:'web'})}).then(r=>r.json()).then(d=>alert('ReadNow Enterprise Saved: '+d.article.title)).catch(e=>alert('ReadNow Save Error'));})();`;

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2000);
  };

  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    try {
      await api.createWebhook(name.trim(), url.trim());
      setName('');
      setUrl('');
      await loadWebhooks();
    } catch (err: any) {
      alert('Failed to save webhook');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await api.deleteWebhook(id);
      await loadWebhooks();
    } catch (err) {
      alert('Failed to delete webhook');
    }
  };

  const handleTestWebhook = async (whUrl: string) => {
    setTestResult('Sending ping...');
    try {
      const msg = await api.testWebhook(whUrl);
      setTestResult(`✅ ${msg}`);
    } catch (err: any) {
      setTestResult(`❌ ${err.message}`);
    }
  };

  const handleQuickSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickContent.trim() || loadingSave) return;

    setLoadingSave(true);
    try {
      await api.quickSave({
        title: quickTitle.trim(),
        content: quickContent.trim(),
        url: quickUrl.trim() || undefined,
        mediaType: quickMediaType
      });
      setQuickTitle('');
      setQuickContent('');
      setQuickUrl('');
      onArticleAdded();
      alert('Document ingested successfully into ReadNow Library!');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save document');
    } finally {
      setLoadingSave(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-3xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 bg-indigo-700 text-white border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-400 border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Webhook className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl tracking-tight uppercase">Enterprise Integrations & Extensions</h2>
              <p className="text-xs text-indigo-100 font-medium">Browser 1-Click Save, Slack Webhooks & Media Ingest</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white text-black border-2 border-black hover:bg-yellow-300 font-bold transition-transform active:translate-y-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex border-b-4 border-black bg-gray-100 font-extrabold text-xs uppercase">
          <button
            onClick={() => setTab('bookmarklet')}
            className={`flex-1 py-3 px-4 border-r-2 border-black flex items-center justify-center gap-2 ${
              tab === 'bookmarklet' ? 'bg-yellow-300 text-black' : 'hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Bookmark className="w-4 h-4" /> 1-Click Browser Save & Extension
          </button>
          <button
            onClick={() => setTab('quicksave')}
            className={`flex-1 py-3 px-4 border-r-2 border-black flex items-center justify-center gap-2 ${
              tab === 'quicksave' ? 'bg-yellow-300 text-black' : 'hover:bg-gray-200 text-gray-700'
            }`}
          >
            <FilePlus className="w-4 h-4" /> Text / Audio / Video Ingest
          </button>
          <button
            onClick={() => setTab('webhooks')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
              tab === 'webhooks' ? 'bg-yellow-300 text-black' : 'hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Webhook className="w-4 h-4" /> Slack / Teams Webhooks
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {tab === 'bookmarklet' && (
            <div className="space-y-6">
              <div className="p-5 border-3 border-black bg-yellow-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                <h3 className="font-extrabold text-base text-black flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-indigo-700" /> 1-Click Browser Bookmarklet Button
                </h3>
                <p className="text-xs text-gray-800 font-medium">
                  Drag the button below to your Browser Bookmarks Bar. When reading any web page, click it to instantly save the page & generate AI summaries into ReadNow!
                </p>
                <div className="pt-2 flex items-center gap-4">
                  <a
                    href={bookmarkletCode}
                    onClick={(e) => e.preventDefault()}
                    className="px-6 py-3 bg-indigo-600 text-white font-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-grab active:cursor-grabbing hover:bg-indigo-700 text-sm uppercase flex items-center gap-2"
                  >
                    <Bookmark className="w-4 h-4 fill-yellow-400" /> ⚡ Save to ReadNow
                  </a>
                  <button
                    onClick={handleCopyBookmarklet}
                    className="px-4 py-3 bg-white text-black font-bold border-2 border-black hover:bg-gray-100 text-xs uppercase flex items-center gap-1.5"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedBookmarklet ? 'Copied JavaScript Code!' : 'Copy Code'}
                  </button>
                </div>
              </div>

              <div className="p-4 border-2 border-black bg-gray-50 space-y-2">
                <h4 className="font-extrabold text-sm text-black flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-600" /> REST API Endpoint for Extension Developers:
                </h4>
                <div className="bg-slate-900 text-green-400 p-3 font-mono text-xs border border-black overflow-x-auto">
                  POST http://localhost:3000/api/quick-save<br/>
                  Content-Type: application/json<br/><br/>
                  &#123; "title": "Article Title", "url": "https://...", "content": "Article body text...", "mediaType": "web" &#125;
                </div>
              </div>
            </div>
          )}

          {tab === 'quicksave' && (
            <form onSubmit={handleQuickSave} className="space-y-4">
              <div className="p-4 border-2 border-black bg-indigo-50">
                <h3 className="font-extrabold text-sm uppercase text-indigo-950 flex items-center gap-2 mb-1">
                  <FilePlus className="w-4 h-4" /> Ingest Raw Text, Markdown, Podcast Transcript, or Video Notes
                </h3>
                <p className="text-xs text-indigo-900">
                  Directly paste non-web content into your enterprise library for instant AI analysis.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Document Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q3 Architecture Review Notes"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black font-semibold text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Content Type</label>
                  <select
                    value={quickMediaType}
                    onChange={(e: any) => setQuickMediaType(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black font-bold text-sm bg-white focus:outline-none"
                  >
                    <option value="text">📄 Text / Markdown Document</option>
                    <option value="audio">🎙️ Audio / Podcast Transcript</option>
                    <option value="video">🎥 Video Transcript / Notes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">Source URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black font-semibold text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">Content Body / Text Transcript</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Paste article body or transcript text here..."
                  value={quickContent}
                  onChange={(e) => setQuickContent(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black font-mono text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loadingSave || !quickTitle.trim() || !quickContent.trim()}
                className="w-full py-3 bg-yellow-400 text-black font-black border-2 border-black hover:bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase text-sm"
              >
                {loadingSave ? 'Analyzing & Saving Document...' : '⚡ Save & Analyze Document'}
              </button>
            </form>
          )}

          {tab === 'webhooks' && (
            <div className="space-y-6">
              {/* Add Webhook form */}
              <form onSubmit={handleAddWebhook} className="p-4 bg-indigo-50 border-2 border-black space-y-3">
                <h3 className="font-extrabold text-sm uppercase text-black flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-700" /> Configure Outbound Slack / MS Teams Webhook
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Webhook Name (e.g. #general-readings)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="px-3 py-2 border-2 border-black font-semibold text-sm focus:outline-none bg-white"
                  />
                  <input
                    type="url"
                    placeholder="Webhook URL (https://hooks.slack.com/...)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="px-3 py-2 border-2 border-black font-semibold text-sm focus:outline-none bg-white"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-yellow-400 text-black font-black border-2 border-black hover:bg-yellow-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase"
                  >
                    Save Webhook Integration
                  </button>
                </div>
              </form>

              {testResult && (
                <div className="p-3 bg-black text-yellow-300 font-mono text-xs border border-black font-bold">
                  {testResult}
                </div>
              )}

              {/* Webhooks list */}
              <div className="space-y-3">
                <h4 className="font-black text-sm uppercase text-black">Active Outbound Webhooks ({webhooks.length})</h4>
                {webhooks.map(wh => (
                  <div key={wh.id} className="p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        <h5 className="font-bold text-sm text-black">{wh.name}</h5>
                      </div>
                      <p className="text-xs font-mono text-gray-600 mt-1 truncate max-w-md">{wh.url}</p>
                      <div className="mt-2 flex gap-1.5">
                        {wh.events.map(ev => (
                          <span key={ev} className="px-2 py-0.5 bg-gray-100 border border-black text-[10px] font-bold">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestWebhook(wh.url)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-black text-xs font-bold flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Test Ping
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(wh.id)}
                        className="p-1.5 hover:bg-red-100 border border-black text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-100 border-t-4 border-black flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-black font-bold border-2 border-black hover:bg-yellow-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 text-sm uppercase"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
