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

export type EpubFont = 'sans' | 'serif' | 'persian' | 'mono';

const EPUB_FONTS: Record<EpubFont, { label: string; fontCss: string }> = {
  sans: { label: 'Modern Sans', fontCss: 'var(--font-english), var(--font-persian), sans-serif' },
  serif: { label: 'Book Serif', fontCss: 'var(--font-serif), Georgia, Cambria, serif' },
  persian: { label: 'Vazirmatn (BiDi)', fontCss: 'var(--font-persian), var(--font-english), sans-serif' },
  mono: { label: 'JetBrains Mono', fontCss: 'var(--font-mono), monospace' },
};

export const EpubReader: React.FC = () => {
  const { epubBook, epubFileName, openFileFromBytes, fontScale, setFontScale } = useWorkspaceStore();
  const { currentCharacter } = useThemeStore();

  const zoomRef = useRef<ZoomableViewRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const [readingLayout, setReadingLayout] = useState<'scroll' | 'columns'>('scroll');
  const [selectedFont, setSelectedFont] = useState<EpubFont>('sans');
  const [fontWeight, setFontWeight] = useState<number>(400);
  const [lineHeight, setLineHeight] = useState<number>(1.75);
  const [maxContentWidth, setMaxContentWidth] = useState<number>(960); // px
  const [zoom, setZoom] = useState<number>(1.0);
  const [isHandTool, setIsHandTool] = useState<boolean>(false);
  const [chapterAnchor, setChapterAnchor] = useState({ id: '', request: 0 });
  const [readProgress, setReadProgress] = useState<number>(0);
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
    setReadProgress(0);
  }, [epubBook]);

  // ZoomableView owns the scroll viewport; scrolling its outer wrapper has no effect.
  useEffect(() => {
    const viewport = zoomRef.current?.getContainer();
    if (!viewport) return;
    const anchor = chapterAnchor.id
      ? Array.from(chapterContentRef.current?.querySelectorAll('[id]') || [])
        .find((element) => element.id === chapterAnchor.id)
      : undefined;
    if (anchor) {
      viewport.scrollTop += anchor.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 24;
    } else {
      viewport.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, [currentChapterIndex, chapterAnchor, epubBook]);

  const activeChapter = epubBook?.chapters[currentChapterIndex];
  const totalChapters = epubBook?.chapters.length || 0;

  // Track smooth scroll progress for the scrubber
  useEffect(() => {
    const container = zoomRef.current?.getContainer();
    if (!container) return;

    const handleScroll = () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) {
        setReadProgress(0);
        return;
      }
      const current = Math.min(100, Math.max(0, (container.scrollTop / maxScroll) * 100));
      setReadProgress(current);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentChapterIndex, activeChapter]);

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setReadProgress(val);
    const container = zoomRef.current?.getContainer();
    if (!container) return;
    const maxScroll = container.scrollHeight - container.clientHeight;
    container.scrollTo({
      top: (val / 100) * maxScroll,
      behavior: 'smooth',
    });
  };

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
          Persian/English typography, chapter TOC, two-page spread layouts, and smooth reading.
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
      <header className="h-11 shrink-0 px-3 border-b border-white/10 bg-black/70 backdrop-blur-xl flex items-center justify-between text-xs text-slate-300 z-30 gap-2">
        {/* Left: TOC Sidebar Toggle & Book Title */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <button
            onClick={() => setIsTocOpen((prev) => !prev)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border transition-all ${
              isTocOpen
                ? 'bg-primary text-black font-bold border-primary shadow-sm'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
            }`}
            title="Toggle Table of Contents (T)"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Contents</span>
          </button>

          <div className="flex items-center space-x-1.5 truncate max-w-xs md:max-w-sm lg:max-w-md">
            <span className="font-bold text-white truncate text-xs">{epubBook.title || epubFileName}</span>
            {epubBook.author && (
              <span className="text-textMuted text-[10px] truncate hidden md:inline">by {epubBook.author}</span>
            )}
          </div>
        </div>

        {/* Center: Chapter Stepper */}
        <div className="flex items-center space-x-1.5 bg-black/50 px-2 py-0.5 rounded-lg border border-white/10 shrink-0">
          <button
            onClick={goToPrevChapter}
            disabled={currentChapterIndex === 0}
            className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Previous Chapter"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono font-medium text-slate-200 whitespace-nowrap epub-numbers-legible">
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

        {/* Right: Typography, Layout & Numeric Inputs */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Layout Toggle (Continuous Scroll vs Two-Page Spread) */}
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
              title="Two-Page Spread (Book Mode with monitor adaptation)"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Numeric Input: Font Weight */}
          <div className="flex items-center space-x-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10" title="Font Weight (100 - 900)">
            <span className="text-[10px] text-slate-400 font-medium select-none">Weight:</span>
            <input
              type="number"
              min="100"
              max="900"
              step="50"
              value={fontWeight}
              onChange={(e) => setFontWeight(Math.min(900, Math.max(100, Number(e.target.value) || 400)))}
              className="w-12 bg-black/60 text-white font-mono text-[11px] px-1 py-0.5 rounded border border-white/15 focus:border-primary outline-none text-center epub-numbers-legible"
            />
          </div>

          {/* Numeric Input: Content Width */}
          <div className="flex items-center space-x-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10" title="Reading Width in pixels">
            <span className="text-[10px] text-slate-400 font-medium select-none">Width:</span>
            <input
              type="number"
              min="400"
              max="3000"
              step="50"
              value={maxContentWidth}
              onChange={(e) => setMaxContentWidth(Math.min(3000, Math.max(400, Number(e.target.value) || 960)))}
              className="w-14 bg-black/60 text-white font-mono text-[11px] px-1 py-0.5 rounded border border-white/15 focus:border-primary outline-none text-center epub-numbers-legible"
            />
            <span className="text-[9px] text-slate-400 font-mono">px</span>
          </div>

          {/* Font Family Selector */}
          <select
            value={selectedFont}
            onChange={(e) => setSelectedFont(e.target.value as EpubFont)}
            className="bg-white/5 border border-white/10 text-slate-200 text-xs rounded-lg px-2 py-1 outline-none focus:border-primary hover:bg-white/10 transition-colors"
            title="Reading Font Family"
          >
            {Object.entries(EPUB_FONTS).map(([key, item]) => (
              <option key={key} value={key} className="bg-slate-900 text-white">
                {item.label}
              </option>
            ))}
          </select>

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
          <div className="flex items-center space-x-0.5 bg-white/5 p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => zoomRef.current?.zoomOut()}
              className="p-1 rounded hover:bg-white/10 text-slate-300 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              onClick={() => zoomRef.current?.resetZoom()}
              className="p-1 rounded hover:bg-white/10 text-slate-300 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              onClick={() => zoomRef.current?.zoomIn()}
              className="p-1 rounded hover:bg-white/10 text-slate-300 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body: TOC Sidebar Drawer + ZoomableView Chapter Reader */}
      <div className="flex-1 min-h-0 w-full flex overflow-hidden relative">
        {/* Collapsible TOC Drawer */}
        {isTocOpen && (
          <aside className="w-80 shrink-0 h-full border-r border-white/10 bg-black/80 backdrop-blur-2xl flex flex-col z-20 animate-fade-in shadow-2xl">
            {/* Book Header in Sidebar */}
            <div className="p-3.5 border-b border-white/10 flex items-center space-x-3">
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
                <h3 className="text-xs font-bold text-white truncate">{epubBook.title}</h3>
                {epubBook.author && (
                  <p className="text-[11px] text-textMuted truncate">{epubBook.author}</p>
                )}
                <span className="text-[10px] font-mono text-slate-400 epub-numbers-legible">
                  {totalChapters} chapters
                </span>
              </div>
            </div>

            {/* Typography Customization Drawer Panel */}
            <div className="p-3 border-b border-white/10 bg-white/5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span className="flex items-center space-x-1">
                  <Type className="w-3 h-3 text-primary" />
                  <span>Typography Controls</span>
                </span>
                <span className="font-mono text-[10px] text-primary epub-numbers-legible">
                  {Math.round(fontScale * 100)}%
                </span>
              </div>

              {/* Font Scale Slider */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400 w-14">Scale:</span>
                <input
                  type="range"
                  min="0.7"
                  max="2.0"
                  step="0.05"
                  value={fontScale}
                  onChange={(e) => setFontScale(Number(e.target.value))}
                  className="w-full accent-primary h-1 bg-white/20 rounded cursor-pointer"
                />
              </div>

              {/* Font Weight Slider + Number */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400 w-14">Weight:</span>
                <input
                  type="range"
                  min="100"
                  max="900"
                  step="50"
                  value={fontWeight}
                  onChange={(e) => setFontWeight(Number(e.target.value))}
                  className="w-full accent-primary h-1 bg-white/20 rounded cursor-pointer"
                />
                <span className="font-mono text-[10px] text-slate-300 w-8 text-right epub-numbers-legible">
                  {fontWeight}
                </span>
              </div>

              {/* Line Height Slider */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400 w-14">Height:</span>
                <input
                  type="range"
                  min="1.3"
                  max="2.5"
                  step="0.05"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="w-full accent-primary h-1 bg-white/20 rounded cursor-pointer"
                />
                <span className="font-mono text-[10px] text-slate-300 w-8 text-right epub-numbers-legible">
                  {lineHeight.toFixed(2)}
                </span>
              </div>

              {/* Max Content Width Slider */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400 w-14">Width:</span>
                <input
                  type="range"
                  min="400"
                  max="2800"
                  step="50"
                  value={maxContentWidth}
                  onChange={(e) => setMaxContentWidth(Number(e.target.value))}
                  className="w-full accent-primary h-1 bg-white/20 rounded cursor-pointer"
                />
                <span className="font-mono text-[10px] text-slate-300 w-8 text-right epub-numbers-legible">
                  {maxContentWidth}
                </span>
              </div>
            </div>

            {/* TOC Item List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {tocEntries.map(({ item, depth }, idx) => {
                const isActive = item.chapterIndex === currentChapterIndex;
                return (
                  <button
                    key={`${item.id}-${idx}`}
                    style={{ paddingLeft: `${12 + depth * 14}px` }}
                    onClick={() => {
                      navigateToChapter(item.chapterIndex, item.fragment);
                      if (window.innerWidth < 768) setIsTocOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-primary text-black font-bold shadow-md'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="truncate pr-2">{item.title}</span>
                    <span
                      className={`text-[10px] font-mono whitespace-nowrap epub-numbers-legible ${
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
        <div className="flex-1 min-w-0 h-full overflow-hidden relative flex flex-col">
          <ZoomableView
            ref={zoomRef}
            zoom={zoom}
            onZoomChange={setZoom}
            isHandTool={isHandTool}
            onHandToolChange={setIsHandTool}
            minZoom={0.4}
            maxZoom={3.0}
            showHud={false}
            scrollSmooth={true}
            className="h-full w-full flex-1"
            contentClassName="py-3 sm:py-6 px-1 sm:px-4 flex justify-center"
          >
            {activeChapter ? (
              <div
                className={`rounded-2xl p-4 sm:p-8 lg:p-10 shadow-2xl border transition-all duration-300 w-full ${
                  isHandTool ? 'select-none pointer-events-none' : 'select-text pointer-events-auto'
                }`}
                style={{
                  maxWidth: `${maxContentWidth}px`,
                  backgroundColor: currentCharacter.palette.surface,
                  borderColor: currentCharacter.palette.borderGlow,
                  fontSize: `${16 * fontScale}px`,
                  fontWeight: fontWeight,
                  lineHeight: `${lineHeight}`,
                  fontFamily: EPUB_FONTS[selectedFont].fontCss,
                }}
              >
                {/* Chapter Heading */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 pb-3 border-b border-white/10 text-primary tracking-wide epub-numbers-legible">
                  {activeChapter.title}
                </h1>

                {/* Chapter HTML Content */}
                <div
                  ref={chapterContentRef}
                  onClick={handleChapterClick}
                  className={`epub-chapter-content re-read-content epub-numbers-legible text-slate-100 ${
                    readingLayout === 'columns' ? 'epub-two-page-spread' : ''
                  }`}
                  style={{
                    fontWeight: fontWeight,
                    fontFamily: EPUB_FONTS[selectedFont].fontCss,
                  }}
                  dangerouslySetInnerHTML={{ __html: activeChapter.content }}
                />

                {/* Bottom Navigation Buttons */}
                <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-between text-sm">
                  <button
                    onClick={goToPrevChapter}
                    disabled={currentChapterIndex === 0}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-20 disabled:pointer-events-none transition-all text-slate-300 hover:text-white text-xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous Chapter</span>
                  </button>

                  <span className="text-xs font-mono text-textMuted epub-numbers-legible">
                    Chapter {currentChapterIndex + 1} of {totalChapters}
                  </span>

                  <button
                    onClick={goToNextChapter}
                    disabled={currentChapterIndex >= totalChapters - 1}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-black font-bold hover:opacity-90 disabled:opacity-20 disabled:pointer-events-none transition-all shadow-lg shadow-primary/20 text-xs"
                  >
                    <span>Next Chapter</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : null}
          </ZoomableView>

          {/* Smooth Reading Scrubber Bar */}
          <footer className="h-8 shrink-0 px-4 bg-black/80 backdrop-blur-md border-t border-white/10 flex items-center space-x-3 text-xs text-slate-300 z-20">
            <span className="text-[10px] font-mono text-slate-400 select-none whitespace-nowrap">
              Scrub:
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={readProgress}
              onChange={handleScrubChange}
              className="flex-1 accent-primary h-1.5 bg-white/15 rounded-lg cursor-pointer hover:h-2 transition-all"
              title="Smooth Chapter Scrubber"
            />
            <span className="text-[11px] font-mono text-primary font-semibold w-12 text-right select-none epub-numbers-legible">
              {readProgress.toFixed(1)}%
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
};

