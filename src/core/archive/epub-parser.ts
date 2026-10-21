import * as fflate from 'fflate';
import { DOMParser } from '@xmldom/xmldom';
import type { Document as XmlDocument, Element as XmlElement, Node as XmlNode } from '@xmldom/xmldom';
import type { EpubBook, EpubChapter, EpubTocItem } from './types.ts';
import { getImageMimeType } from './comic-parser.ts';

function normalizePath(path: string): string {
  const parts: string[] = [];
  for (const part of path.replace(/\\/g, '/').split('/')) {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
  }
  return parts.join('/');
}
function decodeUri(value: string): string {
  try { return decodeURIComponent(value); } catch { return value; }
}
export function resolveRelativePath(baseDir: string, relativePath: string): string {
  const path = decodeUri(relativePath.split('#')[0].split('?')[0]);
  return normalizePath((path.startsWith('/') ? '' : `${baseDir}/`) + path);
}
const directory = (path: string) => path.slice(0, Math.max(0, path.lastIndexOf('/')));
const localName = (node: XmlNode) => (node.localName || node.nodeName.split(':').pop() || '').toLowerCase();
const children = (node: XmlNode): XmlElement[] => Array.from(node.childNodes || [])
  .filter((child): child is XmlElement => child.nodeType === 1);
