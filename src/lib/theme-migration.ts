import type { BackgroundEffectId, ColorThemeId, GlassScope } from '@/contexts/ThemeContext';
import {
  GLASS_OPACITY_DEFAULT,
  type ThemeAppearanceMode,
} from '@/lib/appearance-constants';

export type { ThemeAppearanceMode };

export type LegacyThemeId =
  | ColorThemeId
  | 'rain'
  | 'tempestade'
  | 'chuvisco'
  | 'crimson'
  | 'ocean'
  | 'rose'
  | 'cosmos'
  | 'midnight'
  | 'sunset'
  | 'lavender'
  | 'monochrome';

export interface MigratedAppearance {
  colorThemeId: ColorThemeId;
  backgroundEffect: BackgroundEffectId;
  rainDensity: number;
  glassScope: GlassScope;
  glassOpacity: number;
  appearanceMode: ThemeAppearanceMode;
}

const LEGACY_RAIN_THEMES: Record<string, MigratedAppearance> = {
  rain: { colorThemeId: 'slate', backgroundEffect: 'rain', rainDensity: 1, glassScope: 'sidebar', glassOpacity: GLASS_OPACITY_DEFAULT, appearanceMode: 'custom' },
  tempestade: { colorThemeId: 'obsidian', backgroundEffect: 'rain', rainDensity: 1.3, glassScope: 'sidebar', glassOpacity: GLASS_OPACITY_DEFAULT, appearanceMode: 'custom' },
  chuvisco: { colorThemeId: 'snow', backgroundEffect: 'rain', rainDensity: 0.3, glassScope: 'sidebar', glassOpacity: GLASS_OPACITY_DEFAULT, appearanceMode: 'custom' },
};

/** Maps removed color theme IDs to the closest new theme */
const REMOVED_THEME_MAP: Record<string, ColorThemeId> = {
  cosmos: 'obsidian',
  monochrome: 'obsidian',
  tempestade: 'obsidian',
  midnight: 'slate',
  lavender: 'slate',
  sunset: 'ember',
  crimson: 'ember',
  ocean: 'snow',
  rose: 'aurora',
};

const COLOR_THEME_IDS: ColorThemeId[] = [
  'aurora', 'obsidian', 'graphite', 'snow', 'slate', 'ember',
];

export function isColorThemeId(id: string): id is ColorThemeId {
  return COLOR_THEME_IDS.includes(id as ColorThemeId);
}

function resolveColorThemeId(id: string): ColorThemeId {
  if (isColorThemeId(id)) return id;
  if (id in REMOVED_THEME_MAP) return REMOVED_THEME_MAP[id];
  return 'obsidian';
}

export function isGlassScope(id: string): id is GlassScope {
  return id === 'none' || id === 'sidebar' || id === 'full';
}

export function migrateLegacyTheme(oldId: string): MigratedAppearance {
  if (oldId in LEGACY_RAIN_THEMES) {
    return LEGACY_RAIN_THEMES[oldId];
  }
  return {
    colorThemeId: resolveColorThemeId(oldId),
    backgroundEffect: 'starfield',
    rainDensity: 1,
    glassScope: 'sidebar',
    glassOpacity: GLASS_OPACITY_DEFAULT,
    appearanceMode: 'custom',
  };
}

function isAppearanceMode(v: string): v is ThemeAppearanceMode {
  return v === 'system' || v === 'light' || v === 'dark' || v === 'custom';
}

export function loadAppearanceFromStorage(): MigratedAppearance {
  const colorSaved = localStorage.getItem('arrow-color-theme');
  const effectSaved = localStorage.getItem('arrow-bg-effect');
  const densitySaved = localStorage.getItem('arrow-rain-density');
  const glassSaved = localStorage.getItem('arrow-glass-scope');
  const opacitySaved = localStorage.getItem('arrow-glass-opacity');
  const modeSaved = localStorage.getItem('arrow-appearance-mode');

  const appearanceMode =
    modeSaved && isAppearanceMode(modeSaved) ? modeSaved : 'custom';

  if (colorSaved) {
    const colorThemeId = resolveColorThemeId(colorSaved);
    const backgroundEffect =
      effectSaved === 'none' || effectSaved === 'starfield' || effectSaved === 'rain'
        ? effectSaved
        : 'starfield';
    const rainDensity = densitySaved ? parseFloat(densitySaved) : 1;
    const glassScope = glassSaved && isGlassScope(glassSaved) ? glassSaved : 'sidebar';
    const parsedOpacity = opacitySaved ? parseInt(opacitySaved, 10) : GLASS_OPACITY_DEFAULT;
    const glassOpacity = Number.isFinite(parsedOpacity) ? parsedOpacity : GLASS_OPACITY_DEFAULT;
    return {
      colorThemeId,
      backgroundEffect,
      rainDensity: Number.isFinite(rainDensity) ? rainDensity : 1,
      glassScope,
      glassOpacity,
      appearanceMode,
    };
  }

  const legacy = localStorage.getItem('arrow-theme');
  if (legacy) {
    const migrated = migrateLegacyTheme(legacy);
    persistAppearance(migrated);
    localStorage.removeItem('arrow-theme');
    return migrated;
  }

  return {
    colorThemeId: 'obsidian',
    backgroundEffect: 'starfield',
    rainDensity: 1,
    glassScope: 'sidebar',
    glassOpacity: GLASS_OPACITY_DEFAULT,
    appearanceMode: 'custom',
  };
}

export function persistAppearance(appearance: MigratedAppearance) {
  localStorage.setItem('arrow-color-theme', appearance.colorThemeId);
  localStorage.setItem('arrow-bg-effect', appearance.backgroundEffect);
  localStorage.setItem('arrow-rain-density', String(appearance.rainDensity));
  localStorage.setItem('arrow-glass-scope', appearance.glassScope);
  localStorage.setItem('arrow-glass-opacity', String(appearance.glassOpacity));
  localStorage.setItem('arrow-appearance-mode', appearance.appearanceMode);
}
