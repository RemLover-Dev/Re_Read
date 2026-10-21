export interface ImageSize { width: number; height: number }
export type ComicFitMode = 'fit-height' | 'fit-width' | 'original';

/** Fit a spread at a common height without automatically enlarging any page. */
export function sizeComicPages(
  pages: ImageSize[], viewport: ImageSize, mode: ComicFitMode, zoom = 1
): ImageSize[] {
  if (!pages.length) return [];
  if (mode === 'original') {
    return pages.map(({ width, height }) => ({ width: width * zoom, height: height * zoom }));
  }
  const aspectSum = pages.reduce((sum, page) => sum + page.width / page.height, 0);
  const height = Math.min(
    ...pages.map((page) => page.height),
    Math.max(1, viewport.width) / aspectSum,
    mode === 'fit-height' ? Math.max(1, viewport.height) : Infinity
  );
  return pages.map((page) => ({
    width: height * (page.width / page.height) * zoom,
    height: height * zoom,
  }));
}
