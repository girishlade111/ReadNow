import React, { useState } from 'react';
import { Highlight } from '../types';
import { Highlight as HighlightIcon, Trash2, StickyNote, Copy, Check, Plus } from 'lucide-react';

interface HighlightsManagerProps {
  highlights: Highlight[];
  onAddHighlight: (text: string, color: 'yellow' | 'green' | 'pink' | 'blue', note?: string) => void;
  onDeleteHighlight: (id: string) => void;
  selectedText: string;
  clearSelection: () => void;
}

export const HighlightsManager: React.FC<HighlightsManagerProps> = ({
  highlights,
  onAddHighlight,
  onDeleteHighlight,
  selectedText,
  clearSelection
}) => {
  const [noteInput, setNoteInput] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const colors: { name: 'yellow' | 'green' | 'pink' | 'blue'; bg: string; border: string }[] = [
    { name: 'yellow', bg: 'bg-yellow-300', border: 'border-yellow-600' },
    { name: 'green', bg: 'bg-green-300', border: 'border-green-600' },
    { name: 'pink', bg: 'bg-pink-300', border: 'border-pink-600' },
    { name: 'blue', bg: 'bg-blue-300', border: 'border-blue-600' }
  ];

  const handleCreate = (color: 'yellow' | 'green' | 'pink' | 'blue') => {
    if (!selectedText) return;
    onAddHighlight(selectedText, color, noteInput.trim());
    setNoteInput('');
    setShowNoteField(false);
    clearSelection();
  };

  const copyQuote = (text: string, id: string) => {
    navigator.clipboard.writeText(`"${text}"`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Floating Action Popover for Selected Text */}
      {selectedText && (
        <div className="bg-black text-white p-4 brutal-border border-4 border-black mb-6 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between gap-4 mb-3">
            <span className="text-xs font-mono font-bold uppercase text-red-400 flex items-center gap-1">
              <HighlightIcon className="w-4 h-4" /> Selected Text ({selectedText.length} chars)
            </span>
            <button onClick={clearSelection} className="text-xs hover:underline uppercase font-bold text-gray-400">
              Cancel
            </button>
          </div>

          <p className="text-xs font-serif italic line-clamp-2 bg-gray-900 p-2 border border-gray-700 mb-3">
            "{selectedText}"
          </p>

          {showNoteField ? (
            <div className="space-y-2 mb-3">
              <input
                type="text"
                placeholder="Add a note or comment..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="w-full p-2 bg-white text-black text-xs font-bold border-2 border-black focus:outline-none"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase">Color:</span>
              {colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => handleCreate(c.name)}
                  className={`w-6 h-6 border-2 border-white ${c.bg} hover:scale-110 transition-transform`}
                  title={`Highlight in ${c.name}`}
                />
              ))}
            </div>

            <button
              onClick={() => setShowNoteField(!showNoteField)}
              className="text-xs font-bold uppercase underline hover:text-red-400 flex items-center gap-1"
            >
              <StickyNote className="w-3.5 h-3.5" />
              {showNoteField ? "Hide Note" : "+ Add Note"}
            </button>
          </div>
        </div>
      )}

      {/* Saved Highlights List */}
      <div className="brutal-card !p-6">
        <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
          <HighlightIcon className="w-5 h-5 text-yellow-500" /> Saved Highlights ({highlights.length})
        </h3>

        {highlights.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Select any text in the article to add highlights and notes.</p>
        ) : (
          <div className="space-y-4">
            {highlights.map((h) => {
              const bgClass =
                h.color === 'green' ? 'bg-green-100 border-green-600' :
                h.color === 'pink' ? 'bg-pink-100 border-pink-600' :
                h.color === 'blue' ? 'bg-blue-100 border-blue-600' :
                'bg-yellow-100 border-yellow-600';

              return (
                <div key={h.id} className={`p-4 border-l-4 ${bgClass} border-2 border-black space-y-2 relative group`}>
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-serif italic text-black font-medium pr-12">
                      "{h.text}"
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyQuote(h.text, h.id)}
                        className="p-1 hover:text-black text-gray-500"
                        title="Copy Quote"
                      >
                        {copiedId === h.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => onDeleteHighlight(h.id)}
                        className="p-1 hover:text-red-600 text-gray-500"
                        title="Delete highlight"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {h.note && (
                    <div className="bg-white p-2 border border-black text-xs font-bold flex items-center gap-2">
                      <StickyNote className="w-3.5 h-3.5 text-red-600" />
                      <span>{h.note}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
