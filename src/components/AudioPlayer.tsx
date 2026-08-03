import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, FastForward, Sparkles } from 'lucide-react';

interface AudioPlayerProps {
  title: string;
  text: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ title, text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Clean HTML tags from text for speech
  const cleanText = React.useMemo(() => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = text;
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
  }, [text]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const togglePlay = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    const synth = window.speechSynthesis;

    if (isPlaying) {
      synth.pause();
      setIsPlaying(false);
      return;
    }

    if (synth.paused) {
      synth.resume();
      setIsPlaying(true);
      return;
    }

    // Start fresh
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(`${title}. ${cleanText}`);
    utterance.rate = rate;
    utterance.volume = isMuted ? 0 : 1;

    utterance.onboundary = (e) => {
      if (cleanText.length > 0) {
        const charProgress = Math.min(100, Math.round((e.charIndex / cleanText.length) * 100));
        setProgress(charProgress);
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
    setIsPlaying(true);
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    if ('speechSynthesis' in window && isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setTimeout(() => {
        togglePlay();
      }, 100);
    }
  };

  const resetAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="bg-black text-white p-4 brutal-border border-4 border-black mb-8 shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title & Status */}
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 text-white border-2 border-white">
            <Volume2 className={`w-5 h-5 ${isPlaying ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <span>AI Audio Podcast Reader</span>
              {isPlaying && <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 animate-pulse">PLAYING</span>}
            </h4>
            <p className="text-xs font-mono text-gray-300 truncate max-w-xs md:max-w-md">
              {title}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Progress Slider */}
          <div className="flex-1 md:w-48 bg-gray-800 h-3 border border-white relative overflow-hidden">
            <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed Picker */}
            <div className="flex border border-white text-xs font-bold font-mono">
              {[1, 1.25, 1.5, 2].map((r) => (
                <button
                  key={r}
                  onClick={() => handleRateChange(r)}
                  className={`px-1.5 py-1 ${rate === r ? 'bg-red-600 text-white' : 'bg-black text-gray-300 hover:text-white'}`}
                >
                  {r}x
                </button>
              ))}
            </div>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="brutal-button !bg-red-600 !text-white !p-2 !border-white hover:!bg-red-700"
              title={isPlaying ? "Pause Audio" : "Play Audio"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Reset */}
            <button
              onClick={resetAudio}
              className="p-2 text-gray-300 hover:text-white"
              title="Reset Audio"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
