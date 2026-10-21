import { create } from 'zustand';
import type { ComicBook, EpubBook } from '../core/archive/types.ts';
import { parseComicArchive, inspectArchive } from '../core/archive/comic-parser.ts';
import { parseEbook, parseEpubArchive, parseFb2Book } from '../core/archive/ebook-parser.ts';

export type AppMode = 'split' | 'editor' | 'reader' | 'pdf' | 'booru' | 'comic' | 'epub';
export type ActiveDocumentType = 'markdown' | 'pdf' | 'epub' | 'comic';

const DEFAULT_SAMPLE_MARKDOWN = `# خوش‌آمدید به Re:Read (RemReader) 🌸

این یک نرم‌افزار سبک، مدرن و شیشه‌ای (Acrylic / Mica) برای **مطالعه، نگارش و استریم** با پشتیبانی بی‌نقص از متن‌های دوجهته (BiDi) فارسی و انگلیسی است.

---

## ۱. نمایش ترکیبی متن فارسی و فرمول‌های ریاضی (LaTeX)

در ویرایشگرهای عادی، زمانی که فرمول‌های ریاضی درون جملات فارسی قرار می‌گیرند، پرانتزها و علامت‌ها معکوس می‌شوند. اما در موتور ایزوله‌ساز **Re:Read**، تمام عبارات درون ایزوله‌ساز \`unicode-bidi: isolate\` قرار دارند:

* رابطه هم‌ارزی جرم و انرژی انیشتین به‌صورت $E = mc^2$ تعریف می‌شود.
* مساحت دایره با شعاع $r$ برابر است با $S = \\pi r^2$ و محیط آن $P = 2\\pi r$ می‌باشد.
* انتگرال گاوسی معروف را در نظر بگیرید:
$$ \\int_{-\\infty}^{+\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi} $$

---

## ۲. فرمول‌های پیچیده چندجمله‌ای و ماتریس‌ها

اگر ماتریس $A$ یک ماتریس $2 \\times 2$ باشد:
$$ A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\implies \\det(A) = ad - bc $$

برای حل معادله درجه دو $ax^2 + bx + c = 0$، ریشه‌ها از فرمول زیر به‌دست می‌آیند:
$$ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} $$

---

## ۳. کدهای برنامه‌نویسی با ایزولاسیون جهت

تکه کد زیر در زبان Rust برای ارتباط با DWM نوشته شده است:

\`\`\`rust
// Apply Windows 11 Mica backdrop effect
pub fn apply_mica_backdrop(window: &WebviewWindow) -> Result<(), String> {
    window_vibrancy::apply_mica(window, None)
        .map_err(|e| format!("Mica Error: {:?}", e))
}
\`\`\`

---

## ۴. قابلیت‌های کلیدی سیستم
1. **تم‌های Re:Zero:** پشتیبانی از ۴۲ شخصیت با پالت‌های رنگی اختصاصی و انیمیشن مش گرادیان.
2. **کنسول والپیپر Booru:** اتصال به Safebooru و Zerochan با تگ‌های ایمن و نرخ درخواست کنترل‌شده.
3. **حالت استریمر (Streamer Mode):** مناسب اشتراک‌گذاری صفحه و ضبط استریم با فونت‌های مقیاس‌پذیر و عدم نمایش اطلاعات حساس.
4. **خوانش کمیک و مانگا (.cbz, .cbr, .zip, .rar):** پشتیبانی از RTL، چرخش صفحه دوبل، و حالت وب‌تون عمودی.
5. **کتاب‌های الکترونیک (.epub, .fb2, .txt):** پشتیبانی از رمان‌های سبک، تصویرسازی‌ها و فهرست فصول.
`;

interface WorkspaceState {
  markdownContent: string;
  activeMode: AppMode;
  activeDocumentType: ActiveDocumentType;
  splitRatio: number; // Percentage (e.g. 50%)

  // PDF
  pdfUrl: string | null;
  pdfFileName: string | null;

  // Comic / Manga / Webtoon
  comicBook: ComicBook | null;
  comicFileName: string | null;

  // E-Book / Light Novel
  epubBook: EpubBook | null;
  epubFileName: string | null;

  // General loading
  isArchiveLoading: boolean;
  archiveLoadingMessage: string | null;

  // Global settings
  fontScale: number;
  isStreamerMode: boolean;

  // Actions
  setMarkdownContent: (content: string) => void;
  setActiveMode: (mode: AppMode) => void;
  setActiveDocumentType: (type: ActiveDocumentType) => void;
  setSplitRatio: (ratio: number) => void;
  setPdfUrl: (url: string | null, fileName?: string) => void;
  setComicBook: (comic: ComicBook | null, fileName?: string) => void;
  setEpubBook: (epub: EpubBook | null, fileName?: string) => void;
  setArchiveLoading: (loading: boolean, message?: string | null) => void;
  openFileFromBytes: (data: Uint8Array | ArrayBuffer, fileName: string) => Promise<void>;
  setFontScale: (scale: number) => void;
  toggleStreamerMode: () => void;
  resetToSample: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  markdownContent: DEFAULT_SAMPLE_MARKDOWN,
  activeMode: 'split',
  activeDocumentType: 'markdown',
  splitRatio: 50,

