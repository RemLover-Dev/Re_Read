import { create } from 'zustand';

export type AppMode = 'split' | 'editor' | 'reader' | 'pdf' | 'booru';

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
`;

interface WorkspaceState {
  markdownContent: string;
  activeMode: AppMode;
  splitRatio: number; // Percentage (e.g. 50%)
  pdfUrl: string | null;
  pdfFileName: string | null;
  fontScale: number;
  isStreamerMode: boolean;

  // Actions
  setMarkdownContent: (content: string) => void;
  setActiveMode: (mode: AppMode) => void;
  setSplitRatio: (ratio: number) => void;
  setPdfUrl: (url: string | null, fileName?: string) => void;
  setFontScale: (scale: number) => void;
  toggleStreamerMode: () => void;
  resetToSample: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  markdownContent: DEFAULT_SAMPLE_MARKDOWN,
  activeMode: 'split',
  splitRatio: 50,
  pdfUrl: null,
  pdfFileName: null,
  fontScale: 1.0,
  isStreamerMode: false,

  setMarkdownContent: (content: string) => set({ markdownContent: content }),
  setActiveMode: (mode: AppMode) => set({ activeMode: mode }),
  setSplitRatio: (ratio: number) => set({ splitRatio: ratio }),
  setPdfUrl: (url: string | null, fileName?: string) => set({ pdfUrl: url, pdfFileName: fileName || null }),
  setFontScale: (scale: number) => set({ fontScale: Math.max(0.7, Math.min(2.0, scale)) }),
  toggleStreamerMode: () => set((state) => ({ isStreamerMode: !state.isStreamerMode })),
  resetToSample: () => set({ markdownContent: DEFAULT_SAMPLE_MARKDOWN }),
}));
