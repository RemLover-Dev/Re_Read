import { create } from 'zustand';
import { CharacterEntry, FactionId, RE_ZERO_CHARACTERS } from '../themes/characters.data';
import { ThemeManager } from '../themes/theme-manager';

interface ThemeState {
  characterId: string;
  currentCharacter: CharacterEntry;
  userCustomWallpaper: string | null;
  wallpaperDim: number;
  wallpaperBlur: number;
  selectedFaction: FactionId | 'all';
  searchQuery: string;
  performanceMode: boolean;

  // Actions
  setCharacter: (id: string) => void;
  setCustomWallpaper: (url: string | null) => void;
  setWallpaperDim: (dim: number) => void;
  setWallpaperBlur: (blur: number) => void;
  setSelectedFaction: (faction: FactionId | 'all') => void;
  setSearchQuery: (query: string) => void;
  setPerformanceMode: (enabled: boolean) => void;
}

const initialCharacter = RE_ZERO_CHARACTERS['rem'];
ThemeManager.getInstance().applyTheme(initialCharacter);

const savedWallpaper = typeof window !== 'undefined' ? localStorage.getItem('reread_custom_wallpaper') : null;
const savedPerformanceMode = typeof window !== 'undefined' ? localStorage.getItem('reread_performance_mode') === 'true' : false;

// Apply initial performance-mode class to document root
if (typeof window !== 'undefined' && savedPerformanceMode) {
  document.documentElement.classList.add('performance-mode');
}

export const useThemeStore = create<ThemeState>((set) => ({
  characterId: 'rem',
  currentCharacter: initialCharacter,
  userCustomWallpaper: savedWallpaper,
  wallpaperDim: 40,
  wallpaperBlur: 10,
  selectedFaction: 'all',
  searchQuery: '',
  performanceMode: savedPerformanceMode,

  setCharacter: (id: string) => {
    const char = RE_ZERO_CHARACTERS[id] || RE_ZERO_CHARACTERS['rem'];
    ThemeManager.getInstance().applyTheme(char);
    set({
      characterId: id,
      currentCharacter: char,
    });
  },

  setCustomWallpaper: (url: string | null) => {
    if (typeof window !== 'undefined') {
      if (url) {
        localStorage.setItem('reread_custom_wallpaper', url);
      } else {
        localStorage.removeItem('reread_custom_wallpaper');
      }
    }
    set({ userCustomWallpaper: url });
  },

  setWallpaperDim: (dim: number) => set({ wallpaperDim: dim }),
  setWallpaperBlur: (blur: number) => set({ wallpaperBlur: blur }),
  setSelectedFaction: (faction: FactionId | 'all') => set({ selectedFaction: faction }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setPerformanceMode: (enabled: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('reread_performance_mode', enabled ? 'true' : 'false');
      if (enabled) {
        document.documentElement.classList.add('performance-mode');
      } else {
        document.documentElement.classList.remove('performance-mode');
      }

      // If running inside Tauri on Windows, clear OS blur to eliminate DWM lag on low-end GPUs
      if ((window as any).__TAURI_INTERNALS__) {
        import('@tauri-apps/api/core')
          .then(({ invoke }) => {
            invoke('set_window_vibrancy', { effect: enabled ? 'none' : 'mica' }).catch(() => {});
          })
          .catch(() => {});
      }
    }
    set({ performanceMode: enabled });
  },
}));
