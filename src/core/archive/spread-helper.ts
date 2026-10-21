import type { ComicPage } from './types.ts';

export type ReadingMode = 'manga-rtl' | 'webtoon-strip' | 'comic-ltr';
export type SpreadMode = '1P' | '2P';

export interface PageSpread {
  spreadIndex: number;
  leftPage?: ComicPage;
  rightPage?: ComicPage;
  isWideSingle?: boolean;
}

/**
 * Computes spreads for 1P, 2P Manga (RTL), and 2P Comic (LTR) modes,
 * handling cover offset and wide landscape double-page spreads.
 */
export function computeSpreads(
  pages: ComicPage[],
  readingMode: ReadingMode,
  spreadMode: SpreadMode,
  offsetCover: boolean
): PageSpread[] {
  if (pages.length === 0) return [];

  // In 1P or Webtoon continuous strip, each page is a single spread
  if (spreadMode === '1P' || readingMode === 'webtoon-strip') {
    return pages.map((page, idx) => ({
      spreadIndex: idx,
      leftPage: readingMode === 'manga-rtl' ? undefined : page,
      rightPage: readingMode === 'manga-rtl' ? page : undefined,
    }));
  }

  // 2P Spread Mode
  const spreads: PageSpread[] = [];
  let i = 0;

  // If offsetCover is true and there are multiple pages, page 0 (cover) is displayed alone
  if (offsetCover && pages.length > 1) {
    spreads.push({
      spreadIndex: spreads.length,
      rightPage: readingMode === 'manga-rtl' ? pages[0] : undefined,
      leftPage: readingMode === 'manga-rtl' ? undefined : pages[0],
    });
    i = 1;
  }

  while (i < pages.length) {
    const currentPage = pages[i];

    // If current page is wide landscape, it takes the entire spread alone
    if (currentPage.isWide) {
      spreads.push({
        spreadIndex: spreads.length,
        leftPage: currentPage,
        isWideSingle: true,
      });
      i++;
      continue;
    }

    const nextPage = i + 1 < pages.length ? pages[i + 1] : undefined;

    // If next page is wide, do not pair it with the current page
    if (nextPage && nextPage.isWide) {
      spreads.push({
        spreadIndex: spreads.length,
        rightPage: readingMode === 'manga-rtl' ? currentPage : undefined,
        leftPage: readingMode === 'manga-rtl' ? undefined : currentPage,
      });
      i++;
      continue;
    }

    if (nextPage) {
      if (readingMode === 'manga-rtl') {
        // In Manga RTL: Right page is first (index i), Left page is second (index i+1)
        spreads.push({
          spreadIndex: spreads.length,
          rightPage: currentPage,
          leftPage: nextPage,
        });
      } else {
        // In Comic LTR: Left page is first (index i), Right page is second (index i+1)
        spreads.push({
          spreadIndex: spreads.length,
          leftPage: currentPage,
          rightPage: nextPage,
        });
      }
      i += 2;
    } else {
      // Trailing solitary page
      spreads.push({
        spreadIndex: spreads.length,
        rightPage: readingMode === 'manga-rtl' ? currentPage : undefined,
        leftPage: readingMode === 'manga-rtl' ? undefined : currentPage,
      });
      i++;
    }
  }

  return spreads;
}
