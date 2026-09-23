import { CharacterEntry, RE_ZERO_CHARACTERS } from './characters.data';

export class ThemeManager {
  private static instance: ThemeManager;

  private constructor() {}

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Applies the chosen character's styling to the DOM and calls Tauri vibrancy if available.
   */
  public async applyTheme(character: CharacterEntry): Promise<void> {
    const root = document.documentElement;

    // 1. Set CSS Custom Properties
    root.style.setProperty('--color-primary', character.palette.primary);
    root.style.setProperty('--color-secondary', character.palette.secondary);
    root.style.setProperty('--surface-glass', character.palette.surface);
    root.style.setProperty('--text-primary', character.palette.textPrimary);
    root.style.setProperty('--text-muted', character.palette.textMuted);
    root.style.setProperty('--border-glow', character.palette.borderGlow);
    root.style.setProperty('--code-bg', character.palette.codeBackground);
    root.style.setProperty('--glass-opacity', character.palette.glassOpacity.toString());
    root.style.setProperty('--pdf-filter', character.pdfFilter);

    // 2. Call Tauri native vibrancy bridge if available
    try {
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('set_window_vibrancy', { effect: character.windowVibrancy });
      }
    } catch (e) {
      // Normal when previewing in browser or non-Windows platform
      console.debug('[ThemeManager] Window vibrancy bridge notice:', e);
    }
  }

  public getCharacter(id: string): CharacterEntry {
    return RE_ZERO_CHARACTERS[id] || RE_ZERO_CHARACTERS['rem'];
  }
}
