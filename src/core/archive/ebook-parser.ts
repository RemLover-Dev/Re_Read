import * as fflate from 'fflate';
import type { EpubBook, EpubChapter, EpubTocItem } from './types.ts';
import { getImageMimeType } from './comic-parser.ts';

import { parseEpubArchive } from './epub-parser.ts';
export { parseEpubArchive, resolveRelativePath } from './epub-parser.ts';

function sanitizeHtml(html: string): string {
  // Extract body content if present
  let content = html;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    content = bodyMatch[1];
  }

  // Remove script and link tags that could interfere
  content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  content = content.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, '');

  return content.trim();
}

/**
 * Parses FictionBook (.fb2 or .fb2.zip) XML documents into chapters and illustrations.
 */
export async function parseFb2Book(data: Uint8Array | ArrayBuffer, filename: string): Promise<EpubBook> {
  let bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const createdUrls: string[] = [];

  const createSafeUrl = (buf: Uint8Array, mimeType: string): string => {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const blob = new Blob([buf as unknown as BlobPart], { type: mimeType });
      const url = URL.createObjectURL(blob);
      createdUrls.push(url);
      return url;
    }
    const mockUrl = `blob:fb2-res-${createdUrls.length}-${Date.now()}`;
    createdUrls.push(mockUrl);
    return mockUrl;
  };

  // If .fb2.zip or zipped data, extract the .fb2 file
  if (filename.toLowerCase().endsWith('.zip') || (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b)) {
    const unzipped = fflate.unzipSync(bytes);
    const fb2Key = Object.keys(unzipped).find((k) => k.toLowerCase().endsWith('.fb2'));
    if (fb2Key) {
      bytes = unzipped[fb2Key];
    }
  }

  const xmlText = new TextDecoder('utf-8').decode(bytes);

  // 1. Extract base64 binaries (<binary id="..." content-type="...">...)
  const binaryMap: Map<string, string> = new Map();
  const binaryRegex = /<binary\b[^>]*?\bid=["']([^"']+)["'][^>]*?\bcontent-type=["']([^"']+)["'][^>]*>([\s\S]*?)<\/binary>/gi;
  let binMatch: RegExpExecArray | null;

  while ((binMatch = binaryRegex.exec(xmlText)) !== null) {
    const id = binMatch[1].trim();
    const contentType = binMatch[2].trim();
    const base64Data = binMatch[3].replace(/\s+/g, '');
    try {
      let rawBytes: Uint8Array;
      if (typeof Buffer !== 'undefined') {
        rawBytes = new Uint8Array(Buffer.from(base64Data, 'base64'));
      } else {
        const binStr = atob(base64Data);
        rawBytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          rawBytes[i] = binStr.charCodeAt(i);
        }
      }
      const url = createSafeUrl(rawBytes, contentType || getImageMimeType(id));
      binaryMap.set(id, url);
      binaryMap.set(`#${id}`, url);
    } catch {}
  }

  // 2. Extract Metadata
  const titleMatch = xmlText.match(/<book-title[^>]*>([\s\S]*?)<\/book-title>/i);
  const authorFirstMatch = xmlText.match(/<first-name[^>]*>([\s\S]*?)<\/first-name>/i);
  const authorLastMatch = xmlText.match(/<last-name[^>]*>([\s\S]*?)<\/last-name>/i);
  const bookTitle = titleMatch ? titleMatch[1].trim() : filename.replace(/\.(fb2(\.zip)?)$/i, '');
  const authorParts = [authorFirstMatch?.[1]?.trim(), authorLastMatch?.[1]?.trim()].filter(Boolean);
  const bookAuthor = authorParts.length > 0 ? authorParts.join(' ') : undefined;

  // Cover image
  const coverMatch = xmlText.match(/<coverpage>[\s\S]*?<image\b[^>]*?(?:l:href|xlink:href)=["']([^"']+)["']/i);
  const coverUrl = coverMatch ? binaryMap.get(coverMatch[1]) : undefined;

  // 3. Extract Body Sections into Chapters
  const bodyMatch = xmlText.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyXml = bodyMatch ? bodyMatch[1] : xmlText;

  // Split into sections
  const sectionRegex = /<section\b[^>]*>([\s\S]*?)<\/section>/gi;
  let secMatch: RegExpExecArray | null;
  const rawSections: string[] = [];

  while ((secMatch = sectionRegex.exec(bodyXml)) !== null) {
    rawSections.push(secMatch[1]);
  }

  if (rawSections.length === 0) {
    rawSections.push(bodyXml);
  }

  const chapters: EpubChapter[] = [];
  const toc: EpubTocItem[] = [];

  rawSections.forEach((sec, idx) => {
    // Extract title
    const secTitleMatch = sec.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const secTitle = secTitleMatch
      ? secTitleMatch[1].replace(/<[^>]+>/g, '').trim()
      : `Chapter ${idx + 1}`;

    // Convert FB2 markup to clean HTML
    let chapterHtml = sec;

    // Convert <title> to <h2>
    chapterHtml = chapterHtml.replace(/<title[^>]*>([\s\S]*?)<\/title>/gi, '<h2 class="text-xl font-bold my-4">$1</h2>');

    // Convert <p> to <p dir="auto">
    chapterHtml = chapterHtml.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, '<p dir="auto" class="my-3 leading-relaxed text-slate-100">$1</p>');

    // Convert <epigraph> to blockquote
    chapterHtml = chapterHtml.replace(/<epigraph\b[^>]*>([\s\S]*?)<\/epigraph>/gi, '<blockquote class="border-l-2 border-primary/40 pl-4 my-4 italic text-slate-300">$1</blockquote>');

    // Convert <image l:href="#..."/> to <img src="..."/>
    chapterHtml = chapterHtml.replace(/<image\b[^>]*?(?:l:href|xlink:href)=["']([^"']+)["'][^>]*\/?>/gi, (_orig, href) => {
      const url = binaryMap.get(href) || binaryMap.get(href.replace(/^#/, ''));
      return url ? `<img src="${url}" alt="" class="my-6 rounded-xl max-w-full mx-auto shadow-lg" />` : '';
    });

    // Remove remaining empty tags
    chapterHtml = chapterHtml.replace(/<empty-line\s*\/?>/gi, '<br />');

    const cleanId = `chapter-${idx}`;
    chapters.push({
      id: cleanId,
      title: secTitle || `Chapter ${idx + 1}`,
      href: `#${cleanId}`,
      content: sanitizeHtml(chapterHtml),
    });

    toc.push({
      id: `toc-${idx}`,
      title: secTitle || `Chapter ${idx + 1}`,
      href: `#${cleanId}`,
      chapterIndex: idx,
    });
  });

  return {
    title: bookTitle,
    author: bookAuthor,
    coverUrl,
    chapters,
    toc,
    cleanup: () => {
      if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        for (const url of createdUrls) {
          try {
            URL.revokeObjectURL(url);
          } catch {}
        }
      }
    },
  };
}