  pdfUrl: null,
  pdfFileName: null,

  comicBook: null,
  comicFileName: null,

  epubBook: null,
  epubFileName: null,

  isArchiveLoading: false,
  archiveLoadingMessage: null,

  fontScale: 1.0,
  isStreamerMode: false,

  setMarkdownContent: (content: string) =>
    set({ markdownContent: content, activeDocumentType: 'markdown' }),

  setActiveMode: (mode: AppMode) => set({ activeMode: mode }),
  setActiveDocumentType: (type: ActiveDocumentType) => set({ activeDocumentType: type }),
  setSplitRatio: (ratio: number) => set({ splitRatio: ratio }),

  setPdfUrl: (url: string | null, fileName?: string) =>
    set({
      pdfUrl: url,
      pdfFileName: fileName || null,
      activeMode: 'pdf',
      activeDocumentType: 'pdf',
    }),

  setComicBook: (comic: ComicBook | null, fileName?: string) => {
    const prev = get().comicBook;
    if (prev && prev !== comic) {
      try {
        prev.cleanup();
      } catch {}
    }
    set({
      comicBook: comic,
      comicFileName: fileName || null,
      activeMode: comic ? 'comic' : get().activeMode,
      activeDocumentType: comic ? 'comic' : get().activeDocumentType,
    });
  },

  setEpubBook: (epub: EpubBook | null, fileName?: string) => {
    const prev = get().epubBook;
    if (prev && prev !== epub) {
      try {
        prev.cleanup();
      } catch {}
    }
    set({
      epubBook: epub,
      epubFileName: fileName || null,
      activeMode: epub ? 'epub' : get().activeMode,
      activeDocumentType: epub ? 'epub' : get().activeDocumentType,
    });
  },

  setArchiveLoading: (loading: boolean, message: string | null = null) =>
    set({ isArchiveLoading: loading, archiveLoadingMessage: message }),

  openFileFromBytes: async (data: Uint8Array | ArrayBuffer, fileName: string) => {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const lower = fileName.toLowerCase();

    // 1. PDF Documents
    if (lower.endsWith('.pdf')) {
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      get().setPdfUrl(url, fileName);
      return;
    }

    // 2. Markdown Documents
    if (lower.endsWith('.md') || lower.endsWith('.markdown')) {
      const text = new TextDecoder('utf-8').decode(bytes);
      get().setMarkdownContent(text);
      set({ activeMode: 'reader', activeDocumentType: 'markdown' });
      return;
    }

    // 3. E-Books / Light Novels (.epub, .fb2, .fb2.zip, .txt)
    if (lower.endsWith('.epub') || lower.endsWith('.fb2') || lower.endsWith('.fb2.zip') || lower.endsWith('.txt')) {
      get().setArchiveLoading(true, `Opening ${fileName}...`);
      try {
        const book = await parseEbook(bytes, fileName);
        get().setEpubBook(book, fileName);
      } catch (err: any) {
        alert(`Failed to load e-book: ${err?.message || err}`);
      } finally {
        get().setArchiveLoading(false);
      }
      return;
    }

    // 4. Comics / Manga (.cbz, .cbr)
    if (lower.endsWith('.cbz') || lower.endsWith('.cbr')) {
      get().setArchiveLoading(true, `Opening comic ${fileName}...`);
      try {
        const comic = await parseComicArchive(bytes, fileName);
        get().setComicBook(comic, fileName);
      } catch (err: any) {
        alert(`Failed to load comic: ${err?.message || err}`);
      } finally {
        get().setArchiveLoading(false);
      }
      return;
    }

    // 5. Generic Archives (.zip, .rar)
    if (lower.endsWith('.zip') || lower.endsWith('.rar')) {
      get().setArchiveLoading(true, `Inspecting ${fileName}...`);
      try {
        const detected = await inspectArchive(bytes, fileName);
        if (detected === 'epub') {
          const book = await parseEpubArchive(bytes, fileName);
          get().setEpubBook(book, fileName);
        } else if (detected === 'fb2') {
          const book = await parseFb2Book(bytes, fileName);
          get().setEpubBook(book, fileName);
        } else {
          const comic = await parseComicArchive(bytes, fileName);
          get().setComicBook(comic, fileName);
        }
      } catch (err: any) {
        alert(`Failed to open archive: ${err?.message || err}`);
      } finally {
        get().setArchiveLoading(false);
      }
      return;
    }

    // Fallback: try parsing as text/markdown
    try {
      const text = new TextDecoder('utf-8').decode(bytes);
      get().setMarkdownContent(text);
      set({ activeMode: 'reader', activeDocumentType: 'markdown' });
    } catch {
      alert(`Unsupported file format: ${fileName}`);
    }
  },

  setFontScale: (scale: number) => set({ fontScale: Math.max(0.7, Math.min(2.0, scale)) }),
  toggleStreamerMode: () => set((state) => ({ isStreamerMode: !state.isStreamerMode })),
  resetToSample: () => set({ markdownContent: DEFAULT_SAMPLE_MARKDOWN }),
}));
