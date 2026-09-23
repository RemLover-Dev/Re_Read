export interface LocalizedName {
  en: string;
  fa: string;
  romaji: string;
}

export interface CharacterPalette {
  primary: string;        // Main accent color
  secondary: string;      // Ambient complementary tone
  surface: string;        // Base glass panel tint (RGBA)
  textPrimary: string;    // Main typography color (WCAG AAA contrast)
  textMuted: string;      // Secondary/muted text
  glassOpacity: number;   // Suggested panel opacity (0.15 - 0.40)
  borderGlow: string;     // Luminous border accent (RGBA)
  codeBackground: string; // Background for code snippets
}

export type FactionId =
  | 'emilia-camp'
  | 'crusch-camp'
  | 'anastasia-camp'
  | 'priscilla-camp'
  | 'felt-camp'
  | 'witches-of-sin'
  | 'witch-cult'
  | 'historical-rogue';

export interface FactionMeta {
  id: FactionId;
  name: { en: string; fa: string };
  badgeColor: string;
}

export const FACTIONS: Record<FactionId, FactionMeta> = {
  'emilia-camp': { id: 'emilia-camp', name: { en: 'Emilia Camp', fa: 'اردوگاه امیلیا' }, badgeColor: '#A855F7' },
  'crusch-camp': { id: 'crusch-camp', name: { en: 'Crusch Camp', fa: 'اردوگاه کروش' }, badgeColor: '#15803D' },
  'anastasia-camp': { id: 'anastasia-camp', name: { en: 'Anastasia Camp', fa: 'اردوگاه آناستازیا' }, badgeColor: '#8B5CF6' },
  'priscilla-camp': { id: 'priscilla-camp', name: { en: 'Priscilla Camp', fa: 'اردوگاه پریسیلا' }, badgeColor: '#DC2626' },
  'felt-camp': { id: 'felt-camp', name: { en: 'Felt Camp', fa: 'اردوگاه فلت' }, badgeColor: '#EAB308' },
  'witches-of-sin': { id: 'witches-of-sin', name: { en: 'Witches of Sin', fa: 'جادوگران گناه' }, badgeColor: '#9333EA' },
  'witch-cult': { id: 'witch-cult', name: { en: 'Witch Cult', fa: 'فرقه جادوگر' }, badgeColor: '#B91C1C' },
  'historical-rogue': { id: 'historical-rogue', name: { en: 'Historical & Rogues', fa: 'شخصیت‌های تاریخی و سرکش' }, badgeColor: '#6366F1' },
};

export interface CharacterEntry {
  id: string;
  name: LocalizedName;
  faction: FactionId;
  palette: CharacterPalette;
  booruTags: string[];
  defaultWallpaper: string | null;
  windowVibrancy: 'mica' | 'acrylic';
  pdfFilter: string;
}

