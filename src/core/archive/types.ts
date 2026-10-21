export interface ComicMetadata {
  title?: string;
  series?: string;
  number?: string;
  writer?: string;
  pageCount?: number;
  isManga?: boolean;
}

export interface ComicPage {
  index: number;
  name: string;
  url: string;
  isWide?: boolean;
}

export interface ComicBook {
  title: string;
  metadata: ComicMetadata;
  pages: ComicPage[];
  cleanup: () => void;
}

export interface EpubChapter {
  id: string;
  title: string;
  href: string;
  content: string;
}

export interface EpubTocItem {
  id: string;
  title: string;
  href: string;
  chapterIndex: number;
  fragment?: string;
  children?: EpubTocItem[];
}

export interface EpubBook {
  title: string;
  author?: string;
  coverUrl?: string;
  chapters: EpubChapter[];
  initialChapterIndex?: number;
  toc: EpubTocItem[];
  cleanup: () => void;
}

export type ArchiveDetectedType = 'comic' | 'epub' | 'fb2' | 'unknown';
