export interface BooruPost {
  id: string;
  provider: string;
  preview_url: string;
  file_url: string;
  width: u32;
  height: u32;
  aspect_ratio: string;
  resolution_badge: string;
  tags: string[];
  artist?: string;
  source?: string;
}

type u32 = number;

export interface BooruResult {
  success: boolean;
  posts: BooruPost[];
  total_found: number;
  message?: string;
}

export type SupportedBooruProvider = 'safebooru' | 'zerochan' | 'eshuushuu';

/**
 * Format any local disk path or remote URL into a valid webview / browser loadable URL
 */
export async function formatWallpaperUrl(pathOrUrl: string): Promise<string> {
  if (!pathOrUrl) return '';
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('data:') ||
    pathOrUrl.startsWith('blob:') ||
    pathOrUrl.startsWith('asset://')
  ) {
    return pathOrUrl;
  }

  // Tauri asset converter
  try {
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      const { convertFileSrc } = await import('@tauri-apps/api/core');
      return convertFileSrc(pathOrUrl);
    }
  } catch (err) {
    console.debug('[BooruClient] convertFileSrc error:', err);
  }

  // Electron or file:// protocol
  const normalized = pathOrUrl.replace(/\\/g, '/');
  return normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`;
}

export async function fetchBooruPosts(
  provider: SupportedBooruProvider,
  tags: string,
  page: number = 0,
  limit: number = 40
): Promise<BooruResult> {
  // 1. Try Tauri Native Rust IPC first
  try {
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<BooruResult>('search_booru', {
        provider,
        tags,
        page,
        limit,
      });
    }
  } catch (err) {
    console.debug('[BooruClient] Tauri IPC not available, trying direct web fetch:', err);
  }

  // 2. Direct Web API fallback for Safebooru
  if (provider === 'safebooru') {
    try {
      const cleanTags = tags.trim();
      const url = `https://safebooru.org/index.php?page=dapi&s=post&q=index&tags=${encodeURIComponent(
        cleanTags
      )}&pid=${page}&limit=${limit}&json=1`;

      const res = await fetch(url);
      if (!res.ok) {
        return {
          success: false,
          posts: [],
          total_found: 0,
          message: `Safebooru returned status ${res.status}`,
        };
      }

      const raw = await res.json();
      if (!Array.isArray(raw)) {
        return {
          success: true,
          posts: [],
          total_found: 0,
          message: 'No community wallpapers found — using procedural theme',
        };
      }

      const posts: BooruPost[] = raw.map((p: any) => {
        const width = Number(p.width) || 0;
        const height = Number(p.height) || 0;
        const ratio = height > 0 ? width / height : 1;
        const aspect_ratio = ratio > 1.15 ? 'Landscape' : 'Portrait';

        let resolution_badge = `${width}x${height}`;
        if (width >= 3840 || height >= 2160) resolution_badge = '4K UHD';
        else if (width >= 2560 || height >= 1440) resolution_badge = '2K QHD';
        else if (width >= 1920 || height >= 1080) resolution_badge = 'FHD';
        else if (width >= 1280 || height >= 720) resolution_badge = 'HD';

        // Extract direct preview_url and file_url from Safebooru response
        let preview_url = p.preview_url;
        if (!preview_url && p.directory && p.image) {
          preview_url = `https://safebooru.org/thumbnails/${p.directory}/thumbnail_${p.image}`;
        }

        let file_url = p.file_url || p.sample_url;
        if (!file_url && p.directory && p.image) {
          file_url = `https://safebooru.org/images/${p.directory}/${p.image}`;
        }

        return {
          id: String(p.id),
          provider: 'safebooru',
          preview_url: preview_url || '',
          file_url: file_url || preview_url || '',
          width,
          height,
          aspect_ratio,
          resolution_badge,
          tags: (p.tags || '').split(' ').filter(Boolean),
          artist: undefined,
          source: p.source || undefined,
        };
      });

      return {
        success: true,
        posts,
        total_found: posts.length,
        message: posts.length === 0 ? 'No community wallpapers found — using procedural theme' : undefined,
      };
    } catch (e) {
      return {
        success: false,
        posts: [],
        total_found: 0,
        message: `Network error: ${(e as Error).message}`,
      };
    }
  }

  // 3. Direct Web API fallback for E-shuushuu
  if (provider === 'eshuushuu') {
    try {
      const knownIds: Record<string, string> = {
        'rem': '99369',
        'ram': '99370',
        'emilia': '98504',
        'subaru': '99368',
        'beatrice': '99371',
        'echidna': '208753',
        'felt': '99372',
      };

      const tagKey = tags.trim().toLowerCase();
      let tagId = knownIds[tagKey] || (/^\d+$/.test(tagKey) ? tagKey : '99369');

      const searchUrl = `https://e-shuushuu.net/search?tags=${tagId}&page=${page + 1}`;
      const res = await fetch(searchUrl);
      if (!res.ok) {
        return {
          success: false,
          posts: [],
          total_found: 0,
          message: `E-shuushuu returned status ${res.status}`,
        };
      }

      const html = await res.text();
      const regex = /\/thumbs\/(\d{4}-\d{2}-\d{2})-(\d+)\.webp/g;
      const posts: BooruPost[] = [];
      const seen = new Set<string>();

      let match: RegExpExecArray | null;
      while ((match = regex.exec(html)) !== null) {
        const date = match[1];
        const id = match[2];
        if (seen.has(id)) continue;
        seen.add(id);

        const filename = `${date}-${id}`;
        posts.push({
          id,
          provider: 'eshuushuu',
          preview_url: `https://cdn.e-shuushuu.net/thumbs/${filename}.webp`,
          file_url: `https://cdn.e-shuushuu.net/fullsize/${filename}.png`,
          width: 1920,
          height: 1080,
          aspect_ratio: 'Portrait',
          resolution_badge: 'HD',
          tags: [tags, 're:zero'],
          source: `https://e-shuushuu.net/images/${id}`,
        });
      }

      return {
        success: true,
        posts,
        total_found: posts.length,
        message: posts.length === 0 ? 'No wallpapers found on E-shuushuu' : undefined,
      };
    } catch (e) {
      return {
        success: false,
        posts: [],
        total_found: 0,
        message: `E-shuushuu web error: ${(e as Error).message}`,
      };
    }
  }

  // 4. Zerochan web fallback
  return {
    success: true,
    posts: [],
    total_found: 0,
    message: 'Zerochan requires native desktop client or proxy',
  };
}

export async function downloadWallpaperToDisk(fileUrl: string, filename: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
      const { invoke } = await import('@tauri-apps/api/core');
      const res = await invoke<{ success: boolean; local_path?: string; error?: string }>(
        'download_wallpaper',
        { url: fileUrl, filename }
      );
      if (res.success && res.local_path) {
        return await formatWallpaperUrl(res.local_path);
      }
    }
  } catch (err) {
    console.debug('[BooruClient] Tauri download wallpaper error:', err);
  }

  // In Electron or web preview, return direct URL
  return fileUrl;
}
