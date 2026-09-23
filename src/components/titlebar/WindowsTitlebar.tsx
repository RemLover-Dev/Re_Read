import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useThemeStore } from '../../stores/useThemeStore';
import {
  Columns,
  Edit3,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Palette,
  Tv,
  Minus,
  Square,
  Copy,
  X,
  Aperture,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface WindowsTitlebarProps {
  onOpenThemeModal: () => void;
}

export const WindowsTitlebar: React.FC<WindowsTitlebarProps> = ({ onOpenThemeModal }) => {
  const {
    activeMode,
    setActiveMode,
    isStreamerMode,
    toggleStreamerMode,
    fontScale,
    setFontScale,
  } = useWorkspaceStore();
  const { currentCharacter } = useThemeStore();
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  useEffect(() => {
    // Check initial maximize state in Tauri or Electron
    const checkState = async () => {
      try {
        if ((window as any).__TAURI_INTERNALS__) {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          const win = getCurrentWindow();
          setIsMaximized(await win.isMaximized());
          const unlisten = await win.onResized(async () => {
            setIsMaximized(await win.isMaximized());
          });
          return () => {
            unlisten();
          };
        } else if ((window as any).electronAPI?.onMaximizedChange) {
          const cleanup = (window as any).electronAPI.onMaximizedChange((max: boolean) => {
            setIsMaximized(max);
          });
          if ((window as any).electronAPI.isMaximized) {
            const current = await (window as any).electronAPI.isMaximized();
            setIsMaximized(current);
          }
          return cleanup;
        }
      } catch (err) {
        console.debug('Titlebar maximize check error:', err);
      }
    };
    checkState();
  }, []);

  const handleMinimize = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if ((window as any).__TAURI_INTERNALS__) {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().minimize();
      } else if ((window as any).electronAPI) {
        (window as any).electronAPI.minimize();
      }
    } catch (e) {
      console.warn('Minimize clicked error:', e);
    }
  };

  const handleMaximize = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if ((window as any).__TAURI_INTERNALS__) {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        await win.toggleMaximize();
        setIsMaximized(await win.isMaximized());
      } else if ((window as any).electronAPI) {
        (window as any).electronAPI.maximize();
        setIsMaximized(!isMaximized);
      }
    } catch (e) {
      console.warn('Maximize clicked error:', e);
    }
  };

  const handleClose = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if ((window as any).__TAURI_INTERNALS__) {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().close();
      } else if ((window as any).electronAPI) {
        (window as any).electronAPI.close();
      }
    } catch (e) {
      console.warn('Close clicked error:', e);
    }
  };

  if (isStreamerMode) {
    // In streamer mode, titlebar is hidden for clean presentation
    return null;
  }

  const noDragStyle: React.CSSProperties = {
    WebkitAppRegion: 'no-drag',
  } as React.CSSProperties;

  return (
    <header
      data-tauri-drag-region
      onDoubleClick={handleMaximize}
      className="h-10 w-full flex items-center justify-between px-3 border-b border-white/10 bg-black/40 backdrop-blur-xl titlebar-drag-region select-none text-xs text-slate-300 z-40"
    >
      {/* Brand & Active Character */}
      <div className="flex items-center space-x-3 titlebar-no-drag" style={noDragStyle}>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-lg bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
            <Aperture className="w-3.5 h-3.5 animate-spin-slow" />
          </div>
          <span className="font-bold tracking-wide text-white">Re:Read</span>
        </div>

        <button
          onClick={onOpenThemeModal}
          className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] transition-colors titlebar-no-drag"
          style={noDragStyle}
          title="Click to Switch Character Theme"
        >
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: currentCharacter.palette.primary }}
          />
          <span className="text-white font-medium">{currentCharacter.name.en}</span>
          <span className="text-textMuted font-persian">{currentCharacter.name.fa}</span>
          <Palette className="w-3 h-3 ml-1 text-slate-400" />
        </button>
      </div>

      {/* Center Navigation Mode Switcher */}
      <nav className="flex items-center bg-black/50 p-0.5 rounded-lg border border-white/10 titlebar-no-drag" style={noDragStyle}>
        <button
          onClick={() => setActiveMode('split')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] transition-all titlebar-no-drag ${
            activeMode === 'split' ? 'bg-primary text-black font-bold' : 'hover:text-white'
          }`}
          style={noDragStyle}
          title="Split View (Editor + Live Reader)"
        >
          <Columns className="w-3 h-3" />
          <span>Split</span>
        </button>

        <button
          onClick={() => setActiveMode('editor')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] transition-all titlebar-no-drag ${
            activeMode === 'editor' ? 'bg-primary text-black font-bold' : 'hover:text-white'
          }`}
          style={noDragStyle}
          title="Editor Only"
        >
          <Edit3 className="w-3 h-3" />
          <span>Editor</span>
        </button>

        <button
          onClick={() => setActiveMode('reader')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] transition-all titlebar-no-drag ${
            activeMode === 'reader' ? 'bg-primary text-black font-bold' : 'hover:text-white'
          }`}
          style={noDragStyle}
          title="Distraction-Free Reader"
        >
          <BookOpen className="w-3 h-3" />
          <span>Reader</span>
        </button>

        <button
          onClick={() => setActiveMode('pdf')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] transition-all titlebar-no-drag ${
            activeMode === 'pdf' ? 'bg-primary text-black font-bold' : 'hover:text-white'
          }`}
          style={noDragStyle}
          title="PDF Document Reader"
        >
          <FileText className="w-3 h-3" />
          <span>PDF</span>
        </button>

        <button
          onClick={() => setActiveMode('booru')}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] transition-all titlebar-no-drag ${
            activeMode === 'booru' ? 'bg-primary text-black font-bold' : 'hover:text-white'
          }`}
          style={noDragStyle}
          title="Booru Wallpaper Browser"
        >
          <ImageIcon className="w-3 h-3" />
          <span>Booru</span>
        </button>
      </nav>

      {/* Right Controls: Font Scaling, Streamer Toggle & Native Windows Controls */}
      <div className="flex items-center space-x-2 titlebar-no-drag" style={noDragStyle}>
        {/* Font Scaling Buttons */}
        <div className="flex items-center space-x-1 bg-black/40 px-1.5 py-0.5 rounded-md border border-white/10 titlebar-no-drag" style={noDragStyle}>
          <button
            onClick={() => setFontScale(fontScale - 0.1)}
            className="p-1 hover:text-white transition-colors titlebar-no-drag"
            style={noDragStyle}
            title="Decrease Font Size"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[10px] font-mono text-slate-300 w-8 text-center select-none">
            {Math.round(fontScale * 100)}%
          </span>
          <button
            onClick={() => setFontScale(fontScale + 0.1)}
            className="p-1 hover:text-white transition-colors titlebar-no-drag"
            style={noDragStyle}
            title="Increase Font Size"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        {/* Streamer Mode Toggle */}
        <button
          onClick={toggleStreamerMode}
          className="flex items-center space-x-1 px-2 py-1 rounded-md bg-white/5 hover:bg-primary hover:text-black transition-all border border-white/10 text-[11px] titlebar-no-drag"
          style={noDragStyle}
          title="Toggle Streamer / OBS Presentation Mode (F11)"
        >
          <Tv className="w-3 h-3" />
          <span>Streamer</span>
        </button>

        <div className="h-4 w-px bg-white/15 mx-1" />

        {/* Windows System Buttons */}
        <div className="flex items-center space-x-1 titlebar-no-drag" style={noDragStyle}>
          <button
            onClick={handleMinimize}
            className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors titlebar-no-drag"
            style={noDragStyle}
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors titlebar-no-drag"
            style={noDragStyle}
            title={isMaximized ? "Restore Window" : "Maximize Window"}
          >
            {isMaximized ? <Copy className="w-3.5 h-3.5 rotate-180" /> : <Square className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded hover:bg-red-600 text-slate-400 hover:text-white transition-colors titlebar-no-drag"
            style={noDragStyle}
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
