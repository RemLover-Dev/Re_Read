import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Upload, Sparkles, FileText } from 'lucide-react';

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const PDFViewer: React.FC = () => {
  const { pdfUrl, pdfFileName, setPdfUrl } = useWorkspaceStore();
  const { currentCharacter } = useThemeStore();

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.25);
  const [applyThemeFilter, setApplyThemeFilter] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Render Page to Canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask: any = null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    pdfDoc.getPage(currentPage).then((page) => {
      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: ctx,
        viewport,
      };

      renderTask = page.render(renderContext);
      renderTask.promise.catch((err: any) => {
        if (err.name !== 'RenderingCancelledException') {
          console.error('PDF rendering error:', err);
        }
      });
    });

    return () => {
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale]);

  // Handle local PDF File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setPdfUrl(fileUrl, file.name);
    }
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-black/30 backdrop-blur-md">
      {/* PDF Controls Toolbar */}
      <div className="h-12 px-6 border-b border-white/10 bg-black/40 flex items-center justify-between text-xs text-slate-300">
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
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-primary text-black font-semibold hover:opacity-90 transition-opacity"
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
          <div className="flex items-center space-x-4">
            {/* Page Navigation */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs text-white">
                {currentPage} / {numPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                disabled={currentPage >= numPages}
                className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="h-4 w-px bg-white/15" />

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs w-12 text-center text-slate-300">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(3.0, s + 0.2))}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setScale(1.25)}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
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
              <span>Theme Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* PDF Viewport */}
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
        {!pdfUrl ? (
          <div className="text-center p-12 max-w-md rounded-2xl glass-panel border border-white/10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No PDF Document Loaded</h3>
            <p className="text-xs text-textMuted leading-relaxed mb-6">
              Open any research paper, thesis, or novel to view it in full screen with continuous scaling and dynamic Re:Zero theme tint filters.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-primary text-black font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
            >
              Choose PDF File
            </button>
          </div>
        ) : isLoading ? (
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-mono text-primary">Loading Document...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-6 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-sm max-w-md text-center">
            {errorMsg}
          </div>
        ) : (
          <div
            className="rounded-xl shadow-2xl transition-all duration-300 overflow-hidden border border-white/15"
            style={{
              filter: applyThemeFilter ? currentCharacter.pdfFilter : 'none',
            }}
          >
            <canvas ref={canvasRef} className="block max-w-full" />
          </div>
        )}
      </div>
    </div>
  );
};
