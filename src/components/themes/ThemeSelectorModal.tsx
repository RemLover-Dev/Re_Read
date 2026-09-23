import React from 'react';
import { useThemeStore } from '../../stores/useThemeStore';
import { FACTIONS, RE_ZERO_CHARACTERS } from '../../themes/characters.data';
import { X, Search, Check, Sliders, Palette } from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ isOpen, onClose }) => {
  const {
    characterId,
    setCharacter,
    wallpaperDim,
    setWallpaperDim,
    wallpaperBlur,
    setWallpaperBlur,
    selectedFaction,
    setSelectedFaction,
    searchQuery,
    setSearchQuery,
  } = useThemeStore();

  if (!isOpen) return null;

  const charactersList = Object.values(RE_ZERO_CHARACTERS);

  const filteredCharacters = charactersList.filter((char) => {
    const matchesFaction = selectedFaction === 'all' || char.faction === selectedFaction;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesFaction;

    const matchesName =
      char.name.en.toLowerCase().includes(query) ||
      char.name.fa.includes(query) ||
      char.name.romaji.toLowerCase().includes(query) ||
      char.id.toLowerCase().includes(query);

    return matchesFaction && matchesName;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="glass-panel relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Re:Zero Character Theme Registry
              </h2>
              <p className="text-xs text-textMuted">
                Select from 42 characters across 8 factions • انتخاب از میان ۴۲ شخصیت
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar: Search & Wallpaper Adjusters */}
        <div className="p-6 pb-3 border-b border-white/10 bg-black/10 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search character (Subaru, رم, Echidna)..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-black/40 border border-white/15 text-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Wallpaper Sliders (Dim & Blur) */}
            <div className="flex items-center space-x-6 w-full md:w-auto bg-black/30 px-4 py-2 rounded-xl border border-white/10">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-primary" />
                <span className="text-xs text-textMuted whitespace-nowrap">Dim:</span>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={wallpaperDim}
                  onChange={(e) => setWallpaperDim(Number(e.target.value))}
                  className="w-20 accent-primary cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300 w-8">{wallpaperDim}%</span>
              </div>

              <div className="flex items-center space-x-2 border-l border-white/10 pl-4">
                <span className="text-xs text-textMuted whitespace-nowrap">Blur:</span>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={wallpaperBlur}
                  onChange={(e) => setWallpaperBlur(Number(e.target.value))}
                  className="w-20 accent-primary cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300 w-8">{wallpaperBlur}px</span>
              </div>
            </div>
          </div>

          {/* Faction Filter Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedFaction('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedFaction === 'all'
                  ? 'bg-primary text-black font-bold shadow-lg shadow-primary/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              All ({charactersList.length})
            </button>

            {Object.values(FACTIONS).map((fac) => {
              const count = charactersList.filter((c) => c.faction === fac.id).length;
              return (
                <button
                  key={fac.id}
                  onClick={() => setSelectedFaction(fac.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    selectedFaction === fac.id
                      ? 'bg-primary text-black font-bold shadow-lg shadow-primary/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {fac.name.en} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Character Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCharacters.map((char) => {
            const isSelected = characterId === char.id;
            return (
              <div
                key={char.id}
                onClick={() => setCharacter(char.id)}
                className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? 'bg-white/15 border-primary shadow-lg shadow-primary/20 ring-1 ring-primary'
                    : 'bg-black/30 border-white/10 hover:border-white/25 hover:bg-white/5'
                }`}
              >
                {/* Checkmark badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center shadow-md">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* Character Name & Faction */}
                <div className="pr-6">
                  <h3 className="font-semibold text-sm text-white group-hover:text-primary transition-colors">
                    {char.name.en}
                  </h3>
                  <div className="text-xs text-textMuted font-persian font-medium mt-0.5">
                    {char.name.fa}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                    {FACTIONS[char.faction]?.name.en || char.faction}
                  </span>

                  {/* Palette Swatches */}
                  <div className="flex items-center space-x-1.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: char.palette.primary }}
                      title={`Primary: ${char.palette.primary}`}
                    />
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                      style={{ backgroundColor: char.palette.secondary }}
                      title={`Secondary: ${char.palette.secondary}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-black/30 flex items-center justify-between text-xs text-slate-400">
          <div>
            Active Theme: <span className="text-primary font-bold">{RE_ZERO_CHARACTERS[characterId]?.name.en}</span> ({RE_ZERO_CHARACTERS[characterId]?.name.fa})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-primary text-black font-semibold hover:opacity-90 transition-opacity"
          >
            Apply & Close
          </button>
        </div>

      </div>
    </div>
  );
};