function elements(node: XmlDocument | XmlElement, name: string): XmlElement[] {
  return Array.from(node.getElementsByTagName('*')).filter((element) => localName(element) === name);
}
function attr(node: XmlElement, name: string): string {
  return node.getAttribute(name) || Array.from(node.attributes)
    .find((attribute) => localName(attribute) === name)?.value || '';
}
const text = (node: XmlNode | undefined) => (node?.textContent || '').replace(/\s+/g, ' ').trim();
const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function decodeText(bytes: Uint8Array): string {
  const declaration = new TextDecoder().decode(bytes.subarray(0, 200));
  const encoding = bytes[0] === 0xff && bytes[1] === 0xfe ? 'utf-16le' :
    bytes[0] === 0xfe && bytes[1] === 0xff ? 'utf-16be' :
    declaration.match(/encoding\s*=\s*["']([^"']+)/i)?.[1] || 'utf-8';
  return new TextDecoder(encoding).decode(bytes);
}
function parseXml(bytes: Uint8Array, label: string, xhtml = false): XmlDocument {
  try {
    const document = new DOMParser({ onError(level, message) {
      if (level !== 'warning') throw new Error(message);
    } }).parseFromString(decodeText(bytes), xhtml ? 'application/xhtml+xml' : 'application/xml');
    if (!document.documentElement) throw new Error('Empty document');
    return document;
  } catch (error) {
    throw new Error(`Cannot read EPUB document "${label}": ${error instanceof Error ? error.message : String(error)}`);
  }
}

const HTML_TAGS = new Set(('a abbr address article aside b bdi bdo blockquote br caption cite code col colgroup dd del details dfn div dl dt em figcaption figure footer h1 h2 h3 h4 h5 h6 header hr i img ins kbd li main mark nav ol p pre q rp rt ruby s samp section small span strong sub summary sup table tbody td tfoot th thead time tr u ul var wbr').split(' '));
const SVG_TAGS = new Set('svg image g path rect circle ellipse line polyline polygon text tspan title desc defs clippath'.split(' '));
const SVG_ATTRS = new Set('viewBox width height x y x1 x2 y1 y2 dx dy d points cx cy r rx ry fill stroke stroke-width transform preserveAspectRatio clip-path'.split(' '));
const DROP_TAGS = new Set('script style link head meta base iframe object embed form input button textarea select source audio video'.split(' '));
const VOID_TAGS = new Set('br col hr img wbr'.split(' '));

/** Reflow chapter content with reader typography, instead of importing publisher page CSS. */
function chapterHtml(root: XmlElement, chapterPath: string, imageUrl: (path: string) => string | undefined): string {
  const render = (node: XmlNode, inSvg = false): string => {
    if (node.nodeType === 3 || node.nodeType === 4) return escapeHtml(node.nodeValue || '');
    if (node.nodeType !== 1) return '';
    const element = node as XmlElement;
    const tag = localName(element);
    if (DROP_TAGS.has(tag)) return '';
    const svg = inSvg || tag === 'svg';
    const content = () => Array.from(element.childNodes).map((child) => render(child, svg)).join('');
    if (!(svg ? SVG_TAGS : HTML_TAGS).has(tag)) return content();
    const attributes: string[] = [];
    const add = (name: string, value: string) => attributes.push(`${name}="${escapeHtml(value)}"`);
    for (const name of ['id', 'title', 'lang', 'dir', 'colspan', 'rowspan', 'start', 'reversed', 'value']) {
      const value = attr(element, name);
      if (value) add(name, value);
    }
    // Keep semantic emphasis and alignment, but never publisher visibility, colors,
    // absolute positioning, fixed heights, or classes that collide with app CSS.
    const typography = attr(element, 'style').split(';').filter((rule) =>
      /^\s*(text-align\s*:\s*(left|right|center|justify|start|end)|font-style\s*:\s*(italic|normal)|font-weight\s*:\s*(bold|normal|[1-9]00)|text-decoration\s*:\s*(underline|line-through))\s*$/i.test(rule)
    ).join(';');
    if (typography) add('style', typography);
    if (tag === 'img' || tag === 'image') {
      const source = attr(element, tag === 'img' ? 'src' : 'href');
      const url = imageUrl(resolveRelativePath(directory(chapterPath), source));
      if (!url) return tag === 'img' ? `<span>${escapeHtml(attr(element, 'alt'))}</span>` : '';
      add(tag === 'img' ? 'src' : 'href', url);
      if (tag === 'img') { add('alt', attr(element, 'alt')); add('draggable', 'false'); }
    }
    if (tag === 'a') {
      const href = attr(element, 'href');
      if (href && !/^[a-z][a-z\d+.-]*:|^\/\//i.test(href)) {
        const fragment = href.includes('#') ? `#${href.slice(href.indexOf('#') + 1)}` : '';
        const target = href.startsWith('#') ? chapterPath : resolveRelativePath(directory(chapterPath), href);
        add('data-epub-href', target.split('/').map(encodeURIComponent).join('/') + fragment);
        add('href', fragment || '#');
      }
    }
    if (svg) {
      for (const attribute of Array.from(element.attributes)) {
        if (SVG_ATTRS.has(attribute.name) && !/url\s*\(/i.test(attribute.value)) add(attribute.name, attribute.value);
      }
    }
    const markupTag = tag === 'clippath' ? 'clipPath' : tag;
    const opening = `<${markupTag}${attributes.length ? ' ' + attributes.join(' ') : ''}>`;
    return VOID_TAGS.has(tag) ? opening : `${opening}${content()}</${markupTag}>`;
  };
  const dir = attr(root, 'dir');
  const lang = attr(root, 'lang');
  const content = localName(root) === 'svg' ? render(root) : Array.from(root.childNodes).map((node) => render(node)).join('');
  return `<section${dir ? ` dir="${escapeHtml(dir)}"` : ''}${lang ? ` lang="${escapeHtml(lang)}"` : ''}>${content}</section>`;
}

interface ManifestItem { id: string; path: string; mediaType: string; properties: string[]; fallback: string }

export async function parseEpubArchive(data: Uint8Array | ArrayBuffer, filename: string): Promise<EpubBook> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const urls: string[] = [];
  const cleanup = () => { for (const url of urls) URL.revokeObjectURL(url); };
  try {
    const unzipped = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
      fflate.unzip(bytes, (error, result) => error ? reject(error) : resolve(result));
    });
    const files = new Map(Object.entries(unzipped).filter(([name]) => !name.endsWith('/'))
      .map(([name, content]) => [normalizePath(name), content]));
    const requireFile = (path: string): Uint8Array => {
      const content = files.get(path);
      if (!content) throw new Error(`EPUB references a missing file: ${path}`);
      return content;
    };
    const containerPath = Array.from(files.keys()).find((path) => path.toLowerCase() === 'meta-inf/container.xml');
    if (!containerPath) throw new Error('Invalid EPUB: Missing META-INF/container.xml');
    const container = parseXml(requireFile(containerPath), containerPath);
    const rootfiles = elements(container, 'rootfile');
    const rootfile = rootfiles.find((item) => attr(item, 'media-type') === 'application/oebps-package+xml') || rootfiles[0];
    if (!rootfile || !attr(rootfile, 'full-path')) throw new Error('Invalid EPUB: Missing package rootfile path');
    const opfPath = resolveRelativePath('', attr(rootfile, 'full-path'));
    const opf = parseXml(requireFile(opfPath), opfPath);
    const metadata = elements(opf, 'metadata')[0];
    const title = metadata ? text(elements(metadata, 'title')[0]) : '';
    const author = metadata ? text(elements(metadata, 'creator')[0]) : '';
    const manifestElement = elements(opf, 'manifest')[0];
    const manifest = new Map<string, ManifestItem>();
    for (const item of manifestElement ? children(manifestElement).filter((node) => localName(node) === 'item') : []) {
      const id = attr(item, 'id');
      if (id && attr(item, 'href')) manifest.set(id, {
        id, path: resolveRelativePath(directory(opfPath), attr(item, 'href')),
        mediaType: attr(item, 'media-type'), properties: attr(item, 'properties').split(/\s+/),
        fallback: attr(item, 'fallback'),
      });
    }
    const imageUrls = new Map<string, string>();
    const imageUrl = (path: string): string | undefined => {
      if (imageUrls.has(path)) return imageUrls.get(path);
      const content = files.get(path);
      if (!content) return undefined;
      const item = Array.from(manifest.values()).find((entry) => entry.path === path);
      const mime = item?.mediaType || (path.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : getImageMimeType(path));
      if (!mime.startsWith('image/')) return undefined;
      const url = URL.createObjectURL(new Blob([content as unknown as BlobPart], { type: mime }));
      urls.push(url); imageUrls.set(path, url); return url;
    };
    const coverId = metadata ? elements(metadata, 'meta').find((node) => attr(node, 'name') === 'cover')?.getAttribute('content') : undefined;
    const cover = (coverId ? manifest.get(coverId) : undefined) || Array.from(manifest.values()).find((item) => item.properties.includes('cover-image')) ||
      Array.from(manifest.values()).find((item) => item.mediaType.startsWith('image/') && /cover/i.test(item.id + item.path));
    const coverUrl = cover ? imageUrl(cover.path) : undefined;
    const spine = elements(opf, 'spine')[0];
    const refs = spine ? children(spine).filter((node) => localName(node) === 'itemref') : [];
    if (!refs.length) throw new Error('Invalid EPUB: No reading-order entries in the spine');
    const chapters: EpubChapter[] = [];
    const readingCandidates: boolean[] = [];
    for (const ref of refs) {
      const idref = attr(ref, 'idref');
      let item = manifest.get(idref);
      if (!item) throw new Error(`Invalid EPUB: Spine item "${idref}" is missing from the manifest`);
      const seen = new Set<string>();
      while (!['application/xhtml+xml', 'text/html', 'image/svg+xml'].includes(item.mediaType) && !item.mediaType.startsWith('image/') && item.fallback && !seen.has(item.id)) {
        seen.add(item.id); item = manifest.get(item.fallback) || item;
      }
      const content = requireFile(item.path);
      let chapterTitle = `Chapter ${chapters.length + 1}`;
      let html: string;
      let hasText = false;
      if (item.mediaType.startsWith('image/') && item.mediaType !== 'image/svg+xml') {
        html = `<img src="${escapeHtml(imageUrl(item.path) || '')}" alt="Illustration">`;
      } else {
        const document = parseXml(content, item.path, true);
        const body = elements(document, 'body')[0] || document.documentElement!;
        const heading = elements(body, 'h1')[0] || elements(body, 'h2')[0];
        chapterTitle = text(heading) || text(elements(document, 'title')[0]) || chapterTitle;
        html = chapterHtml(body, item.path, imageUrl);
        const bodyText = html.replace(/<[^>]*>/g, '').replace(/\s|&(?:nbsp|#160);/g, '');
        const coverPage = /\b(cover|titlepage)\b/.test(attr(body, 'type')) || /^(cover|titlepage)([-_\d]|$)/i.test(item.id);
        hasText = Boolean(bodyText) && !coverPage && !item.properties.includes('nav');
      }
      chapters.push({ id: idref, title: chapterTitle, href: item.path, content: html });
      readingCandidates.push(hasText && attr(ref, 'linear') !== 'no');
    }
    const initialChapterIndex = Math.max(0, readingCandidates.findIndex(Boolean));
    const makeTocItem = (label: string, href: string, base: string, id: string): EpubTocItem | undefined => {
      const path = resolveRelativePath(base, href);
      const chapterIndex = chapters.findIndex((chapter) => chapter.href === path);
      if (chapterIndex < 0) return undefined;
      return { id, title: label || chapters[chapterIndex].title, href: path, chapterIndex,
        fragment: href.includes('#') ? decodeUri(href.slice(href.indexOf('#') + 1)) : undefined };
    };
    let toc: EpubTocItem[] = [];
    const navItem = Array.from(manifest.values()).find((item) => item.properties.includes('nav'));
    if (navItem && files.has(navItem.path)) {
      const navDoc = parseXml(requireFile(navItem.path), navItem.path, true);
      const navs = elements(navDoc, 'nav');
      const nav = navs.find((node) => attr(node, 'type').split(/\s+/).includes('toc')) || navs[0];
      const parseList = (list: XmlElement): EpubTocItem[] => children(list).filter((node) => localName(node) === 'li').flatMap((li, index) => {
        const link = children(li).find((node) => localName(node) === 'a');
        const nested = children(li).filter((node) => localName(node) === 'ol').flatMap(parseList);
        const entry = link ? makeTocItem(text(link), attr(link, 'href'), directory(navItem.path), `nav-${attr(li, 'id') || attr(link, 'href')}-${index}`) : undefined;
        return entry ? [{ ...entry, children: nested.length ? nested : undefined }] : nested;
      });
      const list = nav && children(nav).find((node) => localName(node) === 'ol');
      if (list) toc = parseList(list);
    }
    if (!toc.length) {
      const ncx = (spine && manifest.get(attr(spine, 'toc'))) || Array.from(manifest.values()).find((item) => item.mediaType === 'application/x-dtbncx+xml');
      if (ncx && files.has(ncx.path)) {
        const ncxDoc = parseXml(requireFile(ncx.path), ncx.path);
        const map = elements(ncxDoc, 'navmap')[0];
        const parsePoints = (parent: XmlElement): EpubTocItem[] => children(parent).filter((node) => localName(node) === 'navpoint').flatMap((point) => {
          const source = children(point).find((node) => localName(node) === 'content');
          const label = children(point).find((node) => localName(node) === 'navlabel');
          const nested = parsePoints(point);
          const entry = source ? makeTocItem(text(label), attr(source, 'src'), directory(ncx.path), attr(point, 'id') || attr(source, 'src')) : undefined;
          return entry ? [{ ...entry, children: nested.length ? nested : undefined }] : nested;
        });
        if (map) toc = parsePoints(map);
      }
    }
    if (!toc.length) toc = chapters.map((chapter, chapterIndex) => ({ id: chapter.id, title: chapter.title, href: chapter.href, chapterIndex }));
    return { title: title || filename.replace(/\.epub$/i, ''), author: author || undefined, coverUrl, chapters, toc, initialChapterIndex, cleanup };
  } catch (error) {
    cleanup();
    throw error;
  }
}
