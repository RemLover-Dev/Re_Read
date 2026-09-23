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

  // Actions
  setCharacter: (id: string) => void;
  setCustomWallpaper: (url: string | null) => void;
  setWallpaperDim: (dim: number) => void;
  setWallpaperBlur: (blur: number) => void;
  setSelectedFaction: (faction: FactionId | 'all') => void;
  setSearchQuery: (query: string) => void;
}

const initialCharacter = RE_ZERO_CHARACTERS['rem'];
ThemeManager.getInstance().applyTheme(initialCharacter);

const savedWallpaper = typeof window !== 'undefined' ? localStorage.getItem('reread_custom_wallpaper') : null;

export const useThemeStore = create<ThemeState>((set) => ({
  characterId: 'rem',
  currentCharacter: initialCharacter,
  userCustomWallpaper: savedWallpaper,
  wallpaperDim: 40,
  wallpaperBlur: 10,
  selectedFaction: 'all',
  searchQuery: '',

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
}));
