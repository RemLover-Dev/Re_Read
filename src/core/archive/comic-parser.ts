import * as fflate from 'fflate';
import type { ComicBook, ComicMetadata, ComicPage, ArchiveDetectedType } from './types.ts';

const IMAGE_REGEX = /\.(jpe?g|png|webp|avif|gif|bmp)$/i;

export function normalizeArchivePath(filename: string): string {
  return filename.replace(/\\/g, '/').split('/').filter((part) => part !== '.').join('/');
}

function isVisibleArchiveFile(filename: string): boolean {
  const normalized = normalizeArchivePath(filename);
  return !normalized.endsWith('/') && !normalized.split('/').some(
    (part) => part.startsWith('.') || part.toLowerCase() === '__macosx'
  );
}

export function isImageFile(filename: string): boolean {
  return isVisibleArchiveFile(filename) && IMAGE_REGEX.test(filename);
}

function isComicInfoFile(filename: string): boolean {
  return isVisibleArchiveFile(filename) &&
    normalizeArchivePath(filename).split('/').pop()?.toLowerCase() === 'comicinfo.xml';
}

export function getImageMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
    case 'gif':
      return 'image/gif';
    case 'bmp':
      return 'image/bmp';
    default:
      return 'application/octet-stream';
  }
}

export function naturalSortItems<T extends { name: string }>(items: T[]): T[] {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  return [...items].sort((a, b) => collator.compare(a.name, b.name));
}

export function parseComicInfo(xmlText: string): ComicMetadata {
  const metadata: ComicMetadata = {};
  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
      metadata.title = doc.querySelector('Title')?.textContent?.trim() || undefined;
      metadata.series = doc.querySelector('Series')?.textContent?.trim() || undefined;
      metadata.number = doc.querySelector('Number')?.textContent?.trim() || undefined;
      metadata.writer = doc.querySelector('Writer')?.textContent?.trim() || undefined;
      const pc = doc.querySelector('PageCount')?.textContent?.trim();
      if (pc) metadata.pageCount = parseInt(pc, 10);
      const manga = doc.querySelector('Manga')?.textContent?.trim()?.toLowerCase();
      if (manga && (manga === 'yes' || manga.includes('righttoleft'))) {
        metadata.isManga = true;
      }
      return metadata;
    } catch {}
  }

  // Regex fallback for non-DOM environments
  const extractTag = (tag: string) => {
    const match = xmlText.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return match ? match[1].trim() : undefined;
  };
  metadata.title = extractTag('Title');
  metadata.series = extractTag('Series');
  metadata.number = extractTag('Number');
  metadata.writer = extractTag('Writer');
  const pc = extractTag('PageCount');
  if (pc) metadata.pageCount = parseInt(pc, 10);
  const manga = extractTag('Manga')?.toLowerCase();
  if (manga && (manga === 'yes' || manga.includes('righttoleft'))) {
    metadata.isManga = true;
  }
  return metadata;
}

export function isRarArchive(bytes: Uint8Array): boolean {
  return bytes.length >= 7 && bytes[0] === 0x52 && bytes[1] === 0x61 &&
    bytes[2] === 0x72 && bytes[3] === 0x21 && bytes[4] === 0x1a && bytes[5] === 0x07 &&
    (bytes[6] === 0 || (bytes[6] === 1 && bytes.length >= 8 && bytes[7] === 0));
}

export function isZipArchive(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && (
    (bytes[2] === 3 && bytes[3] === 4) || (bytes[2] === 5 && bytes[3] === 6) ||
    (bytes[2] === 7 && bytes[3] === 8)
  );
}

async function createRarExtractor(bytes: Uint8Array) {
  const { createExtractorFromData } = await import('node-unrar-js');
  // Vite must bundle the WASM asset explicitly; unrar cannot locate it itself in a WebView.
  const wasmBinary = typeof window === 'undefined' ? undefined :
    await (await import('./rar-wasm.ts')).loadRarWasm();
  return createExtractorFromData({ data: bytes.slice().buffer, wasmBinary });
}

