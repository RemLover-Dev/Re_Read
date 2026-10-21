import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { ZoomableView, ZoomableViewRef } from '../common/ZoomableView';
import { sizeComicPages } from '../../core/archive/comic-layout.ts';
import type { ImageSize } from '../../core/archive/comic-layout.ts';
import type { ComicPage } from '../../core/archive/types.ts';
import {
  computeSpreads,
  ReadingMode,
  SpreadMode,
  PageSpread,
} from '../../core/archive/spread-helper.ts';
import {
  BookOpen,
  Columns,
  Square,
  Scroll,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Hand,
  Upload,
  FolderOpen,
  SlidersHorizontal,
} from 'lucide-react';

export const ComicReader: React.FC = () => {
  const { comicBook, comicFileName, openFileFromBytes } = useWorkspaceStore();

  const zoomRef = useRef<ZoomableViewRef>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reader Settings
  const [readingMode, setReadingMode] = useState<ReadingMode>('manga-rtl');
  const [spreadMode, setSpreadMode] = useState<SpreadMode>('1P');
  const [offsetCover, setOffsetCover] = useState<boolean>(true);
  const [fitMode, setFitMode] = useState<'fit-height' | 'fit-width' | 'original'>('fit-height');
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [isHandTool, setIsHandTool] = useState<boolean>(false);
  const [showToolbar, setShowToolbar] = useState<boolean>(true);
  const [widePageIndices, setWidePageIndices] = useState<Set<number>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [imageSizes, setImageSizes] = useState<Record<string, ImageSize>>({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [viewportSize, setViewportSize] = useState<ImageSize>({ width: 1, height: 1 });

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const measure = () => setViewportSize({
      width: Math.max(1, viewport.clientWidth - 16),
      height: Math.max(1, viewport.clientHeight - 16),
    });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [comicBook]);

  // Initialize reading mode based on ComicInfo.xml metadata if available
  useEffect(() => {
    if (comicBook?.metadata.isManga) {
      setReadingMode('manga-rtl');
      setSpreadMode('2P');
    }
    setCurrentPageIndex(0);
    setWidePageIndices(new Set());
    setImageSizes({});
    setFailedImages(new Set());
    setZoom(1);
    zoomRef.current?.getContainer()?.scrollTo({ top: 0, left: 0 });
  }, [comicBook]);

  // Handle Wide (Landscape) Image Auto-detection
  const handleImageLoad = useCallback((page: ComicPage, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSizes((prev) => ({
      ...prev, [page.url]: { width: img.naturalWidth, height: img.naturalHeight },
    }));
    if (img.naturalWidth > img.naturalHeight * 1.2) {
      setWidePageIndices((prev) => {
        if (prev.has(page.index)) return prev;
        const next = new Set(prev);
        next.add(page.index);
        return next;
      });
    }
  }, []);

  // Compute pages with wide flags
  const enrichedPages = useMemo(() => {
    if (!comicBook) return [];
    return comicBook.pages.map((p) => ({
      ...p,
      isWide: widePageIndices.has(p.index),
    }));
  }, [comicBook, widePageIndices]);

  // Compute spreads for paginated modes
  const spreads: PageSpread[] = useMemo(() => {
    return computeSpreads(enrichedPages, readingMode, spreadMode, offsetCover);
  }, [enrichedPages, readingMode, spreadMode, offsetCover]);

  // Anchor navigation to the page, so a newly detected wide page or 1P/2P change
  // cannot jump backwards or leave the current spread index out of range.
  const currentSpreadIndex = Math.max(0, spreads.findIndex((spread) =>
    spread.leftPage?.index === currentPageIndex || spread.rightPage?.index === currentPageIndex
  ));
  const activeSpread = spreads[currentSpreadIndex];
  const totalSpreads = spreads.length;

  const goToSpread = useCallback((index: number) => {
    const spread = spreads[Math.max(0, Math.min(spreads.length - 1, index))];
    if (!spread) return;
    setCurrentPageIndex(Math.min(spread.leftPage?.index ?? Infinity, spread.rightPage?.index ?? Infinity));
    zoomRef.current?.getContainer()?.scrollTo({ top: 0, left: 0 });
  }, [spreads]);
  const goToNextSpread = useCallback(() => goToSpread(currentSpreadIndex + 1), [goToSpread, currentSpreadIndex]);
  const goToPrevSpread = useCallback(() => goToSpread(currentSpreadIndex - 1), [goToSpread, currentSpreadIndex]);

  // Click navigation based on reading mode
  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isHandTool) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    // Center click (middle 25%) toggles toolbar
    if (clickX > width * 0.35 && clickX < width * 0.65) {
      setShowToolbar((prev) => !prev);
      return;
    }

    if (readingMode === 'manga-rtl') {
      // Manga: Click Left = Next, Click Right = Prev
      if (clickX < width * 0.35) {
        goToNextSpread();
      } else {
        goToPrevSpread();
      }
    } else if (readingMode === 'comic-ltr') {
      // Comic: Click Right = Next, Click Left = Prev
      if (clickX > width * 0.65) {
        goToNextSpread();
      } else {
        goToPrevSpread();
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (readingMode === 'webtoon-strip') {
        if (e.key === 'Home') {
          e.preventDefault();
          zoomRef.current?.getContainer()?.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      if (readingMode === 'manga-rtl') {
        if (e.key === 'ArrowLeft' || e.key === ' ' || e.key === 'PageDown') {
          e.preventDefault();
          goToNextSpread();
        } else if (e.key === 'ArrowRight' || e.key === 'PageUp') {
          e.preventDefault();
          goToPrevSpread();
        }
      } else {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
          e.preventDefault();
          goToNextSpread();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
          e.preventDefault();
          goToPrevSpread();
        }
      }

      if (e.key === 'Home') {
        goToSpread(0);
      } else if (e.key === 'End') {
        goToSpread(totalSpreads - 1);
      } else if (e.key === 'h' || e.key === 'H') {
        setIsHandTool((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readingMode, goToNextSpread, goToPrevSpread, goToSpread, totalSpreads]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Open file handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // Allow retrying the same archive after a failed read.
    if (file) {
      const buffer = await file.arrayBuffer();
      await openFileFromBytes(buffer, file.name);
    }
  };

  const spreadPages = [activeSpread?.leftPage, activeSpread?.rightPage]
    .filter((page): page is ComicPage => Boolean(page));
  const spreadSizes = spreadPages.every((page) => imageSizes[page.url])
    ? sizeComicPages(spreadPages.map((page) => imageSizes[page.url]), viewportSize, fitMode, zoom)
    : [];
  const currentPageNumbers = spreadPages.map((page) => page.index + 1).sort((a, b) => a - b).join(' - ');

  const renderPage = (page: ComicPage, strip = false) => {
    if (failedImages.has(page.url)) {
      return <div key={page.url} role="alert" className="p-6 text-center text-rose-200 max-w-sm">
        Could not decode page {page.index + 1}: {page.name}. The image may be damaged or unsupported by this browser.
      </div>;
    }
    const size = strip && imageSizes[page.url]
      ? sizeComicPages([imageSizes[page.url]], viewportSize, fitMode === 'original' ? 'original' : 'fit-width', zoom)[0]
      : spreadSizes[spreadPages.indexOf(page)];
    return <img
      key={page.url}
      src={page.url}
      alt={`Page ${page.index + 1}`}
      loading={strip ? 'lazy' : 'eager'}
      decoding="async"
      draggable={false}
      onLoad={(event) => handleImageLoad(page, event)}
      onError={() => setFailedImages((prev) => new Set(prev).add(page.url))}
      className="block max-w-none select-none shrink-0"
      style={size ? { width: size.width, height: size.height } : {
        maxWidth: (viewportSize.width / (strip ? 1 : Math.max(1, spreadPages.length))) * zoom,
        maxHeight: !strip && fitMode === 'fit-height' ? viewportSize.height * zoom : undefined,
      }}
    />;
  };

  // Empty state: No comic loaded
  if (!comicBook || comicBook.pages.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-black/40">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".cbz,.cbr,.zip,.rar"
          className="hidden"
        />
        <div className="p-5 rounded-2xl bg-primary/20 text-primary border border-primary/30 mb-6 shadow-2xl animate-fade-in">
          <BookOpen className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Comic & Manga Reader</h2>
        <p className="text-sm text-textMuted max-w-md mb-8 leading-relaxed">
          Open a <span className="text-primary font-mono font-semibold">.cbz</span>,{' '}
          <span className="text-primary font-mono font-semibold">.cbr</span>,{' '}
          <span className="text-primary font-mono font-semibold">.zip</span>, or{' '}
          <span className="text-primary font-mono font-semibold">.rar</span> archive for high-speed
          reading with Manga RTL, Webtoon, and Spread modes.
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-primary text-black font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/25 hover:scale-105 active:scale-95"
        >
          <FolderOpen className="w-5 h-5" />
          <span>Open Comic Archive</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black/90 select-none flex flex-col">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".cbz,.cbr,.zip,.rar"
        className="hidden"
      />

      {/* Main Comic ZoomableView Viewport */}
      <div ref={viewportRef} className="flex-1 min-h-0 w-full overflow-hidden relative" onClick={handleViewportClick}>
        <ZoomableView
          ref={zoomRef}
          zoom={zoom}
          onZoomChange={setZoom}
          isHandTool={isHandTool}
          onHandToolChange={setIsHandTool}
          minZoom={0.4}
          maxZoom={4.0}
          showHud={false}
          scaleContent={false}
          centered={readingMode !== 'webtoon-strip'}
          className="h-full w-full"
          contentClassName={
            readingMode === 'webtoon-strip'
              ? 'flex flex-col items-center gap-0 py-0'
              : 'flex items-center p-2 min-h-full'
          }
        >
          {readingMode === 'webtoon-strip' ? (
            <div className="flex flex-col items-center gap-0 mx-auto">
              {enrichedPages.map((page) => renderPage(page, true))}
            </div>
          ) : (
            <div className="flex items-start justify-center gap-0 select-none" dir="ltr">
              {spreadPages.map((page) => renderPage(page))}
            </div>
          )}
        </ZoomableView>
      </div>

      {/* Floating Top Header: Title & Close/Open */}
      {showToolbar && (
        <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none transition-all duration-300">
          <div className="flex items-center space-x-3 px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/15 shadow-2xl pointer-events-auto text-xs">
            <span className="font-bold text-white tracking-wide truncate max-w-xs md:max-w-md">
              {comicBook.title || comicFileName}
            </span>
            {comicBook.metadata.series && (
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-mono">
                {comicBook.metadata.series}
              </span>
            )}
            {comicBook.metadata.isManga && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                Manga (RTL)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 pointer-events-auto">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-black/80 backdrop-blur-xl border border-white/15 hover:border-primary text-xs font-medium text-slate-200 hover:text-white transition-all shadow-xl"
              title="Open Another Comic"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Open</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-black/80 backdrop-blur-xl border border-white/15 hover:border-primary text-slate-200 hover:text-white transition-all shadow-xl"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom HUD Toolbar */}
      {showToolbar && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-auto transition-all duration-300 max-w-3xl w-[94%]">
          {/* Page Scrubber (for paginated modes) */}
          {readingMode !== 'webtoon-strip' && totalSpreads > 1 && (
            <div className="w-full px-5 py-2 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/15 shadow-2xl flex items-center space-x-4">
              <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                {readingMode === 'manga-rtl' ? 'RTL' : 'LTR'}
              </span>

              <input
                type="range"
                min="0"
                max={totalSpreads - 1}
                value={currentSpreadIndex}
                onChange={(e) => goToSpread(Number(e.target.value))}
                style={{ direction: readingMode === 'manga-rtl' ? 'rtl' : 'ltr' }}
                className="w-full accent-primary h-1.5 bg-white/20 rounded-lg cursor-pointer"
              />

              <span className="text-xs font-mono text-primary font-bold whitespace-nowrap">
                {currentPageNumbers ? `p. ${currentPageNumbers}` : `Spread ${currentSpreadIndex + 1}`} /{' '}
                {comicBook.pages.length}
              </span>
            </div>
          )}

          {/* Controls Cluster */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/15 shadow-2xl text-xs text-slate-200">
            {/* Reading Mode Selector */}
            <div className="flex items-center space-x-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setReadingMode('manga-rtl')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all ${
                  readingMode === 'manga-rtl'
                    ? 'bg-primary text-black font-bold shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Manga (Right-to-Left)"
              >
                <span>Manga (RTL)</span>
              </button>

              <button
                onClick={() => setReadingMode('webtoon-strip')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all ${
                  readingMode === 'webtoon-strip'
                    ? 'bg-primary text-black font-bold shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Manhwa / Webtoon (Vertical Strip)"
              >
                <Scroll className="w-3.5 h-3.5" />
                <span>Webtoon</span>
              </button>

              <button
                onClick={() => setReadingMode('comic-ltr')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all ${
                  readingMode === 'comic-ltr'
                    ? 'bg-primary text-black font-bold shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Western Comic (Left-to-Right)"
              >
                <span>Comic (LTR)</span>
              </button>
            </div>

            {/* Spread Options (if not webtoon) */}
            {readingMode !== 'webtoon-strip' && (
              <div className="flex items-center space-x-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setSpreadMode(spreadMode === '1P' ? '2P' : '1P')}
                  className="flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                  title="Toggle Single / Double Spread"
                >
                  {spreadMode === '2P' ? (
                    <>
                      <Columns className="w-3.5 h-3.5 text-primary" />
                      <span className="font-semibold text-primary">2P</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>1P</span>
                    </>
                  )}
                </button>

                {spreadMode === '2P' && (
                  <button
                    onClick={() => setOffsetCover((prev) => !prev)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-colors ${
                      offsetCover ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-400'
                    }`}
                    title="Offset Cover Page (Show Page 1 Alone)"
                  >
                    Cover 1P
                  </button>
                )}
              </div>
            )}

            {/* Fit Mode Switcher */}
            <div className="flex items-center space-x-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => {
                  setZoom(1);
                  setFitMode((curr) =>
                    curr === 'fit-height' ? 'fit-width' : curr === 'fit-width' ? 'original' : 'fit-height'
                  );
                }}
                className="flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors capitalize text-[11px]"
                title="Cycle Image Fit (Fit Height / Fit Width / Original)"
              >
                <SlidersHorizontal className="w-3 h-3 text-primary" />
                <span>{fitMode.replace('-', ' ')}</span>
              </button>
            </div>

            {/* Zoom & Navigation Actions */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsHandTool((prev) => !prev)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isHandTool
                    ? 'bg-primary text-black font-bold border-primary'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                }`}
                title="Pan / Hand Tool (H)"
              >
                <Hand className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => zoomRef.current?.zoomOut()}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => zoomRef.current?.resetZoom()}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors font-mono text-[10px]"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>

              <button
                onClick={() => zoomRef.current?.zoomIn()}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              {readingMode !== 'webtoon-strip' && (
                <div className="flex items-center space-x-1 ml-1 border-l border-white/10 pl-2">
                  <button
                    onClick={goToPrevSpread}
                    disabled={currentSpreadIndex === 0}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Previous Spread"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={goToNextSpread}
                    disabled={currentSpreadIndex >= totalSpreads - 1}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Next Spread"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
