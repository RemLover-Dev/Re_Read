import React, { useEffect } from 'react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

export const StreamerOverlay: React.FC = () => {
  const { isStreamerMode, toggleStreamerMode, fontScale, setFontScale } = useWorkspaceStore();

  // Keyboard shortcut listener: F11 or Esc toggles streamer mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleStreamerMode();
      } else if (e.key === 'Escape' && isStreamerMode) {
        toggleStreamerMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStreamerMode, toggleStreamerMode]);

  if (!isStreamerMode) return null;

  return (
    <aside aria-label="Streamer controls" className="fixed top-4 right-4 z-50 flex items-center space-x-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-xl border border-primary/40 shadow-2xl text-xs text-white animate-fade-in">
      <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-red-600/30 text-red-400 font-mono text-[10px] font-bold border border-red-500/40">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        <span>OBS LIVE</span>
      </div>

      <div className="h-3 w-px bg-white/20" />

      {/* Font Size Adjusters */}
      <button
        onClick={() => setFontScale(fontScale - 0.1)}
        className="p-1 hover:text-primary transition-colors"
        title="Decrease Font Size"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>

      <span className="font-mono text-[11px] text-slate-300 w-9 text-center">
        {Math.round(fontScale * 100)}%
      </span>

      <button
        onClick={() => setFontScale(fontScale + 0.1)}
        className="p-1 hover:text-primary transition-colors"
        title="Increase Font Size"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>

      <div className="h-3 w-px bg-white/20" />

      {/* Exit Streamer Mode */}
      <button
        onClick={toggleStreamerMode}
        className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-[11px]"
        title="Exit Streamer Mode (Esc)"
      >
        <X className="w-3.5 h-3.5" />
        <span>Exit (Esc)</span>
      </button>
    </aside>
  );
};
