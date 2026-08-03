import React from 'react';
import { ReaderSettings } from '../types';
import { X, Sliders, Type, Eye, Palette } from 'lucide-react';

interface ReaderSettingsModalProps {
  settings: ReaderSettings;
  onUpdateSettings: (newSettings: Partial<ReaderSettings>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ReaderSettingsModal: React.FC<ReaderSettingsModalProps> = ({
  settings,
  onUpdateSettings,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg brutal-card !p-8 shadow-2xl relative border-4 border-black">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b-4 border-black mb-6">
          <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-red-600" /> Reader Preferences
          </h3>
          <button
            onClick={onClose}
            className="brutal-button !py-1 !px-2.5 !bg-gray-100 hover:!bg-black hover:!text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Themes */}
          <div>
            <label className="font-bold uppercase text-xs tracking-wider block mb-2 flex items-center gap-1">
              <Palette className="w-4 h-4" /> Theme Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'brutal-light', label: 'Light', bg: 'bg-[#f4f4f0]', text: 'text-black', border: 'border-black' },
                { id: 'brutal-dark', label: 'Dark', bg: 'bg-gray-950', text: 'text-white', border: 'border-white' },
                { id: 'sepia', label: 'Sepia', bg: 'bg-[#f4ecd8]', text: 'text-[#433422]', border: 'border-[#433422]' },
                { id: 'cyberpunk', label: 'Cyberpunk', bg: 'bg-yellow-300', text: 'text-black', border: 'border-black' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onUpdateSettings({ theme: t.id as any })}
                  className={`p-3 border-2 font-bold text-xs uppercase text-center transition-transform ${t.bg} ${t.text} ${t.border} ${
                    settings.theme === t.id ? 'ring-4 ring-red-600 scale-105' : ''
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div>
            <label className="font-bold uppercase text-xs tracking-wider block mb-2 flex items-center gap-1">
              <Type className="w-4 h-4" /> Font Family
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'sans', label: 'Sans-Serif', font: 'font-sans' },
                { id: 'serif', label: 'Serif', font: 'font-serif' },
                { id: 'mono', label: 'Monospace', font: 'font-mono' },
                { id: 'dyslexic', label: 'Dyslexia Friendly', font: 'font-mono tracking-wider' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => onUpdateSettings({ fontFamily: f.id as any })}
                  className={`p-2.5 border-2 border-black font-bold text-xs uppercase text-left ${f.font} ${
                    settings.fontFamily === f.id ? 'bg-black text-white' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold uppercase text-xs tracking-wider">Font Size: {settings.fontSize}px</label>
            </div>
            <input
              type="range"
              min={14}
              max={28}
              step={1}
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({ fontSize: Number(e.target.value) })}
              className="w-full accent-red-600 cursor-pointer"
            />
          </div>

          {/* Line Height */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold uppercase text-xs tracking-wider">Line Height: {settings.lineHeight}</label>
            </div>
            <input
              type="range"
              min={1.2}
              max={2.2}
              step={0.1}
              value={settings.lineHeight}
              onChange={(e) => onUpdateSettings({ lineHeight: Number(e.target.value) })}
              className="w-full accent-red-600 cursor-pointer"
            />
          </div>

          {/* Column Width */}
          <div>
            <label className="font-bold uppercase text-xs tracking-wider block mb-2">Reading Width</label>
            <div className="flex border-2 border-black">
              {[
                { id: 'narrow', label: 'Narrow (600px)' },
                { id: 'normal', label: 'Normal (800px)' },
                { id: 'wide', label: 'Wide (1000px)' }
              ].map((w) => (
                <button
                  key={w.id}
                  onClick={() => onUpdateSettings({ columnWidth: w.id as any })}
                  className={`flex-1 py-2 text-xs font-bold uppercase ${
                    settings.columnWidth === w.id ? 'bg-red-600 text-white' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {w.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Bionic Reading Toggle */}
          <div className="flex items-center justify-between pt-2 border-t-2 border-black">
            <div>
              <span className="font-bold uppercase text-xs block">Bionic Reading Engine</span>
              <span className="text-xs text-gray-500">Highlights word beginnings for 3x faster comprehension</span>
            </div>
            <button
              onClick={() => onUpdateSettings({ bionicReading: !settings.bionicReading })}
              className={`w-12 h-6 border-2 border-black rounded-none transition-colors relative ${
                settings.bionicReading ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-4 h-4 bg-black absolute top-0.5 transition-transform ${
                  settings.bionicReading ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t-4 border-black text-right">
          <button onClick={onClose} className="brutal-button !bg-black !text-white">
            Save Preferences
          </button>
        </div>

      </div>
    </div>
  );
};