export const RE_ZERO_CHARACTERS: Record<string, CharacterEntry> = {
  // =========================================================================
  // 1. EMILIA CAMP
  // =========================================================================
  'natsuki-subaru': {
    id: 'natsuki-subaru',
    name: { en: 'Natsuki Subaru', fa: 'ناتسوکی سوبارو', romaji: 'Natsuki Subaru' },
    faction: 'emilia-camp',
    palette: {
      primary: '#F97316',
      secondary: '#1C1917',
      surface: 'rgba(28, 25, 23, 0.78)',
      textPrimary: '#FFF7ED',
      textMuted: '#A8A29E',
      glassOpacity: 0.28,
      borderGlow: 'rgba(249, 115, 22, 0.35)',
      codeBackground: 'rgba(15, 13, 12, 0.85)',
    },
    booruTags: ['natsuki_subaru', 'subaru_(re:zero)', 'rating:safe'],
    defaultWallpaper: 'assets/themes/natsuki-subaru/default.webp',
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(25deg) contrast(1.05)',
  },

  'emilia': {
    id: 'emilia',
    name: { en: 'Emilia', fa: 'امیلیا', romaji: 'Emiria' },
    faction: 'emilia-camp',
    palette: {
      primary: '#A855F7',
      secondary: '#F8FAFC',
      surface: 'rgba(23, 15, 38, 0.70)',
      textPrimary: '#FAF5FF',
      textMuted: '#CBD5E1',
      glassOpacity: 0.22,
      borderGlow: 'rgba(168, 85, 247, 0.32)',
      codeBackground: 'rgba(18, 10, 30, 0.85)',
    },
    booruTags: ['emilia_(re:zero)', '-subaru_(re:zero)', 'solo', 'rating:safe'],
    defaultWallpaper: 'assets/themes/emilia/default.webp',
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(260deg) contrast(1.02)',
  },

  'puck': {
    id: 'puck',
    name: { en: 'Puck', fa: 'پک', romaji: 'Pakku' },
    faction: 'emilia-camp',
    palette: {
      primary: '#06B6D4',
      secondary: '#E2E8F0',
      surface: 'rgba(15, 23, 42, 0.68)',
      textPrimary: '#ECFEFF',
      textMuted: '#94A3B8',
      glassOpacity: 0.20,
      borderGlow: 'rgba(6, 182, 212, 0.30)',
      codeBackground: 'rgba(11, 19, 36, 0.85)',
    },
    booruTags: ['puck_(re:zero)', 'solo', 'rating:safe'],
    defaultWallpaper: 'assets/themes/puck/default.webp',
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.90) hue-rotate(180deg) brightness(0.95)',
  },

  'rem': {
    id: 'rem',
    name: { en: 'Rem', fa: 'رم', romaji: 'Remu' },
    faction: 'emilia-camp',
    palette: {
      primary: '#38BDF8',
      secondary: '#E0F2FE',
      surface: 'rgba(12, 24, 48, 0.65)',
      textPrimary: '#F0F9FF',
      textMuted: '#93C5FD',
      glassOpacity: 0.20,
      borderGlow: 'rgba(56, 189, 248, 0.35)',
      codeBackground: 'rgba(7, 16, 34, 0.85)',
    },
    booruTags: ['rem_(re:zero)', '-ram_(re:zero)', 'solo', 'rating:safe'],
    defaultWallpaper: 'assets/themes/rem/default.webp',
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(200deg) brightness(0.96)',
  },

  'ram': {
    id: 'ram',
    name: { en: 'Ram', fa: 'رام', romaji: 'Ramu' },
    faction: 'emilia-camp',
    palette: {
      primary: '#F472B6',
      secondary: '#E11D48',
      surface: 'rgba(38, 14, 25, 0.70)',
      textPrimary: '#FFF1F2',
      textMuted: '#FDA4AF',
      glassOpacity: 0.22,
      borderGlow: 'rgba(244, 114, 182, 0.32)',
      codeBackground: 'rgba(28, 8, 18, 0.85)',
    },
    booruTags: ['ram_(re:zero)', '-rem_(re:zero)', 'solo', 'rating:safe'],
    defaultWallpaper: 'assets/themes/ram/default.webp',
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(320deg) brightness(0.96)',
  },

  'roswaal-l-mathers': {
    id: 'roswaal-l-mathers',
    name: { en: 'Roswaal L. Mathers', fa: 'روزوال ال. مدرز', romaji: 'Rozuwāru Eru Mēzāsu' },
    faction: 'emilia-camp',
    palette: {
      primary: '#EAB308',
      secondary: '#6366F1',
      surface: 'rgba(26, 18, 42, 0.78)',
      textPrimary: '#FEF08A',
      textMuted: '#A5B4FC',
      glassOpacity: 0.28,
      borderGlow: 'rgba(234, 179, 8, 0.30)',
      codeBackground: 'rgba(18, 12, 30, 0.88)',
    },
    booruTags: ['roswaal_l_mathers', 'roswaal_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'acrylic',
    pdfFilter: 'invert(0.90) hue-rotate(270deg)',
  },

  'beatrice': {
    id: 'beatrice',
    name: { en: 'Beatrice', fa: 'بئاتریس', romaji: 'Beatorisu' },
    faction: 'emilia-camp',
    palette: {
      primary: '#EC4899',
      secondary: '#FDE047',
      surface: 'rgba(40, 16, 32, 0.72)',
      textPrimary: '#FDF2F8',
      textMuted: '#F9A8D4',
      glassOpacity: 0.24,
      borderGlow: 'rgba(236, 72, 153, 0.35)',
      codeBackground: 'rgba(28, 10, 22, 0.85)',
    },
    booruTags: ['beatrice_(re:zero)', 'solo', 'rating:safe'],
    defaultWallpaper: 'assets/themes/beatrice/default.webp',
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(315deg) brightness(0.98)',
  },

  'otto-suwen': {
    id: 'otto-suwen',
    name: { en: 'Otto Suwen', fa: 'اتوو سوون', romaji: 'Ottō Sūwen' },
    faction: 'emilia-camp',
    palette: {
      primary: '#22C55E',
      secondary: '#B45309',
      surface: 'rgba(16, 30, 20, 0.72)',
      textPrimary: '#F0FDF4',
      textMuted: '#86EFAC',
      glassOpacity: 0.24,
      borderGlow: 'rgba(34, 197, 94, 0.28)',
      codeBackground: 'rgba(10, 22, 14, 0.85)',
    },
    booruTags: ['otto_suwen', 'otto_(re:zero)', 'rating:safe'],
    defaultWallpaper: 'assets/themes/otto/default.webp',
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(100deg)',
  },

  'garfiel-tinsel': {
    id: 'garfiel-tinsel',
    name: { en: 'Garfiel Tinsel', fa: 'گارفیل تینسل', romaji: 'Gāfīru Tinzeru' },
    faction: 'emilia-camp',
    palette: {
      primary: '#F59E0B',
      secondary: '#10B981',
      surface: 'rgba(34, 24, 12, 0.75)',
      textPrimary: '#FFFBEB',
      textMuted: '#FCD34D',
      glassOpacity: 0.26,
      borderGlow: 'rgba(245, 158, 11, 0.35)',
      codeBackground: 'rgba(24, 16, 8, 0.88)',
    },
    booruTags: ['garfiel_tinsel', 'garfiel_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.90) hue-rotate(35deg)',
  },

  'frederica-baumann': {
    id: 'frederica-baumann',
    name: { en: 'Frederica Baumann', fa: 'فردریکا باومن', romaji: 'Furederika Bauman' },
    faction: 'emilia-camp',
    palette: {
      primary: '#D97706',
      secondary: '#1E3A8A',
      surface: 'rgba(28, 22, 20, 0.72)',
      textPrimary: '#FEF3C7',
      textMuted: '#FDE68A',
      glassOpacity: 0.22,
      borderGlow: 'rgba(217, 119, 6, 0.30)',
      codeBackground: 'rgba(20, 14, 12, 0.86)',
    },
    booruTags: ['frederica_baumann', 'frederica_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.90) sepia(0.2) hue-rotate(30deg)',
  },

  // =========================================================================
  // 2. CRUSCH CAMP
  // =========================================================================
  'crusch-karsten': {
    id: 'crusch-karsten',
    name: { en: 'Crusch Karsten', fa: 'کروش کارستن', romaji: 'Kurushu Karusuten' },
    faction: 'crusch-camp',
    palette: {
      primary: '#15803D',
      secondary: '#E2E8F0',
      surface: 'rgba(12, 28, 18, 0.74)',
      textPrimary: '#F0FDF4',
      textMuted: '#CBD5E1',
      glassOpacity: 0.24,
      borderGlow: 'rgba(21, 128, 61, 0.35)',
      codeBackground: 'rgba(8, 20, 12, 0.88)',
    },
    booruTags: ['crusch_karsten', 'crusch_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(120deg)',
  },

  'felix-argyle': {
    id: 'felix-argyle',
    name: { en: 'Felix Argyle (Ferris)', fa: 'فلیکس آرگیل (فریس)', romaji: 'Ferikkusu Āgairu' },
    faction: 'crusch-camp',
    palette: {
      primary: '#38BDF8',
      secondary: '#F472B6',
      surface: 'rgba(18, 26, 42, 0.68)',
      textPrimary: '#F0F9FF',
      textMuted: '#FBCFE8',
      glassOpacity: 0.20,
      borderGlow: 'rgba(56, 189, 248, 0.30)',
      codeBackground: 'rgba(10, 18, 32, 0.85)',
    },
    booruTags: ['felix_argyle', 'ferris_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(190deg)',
  },

  'wilhelm-van-astrea': {
    id: 'wilhelm-van-astrea',
    name: { en: 'Wilhelm van Astrea', fa: 'ویلهلم ون آستریا', romaji: 'Viruherumu van Asutorea' },
    faction: 'crusch-camp',
    palette: {
      primary: '#94A3B8',
      secondary: '#1E293B',
      surface: 'rgba(15, 23, 42, 0.82)',
      textPrimary: '#F8FAFC',
      textMuted: '#94A3B8',
      glassOpacity: 0.32,
      borderGlow: 'rgba(148, 163, 184, 0.28)',
      codeBackground: 'rgba(9, 14, 26, 0.90)',
    },
    booruTags: ['wilhelm_van_astrea', 'wilhelm_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.94) grayscale(1)',
  },

  // =========================================================================
  // 3. ANASTASIA CAMP
  // =========================================================================
  'anastasia-hoshin': {
    id: 'anastasia-hoshin',
    name: { en: 'Anastasia Hoshin', fa: 'آناستازیا هوشین', romaji: 'Anasutashia Hōshin' },
    faction: 'anastasia-camp',
    palette: {
      primary: '#8B5CF6',
      secondary: '#F59E0B',
      surface: 'rgba(26, 18, 42, 0.70)',
      textPrimary: '#FAF5FF',
      textMuted: '#DDD6FE',
      glassOpacity: 0.22,
      borderGlow: 'rgba(139, 92, 246, 0.35)',
      codeBackground: 'rgba(18, 12, 30, 0.86)',
    },
    booruTags: ['anastasia_hoshin', 'anastasia_(re:zero)', 'rating:safe'],
    defaultWallpaper: 'assets/themes/anastasia/default.webp',
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(245deg)',
  },

  'julius-juukulius': {
    id: 'julius-juukulius',
    name: { en: 'Julius Juukulius', fa: 'جولیوس یوکولیوس', romaji: 'Yuriusu Yūkuriusu' },
    faction: 'anastasia-camp',
    palette: {
      primary: '#A78BFA',
      secondary: '#EAB308',
      surface: 'rgba(24, 20, 40, 0.74)',
      textPrimary: '#FAF5FF',
      textMuted: '#C4B5FD',
      glassOpacity: 0.24,
      borderGlow: 'rgba(167, 139, 250, 0.32)',
      codeBackground: 'rgba(16, 12, 28, 0.88)',
    },
    booruTags: ['julius_juukulius', 'julius_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(255deg)',
  },

  'ricardo-welkin': {
    id: 'ricardo-welkin',
    name: { en: 'Ricardo Welkin', fa: 'ریکاردو ولکین', romaji: 'Rikarudo Werukin' },
    faction: 'anastasia-camp',
    palette: {
      primary: '#B91C1C',
      secondary: '#78350F',
      surface: 'rgba(34, 18, 14, 0.76)',
      textPrimary: '#FEF2F2',
      textMuted: '#FCA5A5',
      glassOpacity: 0.28,
      borderGlow: 'rgba(185, 28, 28, 0.30)',
      codeBackground: 'rgba(24, 12, 10, 0.88)',
    },
    booruTags: ['ricardo_welkin', 'ricardo_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.90) hue-rotate(350deg)',
  },

  'mimi-pearlbaton': {
    id: 'mimi-pearlbaton',
    name: { en: 'Mimi Pearlbaton', fa: 'میمی پرلباتن', romaji: 'Mimi Pārubaton' },
    faction: 'anastasia-camp',
    palette: {
      primary: '#FB7185',
      secondary: '#FBBF24',
      surface: 'rgba(36, 16, 24, 0.68)',
      textPrimary: '#FFF1F2',
      textMuted: '#FDA4AF',
      glassOpacity: 0.20,
      borderGlow: 'rgba(251, 113, 133, 0.35)',
      codeBackground: 'rgba(26, 10, 16, 0.85)',
    },
    booruTags: ['mimi_pearlbaton', 'mimi_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(330deg)',
  },

  'hetaro-pearlbaton': {
    id: 'hetaro-pearlbaton',
    name: { en: 'Hetaro Pearlbaton', fa: 'هتارو پرلباتن', romaji: 'Hetāro Pārubaton' },
    faction: 'anastasia-camp',
    palette: {
      primary: '#14B8A6',
      secondary: '#B45309',
      surface: 'rgba(14, 28, 26, 0.70)',
      textPrimary: '#F0FDFA',
      textMuted: '#99F6E4',
      glassOpacity: 0.22,
      borderGlow: 'rgba(20, 184, 166, 0.28)',
      codeBackground: 'rgba(10, 20, 18, 0.85)',
    },
    booruTags: ['hetaro_pearlbaton', 'hetaro_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(160deg)',
  },

  'tivey-pearlbaton': {
    id: 'tivey-pearlbaton',
    name: { en: 'Tivey Pearlbaton', fa: 'تیوی پرلباتن', romaji: 'Tibī Pārubaton' },
    faction: 'anastasia-camp',
    palette: {
      primary: '#3B82F6',
      secondary: '#D97706',
      surface: 'rgba(16, 22, 38, 0.72)',
      textPrimary: '#EFF6FF',
      textMuted: '#93C5FD',
      glassOpacity: 0.24,
      borderGlow: 'rgba(59, 130, 246, 0.30)',
      codeBackground: 'rgba(10, 16, 28, 0.86)',
    },
    booruTags: ['tivey_pearlbaton', 'tivey_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(210deg)',
  },

  'scarfdona': {
    id: 'scarfdona',
    name: { en: 'Scarfdona (Fox Echidna)', fa: 'اسکارفدونا', romaji: 'Eridona' },
    faction: 'anastasia-camp',
    palette: {
      primary: '#10B981',
      secondary: '#F8FAFC',
      surface: 'rgba(16, 26, 24, 0.68)',
      textPrimary: '#F0FDF4',
      textMuted: '#A7F3D0',
      glassOpacity: 0.20,
      borderGlow: 'rgba(16, 185, 129, 0.35)',
      codeBackground: 'rgba(10, 18, 16, 0.85)',
    },
    booruTags: ['scarfdona', 'echidna_(fox)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(145deg)',
  },

  // =========================================================================
  // 4. PRISCILLA CAMP
  // =========================================================================
  'priscilla-barielle': {
    id: 'priscilla-barielle',
    name: { en: 'Priscilla Barielle', fa: 'پریسیلا باریل', romaji: 'Purishira Barīeru' },
    faction: 'priscilla-camp',
    palette: {
      primary: '#DC2626',
      secondary: '#F59E0B',
      surface: 'rgba(38, 12, 16, 0.75)',
      textPrimary: '#FFF1F2',
      textMuted: '#FECDD3',
      glassOpacity: 0.26,
      borderGlow: 'rgba(220, 38, 38, 0.38)',
      codeBackground: 'rgba(26, 8, 10, 0.88)',
    },
    booruTags: ['priscilla_barielle', 'priscilla_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.90) hue-rotate(345deg)',
  },

  'aldebaran': {
    id: 'aldebaran',
    name: { en: 'Aldebaran (Al)', fa: 'الدبران (ال)', romaji: 'Arudebaran' },
    faction: 'priscilla-camp',
    palette: {
      primary: '#D97706',
      secondary: '#64748B',
      surface: 'rgba(28, 22, 18, 0.75)',
      textPrimary: '#FEF3C7',
      textMuted: '#CBD5E1',
      glassOpacity: 0.28,
      borderGlow: 'rgba(217, 119, 6, 0.30)',
      codeBackground: 'rgba(20, 15, 12, 0.88)',
    },
    booruTags: ['aldebaran_(re:zero)', 'al_(re:zero)', 'rating:safe'],
    defaultWallpaper: 'assets/themes/aldebaran/default.webp',
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.90) sepia(0.3) hue-rotate(35deg)',
  },

  // =========================================================================
  // 5. FELT CAMP
  // =========================================================================
  'felt': {
    id: 'felt',
    name: { en: 'Felt', fa: 'فلت', romaji: 'Feruto' },
    faction: 'felt-camp',
    palette: {
      primary: '#EAB308',
      secondary: '#EF4444',
      surface: 'rgba(32, 24, 12, 0.72)',
      textPrimary: '#FEF9C3',
      textMuted: '#FDE047',
      glassOpacity: 0.22,
      borderGlow: 'rgba(234, 179, 8, 0.35)',
      codeBackground: 'rgba(22, 16, 8, 0.86)',
    },
    booruTags: ['felt_(re:zero)', 'solo', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.90) hue-rotate(45deg)',
  },

  'reinhard-van-astrea': {
    id: 'reinhard-van-astrea',
    name: { en: 'Reinhard van Astrea', fa: 'راینهارد ون آستریا', romaji: 'Rainhāto van Asutorea' },
    faction: 'felt-camp',
    palette: {
      primary: '#EF4444',
      secondary: '#38BDF8',
      surface: 'rgba(32, 14, 16, 0.72)',
      textPrimary: '#FEF2F2',
      textMuted: '#BAE6FD',
      glassOpacity: 0.24,
      borderGlow: 'rgba(239, 68, 68, 0.35)',
      codeBackground: 'rgba(22, 10, 12, 0.86)',
    },
    booruTags: ['reinhard_van_astrea', 'reinhard_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(350deg)',
  },

  'old-rom': {
    id: 'old-rom',
    name: { en: 'Old Rom', fa: 'پیرمرد رام', romaji: 'Romu-jii' },
    faction: 'felt-camp',
    palette: {
      primary: '#78716C',
      secondary: '#92400E',
      surface: 'rgba(28, 25, 23, 0.82)',
      textPrimary: '#F5F5F4',
      textMuted: '#A8A29E',
      glassOpacity: 0.35,
      borderGlow: 'rgba(120, 113, 108, 0.25)',
      codeBackground: 'rgba(18, 16, 14, 0.90)',
    },
    booruTags: ['old_rom_(re:zero)', 'cromwell_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'acrylic',
    pdfFilter: 'invert(0.94) grayscale(0.8)',
  },

  // =========================================================================
  // 6. WITCHES OF SIN
  // =========================================================================
  'satella': {
    id: 'satella',
    name: { en: 'Satella (Witch of Envy)', fa: 'ساتلا (جادوگر حسادت)', romaji: 'Satera' },
    faction: 'witches-of-sin',
    palette: {
      primary: '#A855F7',
      secondary: '#0F071A',
      surface: 'rgba(16, 8, 28, 0.82)',
      textPrimary: '#FAF5FF',
      textMuted: '#C084FC',
      glassOpacity: 0.32,
      borderGlow: 'rgba(168, 85, 247, 0.40)',
      codeBackground: 'rgba(10, 4, 18, 0.92)',
    },
    booruTags: ['satella_(re:zero)', 'witch_of_envy', 'rating:safe'],
    defaultWallpaper: 'assets/themes/satella/default.webp',
    windowVibrancy: 'acrylic',
    pdfFilter: 'invert(0.92) hue-rotate(265deg) contrast(1.1)',
  },

  'echidna': {
    id: 'echidna',
    name: { en: 'Echidna (Witch of Greed)', fa: 'اکیدنا (جادوگر طمع)', romaji: 'Ekidona' },
    faction: 'witches-of-sin',
    palette: {
      primary: '#10B981',
      secondary: '#000000',
      surface: 'rgba(8, 8, 12, 0.85)',
      textPrimary: '#F8FAFC',
      textMuted: '#94A3B8',
      glassOpacity: 0.35,
      borderGlow: 'rgba(16, 185, 129, 0.30)',
      codeBackground: 'rgba(5, 5, 8, 0.94)',
    },
    booruTags: ['echidna_(re:zero)', '-fox', 'solo', 'rating:safe'],
    defaultWallpaper: 'assets/themes/echidna/default.webp',
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.95) grayscale(1) contrast(1.15)',
  },

  'minerva': {
    id: 'minerva',
    name: { en: 'Minerva (Witch of Wrath)', fa: 'مینروا (جادوگر خشم)', romaji: 'Mineruba' },
    faction: 'witches-of-sin',
    palette: {
      primary: '#F43F5E',
      secondary: '#FDE047',
      surface: 'rgba(38, 14, 22, 0.72)',
      textPrimary: '#FFF1F2',
      textMuted: '#FECDD3',
      glassOpacity: 0.22,
      borderGlow: 'rgba(244, 63, 94, 0.35)',
      codeBackground: 'rgba(26, 8, 14, 0.86)',
    },
    booruTags: ['minerva_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(335deg)',
  },

  'daphne': {
    id: 'daphne',
    name: { en: 'Daphne (Witch of Gluttony)', fa: 'دافنه (جادوگر شکم‌پرستی)', romaji: 'Dafune' },
    faction: 'witches-of-sin',
    palette: {
      primary: '#A8A29E',
      secondary: '#6D28D9',
      surface: 'rgba(24, 20, 26, 0.80)',
      textPrimary: '#F5F5F4',
      textMuted: '#A8A29E',
      glassOpacity: 0.30,
      borderGlow: 'rgba(168, 162, 158, 0.28)',
      codeBackground: 'rgba(16, 14, 18, 0.90)',
    },
    booruTags: ['daphne_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'acrylic',
    pdfFilter: 'invert(0.92) hue-rotate(250deg)',
  },

  'typhon': {
    id: 'typhon',
    name: { en: 'Typhon (Witch of Pride)', fa: 'تایفون (جادوگر تکبر)', romaji: 'Taifon' },
    faction: 'witches-of-sin',
    palette: {
      primary: '#84CC16',
      secondary: '#92400E',
      surface: 'rgba(20, 28, 14, 0.72)',
      textPrimary: '#F7FEE7',
      textMuted: '#BEF264',
      glassOpacity: 0.24,
      borderGlow: 'rgba(132, 204, 22, 0.32)',
      codeBackground: 'rgba(14, 20, 10, 0.86)',
    },
    booruTags: ['typhon_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(85deg)',
  },

  'carmilla': {
    id: 'carmilla',
    name: { en: 'Carmilla (Witch of Lust)', fa: 'کارمیلا (جادوگر شهوت)', romaji: 'Kāmira' },
    faction: 'witches-of-sin',
    palette: {
      primary: '#FB7185',
      secondary: '#BE123C',
      surface: 'rgba(36, 16, 22, 0.70)',
      textPrimary: '#FFF1F2',
      textMuted: '#FECDD3',
      glassOpacity: 0.20,
      borderGlow: 'rgba(251, 113, 133, 0.35)',
      codeBackground: 'rgba(24, 10, 14, 0.85)',
    },
    booruTags: ['carmilla_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(325deg)',
  },

  'sekhmet': {
    id: 'sekhmet',
    name: { en: 'Sekhmet (Witch of Sloth)', fa: 'سخمت (جادوگر تنبلی)', romaji: 'Sekumeto' },
    faction: 'witches-of-sin',
    palette: {
      primary: '#64748B',
      secondary: '#581C87',
      surface: 'rgba(22, 18, 30, 0.82)',
      textPrimary: '#F1F5F9',
      textMuted: '#94A3B8',
      glassOpacity: 0.35,
      borderGlow: 'rgba(100, 116, 139, 0.30)',
      codeBackground: 'rgba(14, 12, 20, 0.92)',
    },
    booruTags: ['sekhmet_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'acrylic',
    pdfFilter: 'invert(0.94) hue-rotate(270deg)',
  },

  'hector': {
    id: 'hector',
    name: { en: 'Hector (Warlock of Melancholy)', fa: 'هکتور (وارلاک مالیخولیا)', romaji: 'Hekutōru' },
    faction: 'witches-of-sin',
    palette: {
      primary: '#6366F1',
      secondary: '#334155',
      surface: 'rgba(18, 20, 32, 0.85)',
      textPrimary: '#EEF2FF',
      textMuted: '#94A3B8',
      glassOpacity: 0.38,
      borderGlow: 'rgba(99, 102, 241, 0.28)',
      codeBackground: 'rgba(10, 12, 22, 0.92)',
    },
    booruTags: ['hector_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'acrylic',
    pdfFilter: 'invert(0.94) hue-rotate(235deg)',
  },

  'pandora': {
    id: 'pandora',
    name: { en: 'Pandora (Witch of Vainglory)', fa: 'پاندورا (جادوگر خودستایی)', romaji: 'Pandora' },
    faction: 'witches-of-sin',
    palette: {
      primary: '#E2E8F0',
      secondary: '#38BDF8',
      surface: 'rgba(24, 28, 36, 0.65)',
      textPrimary: '#FFFFFF',
      textMuted: '#CBD5E1',
      glassOpacity: 0.18,
      borderGlow: 'rgba(226, 232, 240, 0.40)',
      codeBackground: 'rgba(14, 18, 24, 0.85)',
    },
    booruTags: ['pandora_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.96) grayscale(0.9)',
  },

  // =========================================================================
  // 7. WITCH CULT SIN ARCHBISHOPS
  // =========================================================================
  'petelgeuse-romanee-conti': {
    id: 'petelgeuse-romanee-conti',
    name: { en: 'Petelgeuse Romanee-Conti', fa: 'پتلگیوس رومانی-کنتی', romaji: 'Peterugiusu Romanekonti' },
    faction: 'witch-cult',
    palette: {
      primary: '#15803D',
      secondary: '#7E22CE',
      surface: 'rgba(18, 24, 18, 0.82)',
      textPrimary: '#F0FDF4',
      textMuted: '#86EFAC',
      glassOpacity: 0.32,
      borderGlow: 'rgba(21, 128, 61, 0.35)',
      codeBackground: 'rgba(10, 16, 10, 0.90)',
    },
    booruTags: ['petelgeuse_romanee-conti', 'betelgeuse_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'acrylic',
    pdfFilter: 'invert(0.92) hue-rotate(115deg)',
  },

  'regulus-corneas': {
    id: 'regulus-corneas',
    name: { en: 'Regulus Corneas', fa: 'رگولوس کورنیاس', romaji: 'Regurusu Koruniasu' },
    faction: 'witch-cult',
    palette: {
      primary: '#F8FAFC',
      secondary: '#EAB308',
      surface: 'rgba(28, 28, 32, 0.78)',
      textPrimary: '#FFFFFF',
      textMuted: '#E2E8F0',
      glassOpacity: 0.25,
      borderGlow: 'rgba(248, 250, 252, 0.35)',
      codeBackground: 'rgba(18, 18, 22, 0.88)',
    },
    booruTags: ['regulus_corneas', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.95) contrast(1.1)',
  },

  'lye-batenkaitos': {
    id: 'lye-batenkaitos',
    name: { en: 'Lye Batenkaitos', fa: 'لای باتنکایتوس', romaji: 'Rai Batenkaitosu' },
    faction: 'witch-cult',
    palette: {
      primary: '#71717A',
      secondary: '#991B1B',
      surface: 'rgba(26, 22, 22, 0.80)',
      textPrimary: '#F4F4F5',
      textMuted: '#A1A1AA',
      glassOpacity: 0.30,
      borderGlow: 'rgba(113, 113, 122, 0.28)',
      codeBackground: 'rgba(16, 14, 14, 0.90)',
    },
    booruTags: ['lye_batenkaitos', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'acrylic',
    pdfFilter: 'invert(0.92) hue-rotate(350deg)',
  },

  'roy-alphard': {
    id: 'roy-alphard',
    name: { en: 'Roy Alphard', fa: 'روی الفارد', romaji: 'Roi Arufādo' },
    faction: 'witch-cult',
    palette: {
      primary: '#854D0E',
      secondary: '#71717A',
      surface: 'rgba(28, 24, 18, 0.82)',
      textPrimary: '#FEF08A',
      textMuted: '#CA8A04',
      glassOpacity: 0.32,
      borderGlow: 'rgba(133, 77, 14, 0.30)',
      codeBackground: 'rgba(18, 14, 10, 0.90)',
    },
    booruTags: ['roy_alphard', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'acrylic',
    pdfFilter: 'invert(0.90) sepia(0.4)',
  },

  'sirius-romanee-conti': {
    id: 'sirius-romanee-conti',
    name: { en: 'Sirius Romanee-Conti', fa: 'سیریوس رومانی-کنتی', romaji: 'Shiriusu Romanekonti' },
    faction: 'witch-cult',
    palette: {
      primary: '#EA580C',
      secondary: '#B91C1C',
      surface: 'rgba(36, 16, 12, 0.80)',
      textPrimary: '#FFF7ED',
      textMuted: '#FDBA74',
      glassOpacity: 0.28,
      borderGlow: 'rgba(234, 88, 12, 0.35)',
      codeBackground: 'rgba(24, 10, 8, 0.90)',
    },
    booruTags: ['sirius_romanee-conti', 'sirius_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'acrylic',
    pdfFilter: 'invert(0.92) hue-rotate(15deg)',
  },

  'capella-emerada-lugnica': {
    id: 'capella-emerada-lugnica',
    name: { en: 'Capella Emerada Lugnica', fa: 'کاپلا امرادا لوگنیکا', romaji: 'Kapera Emerada Rugunika' },
    faction: 'witch-cult',
    palette: {
      primary: '#C026D3',
      secondary: '#F59E0B',
      surface: 'rgba(34, 12, 32, 0.78)',
      textPrimary: '#FDF4FF',
      textMuted: '#F0ABFC',
      glassOpacity: 0.26,
      borderGlow: 'rgba(192, 38, 211, 0.35)',
      codeBackground: 'rgba(22, 8, 20, 0.88)',
    },
    booruTags: ['capella_emerada_lugnica', 'capella_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'acrylic',
    pdfFilter: 'invert(0.92) hue-rotate(295deg)',
  },

  // =========================================================================
  // 8. HISTORICAL & ROGUE FIGURES
  // =========================================================================
  'theresia-van-astrea': {
    id: 'theresia-van-astrea',
    name: { en: 'Theresia van Astrea', fa: 'ترزیا ون آستریا', romaji: 'Tereshia van Asutorea' },
    faction: 'historical-rogue',
    palette: {
      primary: '#F43F5E',
      secondary: '#38BDF8',
      surface: 'rgba(36, 14, 22, 0.70)',
      textPrimary: '#FFF1F2',
      textMuted: '#FECDD3',
      glassOpacity: 0.22,
      borderGlow: 'rgba(244, 63, 94, 0.35)',
      codeBackground: 'rgba(24, 8, 14, 0.86)',
    },
    booruTags: ['theresia_van_astrea', 'theresia_(re:zero)', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(340deg)',
  },

  'elsa-granhiert': {
    id: 'elsa-granhiert',
    name: { en: 'Elsa Granhiert', fa: 'السا گرانهیرت', romaji: 'Erusa Guranhīte' },
    faction: 'historical-rogue',
    palette: {
      primary: '#9F1239',
      secondary: '#1E1B4B',
      surface: 'rgba(30, 10, 18, 0.82)',
      textPrimary: '#FFF1F2',
      textMuted: '#FDA4AF',
      glassOpacity: 0.32,
      borderGlow: 'rgba(159, 18, 57, 0.35)',
      codeBackground: 'rgba(20, 6, 12, 0.90)',
    },
    booruTags: ['elsa_granhiert', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'acrylic',
    pdfFilter: 'invert(0.92) hue-rotate(330deg) contrast(1.1)',
  },

  'meili-portroute': {
    id: 'meili-portroute',
    name: { en: 'Meili Portroute', fa: 'میلی پورتروت', romaji: 'Meirī Pōtorūto' },
    faction: 'historical-rogue',
    palette: {
      primary: '#818CF8',
      secondary: '#FDE047',
      surface: 'rgba(22, 18, 38, 0.72)',
      textPrimary: '#EEF2FF',
      textMuted: '#C7D2FE',
      glassOpacity: 0.22,
      borderGlow: 'rgba(129, 140, 248, 0.32)',
      codeBackground: 'rgba(14, 12, 26, 0.86)',
    },
    booruTags: ['meili_portroute', 'rating:safe'],
    defaultWallpaper: null,
    windowVibrancy: 'mica',
    pdfFilter: 'invert(0.92) hue-rotate(240deg)',
  },
};