/** Inspect entry names without inflating any ZIP payloads. */
export async function inspectArchive(
  data: Uint8Array | ArrayBuffer,
  filename: string = ''
): Promise<ArchiveDetectedType> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const lowerName = filename.toLowerCase();
  if (lowerName.endsWith('.epub')) return 'epub';
  if (lowerName.endsWith('.fb2')) return 'fb2';

  const names: string[] = [];
  if (isRarArchive(bytes)) {
    const extractor = await createRarExtractor(bytes);
    // Always exhaust the generator so unrar releases the archive handle.
    for (const header of extractor.getFileList().fileHeaders) {
      if (!header.flags.directory && isVisibleArchiveFile(header.name)) names.push(header.name);
    }
    // The e-book parsers support ZIP containers, not RAR containers.
    return names.some(isImageFile) ? 'comic' : 'unknown';
  }
  if (!isZipArchive(bytes)) return 'unknown';
  fflate.unzipSync(bytes, {
    filter(file) {
      if (isVisibleArchiveFile(file.name)) names.push(file.name);
      return false;
    },
  });
  const normalized = names.map((name) => normalizeArchivePath(name).toLowerCase());
  if (lowerName.endsWith('.cbz') || lowerName.endsWith('.cbr')) {
    return names.some(isImageFile) ? 'comic' : 'unknown';
  }
  if (normalized.includes('meta-inf/container.xml')) return 'epub';
  if (normalized.some((name) => name.endsWith('.fb2'))) return 'fb2';
  return names.some(isImageFile) ? 'comic' : 'unknown';
}

/** Extract original image bytes from ZIP/CBZ or RAR/CBR, selected by signature. */
export async function parseComicArchive(
  data: Uint8Array | ArrayBuffer,
  filename: string
): Promise<ComicBook> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const pages: ComicPage[] = [];
  let comicInfoXml: string | null = null;
  const cleanup = () => {
    for (const page of pages) URL.revokeObjectURL(page.url);
  };
  const acceptEntry = (rawName: string, content: Uint8Array) => {
    const name = normalizeArchivePath(rawName);
    if (isComicInfoFile(name)) {
      comicInfoXml = fflate.strFromU8(content);
    } else if (isImageFile(name) && content.byteLength > 0) {
      // No canvas resizing, JPEG re-encoding, thumbnails, or lossy conversion.
      const blob = new Blob([content as unknown as BlobPart], { type: getImageMimeType(name) });
      pages.push({ index: pages.length, name, url: URL.createObjectURL(blob) });
    }
  };

  try {
    if (isRarArchive(bytes)) {
      const extractor = await createRarExtractor(bytes);
      const extracted = extractor.extract({
        files: (header) => !header.flags.directory &&
          (isImageFile(header.name) || isComicInfoFile(header.name)),
      });
      for (const entry of extracted.files) {
        if (entry.extraction) acceptEntry(entry.fileHeader.name, entry.extraction);
      }
    } else if (isZipArchive(bytes)) {
      const unzipped = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
        fflate.unzip(bytes, {
          filter: (file) => isImageFile(file.name) || isComicInfoFile(file.name),
        }, (error, result) => error ? reject(error) : resolve(result));
      });
      for (const name of Object.keys(unzipped)) {
        acceptEntry(name, unzipped[name]);
        delete unzipped[name];
      }
    } else {
      throw new Error('This file is not a supported ZIP/CBZ or RAR/CBR archive.');
    }

    if (!pages.length) {
      throw new Error('No readable image pages found. Use JPG, PNG, WebP, AVIF, GIF, or BMP files inside the archive.');
    }
    const sortedPages = naturalSortItems(pages).map((page, index) => ({ ...page, index }));
    const metadata: ComicMetadata = comicInfoXml ? parseComicInfo(comicInfoXml) : {};
    const fallbackTitle = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    return { title: metadata.title || metadata.series || fallbackTitle, metadata, pages: sortedPages, cleanup };
  } catch (error) {
    cleanup();
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not open comic "${filename}": ${message}`);
  }
}
