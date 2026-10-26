import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Hand, MousePointer, Activity, X } from 'lucide-react';

export interface ZoomableViewProps {
  children: React.ReactNode;
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  className?: string;
  contentClassName?: string;
  showHud?: boolean;
  showDebugHud?: boolean;
  isHandTool?: boolean;
  onHandToolChange?: (isHand: boolean) => void;
  centered?: boolean;
  enableTouchpadPinch?: boolean;
  enableMousePan?: boolean;
  scrollSmooth?: boolean;
  /** Children provide their own pixel dimensions at the requested zoom. */
  scaleContent?: boolean;
}

export interface ZoomableViewRef {
  zoomIn: (step?: number) => void;
  zoomOut: (step?: number) => void;
  resetZoom: () => void;
  setZoom: (targetZoom: number, focalPoint?: { clientX: number; clientY: number }) => void;
  getZoom: () => number;
  getContainer: () => HTMLDivElement | null;
}

// Check CSS zoom engine compatibility (true in Chromium/WebKit macOS, false in WebKitGTK Linux/Firefox)
function checkZoomSupport(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return true;
  try {
    if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
      return CSS.supports('zoom', '1.2');
    }
    const el = document.createElement('div');
    el.style.zoom = '1.2';
    return el.style.zoom === '1.2';
  } catch {
    return false;
  }
}

