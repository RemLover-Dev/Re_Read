import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useThemeStore } from '../../stores/useThemeStore';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Upload,
  Sparkles,
  FileText,
  Hand,
  MousePointer,
  Maximize2,
  Minimize2,
  BookOpen,
  ScrollText,
} from 'lucide-react';

// Setup PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export type PDFViewMode = 'single' | 'continuous';

interface PDFPageItemProps {
  pageNumber: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  scale: number;
  renderScale: number;
  applyThemeFilter: boolean;
  themeFilter: string;
  onPageVisible?: (pageNumber: number) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  registerPageRef?: (pageNumber: number, el: HTMLDivElement | null) => void;
}

const PDFPageItem: React.FC<PDFPageItemProps> = ({
  pageNumber,
  pdfDoc,
  scale,
  renderScale,
  applyThemeFilter,
  themeFilter,
  onPageVisible,
  containerRef,
  registerPageRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const [baseDimensions, setBaseDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isRendered, setIsRendered] = useState<boolean>(false);

  // Register DOM element reference for scrollIntoView
  useEffect(() => {
    if (registerPageRef) {
      registerPageRef(pageNumber, wrapperRef.current);
    }
    return () => {
      if (registerPageRef) {
        registerPageRef(pageNumber, null);
      }
    };
  }, [pageNumber, registerPageRef]);

  // Load page base dimensions
  useEffect(() => {
    let isCancelled = false;
    pdfDoc.getPage(pageNumber).then((page) => {
      if (isCancelled) return;
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      setBaseDimensions({
        width: unscaledViewport.width,
        height: unscaledViewport.height,
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, pageNumber]);

  // Render Page to Canvas at renderScale * DPR for razor-sharp HiDPI quality
  useEffect(() => {
    let isCancelled = false;

    pdfDoc.getPage(pageNumber).then((page) => {
      if (isCancelled || !canvasRef.current) return;

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // HiDPI support capped at 2.5 to avoid excessive GPU memory usage
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const viewport = page.getViewport({ scale: renderScale * dpr });

      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);

      const renderContext = {
        canvasContext: ctx,
        viewport,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;

      task.promise
        .then(() => {
          if (!isCancelled) {
            renderTaskRef.current = null;
            setIsRendered(true);
          }
        })
        .catch((err: any) => {
          if (err?.name !== 'RenderingCancelledException') {
            console.error(`Page ${pageNumber} render error:`, err);
          }
        });
    });

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, pageNumber, renderScale]);

  // IntersectionObserver to detect active page during continuous vertical scrolling
  useEffect(() => {
    if (!wrapperRef.current || !onPageVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            onPageVisible(pageNumber);
          }
        });
      },
      {
        root: containerRef?.current || null,
        threshold: [0.1, 0.35, 0.7],
      }
    );

    observer.observe(wrapperRef.current);
    return () => {
      observer.disconnect();
    };
  }, [pageNumber, onPageVisible, containerRef]);

  const targetWidth = baseDimensions ? Math.round(baseDimensions.width * scale) : 600;
  const targetHeight = baseDimensions ? Math.round(baseDimensions.height * scale) : 800;

  return (
    <div
      ref={wrapperRef}
      className="relative flex flex-col items-center select-none"
      style={{
        width: `${targetWidth}px`,
        height: `${targetHeight}px`,
      }}
    >
      <div
        className="w-full h-full rounded-lg shadow-2xl overflow-hidden border border-white/15 bg-white transition-[filter] duration-200"
        style={{
          filter: applyThemeFilter ? themeFilter : 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full object-contain"
          style={{
            opacity: isRendered ? 1 : 0.9,
          }}
        />
      </div>
    </div>
  );
};

export const PDFViewer: React.FC = () => {
  const { pdfUrl, pdfFileName, setPdfUrl } = useWorkspaceStore();
  const { currentCharacter } = useThemeStore();

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [viewMode, setViewMode] = useState<PDFViewMode>('continuous');

  // Interactive scale vs debounced render scale for instant 60fps touchpad pinch
  const [scale, setScale] = useState<number>(1.25);
  const [renderScale, setRenderScale] = useState<number>(1.25);

  const [applyThemeFilter, setApplyThemeFilter] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pan and navigation state
  const [isHandTool, setIsHandTool] = useState<boolean>(true);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [firstPageSize, setFirstPageSize] = useState<{ width: number; height: number } | null>(null);

  const viewerRootRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentWrapperRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const registerPageRef = useCallback((num: number, el: HTMLDivElement | null) => {
    pageRefs.current[num] = el;
  }, []);

  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDistRef = useRef<number | null>(null);
  const lastGestureScaleRef = useRef<number>(1.0);
  const scaleRef = useRef<number>(scale);
  scaleRef.current = scale;

  // Debounce renderScale so rapid touchpad pinch events don't trigger dozens of heavy canvas renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderScale(scale);
    }, 120);
    return () => clearTimeout(timer);
  }, [scale]);

  // Load PDF Document
  useEffect(() => {
    if (!pdfUrl) return;

    let isCancelled = false;
    setIsLoading(true);
    setErrorMsg(null);

    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    loadingTask.promise
      .then((doc) => {
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setIsLoading(false);

          // Read first page dimensions for Fit Width & Fit Page
          doc.getPage(1).then((p) => {
            const vp = p.getViewport({ scale: 1.0 });
            setFirstPageSize({ width: vp.width, height: vp.height });
          });
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setErrorMsg(`Failed to load PDF: ${err.message}`);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [pdfUrl]);

  // Zoom relative to a focal point using invariant coordinate projection
  const zoomAtFocalPoint = useCallback(
    (factor: number, focalPoint: { clientX: number; clientY: number }) => {
      if (!Number.isFinite(factor) || factor <= 0) return;
      const prevScale = scaleRef.current;
      if (!Number.isFinite(prevScale) || prevScale <= 0) return;

      const nextScale = Math.min(Math.max(prevScale * factor, 0.3), 5.0);
      if (Math.abs(nextScale - prevScale) < 0.0001) return;

      const container = containerRef.current;
      if (container) {
        const cRect = container.getBoundingClientRect();
        const ratio = nextScale / prevScale;

        // Container-space scroll coordinate projection for continuous & single modes
        const cursorOffsetY = focalPoint.clientY - cRect.top;
        const containerY = container.scrollTop + cursorOffsetY;
        const shiftY = containerY * (ratio - 1);

        const cursorOffsetX = focalPoint.clientX - cRect.left;
        const containerX = container.scrollLeft + cursorOffsetX;
        const shiftX = (containerX - container.clientWidth / 2) * (ratio - 1);

        requestAnimationFrame(() => {
          if (!container) return;
          container.scrollLeft += shiftX;
          container.scrollTop += shiftY;
        });
      }

      scaleRef.current = nextScale;
      setScale(nextScale);
    },
    []
  );

  // Zoom to a specific target scale (e.g. from toolbar buttons or keyboard)
  const applyZoom = useCallback(
    (newScaleTarget: number, focalPoint?: { clientX: number; clientY: number }) => {
      if (!Number.isFinite(newScaleTarget) || newScaleTarget <= 0) return;
      const prevScale = scaleRef.current;
      if (!Number.isFinite(prevScale) || prevScale <= 0) return;

      const clampedScale = Math.min(Math.max(newScaleTarget, 0.3), 5.0);
      if (Math.abs(clampedScale - prevScale) < 0.0001) return;

      const container = containerRef.current;
      if (container) {
        const cRect = container.getBoundingClientRect();
        const ratio = clampedScale / prevScale;

        const targetX = focalPoint ? focalPoint.clientX : cRect.left + cRect.width / 2;
        const targetY = focalPoint ? focalPoint.clientY : cRect.top + cRect.height / 2;

        const cursorOffsetY = targetY - cRect.top;
        const containerY = container.scrollTop + cursorOffsetY;
        const shiftY = containerY * (ratio - 1);

        const cursorOffsetX = targetX - cRect.left;
        const containerX = container.scrollLeft + cursorOffsetX;
        const shiftX = (containerX - container.clientWidth / 2) * (ratio - 1);

        requestAnimationFrame(() => {
          if (!container) return;
          container.scrollLeft += shiftX;
          container.scrollTop += shiftY;
        });
      }

      scaleRef.current = clampedScale;
      setScale(clampedScale);
    },
    []
  );

  // Capture-phase wheel listener on window for WebView2 Precision Touchpad Pinch
  useEffect(() => {
    const handleCaptureWheel = (e: WheelEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const isTargetInside = container.contains(e.target as Node);
      const cRect = container.getBoundingClientRect();
      const isCursorInside =
        e.clientX >= cRect.left &&
        e.clientX <= cRect.right &&
        e.clientY >= cRect.top &&
        e.clientY <= cRect.bottom;

      if (!isTargetInside && !isCursorInside) return;

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        let delta = -e.deltaY;
        if (e.deltaMode === 1) delta *= 16;
        else if (e.deltaMode === 2) delta *= 40;

        const isNotch = Math.abs(delta) >= 50;

        let factor: number;
        if (isNotch) {
          // Standard physical mouse wheel notch: ~10% step
          factor = delta > 0 ? 1.10 : 0.90;
        } else {
          // Smooth touchpad pinch: continuous exponential scaling
          const clamped = Math.sign(delta) * Math.min(Math.abs(delta), 30);
          factor = Math.exp(clamped * 0.005);
        }

        zoomAtFocalPoint(factor, { clientX: e.clientX, clientY: e.clientY });
      }
    };

    window.addEventListener('wheel', handleCaptureWheel, { passive: false, capture: true });
    return () => {
      window.removeEventListener('wheel', handleCaptureWheel, { capture: true });
    };
  }, [zoomAtFocalPoint]);

  // WebKit gesture event listeners for macOS / Safari trackpads (incremental delta)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onGestureStart = (e: any) => {
      e.preventDefault();
      lastGestureScaleRef.current = 1.0;
    };
    const onGestureChange = (e: any) => {
      e.preventDefault();
      if (e.scale && Number.isFinite(e.scale) && lastGestureScaleRef.current > 0) {
        const factor = e.scale / lastGestureScaleRef.current;
        lastGestureScaleRef.current = e.scale;
        zoomAtFocalPoint(factor, { clientX: e.clientX, clientY: e.clientY });
      }
    };

    container.addEventListener('gesturestart', onGestureStart as any, { passive: false });
    container.addEventListener('gesturechange', onGestureChange as any, { passive: false });

    return () => {
      container.removeEventListener('gesturestart', onGestureStart as any);
      container.removeEventListener('gesturechange', onGestureChange as any);
    };
  }, [zoomAtFocalPoint]);

  // Multi-touch pinch tracking for touchscreen / Linux WebKitGTK touchpad touches
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastTouchDist: number | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        lastTouchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      } else {
        lastTouchDist = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && lastTouchDist && lastTouchDist > 5) {
        e.preventDefault();
        e.stopPropagation();

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

        if (dist > 5) {
          const factor = dist / lastTouchDist;
          lastTouchDist = dist;

          const centerX = (t1.clientX + t2.clientX) / 2;
          const centerY = (t1.clientY + t2.clientY) / 2;
          zoomAtFocalPoint(factor, { clientX: centerX, clientY: centerY });
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        lastTouchDist = null;
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: false });
    container.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [zoomAtFocalPoint]);

  // Pointer event cleanup on global window pointerup / blur
  useEffect(() => {
    const handleGlobalPointerUp = (e: PointerEvent) => {
      activePointersRef.current.delete(e.pointerId);
      if (activePointersRef.current.size < 2) {
        lastPinchDistRef.current = null;
      }
    };
    const handleGlobalBlur = () => {
      activePointersRef.current.clear();
      lastPinchDistRef.current = null;
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    window.addEventListener('blur', handleGlobalBlur);

    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
      window.removeEventListener('blur', handleGlobalBlur);
    };
  }, []);

  // Spacebar toggle for quick panning + Keyboard shortcuts + window blur safety
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        applyZoom(scaleRef.current + 0.2);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        applyZoom(scaleRef.current - 0.2);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        applyZoom(1.25);
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (viewMode === 'single' && currentPage < numPages) {
          e.preventDefault();
          setCurrentPage((p) => p + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (viewMode === 'single' && currentPage > 1) {
          e.preventDefault();
          setCurrentPage((p) => p - 1);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsDragging(false);
      }
    };

    const handleBlur = () => {
      setIsSpacePressed(false);
      setIsDragging(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [viewMode, currentPage, numPages, applyZoom]);

  // Navigate to a specific page
  const goToPage = (pageNum: number) => {
    const target = Math.min(Math.max(1, pageNum), numPages);
    setCurrentPage(target);

    if (viewMode === 'continuous') {
      const pageEl = pageRefs.current[target];
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    }
  };

  // Fit to Width calculation
  const handleFitWidth = () => {
    if (!containerRef.current || !firstPageSize) return;
    const availableWidth = containerRef.current.clientWidth - 48; // padding
    const idealScale = Math.min(Math.max(availableWidth / firstPageSize.width, 0.4), 4.0);
    applyZoom(idealScale);
  };

  // Fit to Page calculation
  const handleFitPage = () => {
    if (!containerRef.current || !firstPageSize) return;
    const availableWidth = containerRef.current.clientWidth - 48;
    const availableHeight = containerRef.current.clientHeight - 64;
    const scaleX = availableWidth / firstPageSize.width;
    const scaleY = availableHeight / firstPageSize.height;
    const idealScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.4), 4.0);
    applyZoom(idealScale);
  };

  // Mouse drag-to-pan handlers with window capture
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    const isInteractive =
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'A');

    if (isInteractive) return;

    const isTargetBackground =
      target === containerRef.current || target === contentWrapperRef.current;

    const shouldPan =
      isHandTool ||
      isSpacePressed ||
      e.button === 1 ||
      (scale > 1.25 && isTargetBackground && e.button === 0);

    if (!shouldPan) return;

    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startScrollLeft = container.scrollLeft;
    const startScrollTop = container.scrollTop;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      container.scrollLeft = startScrollLeft - dx;
      container.scrollTop = startScrollTop - dy;
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Handle local PDF File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setPdfUrl(fileUrl, file.name);
    }
  };

  // Drag and drop PDF files into viewport
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      const fileUrl = URL.createObjectURL(file);
      setPdfUrl(fileUrl, file.name);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointersRef.current.size === 2) {
        const pts = Array.from(activePointersRef.current.values());
        lastPinchDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointersRef.current.size === 2 && lastPinchDistRef.current && lastPinchDistRef.current > 5) {
        const pts = Array.from(activePointersRef.current.values());
        const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const factor = currentDist / lastPinchDistRef.current;
        lastPinchDistRef.current = currentDist;

        const centerX = (pts[0].x + pts[1].x) / 2;
        const centerY = (pts[0].y + pts[1].y) / 2;
        zoomAtFocalPoint(factor, { clientX: centerX, clientY: centerY });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      lastPinchDistRef.current = null;
    }
  };

  const isPanningActive = isHandTool || isSpacePressed;

  return (
    <div
      ref={viewerRootRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="h-full w-full flex flex-col overflow-hidden bg-black/40 select-none"
    >
      {/* PDF Controls Toolbar */}
      <div className="h-12 px-4 sm:px-6 border-b border-white/10 bg-black/60 flex items-center justify-between text-xs text-slate-300 z-30">
        {/* Left: Open File & Filename */}
        <div className="flex items-center space-x-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-primary text-black font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Open PDF</span>
          </button>

          {pdfFileName && (
            <span className="text-slate-300 font-mono text-xs truncate max-w-xs" title={pdfFileName}>
              {pdfFileName}
            </span>
          )}
        </div>

        {pdfDoc && (
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* View Mode Switcher: Single Page ("صفحه صفحه") vs Continuous Vertical ("زیر هم") */}
            <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10">
              <button
                onClick={() => setViewMode('single')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] transition-all ${
                  viewMode === 'single'
                    ? 'bg-primary text-black font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Single Page Mode (Page-by-Page)"
              >
                <BookOpen className="w-3 h-3" />
                <span>Single</span>
              </button>
              <button
                onClick={() => setViewMode('continuous')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] transition-all ${
                  viewMode === 'continuous'
                    ? 'bg-primary text-black font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Continuous Vertical Scroll Mode (All Pages Stacked)"
              >
                <ScrollText className="w-3 h-3" />
                <span>Continuous</span>
              </button>
            </div>

            <div className="h-4 w-px bg-white/15" />

            {/* Page Navigation */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-mono text-xs text-white px-1">
                {currentPage} / {numPages}
              </span>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= numPages}
                className="p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="h-4 w-px bg-white/15" />

            {/* Hand Tool / Pan Mode Toggle */}
            <button
              onClick={() => setIsHandTool(!isHandTool)}
              className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                isHandTool
                  ? 'bg-primary text-black font-semibold'
                  : 'hover:bg-white/10 text-slate-300'
              }`}
              title={isHandTool ? 'Switch to Pointer (Click to Pan)' : 'Switch to Hand Pan Tool (or hold Spacebar)'}
            >
              {isHandTool ? <Hand className="w-3.5 h-3.5" /> : <MousePointer className="w-3.5 h-3.5" />}
            </button>

            <div className="h-4 w-px bg-white/15" />

            {/* Zoom Controls */}
            <div className="flex items-center space-x-0.5">
              <button
                onClick={() => applyZoom(scale - 0.2)}
                disabled={scale <= 0.4}
                className="p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30 transition-colors"
                title="Zoom Out (Ctrl -)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => applyZoom(1.25)}
                className="font-mono text-[11px] w-12 text-center text-slate-200 hover:text-primary transition-colors"
                title="Reset Zoom to 125% (Ctrl 0)"
              >
                {Math.round(scale * 100)}%
              </button>

              <button
                onClick={() => applyZoom(scale + 0.2)}
                disabled={scale >= 4.0}
                className="p-1.5 rounded-md hover:bg-white/10 disabled:opacity-30 transition-colors"
                title="Zoom In (Ctrl +)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => applyZoom(1.25)}
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>

              <button
                onClick={handleFitWidth}
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                title="Fit to Width"
              >
                <Maximize2 className="w-3 h-3" />
              </button>

              <button
                onClick={handleFitPage}
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                title="Fit to Page"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
            </div>

            <div className="h-4 w-px bg-white/15" />

            {/* Theme Tint Shader Toggle */}
            <button
              onClick={() => setApplyThemeFilter((f) => !f)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition-all ${
                applyThemeFilter
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
              title="Toggle Dynamic Character Palette Filter"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Theme Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* PDF Viewport Container - Edge-style Smooth 2D Scroll & Pan */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className={`flex-1 overflow-auto relative ${
          isDragging ? 'cursor-grabbing' : isPanningActive ? 'cursor-grab' : 'cursor-auto'
        }`}
      >
        {!pdfUrl ? (
          <div className="h-full w-full flex items-center justify-center p-8">
            <div className="text-center p-10 max-w-md rounded-2xl glass-panel border border-white/10 shadow-2xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No PDF Document Loaded</h3>
              <p className="text-xs text-textMuted leading-relaxed mb-6">
                Open any research paper, thesis, or textbook to view it in Single-Page or Continuous Vertical Scroll mode with seamless laptop touchpad zoom and 2D pan.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-primary text-black font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
              >
                Choose PDF File
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="h-full w-full flex flex-col items-center justify-center space-y-3 p-8">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-mono text-primary">Loading Document...</p>
          </div>
        ) : errorMsg ? (
          <div className="h-full w-full flex items-center justify-center p-8">
            <div className="p-6 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-sm max-w-md text-center">
              {errorMsg}
            </div>
          </div>
        ) : pdfDoc ? (
          <div
            ref={contentWrapperRef}
            className="flex flex-col items-center py-16 px-16 min-w-full w-max min-h-full h-max"
          >
            {viewMode === 'single' ? (
              /* Single Page Mode ("صفحه صفحه") */
              <div className="flex flex-col items-center">
                <PDFPageItem
                  key={`page-${currentPage}`}
                  pageNumber={currentPage}
                  pdfDoc={pdfDoc}
                  scale={scale}
                  renderScale={renderScale}
                  applyThemeFilter={applyThemeFilter}
                  themeFilter={currentCharacter.pdfFilter}
                  containerRef={containerRef}
                  registerPageRef={registerPageRef}
                />
                <div className="mt-3 text-[11px] font-mono text-slate-400">
                  Page {currentPage} of {numPages}
                </div>
              </div>
            ) : (
              /* Continuous Vertical Stacking Mode ("زیر هم") */
              <div className="flex flex-col items-center space-y-8">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                  <div key={`page-wrapper-${pageNum}`} className="flex flex-col items-center group">
                    <PDFPageItem
                      pageNumber={pageNum}
                      pdfDoc={pdfDoc}
                      scale={scale}
                      renderScale={renderScale}
                      applyThemeFilter={applyThemeFilter}
                      themeFilter={currentCharacter.pdfFilter}
                      onPageVisible={setCurrentPage}
                      containerRef={containerRef}
                      registerPageRef={registerPageRef}
                    />
                    <div className="mt-2 text-[11px] font-mono text-slate-400 group-hover:text-primary transition-colors">
                      Page {pageNum} of {numPages}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
