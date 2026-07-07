export const GLASS_OPACITY_DEFAULT = 55;
export const GLASS_OPACITY_MIN = 0;
export const GLASS_OPACITY_MAX = 100;

/** How the app picks light vs dark: system OS, fixed light/dark, or manual color theme */
export type ThemeAppearanceMode = 'system' | 'light' | 'dark' | 'custom';

export const LIGHT_COLOR_THEME = 'aurora' as const;
export const DARK_COLOR_THEME = 'graphite' as const;