export const ZoomableView = forwardRef<ZoomableViewRef, ZoomableViewProps>(
  (
    {
      children,
      minZoom = 0.4,
      maxZoom = 4.0,
      initialZoom = 1.0,
      zoom: controlledZoom,
      onZoomChange,
      className = '',
      contentClassName = '',
      showHud = true,
      showDebugHud = false,
      isHandTool: controlledHandTool,
      onHandToolChange,
      centered = true,
      enableTouchpadPinch = true,
      enableMousePan = true,
      scrollSmooth = true,
      scaleContent = true,
    },
    ref
  ) => {
    // Uncontrolled fallback zoom state
    const [uncontrolledZoom, setUncontrolledZoom] = useState<number>(initialZoom);
    const isControlled = controlledZoom !== undefined;
    const currentZoom = isControlled ? controlledZoom : uncontrolledZoom;

    // Uncontrolled fallback hand tool state
    const [uncontrolledHandTool, setUncontrolledHandTool] = useState<boolean>(false);
    const isHandControlled = controlledHandTool !== undefined;
    const isHandToolActive = isHandControlled ? controlledHandTool : uncontrolledHandTool;

    // Pan interaction states
    const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // Engine feature detection
    const [supportsZoom] = useState<boolean>(() => checkZoomSupport());

    // Live Event Diagnostic state for on-screen inspection
    const [debugInfo, setDebugInfo] = useState<{
      lastEvent: string;
      ctrlKey: boolean;
      metaKey: boolean;
      deltaY: number;
      factor: number;
      touches: number;
      timestamp: number;
    }>({
      lastEvent: 'None yet',
      ctrlKey: false,
      metaKey: false,
      deltaY: 0,
      factor: 1.0,
      touches: 0,
      timestamp: Date.now(),
    });
    const [isDebugVisible, setIsDebugVisible] = useState<boolean>(false);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);

    // Synchronous zoom tracking ref - updated immediately on every event to prevent stale closures
    const currentZoomRef = useRef<number>(currentZoom);
    currentZoomRef.current = currentZoom;

    const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const lastPinchDistRef = useRef<number | null>(null);
    const lastGestureScaleRef = useRef<number>(1.0);

    const updateZoom = useCallback(
      (nextZoom: number) => {
        // Update ref immediately so subsequent high-frequency events see the new zoom
        currentZoomRef.current = nextZoom;
        if (!isControlled) {
          setUncontrolledZoom(nextZoom);
        }
        onZoomChange?.(nextZoom);
      },
      [isControlled, onZoomChange]
    );

    const updateHandTool = useCallback(
      (nextHand: boolean) => {
        if (!isHandControlled) {
          setUncontrolledHandTool(nextHand);
        }
        onHandToolChange?.(nextHand);
      },
      [isHandControlled, onHandToolChange]
    );

    // Zoom relative to a focal point with invariant screen coordinate projection
    const zoomAtFocalPoint = useCallback(
      (
        factor: number,
        focalPoint: { clientX: number; clientY: number },
        _sourceEvent?: string
      ) => {
        if (!Number.isFinite(factor) || factor <= 0) return;
        const prevZoom = currentZoomRef.current;
        if (!Number.isFinite(prevZoom) || prevZoom <= 0) return;

        const nextZoom = Math.min(Math.max(prevZoom * factor, minZoom), maxZoom);
        // Sensitive threshold so sub-pixel trackpad deltas aren't dropped
        if (Math.abs(nextZoom - prevZoom) < 0.0001) return;

        const container = containerRef.current;
        const content = contentRef.current;
        if (container && content) {
          const contentRect = content.getBoundingClientRect();
          const offsetX = focalPoint.clientX - contentRect.left;
          const offsetY = focalPoint.clientY - contentRect.top;
          const ratio = nextZoom / prevZoom;

          // Invariant offset shift relative to centered or top-left layout
          const shiftX = centered
            ? (offsetX - contentRect.width / 2) * (ratio - 1)
            : offsetX * (ratio - 1);
          const shiftY = offsetY * (ratio - 1);

          requestAnimationFrame(() => {
            if (!container) return;
            container.scrollLeft += shiftX;
            container.scrollTop += shiftY;
          });
        }

        // Apply immediately to synchronous ref and notify React state
        updateZoom(nextZoom);
      },
      [minZoom, maxZoom, centered, updateZoom]
    );

    // Direct zoom targeting (e.g. from buttons, keyboard, or ref)
    const applyZoom = useCallback(
      (newTarget: number, focalPoint?: { clientX: number; clientY: number }) => {
        if (!Number.isFinite(newTarget) || newTarget <= 0) return;
        const prevZoom = currentZoomRef.current;
        if (!Number.isFinite(prevZoom) || prevZoom <= 0) return;

        const clamped = Math.min(Math.max(newTarget, minZoom), maxZoom);
        if (Math.abs(clamped - prevZoom) < 0.0001) return;

        const container = containerRef.current;
        const content = contentRef.current;

        if (container && content) {
          const cRect = container.getBoundingClientRect();
          const targetX = focalPoint ? focalPoint.clientX : cRect.left + cRect.width / 2;
          const targetY = focalPoint ? focalPoint.clientY : cRect.top + cRect.height / 2;

          const contentRect = content.getBoundingClientRect();
          const offsetX = targetX - contentRect.left;
          const offsetY = targetY - contentRect.top;
          const ratio = clamped / prevZoom;

          const shiftX = centered
            ? (offsetX - contentRect.width / 2) * (ratio - 1)
            : offsetX * (ratio - 1);
          const shiftY = offsetY * (ratio - 1);

          requestAnimationFrame(() => {
            if (!container) return;
            container.scrollLeft += shiftX;
            container.scrollTop += shiftY;
          });
        }

        updateZoom(clamped);
      },
      [minZoom, maxZoom, centered, updateZoom]
    );

    // Expose imperative API
    useImperativeHandle(
      ref,
      () => ({
        zoomIn: (step = 0.2) => applyZoom(currentZoomRef.current + step),
        zoomOut: (step = 0.2) => applyZoom(currentZoomRef.current - step),
        resetZoom: () => applyZoom(1.0),
        setZoom: (target, focalPoint) => applyZoom(target, focalPoint),
        getZoom: () => currentZoomRef.current,
        getContainer: () => containerRef.current,
      }),
      [applyZoom]
    );

    // --------------------------------------------------------------------------
    // 1. Capture-Phase Wheel Listener on window (Windows Precision Touchpad / WebView2)
    // --------------------------------------------------------------------------
    useEffect(() => {
      if (!enableTouchpadPinch) return;

      const handleCaptureWheel = (e: WheelEvent) => {
        const container = containerRef.current;
        if (!container) return;

        // Check if cursor is over or inside this ZoomableView container
        const isTargetInside = container.contains(e.target as Node);
        const cRect = container.getBoundingClientRect();
        const isCursorInside =
          e.clientX >= cRect.left &&
          e.clientX <= cRect.right &&
          e.clientY >= cRect.top &&
          e.clientY <= cRect.bottom;

        if (!isTargetInside && !isCursorInside) return;

        // Touchpad pinch or Ctrl/Meta + wheel
        if (e.ctrlKey || e.metaKey) {
          // Immediately prevent default in capture phase before WebView2 visual zoom intercepts
          e.preventDefault();
          e.stopPropagation();

          let delta = -e.deltaY;
          if (e.deltaMode === 1) delta *= 16;
          else if (e.deltaMode === 2) delta *= 40;

          const isNotch = Math.abs(delta) >= 50;
          let factor: number;

          if (isNotch) {
            factor = delta > 0 ? 1.10 : 0.90;
          } else {
            const clamped = Math.sign(delta) * Math.min(Math.abs(delta), 35);
            factor = Math.exp(clamped * 0.005);
          }

          setDebugInfo({
            lastEvent: `PINCH (wheel+ctrlKey capture)`,
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey,
            deltaY: Math.round(e.deltaY * 10) / 10,
            factor: Math.round(factor * 1000) / 1000,
            touches: 0,
            timestamp: Date.now(),
          });

          zoomAtFocalPoint(factor, { clientX: e.clientX, clientY: e.clientY }, 'wheel');
        }
      };

      window.addEventListener('wheel', handleCaptureWheel, { passive: false, capture: true });
      return () => {
        window.removeEventListener('wheel', handleCaptureWheel, { capture: true });
      };
    }, [enableTouchpadPinch, zoomAtFocalPoint]);

    // --------------------------------------------------------------------------
    // 2. Native Multi-Touch Touchpad / Touchscreen Pinch (Linux / WebKitGTK / Touch)
    // --------------------------------------------------------------------------
    useEffect(() => {
      if (!enableTouchpadPinch) return;
      const container = containerRef.current;
      if (!container) return;

      let lastTouchDistance: number | null = null;

      const handleTouchStart = (e: TouchEvent) => {
        if (showDebugHud) {
          setDebugInfo((prev) => ({
            ...prev,
            lastEvent: `touchstart (${e.touches.length} fingers)`,
            touches: e.touches.length,
            timestamp: Date.now(),
          }));
        }

        if (e.touches.length === 2) {
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          if (dist > 5) {
            lastTouchDistance = dist;
          }
        } else {
          lastTouchDistance = null;
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 2 && lastTouchDistance && lastTouchDistance > 5) {
          e.preventDefault();
          e.stopPropagation();

          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

          if (currentDist > 5) {
            const factor = currentDist / lastTouchDistance;
            lastTouchDistance = currentDist;

            const centerX = (t1.clientX + t2.clientX) / 2;
            const centerY = (t1.clientY + t2.clientY) / 2;

            if (showDebugHud) {
              setDebugInfo({
                lastEvent: `PINCH (touchmove 2-finger)`,
                ctrlKey: false,
                metaKey: false,
                deltaY: Math.round((currentDist - lastTouchDistance) * 10) / 10,
                factor: Math.round(factor * 1000) / 1000,
                touches: 2,
                timestamp: Date.now(),
              });
            }

            zoomAtFocalPoint(factor, { clientX: centerX, clientY: centerY }, 'touch');
          }
        }
      };

      const handleTouchEnd = (e: TouchEvent) => {
        if (e.touches.length < 2) {
          lastTouchDistance = null;
        }
      };

      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: false });
      container.addEventListener('touchcancel', handleTouchEnd, { passive: false });

      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
        container.removeEventListener('touchcancel', handleTouchEnd);
      };
    }, [enableTouchpadPinch, zoomAtFocalPoint, showDebugHud]);

    // --------------------------------------------------------------------------
    // 3. WebKit Gesture Events (macOS / Safari trackpads)
    // --------------------------------------------------------------------------
    useEffect(() => {
      if (!enableTouchpadPinch) return;
      const container = containerRef.current;
      if (!container) return;

      const onGestureStart = (e: any) => {
        e.preventDefault();
        lastGestureScaleRef.current = 1.0;
        if (showDebugHud) {
          setDebugInfo((prev) => ({
            ...prev,
            lastEvent: 'gesturestart',
            timestamp: Date.now(),
          }));
        }
      };

      const onGestureChange = (e: any) => {
        e.preventDefault();
        if (e.scale && Number.isFinite(e.scale) && lastGestureScaleRef.current > 0) {
          const factor = e.scale / lastGestureScaleRef.current;
          lastGestureScaleRef.current = e.scale;

          if (showDebugHud) {
            setDebugInfo({
              lastEvent: 'PINCH (gesturechange)',
              ctrlKey: false,
              metaKey: false,
              deltaY: 0,
              factor: Math.round(factor * 1000) / 1000,
              touches: 2,
              timestamp: Date.now(),
            });
          }

          zoomAtFocalPoint(factor, { clientX: e.clientX, clientY: e.clientY }, 'gesture');
        }
      };

      container.addEventListener('gesturestart', onGestureStart as any, { passive: false });
      container.addEventListener('gesturechange', onGestureChange as any, { passive: false });

      return () => {
        container.removeEventListener('gesturestart', onGestureStart as any);
        container.removeEventListener('gesturechange', onGestureChange as any);
      };
    }, [enableTouchpadPinch, zoomAtFocalPoint, showDebugHud]);

    // --------------------------------------------------------------------------
    // 4. Keyboard Shortcuts & Blur Protection
    // --------------------------------------------------------------------------
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

        if (e.code === 'Space' && !e.repeat) {
          e.preventDefault();
          setIsSpacePressed(true);
        }

        // Ctrl / Cmd + Shift + D toggles on-screen Touchpad Diagnostics
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
          e.preventDefault();
          setIsDebugVisible((prev) => !prev);
          return;
        }

        // Ctrl / Cmd + (=, -, 0)
        if (e.ctrlKey || e.metaKey) {
          if (e.key === '=' || e.key === '+') {
            e.preventDefault();
            applyZoom(currentZoomRef.current + 0.15);
          } else if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            applyZoom(currentZoomRef.current - 0.15);
          } else if (e.key === '0') {
            e.preventDefault();
            applyZoom(1.0);
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
    }, [applyZoom]);

    // --------------------------------------------------------------------------
    // 5. Mouse Drag-to-Pan
    // --------------------------------------------------------------------------
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enableMousePan) return;

      const target = e.target as HTMLElement | null;
      const isInteractive =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.isContentEditable);

      if (isInteractive) return;

      const isTargetBackground =
        target === containerRef.current || target === contentRef.current;

      const shouldPan =
        isHandToolActive ||
        isSpacePressed ||
        e.button === 1 ||
        (currentZoom > 1.0 && isTargetBackground && e.button === 0);

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

    // --------------------------------------------------------------------------
    // 6. PointerEvent Multi-Touch tracking for Windows Touchscreens & Touchpads
    // --------------------------------------------------------------------------
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

    const handlePointerDown = (e: React.PointerEvent) => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') {
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (activePointersRef.current.size === 2) {
          const pts = Array.from(activePointersRef.current.values());
          const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          if (dist > 5) {
            lastPinchDistRef.current = dist;
          }
        }
      }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      if (activePointersRef.current.has(e.pointerId)) {
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (
          activePointersRef.current.size === 2 &&
          lastPinchDistRef.current &&
          lastPinchDistRef.current > 5
        ) {
          const pts = Array.from(activePointersRef.current.values());
          const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          if (currentDist > 5) {
            const factor = currentDist / lastPinchDistRef.current;
            lastPinchDistRef.current = currentDist;

            const centerX = (pts[0].x + pts[1].x) / 2;
            const centerY = (pts[0].y + pts[1].y) / 2;

            setDebugInfo({
              lastEvent: `PINCH (pointer 2-touch)`,
              ctrlKey: false,
              metaKey: false,
              deltaY: 0,
              factor: Math.round(factor * 1000) / 1000,
              touches: 2,
              timestamp: Date.now(),
            });

            zoomAtFocalPoint(factor, { clientX: centerX, clientY: centerY }, 'pointer');
          }
        }
      }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      activePointersRef.current.delete(e.pointerId);
      if (activePointersRef.current.size < 2) {
        lastPinchDistRef.current = null;
      }
    };

    const isPanningActive = isHandToolActive || isSpacePressed;

    return (
      <div
        className={`relative h-full w-full overflow-hidden select-none ${className}`}
      >
        {/* Scrollable Viewport with Touchpad & 2D Pan Support */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative h-full w-full overflow-auto ${
            scrollSmooth && !isDragging ? 'scroll-smooth' : 'scroll-auto'
          } ${
            isPanningActive
              ? isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : 'cursor-auto'
          }`}
        >
          {/* Zoomed Container using CSS zoom (or transform: scale fallback for WebKitGTK Linux) */}
          <div
            ref={contentRef}
            style={
              !scaleContent ? undefined : supportsZoom
                ? {
                    zoom: currentZoom,
                  }
                : {
                    transform: `scale(${currentZoom})`,
                    transformOrigin: centered ? 'top center' : 'top left',
                  }
            }
            className={`min-w-full w-max min-h-full h-max ${
              centered ? 'flex flex-col items-center' : ''
            } ${contentClassName}`}
          >
            {children}
          </div>
        </div>

        {/* Floating Zoom HUD Badge */}
        {showHud && (
          <div className="absolute bottom-4 right-4 z-40 flex items-center space-x-1 p-1 rounded-xl bg-black/70 backdrop-blur-xl border border-white/15 shadow-2xl text-slate-300 text-xs">
            <button
              onClick={() => updateHandTool(!isHandToolActive)}
              className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                isHandToolActive
                  ? 'bg-primary text-black font-semibold'
                  : 'hover:bg-white/10 text-slate-300'
              }`}
              title={
                isHandToolActive
                  ? 'Switch to Selection Mode'
                  : 'Hand Pan Tool (or hold Spacebar)'
              }
            >
              {isHandToolActive ? (
                <Hand className="w-3.5 h-3.5" />
              ) : (
                <MousePointer className="w-3.5 h-3.5" />
              )}
            </button>

            <div className="h-3.5 w-px bg-white/20 mx-0.5" />

            <button
              onClick={() => applyZoom(currentZoom - 0.15)}
              disabled={currentZoom <= minZoom}
              className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
              title="Zoom Out (Ctrl -)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => applyZoom(1.0)}
              className="px-2 py-0.5 font-mono text-[11px] text-white hover:text-primary transition-colors text-center w-14"
              title="Reset Zoom to 100% (Ctrl 0)"
            >
              {Math.round(currentZoom * 100)}%
            </button>

            <button
              onClick={() => applyZoom(currentZoom + 0.15)}
              disabled={currentZoom >= maxZoom}
              className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
              title="Zoom In (Ctrl +)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => applyZoom(1.0)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Live Touchpad / Pinch Event Diagnostic HUD (Toggled on-demand via Ctrl+Shift+D) */}
        {isDebugVisible && (
          <div className="absolute top-4 left-4 z-50 p-3 rounded-xl bg-black/90 backdrop-blur-2xl border border-white/20 shadow-2xl text-[11px] font-mono text-slate-200 w-80 space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-1 text-primary font-bold">
              <span className="flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span>Touchpad Diagnostics</span>
              </span>
              <button
                onClick={() => setIsDebugVisible(false)}
                className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                title="Close (Ctrl+Shift+D)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Event:</span>
              <span className="text-emerald-400 font-semibold">{debugInfo.lastEvent}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ctrlKey / metaKey:</span>
              <span>{debugInfo.ctrlKey ? 'true (Pinch)' : 'false'} / {debugInfo.metaKey ? 'true' : 'false'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">deltaY / factor:</span>
              <span>{debugInfo.deltaY} / {debugInfo.factor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Touch Fingers:</span>
              <span>{debugInfo.touches}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Zoom:</span>
              <span className="text-amber-300 font-bold">{currentZoom.toFixed(3)} ({Math.round(currentZoom * 100)}%)</span>
            </div>
            <div className="pt-1 border-t border-white/10 text-[10px] text-slate-400">
              Press Ctrl+Shift+D to hide. Pinch or scroll trackpad to test.
            </div>
          </div>
        )}
      </div>
    );
  }
);

ZoomableView.displayName = 'ZoomableView';
