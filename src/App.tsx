import React, { useState } from 'react';
import { useWorkspaceStore } from './stores/useWorkspaceStore';
import { WindowsTitlebar } from './components/titlebar/WindowsTitlebar';
import { ResilientWallpaper } from './core/wallpaper/ResilientWallpaper';
import { CodeMirrorEditor } from './components/editor/CodeMirrorEditor';
import { EditorToolbar } from './components/editor/EditorToolbar';
import { MarkdownReader } from './components/reader/MarkdownReader';
import { PDFViewer } from './components/pdf/PDFViewer';
import { BooruBrowser } from './components/booru/BooruBrowser';
import { ThemeSelectorModal } from './components/themes/ThemeSelectorModal';
import { StreamerOverlay } from './components/streamer/StreamerOverlay';

export const App: React.FC = () => {
  const { activeMode, splitRatio, setSplitRatio } = useWorkspaceStore();
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);

  // Handle Dragging Split Pane Divider
  const handleMouseDown = () => {
    setIsDraggingSplit(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingSplit) return;
    const newRatio = (e.clientX / window.innerWidth) * 100;
    if (newRatio >= 20 && newRatio <= 80) {
      setSplitRatio(newRatio);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingSplit(false);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative h-screen w-screen flex flex-col overflow-hidden text-slate-100"
    >
      {/* 3-Tier Dynamic Background Wallpaper Pipeline */}
      <ResilientWallpaper />

      {/* Windows 11 / 10 Native-Style Glass Titlebar */}
      <WindowsTitlebar onOpenThemeModal={() => setIsThemeModalOpen(true)} />

      {/* Main Workspace Workspace Content */}
      <main className="flex-1 w-full overflow-hidden relative flex">
        {activeMode === 'split' && (
          <div className="h-full w-full flex overflow-hidden">
            {/* Left Pane: CodeMirror Markdown Editor */}
            <div
              style={{ width: `${splitRatio}%` }}
              className="h-full flex flex-col border-r border-white/10"
            >
              <EditorToolbar />
              <div className="flex-1 overflow-hidden">
                <CodeMirrorEditor />
              </div>
            </div>

            {/* Draggable Divider */}
            <div
              onMouseDown={handleMouseDown}
              className="w-1.5 h-full bg-white/5 hover:bg-primary/50 cursor-col-resize transition-colors flex items-center justify-center group"
            >
              <div className="w-0.5 h-8 rounded bg-white/20 group-hover:bg-primary" />
            </div>

            {/* Right Pane: Live BiDi + LaTeX Reader */}
            <div
              style={{ width: `${100 - splitRatio}%` }}
              className="h-full overflow-hidden"
            >
              <MarkdownReader />
            </div>
          </div>
        )}

        {activeMode === 'editor' && (
          <div className="h-full w-full flex flex-col">
            <EditorToolbar />
            <div className="flex-1 overflow-hidden">
              <CodeMirrorEditor />
            </div>
          </div>
        )}

        {activeMode === 'reader' && (
          <div className="h-full w-full overflow-hidden">
            <MarkdownReader />
          </div>
        )}

        {activeMode === 'pdf' && (
          <div className="h-full w-full overflow-hidden">
            <PDFViewer />
          </div>
        )}

        {activeMode === 'booru' && (
          <div className="h-full w-full overflow-hidden">
            <BooruBrowser />
          </div>
        )}
      </main>

      {/* Streamer / OBS Presentation Overlay */}
      <StreamerOverlay />

      {/* 42-Character Re:Zero Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  );
};
