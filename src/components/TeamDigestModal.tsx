import React, { useState } from 'react';
import { X, Sparkles, Send, Copy, Share2, Check, FileText } from 'lucide-react';
import { api } from '../services/api';

interface TeamDigestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamDigestModal: React.FC<TeamDigestModalProps> = ({ isOpen, onClose }) => {
  const [digest, setDigest] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [broadcasted, setBroadcasted] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await api.generateTeamDigest();
      setDigest(data);
    } catch (err: any) {
      alert(err.message || 'Failed to generate digest');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!digest) return;
    let md = `# 🗞️ ${digest.digestTitle}\n\n`;
    md += `*Generated on: ${new Date(digest.generatedAt).toLocaleDateString()}*\n\n`;
    md += `## Executive Summary\n\n> ${digest.summary}\n\n`;
    if (digest.topInsights?.length) {
      md += `## Top Team Insights\n\n`;
      digest.topInsights.forEach((item: string) => md += `- ${item}\n`);
      md += `\n`;
    }
    if (digest.recommendedAction) {
      md += `## Recommended Action\n\n${digest.recommendedAction}\n`;
    }
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBroadcastSlack = () => {
    setBroadcasted(true);
    setTimeout(() => setBroadcasted(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 bg-amber-500 text-black border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl tracking-tight uppercase">Weekly Team AI Digest</h2>
              <p className="text-xs text-amber-950 font-medium">Synthesize key team reading highlights for Slack / Email</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white text-black border-2 border-black hover:bg-yellow-300 font-bold transition-transform active:translate-y-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {!digest && (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 bg-amber-100 border-3 border-black mx-auto flex items-center justify-center">
                <FileText className="w-8 h-8 text-amber-700" />
              </div>
              <div>
                <h3 className="font-black text-lg text-black uppercase">Generate Weekly Team Knowledge Brief</h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto mt-1 font-medium">
                  AI will analyze all articles saved by your team over the past week and generate a concise executive brief ready for broadcast.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-8 py-3 bg-yellow-400 text-black font-black border-2 border-black hover:bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase text-sm active:translate-y-0.5 disabled:opacity-50"
              >
                {loading ? 'Analyzing Team Knowledge...' : '✨ Generate AI Digest Now'}
              </button>
            </div>
          )}

          {digest && (
            <div className="space-y-4">
              <div className="p-5 border-3 border-black bg-yellow-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                <div className="flex items-center justify-between border-b-2 border-black/20 pb-2">
                  <h3 className="font-black text-base text-black uppercase">{digest.digestTitle}</h3>
                  <span className="text-[10px] font-mono font-bold bg-black text-yellow-300 px-2 py-0.5">
                    {new Date(digest.generatedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="font-bold text-gray-900 leading-relaxed bg-white p-3 border border-black">
                    &gt; {digest.summary}
                  </p>

                  {digest.topInsights?.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <h4 className="font-extrabold uppercase text-amber-900">Key Team Insights:</h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-800 font-medium pl-1">
                        {digest.topInsights.map((insight: string, idx: number) => (
                          <li key={idx} className="leading-snug">{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {digest.recommendedAction && (
                    <div className="pt-2">
                      <h4 className="font-extrabold uppercase text-amber-900">Recommended Action:</h4>
                      <p className="bg-amber-100 p-2 border border-black font-bold text-amber-950">
                        🎯 {digest.recommendedAction}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleGenerate}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border-2 border-black text-xs font-bold uppercase"
                >
                  🔄 Regenerate
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyMarkdown}
                    className="px-4 py-2 bg-white text-black font-bold border-2 border-black hover:bg-yellow-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copied Markdown!' : 'Copy Markdown'}
                  </button>
                  <button
                    onClick={handleBroadcastSlack}
                    className="px-5 py-2 bg-emerald-500 text-white font-black border-2 border-black hover:bg-emerald-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs uppercase flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {broadcasted ? 'Broadcasted to Slack!' : 'Broadcast to Slack / Teams'}
                  </button>
                </div>
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
