import React, { useEffect, useState, useRef } from 'react';
import { compileBiDiMarkdown } from '../../core/bidi/markdown-pipeline';
import { useThemeStore } from '../../stores/useThemeStore';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { ZoomableView, type ZoomableViewRef } from '../common/ZoomableView';
import { ZoomIn, ZoomOut, RotateCcw, Hand, MousePointer, Maximize2 } from 'lucide-react';
import 'katex/dist/katex.min.css';

export const MarkdownReader: React.FC = () => {
  const { markdownContent, fontScale, isStreamerMode } = useWorkspaceStore();
  const { currentCharacter } = useThemeStore();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Zoom & Pan state synchronized with ZoomableView
  const [zoom, setZoom] = useState<number>(1.0);
  const [isHandTool, setIsHandTool] = useState<boolean>(false);
  const zoomableViewRef = useRef<ZoomableViewRef | null>(null);

  // Compile Markdown to BiDi HTML with KaTeX
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    compileBiDiMarkdown(markdownContent).then((html) => {
      if (!isCancelled) {
        setHtmlContent(html);
        setIsLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [markdownContent]);

  // Handle Fit to Width
  const handleFitWidth = () => {
    const container = zoomableViewRef.current?.getContainer();
    if (container) {
      const availableWidth = container.clientWidth - 80;
      const idealZoom = Math.min(Math.max(availableWidth / 896, 0.5), 2.5);
      zoomableViewRef.current?.setZoom(idealZoom);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden select-none">
      {/* ZoomableView container: Native non-passive touchpad pinch & 2D pan */}
      <ZoomableView
        ref={zoomableViewRef}
        zoom={zoom}
        onZoomChange={setZoom}
        isHandTool={isHandTool}
        onHandToolChange={setIsHandTool}
        minZoom={0.4}
        maxZoom={4.0}
        showHud={false}
        className={`h-full w-full ${isStreamerMode ? 'streamer-presentation-mode' : ''}`}
        contentClassName="py-8 px-8 sm:px-16"
      >
        <div
          className={`rounded-2xl p-6 sm:p-10 shadow-2xl transition-[filter,background-color,border-color] border max-w-4xl w-full ${
            isHandTool ? 'select-none pointer-events-none' : 'select-text pointer-events-auto'
          }`}
          style={{
            fontSize: `${16 * fontScale}px`,
            backgroundColor: currentCharacter.palette.surface,
            borderColor: currentCharacter.palette.borderGlow,
          }}
        >
          {isLoading && (
            <div className="text-xs text-primary font-mono mb-4 animate-pulse">
              Compiling BiDi LaTeX...
            </div>
          )}

          <article
            className="re-read-content prose prose-invert max-w-none leading-relaxed transition-all"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </ZoomableView>

      {/* Floating HUD Zoom & Pan Toolbar */}
      {!isStreamerMode && (
        <div className="absolute bottom-5 right-6 z-30 flex items-center space-x-1.5 p-1 rounded-xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-2xl text-slate-300 text-xs">
          {/* Hand Tool / Pan Mode Toggle */}
          <button
            onClick={() => setIsHandTool((prev) => !prev)}
            className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
              isHandTool
                ? 'bg-primary text-black font-semibold shadow'
                : 'hover:bg-white/10 text-slate-300'
            }`}
            title={
              isHandTool
                ? 'Switch to Text Selection Mode'
                : 'Switch to Hand Pan Tool (or hold Spacebar)'
            }
          >
            {isHandTool ? (
              <Hand className="w-3.5 h-3.5" />
            ) : (
              <MousePointer className="w-3.5 h-3.5" />
            )}
          </button>

          <div className="h-3.5 w-px bg-white/20 mx-0.5" />

          {/* Zoom Out */}
          <button
            onClick={() => zoomableViewRef.current?.zoomOut(0.2)}
            disabled={zoom <= 0.5}
            className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
            title="Zoom Out (Ctrl -)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Percent indicator */}
          <button
            onClick={() => zoomableViewRef.current?.resetZoom()}
            className="px-2 py-0.5 font-mono text-[11px] text-white hover:text-primary transition-colors text-center w-14"
            title="Reset Zoom to 100% (Ctrl 0)"
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* Zoom In */}
          <button
            onClick={() => zoomableViewRef.current?.zoomIn(0.2)}
            disabled={zoom >= 3.8}
            className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
            title="Zoom In (Ctrl +)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Reset Zoom */}
          <button
            onClick={() => zoomableViewRef.current?.resetZoom()}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            title="Reset to 100%"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          {/* Fit Width */}
          <button
            onClick={handleFitWidth}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            title="Fit to Width"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
