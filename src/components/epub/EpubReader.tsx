import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import type { EpubTocItem } from '../../core/archive/types.ts';
import { resolveRelativePath } from '../../core/archive/ebook-parser.ts';
import { useThemeStore } from '../../stores/useThemeStore';
import { ZoomableView, ZoomableViewRef } from '../common/ZoomableView';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  List,
  Type,
  FolderOpen,
  Columns,
  AlignLeft,
  Hand,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

export const EpubReader: React.FC = () => {
  const { epubBook, epubFileName, openFileFromBytes, fontScale, setFontScale } = useWorkspaceStore();
  const { currentCharacter } = useThemeStore();

  const zoomRef = useRef<ZoomableViewRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const [readingLayout, setReadingLayout] = useState<'scroll' | 'columns'>('scroll');
  const [lineHeight, setLineHeight] = useState<number>(1.8);
  const [maxContentWidth, setMaxContentWidth] = useState<number>(768); // px
  const [zoom, setZoom] = useState<number>(1.0);
  const [isHandTool, setIsHandTool] = useState<boolean>(false);
  const [chapterAnchor, setChapterAnchor] = useState({ id: '', request: 0 });
  const chapterContentRef = useRef<HTMLDivElement>(null);
  const tocEntries = useMemo(() => {
    const flatten = (items: EpubTocItem[], depth = 0): { item: EpubTocItem; depth: number }[] =>
      items.flatMap((item) => [{ item, depth }, ...flatten(item.children || [], depth + 1)]);
    return flatten(epubBook?.toc || []);
  }, [epubBook]);

  // Reset chapter index on book change
  useEffect(() => {
    setCurrentChapterIndex(epubBook?.initialChapterIndex || 0);
    setChapterAnchor((previous) => ({ id: '', request: previous.request + 1 }));
    setZoom(1);
    setIsTocOpen(false);
  }, [epubBook]);

  // ZoomableView owns the scroll viewport; scrolling its outer wrapper has no effect.
  useEffect(() => {
    const viewport = zoomRef.current?.getContainer();
    if (!viewport) return;
    const anchor = chapterAnchor.id
      ? Array.from(chapterContentRef.current?.querySelectorAll('[id]') || [])
        .find((element) => element.id === chapterAnchor.id)
      : undefined;
    if (anchor) viewport.scrollTop += anchor.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 24;
    else viewport.scrollTo({ top: 0, left: 0 });
  }, [currentChapterIndex, chapterAnchor, epubBook]);

  const activeChapter = epubBook?.chapters[currentChapterIndex];
  const totalChapters = epubBook?.chapters.length || 0;
  const navigateToChapter = useCallback((index: number, fragment = '') => {
    setCurrentChapterIndex(Math.max(0, Math.min(totalChapters - 1, index)));
    setChapterAnchor((previous) => ({ id: fragment, request: previous.request + 1 }));
  }, [totalChapters]);
  const goToNextChapter = () => navigateToChapter(currentChapterIndex + 1);
  const goToPrevChapter = () => navigateToChapter(currentChapterIndex - 1);
  const handleChapterClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const link = (event.target as Element).closest('a[data-epub-href]');
    if (!link) return;
    event.preventDefault();
    const href = link.getAttribute('data-epub-href') || '';
    const path = resolveRelativePath('', href);
    const index = epubBook?.chapters.findIndex((chapter) => chapter.href === path) ?? -1;
    if (index < 0) return;
    const fragment = href.includes('#') ? href.slice(href.indexOf('#') + 1) : '';
    let decoded = fragment;
    try { decoded = decodeURIComponent(fragment); } catch {}
    navigateToChapter(index, decoded);
  };

  // Keyboard navigation for chapters
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' && e.ctrlKey) {
        goToNextChapter();
      } else if (e.key === 'ArrowLeft' && e.ctrlKey) {
        goToPrevChapter();
      } else if (e.key === 't' || e.key === 'T') {
        setIsTocOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChapterIndex, totalChapters]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      const buffer = await file.arrayBuffer();
      await openFileFromBytes(buffer, file.name);
    }
  };

  // Empty state: No E-Book loaded
  if (!epubBook || totalChapters === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-black/40">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".epub,.fb2,.fb2.zip,.txt"
          className="hidden"
        />
        <div className="p-5 rounded-2xl bg-primary/20 text-primary border border-primary/30 mb-6 shadow-2xl animate-fade-in">
          <BookOpen className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">E-Book & Light Novel Reader</h2>
        <p className="text-sm text-textMuted max-w-md mb-8 leading-relaxed">
          Open an <span className="text-primary font-mono font-semibold">.epub</span>,{' '}
          <span className="text-primary font-mono font-semibold">.fb2</span>, or{' '}
          <span className="text-primary font-mono font-semibold">.txt</span> web novel with full BiDi
          Persian/English typography, chapter TOC, and illustration viewing.
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-primary text-black font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/25 hover:scale-105 active:scale-95"
        >
          <FolderOpen className="w-5 h-5" />
          <span>Open E-Book File</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black/40 flex flex-col select-none">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".epub,.fb2,.fb2.zip,.txt"
        className="hidden"
      />

      {/* Top E-Book Navigation & Controls Bar */}
      <header className="h-12 shrink-0 px-4 border-b border-white/10 bg-black/60 flex items-center justify-between text-xs text-slate-300 z-30">
        {/* Left: TOC Sidebar Toggle & Book Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsTocOpen((prev) => !prev)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-all ${
              isTocOpen
                ? 'bg-primary text-black font-bold border-primary shadow-sm'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
            }`}
            title="Toggle Table of Contents (T)"
          >
            <List className="w-3.5 h-3.5" />
            <span>Contents</span>
          </button>

          <div className="flex items-center space-x-2 truncate max-w-xs sm:max-w-md">
            <span className="font-bold text-white truncate">{epubBook.title || epubFileName}</span>
            {epubBook.author && (
              <span className="text-textMuted text-[11px] truncate">by {epubBook.author}</span>
            )}
          </div>
        </div>

        {/* Center: Chapter Stepper */}
        <div className="flex items-center space-x-2 bg-black/40 px-2 py-1 rounded-xl border border-white/10">
          <button
            onClick={goToPrevChapter}
            disabled={currentChapterIndex === 0}
            className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Previous Chapter"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono font-medium text-slate-200 whitespace-nowrap">
            {currentChapterIndex + 1} / {totalChapters}
          </span>
          <button
            onClick={goToNextChapter}
            disabled={currentChapterIndex >= totalChapters - 1}
            className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Next Chapter"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Typography & Layout Controls */}
        <div className="flex items-center space-x-2">
          {/* Layout Toggle (Scroll vs Multi-Column) */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setReadingLayout('scroll')}
              className={`p-1.5 rounded transition-colors ${
                readingLayout === 'scroll' ? 'bg-primary text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Continuous Scroll Mode"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setReadingLayout('columns')}
              className={`p-1.5 rounded transition-colors ${
                readingLayout === 'columns' ? 'bg-primary text-black font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Two-Column Book Mode"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Hand Tool Toggle */}
          <button
            onClick={() => setIsHandTool((prev) => !prev)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isHandTool
                ? 'bg-primary text-black font-bold border-primary'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
            }`}
            title="Hand / Pan Tool (H)"
          >
            <Hand className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Buttons */}
          <button
            onClick={() => zoomRef.current?.zoomOut()}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => zoomRef.current?.resetZoom()}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => zoomRef.current?.zoomIn()}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Body: TOC Sidebar Drawer + ZoomableView Chapter Reader */}
      <div className="flex-1 min-h-0 w-full flex overflow-hidden relative">
        {/* Collapsible TOC Drawer */}
        {isTocOpen && (
          <aside className="w-80 shrink-0 h-full border-r border-white/10 bg-black/80 backdrop-blur-2xl flex flex-col z-20 animate-fade-in shadow-2xl">
            {/* Book Header in Sidebar */}
            <div className="p-4 border-b border-white/10 flex items-center space-x-3">
              {epubBook.coverUrl ? (
                <img
                  src={epubBook.coverUrl}
                  alt="Cover"
                  className="w-12 h-16 object-cover rounded-md shadow-md border border-white/15"
                />
              ) : (
                <div className="w-12 h-16 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                  <BookOpen className="w-6 h-6" />
                </div>
              )}
              <div className="overflow-hidden">
                <h3 className="text-sm font-bold text-white truncate">{epubBook.title}</h3>
                {epubBook.author && (
                  <p className="text-xs text-textMuted truncate">{epubBook.author}</p>
                )}
                <span className="text-[10px] font-mono text-slate-400">
                  {totalChapters} chapters
                </span>
              </div>
            </div>

            {/* Typography Customization Drawer Panel */}
            <div className="p-3 border-b border-white/10 bg-white/5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span className="flex items-center space-x-1">
                  <Type className="w-3 h-3 text-primary" />
                  <span>Typography</span>
                </span>
                <span className="font-mono text-[10px] text-primary">{Math.round(fontScale * 100)}%</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400 w-12">Font:</span>
                <input
                  type="range"
                  min="0.7"
                  max="1.8"
                  step="0.05"
                  value={fontScale}
                  onChange={(e) => setFontScale(Number(e.target.value))}
                  className="w-full accent-primary h-1 bg-white/20 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400 w-12">Height:</span>
                <input
                  type="range"
                  min="1.4"
                  max="2.4"
                  step="0.1"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="w-full accent-primary h-1 bg-white/20 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400 w-12">Width:</span>
                <input
                  type="range"
                  min="500"
                  max="1200"
                  step="50"
                  value={maxContentWidth}
                  onChange={(e) => setMaxContentWidth(Number(e.target.value))}
                  className="w-full accent-primary h-1 bg-white/20 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* TOC Item List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {tocEntries.map(({ item, depth }, idx) => {
                const isActive = item.chapterIndex === currentChapterIndex;
                return (
                  <button
                    key={`${item.id}-${idx}`}
                    style={{ paddingLeft: `${12 + depth * 16}px` }}
                    onClick={() => {
                      navigateToChapter(item.chapterIndex, item.fragment);
                      if (window.innerWidth < 768) setIsTocOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-primary text-black font-bold shadow-md'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="truncate pr-2">{item.title}</span>
                    <span
                      className={`text-[10px] font-mono whitespace-nowrap ${
                        isActive ? 'text-black/70' : 'text-slate-500'
                      }`}
                    >
                      #{item.chapterIndex + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Chapter Viewport wrapped in ZoomableView */}
        <div className="flex-1 min-w-0 h-full overflow-hidden relative">
          <ZoomableView
            ref={zoomRef}
            zoom={zoom}
            onZoomChange={setZoom}
            isHandTool={isHandTool}
            onHandToolChange={setIsHandTool}
            minZoom={0.4}
            maxZoom={3.0}
            showHud={false}
            className="h-full w-full"
            contentClassName="py-10 px-6 sm:px-12 flex justify-center"
          >
            {activeChapter ? (
              <div
                className={`rounded-2xl p-6 sm:p-12 shadow-2xl border transition-all duration-300 w-full ${
                  isHandTool ? 'select-none pointer-events-none' : 'select-text pointer-events-auto'
                }`}
                style={{
                  maxWidth: `${maxContentWidth}px`,
                  backgroundColor: currentCharacter.palette.surface,
                  borderColor: currentCharacter.palette.borderGlow,
                  fontSize: `${16 * fontScale}px`,
                  lineHeight: `${lineHeight}`,
                }}
              >
                {/* Chapter Heading */}
                <h1 className="text-2xl sm:text-3xl font-bold mb-8 pb-4 border-b border-white/10 text-primary tracking-wide">
                  {activeChapter.title}
                </h1>

                {/* Chapter HTML Content */}
                <div
                  ref={chapterContentRef}
                  onClick={handleChapterClick}
                  className={`epub-chapter-content re-read-content text-slate-100 ${
                    readingLayout === 'columns'
                      ? 'columns-1 md:columns-2 gap-10 [column-rule:1px_solid_rgba(255,255,255,0.1)]'
                      : ''
                  }`}
                  dangerouslySetInnerHTML={{ __html: activeChapter.content }}
                />

                {/* Bottom Navigation Buttons */}
                <div className="mt-16 pt-8 border-t border-white/10 flex items-center justify-between text-sm">
                  <button
                    onClick={goToPrevChapter}
                    disabled={currentChapterIndex === 0}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-20 disabled:pointer-events-none transition-all text-slate-300 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous Chapter</span>
                  </button>

                  <span className="text-xs font-mono text-textMuted">
                    Chapter {currentChapterIndex + 1} of {totalChapters}
                  </span>

                  <button
                    onClick={goToNextChapter}
                    disabled={currentChapterIndex >= totalChapters - 1}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-primary text-black font-bold hover:opacity-90 disabled:opacity-20 disabled:pointer-events-none transition-all shadow-lg shadow-primary/20"
                  >
                    <span>Next Chapter</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </ZoomableView>
        </div>
      </div>
    </div>
  );
};