/**
 * Splits plain text / web novel files (.txt) into structured chapters and TOC based on headings.
 */
export function parseTxtBook(text: string, filename: string): EpubBook {
  const lines = text.split(/\r?\n/);
  const chapterHeadingRegex = /^(?:(?:Chapter|Episode|Part|Book|Volume|Act|Scene|Prologue|Epilogue)\s+[\d\wIVXLCDMivxlcdm]+(?:\s*[:\-–—]\s*.*)?|(?:فصل|بخش|چپتر|قسمت|جلد)\s+[\d\w\u0600-\u06FF]+(?:\s*[:\-–—]\s*.*)?|(?:第[\d一二三四五六七八九十百千万]+[章节回卷集]|Chapter\s+\d+)|#{1,3}\s+(.+))$/i;

  interface ChapterDraft {
    title: string;
    lines: string[];
  }

  const drafts: ChapterDraft[] = [];
  let currentDraft: ChapterDraft = {
    title: 'Introduction',
    lines: [],
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && chapterHeadingRegex.test(trimmed)) {
      if (currentDraft.lines.length > 0) {
        drafts.push(currentDraft);
      }
      currentDraft = {
        title: trimmed.replace(/^#{1,3}\s+/, ''),
        lines: [],
      };
    } else {
      currentDraft.lines.push(line);
    }
  }

  if (currentDraft.lines.length > 0 || drafts.length === 0) {
    drafts.push(currentDraft);
  }

  const bookTitle = filename.replace(/\.txt$/i, '').replace(/[-_]/g, ' ');

  const chapters: EpubChapter[] = drafts.map((draft, idx) => {
    const paragraphs = draft.lines
      .join('\n')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p dir="auto" class="my-3 leading-relaxed text-slate-100">${p.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
      .join('\n');

    const content = `
      <h2 class="text-2xl font-bold my-6 text-primary tracking-wide">${draft.title}</h2>
      ${paragraphs}
    `;

    return {
      id: `txt-ch-${idx}`,
      title: draft.title,
      href: `#txt-ch-${idx}`,
      content,
    };
  });

  const toc: EpubTocItem[] = chapters.map((ch, idx) => ({
    id: `txt-toc-${idx}`,
    title: ch.title,
    href: ch.href,
    chapterIndex: idx,
  }));

  return {
    title: bookTitle,
    chapters,
    toc,
    cleanup: () => {},
  };
}

/**
 * Unified E-Book parser for .epub, .fb2, .fb2.zip, and .txt.
 */
export async function parseEbook(data: Uint8Array | ArrayBuffer, filename: string): Promise<EpubBook> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const lowerName = filename.toLowerCase();

  if (lowerName.endsWith('.txt')) {
    const text = new TextDecoder('utf-8').decode(bytes);
    return parseTxtBook(text, filename);
  }

  if (lowerName.endsWith('.fb2') || lowerName.endsWith('.fb2.zip')) {
    return parseFb2Book(bytes, filename);
  }

  return parseEpubArchive(bytes, filename);
}
