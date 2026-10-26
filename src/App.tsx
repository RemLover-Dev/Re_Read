import React, { useState } from 'react';
import { useWorkspaceStore } from './stores/useWorkspaceStore';
import { WindowsTitlebar } from './components/titlebar/WindowsTitlebar';
import { ResilientWallpaper } from './core/wallpaper/ResilientWallpaper';
import { CodeMirrorEditor } from './components/editor/CodeMirrorEditor';
import { EditorToolbar } from './components/editor/EditorToolbar';
import { MarkdownReader } from './components/reader/MarkdownReader';
import { PDFViewer } from './components/pdf/PDFViewer';
import { BooruBrowser } from './components/booru/BooruBrowser';
import { ComicReader } from './components/comic/ComicReader';
import { EpubReader } from './components/epub/EpubReader';
import { ThemeSelectorModal } from './components/themes/ThemeSelectorModal';
import { StreamerOverlay } from './components/streamer/StreamerOverlay';
import { Loader2, UploadCloud } from 'lucide-react';

export const App: React.FC = () => {
  const {
    activeMode,
    splitRatio,
    setSplitRatio,
    isArchiveLoading,
    archiveLoadingMessage,
    openFileFromBytes,
  } = useWorkspaceStore();

  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [isDragOverWindow, setIsDragOverWindow] = useState<boolean>(false);

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

  // Global Drag & Drop for all supported files (.md, .txt, .pdf, .epub, .fb2, .cbz, .cbr, .zip, .rar)
  const handleDragOver = (e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOverWindow) setIsDragOverWindow(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOverWindow(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverWindow(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const buffer = await file.arrayBuffer();
      await openFileFromBytes(buffer, file.name);
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative h-screen w-screen flex flex-col overflow-hidden text-slate-100"
    >
      {/* 3-Tier Dynamic Background Wallpaper Pipeline */}
      <ResilientWallpaper />

      {/* Windows 11 / 10 Native-Style Glass Titlebar */}
      <WindowsTitlebar onOpenThemeModal={() => setIsThemeModalOpen(true)} />

      {/* Main Workspace Content */}
      <main className="flex-1 w-full overflow-hidden relative flex">
        <div className={`h-full w-full overflow-hidden ${activeMode === 'split' ? 'block' : 'hidden'}`}>
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
        </div>

        <div className={`h-full w-full overflow-hidden ${activeMode === 'editor' ? 'block' : 'hidden'}`}>
          <div className="h-full w-full flex flex-col">
            <EditorToolbar />
            <div className="flex-1 overflow-hidden">
              <CodeMirrorEditor />
            </div>
          </div>
        </div>

        <div className={`h-full w-full overflow-hidden ${activeMode === 'reader' ? 'block' : 'hidden'}`}>
          <MarkdownReader />
        </div>

        <div className={`h-full w-full overflow-hidden ${activeMode === 'pdf' ? 'block' : 'hidden'}`}>
          <PDFViewer />
        </div>

        <div className={`h-full w-full overflow-hidden ${activeMode === 'comic' ? 'block' : 'hidden'}`}>
          <ComicReader />
        </div>

        <div className={`h-full w-full overflow-hidden ${activeMode === 'epub' ? 'block' : 'hidden'}`}>
          <EpubReader />
        </div>

        <div className={`h-full w-full overflow-hidden ${activeMode === 'booru' ? 'block' : 'hidden'}`}>
          <BooruBrowser />
        </div>
      </main>

      {/* Drag & Drop Visual Overlay */}
      {isDragOverWindow && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-primary pointer-events-none animate-fade-in">
          <UploadCloud className="w-16 h-16 text-primary mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-white mb-2">Drop Document or Archive Here</h2>
          <p className="text-sm text-textMuted font-mono">
            Supports .epub, .fb2, .cbz, .cbr, .zip, .rar, .pdf, .md, .txt
          </p>
        </div>
      )}

      {/* Archive Decompression Loading Overlay */}
      {isArchiveLoading && (
        <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <h3 className="text-base font-bold text-white mb-1">
            {archiveLoadingMessage || 'Loading document...'}
          </h3>
          <p className="text-xs text-textMuted">Decompressing and parsing in memory</p>
        </div>
      )}

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
