import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { isDesktop } from '@/lib/platform';
import { desktopAPI } from '@/lib/desktop-api';
import {
  loadAppearanceFromStorage,
  persistAppearance,
  migrateLegacyTheme,
  isColorThemeId,
} from '@/lib/theme-migration';
import {
  GLASS_OPACITY_DEFAULT,
  GLASS_OPACITY_MIN,
  GLASS_OPACITY_MAX,
  LIGHT_COLOR_THEME,
  DARK_COLOR_THEME,
  type ThemeAppearanceMode,
} from '@/lib/appearance-constants';

export { GLASS_OPACITY_DEFAULT, GLASS_OPACITY_MIN, GLASS_OPACITY_MAX };
export type { ThemeAppearanceMode };
export { LIGHT_COLOR_THEME, DARK_COLOR_THEME };

export type ColorThemeId =
  | 'aurora'
  | 'obsidian'
  | 'graphite'
  | 'snow'
  | 'slate'
  | 'ember';

export type BackgroundEffectId = 'none' | 'starfield' | 'rain';

/** Where frosted-glass / vibrancy transparency is applied */
export type GlassScope = 'none' | 'sidebar' | 'full';

/** @deprecated Use ColorThemeId */
export type ThemeId = ColorThemeId | 'rain' | 'tempestade' | 'chuvisco';

export interface ColorThemeConfig {
  id: ColorThemeId;
  name: string;
  isDark: boolean;
  accent: string;
  accentLight: string;
  gradientFrom: string;
  gradientTo: string;
}

export interface NeutralSurfaces {
  bg: string;
  bgElevated: string;
  bgCard: string;
  bgSidebar: string;
  bgGlassMain: string;
  bgTopbar: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  rimLight: string;
}

export interface ResolvedTheme extends NeutralSurfaces {
  id: ColorThemeId;
  name: string;
  isDark: boolean;
  accent: string;
  accentForeground: string;
  accentLight: string;
  gradientFrom: string;
  gradientTo: string;
  /** @deprecated Use backgroundEffect from context */
  hasStarfield: boolean;
  /** @deprecated Use backgroundEffect from context */
  hasRain?: boolean;
  /** @deprecated Use rainDensity from context */
  rainDensity?: number;
}

export const COLOR_THEMES: Record<ColorThemeId, ColorThemeConfig> = {
  aurora: {
    id: 'aurora', name: 'Aurora Boreal', isDark: false,
    accent: '#f97316', accentLight: 'rgba(249,115,22,0.12)',
    gradientFrom: '#f97316', gradientTo: '#3b82f6',
  },
  obsidian: {
    id: 'obsidian', name: 'Obsidian', isDark: true,
    accent: '#A3FF47', accentLight: 'rgba(163,255,71,0.12)',
    gradientFrom: '#A3FF47', gradientTo: '#7AE02E',
  },
  graphite: {
    id: 'graphite', name: 'Graphite', isDark: true,
    accent: '#F5F5F7', accentLight: 'rgba(245,245,247,0.08)',
    gradientFrom: '#F5F5F7', gradientTo: '#AEAEB2',
  },
  snow: {
    id: 'snow', name: 'Snow', isDark: false,
    accent: '#007AFF', accentLight: 'rgba(0,122,255,0.12)',
    gradientFrom: '#007AFF', gradientTo: '#5AC8FA',
  },
  slate: {
    id: 'slate', name: 'Slate', isDark: true,
    accent: '#64D2FF', accentLight: 'rgba(100,210,255,0.12)',
    gradientFrom: '#64D2FF', gradientTo: '#0A84FF',
  },
  ember: {
    id: 'ember', name: 'Ember', isDark: true,
    accent: '#FF9F0A', accentLight: 'rgba(255,159,10,0.12)',
    gradientFrom: '#FF9F0A', gradientTo: '#FF453A',
  },
};

/** @deprecated Use COLOR_THEMES */
export const THEMES = COLOR_THEMES;

export const BACKGROUND_EFFECTS: { id: BackgroundEffectId; name: string; description: string }[] = [
  { id: 'none', name: 'Nenhum', description: 'Fundo limpo sem animação' },
  { id: 'starfield', name: 'Starfield', description: 'Campo de estrelas animado' },
  { id: 'rain', name: 'Chuva', description: 'Efeito de chuva na tela' },
];

export const RAIN_PRESETS = [
  { id: 'light', label: 'Leve', density: 0.3 },
  { id: 'moderate', label: 'Moderada', density: 1 },
  { id: 'intense', label: 'Intensa', density: 1.3 },
] as const;

export const GLASS_SCOPE_OPTIONS: { id: GlassScope; name: string; description: string }[] = [
  {
    id: 'none',
    name: 'Sem transparência',
    description: 'Fundo sólido e flat em toda a interface',
  },
  {
    id: 'sidebar',
    name: 'Apenas barra lateral',
    description: 'Vidro fosco só na sidebar; fundo da página neutro',
  },
  {
    id: 'full',
    name: 'Sidebar e página',
    description: 'Transparência em toda a janela, incluindo o conteúdo',
  },
];

/** Maps slider 0 (transparent) → 100 (opaque) to glass tint alphas */
export function resolveGlassSurfaces(isDark: boolean, opacity: number) {
  const t = Math.min(GLASS_OPACITY_MAX, Math.max(GLASS_OPACITY_MIN, opacity)) / 100;
  if (isDark) {
    const sidebarA = 0.16 + t * 0.56;
    const mainA = 0.14 + t * 0.51;
    return {
      bgSidebar: `rgba(0, 0, 0, ${sidebarA.toFixed(2)})`,
      bgGlassMain: `rgba(0, 0, 0, ${mainA.toFixed(2)})`,
    };
  }
  const sidebarA = 0.1 + t * 0.45;
  const mainA = 0.08 + t * 0.42;
  return {
    bgSidebar: `rgba(255, 255, 255, ${sidebarA.toFixed(2)})`,
    bgGlassMain: `rgba(255, 255, 255, ${mainA.toFixed(2)})`,
  };
}

function getNeutralSurfaces(isDark: boolean, glassOpacity: number): NeutralSurfaces {
  const glass = resolveGlassSurfaces(isDark, glassOpacity);
  if (isDark) {
    return {
      bg: '#000000',
      bgElevated: '#1c1c1e',
      bgCard: 'rgba(28,28,30,0.85)',
      bgSidebar: glass.bgSidebar,
      bgGlassMain: glass.bgGlassMain,
      bgTopbar: 'transparent',
      textPrimary: '#f5f5f7',
      textSecondary: '#a1a1aa',
      textMuted: '#71717a',
      border: 'rgba(255,255,255,0.08)',
      rimLight: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 1px 0 0 rgba(255,255,255,0.04)',
    };
  }
  return {
    bg: '#f5f5f7',
    bgElevated: '#ffffff',
    bgCard: 'rgba(255,255,255,0.72)',
    bgSidebar: glass.bgSidebar,
    bgGlassMain: glass.bgGlassMain,
    bgTopbar: 'transparent',
    textPrimary: '#1d1d1f',
    textSecondary: '#6e6e73',
    textMuted: '#86868b',
    border: 'rgba(0,0,0,0.08)',
    rimLight: 'inset 0 1px 0 rgba(255,255,255,0.9), inset 1px 0 0 rgba(255,255,255,0.5)',
  };
}

/** Text color on solid accent backgrounds (selected pills, primary buttons) */
export function getAccentForeground(isDark: boolean): string {
  return isDark ? '#000000' : '#ffffff';
}

function resolveTheme(
  colorTheme: ColorThemeConfig,
  backgroundEffect: BackgroundEffectId,
  rainDensity: number,
  glassOpacity: number,
): ResolvedTheme {
  const surfaces = getNeutralSurfaces(colorTheme.isDark, glassOpacity);
  return {
    ...surfaces,
    id: colorTheme.id,
    name: colorTheme.name,
    isDark: colorTheme.isDark,
    accent: colorTheme.accent,
    accentForeground: getAccentForeground(colorTheme.isDark),
    accentLight: colorTheme.accentLight,
    gradientFrom: colorTheme.gradientFrom,
    gradientTo: colorTheme.gradientTo,
    hasStarfield: backgroundEffect === 'starfield',
    hasRain: backgroundEffect === 'rain',
    rainDensity: backgroundEffect === 'rain' ? rainDensity : undefined,
  };
}

interface ThemeContextType {
  colorTheme: ColorThemeConfig;
  colorThemeId: ColorThemeId;
  customColorThemeId: ColorThemeId;
  appearanceMode: ThemeAppearanceMode;
  setColorTheme: (id: ColorThemeId) => void;
  setAppearanceMode: (mode: ThemeAppearanceMode) => void;
  toggleLightDark: () => void;
  backgroundEffect: BackgroundEffectId;
  setBackgroundEffect: (id: BackgroundEffectId) => void;
  rainDensity: number;
  setRainDensity: (n: number) => void;
  glassScope: GlassScope;
  setGlassScope: (scope: GlassScope) => void;
  glassOpacity: number;
  setGlassOpacity: (value: number) => void;
  isDark: boolean;
  theme: ResolvedTheme;
  /** @deprecated Use setColorTheme */
  themeId: ColorThemeId;
  /** @deprecated Use setColorTheme */
  setTheme: (id: ColorThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeVars(t: ResolvedTheme) {
  const root = document.documentElement;
  root.style.setProperty('--arrow-bg', t.bg);
  root.style.setProperty('--arrow-bg-elevated', t.bgElevated);
  root.style.setProperty('--arrow-bg-card', t.bgCard);
  root.style.setProperty('--arrow-bg-sidebar', t.bgSidebar);
  root.style.setProperty('--arrow-bg-glass-main', t.bgGlassMain);
  root.style.setProperty('--arrow-bg-topbar', t.bgTopbar);
  root.style.setProperty('--arrow-text-primary', t.textPrimary);
  root.style.setProperty('--arrow-text-secondary', t.textSecondary);
  root.style.setProperty('--arrow-text-muted', t.textMuted);
  root.style.setProperty('--arrow-border', t.border);
  root.style.setProperty('--arrow-rim-light', t.rimLight);
  root.style.setProperty('--arrow-accent', t.accent);
  root.style.setProperty('--arrow-accent-foreground', t.accentForeground);
  root.style.setProperty('--arrow-accent-light', t.accentLight);
  root.style.setProperty('--arrow-gradient-from', t.gradientFrom);
  root.style.setProperty('--arrow-gradient-to', t.gradientTo);

  if (t.isDark) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

function applyGlassScope(scope: GlassScope) {
  const root = document.documentElement;
  root.dataset.glassScope = scope;
  if (isDesktop() && scope !== 'none') {
    root.classList.add('glass-desktop');
  } else {
    root.classList.remove('glass-desktop');
  }
}

async function syncVaultAppearance(appearance: {
  colorThemeId: ColorThemeId;
  backgroundEffect: BackgroundEffectId;
  rainDensity: number;
  glassScope: GlassScope;
  glassOpacity: number;
  appearanceMode: ThemeAppearanceMode;
}) {
  if (!isDesktop()) return;
  try {
    const config = await desktopAPI.vault.getConfig();
    await desktopAPI.vault.saveConfig({
      ...config,
      colorTheme: appearance.colorThemeId,
      backgroundEffect: appearance.backgroundEffect,
      rainDensity: appearance.rainDensity,
      glassScope: appearance.glassScope,
      glassOpacity: appearance.glassOpacity,
      appearanceMode: appearance.appearanceMode,
    });
  } catch {
    // vault may not be open yet
  }
}

function resolveEffectiveColorThemeId(
  mode: ThemeAppearanceMode,
  customId: ColorThemeId,
  systemPrefersDark: boolean,
): ColorThemeId {
  if (mode === 'system') return systemPrefersDark ? DARK_COLOR_THEME : LIGHT_COLOR_THEME;
  if (mode === 'light') return LIGHT_COLOR_THEME;
  if (mode === 'dark') return DARK_COLOR_THEME;
  return customId;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const initial = loadAppearanceFromStorage();
  const [customColorThemeId, setCustomColorThemeId] = useState<ColorThemeId>(initial.colorThemeId);
  const [appearanceMode, setAppearanceModeState] = useState<ThemeAppearanceMode>(initial.appearanceMode);
  const [backgroundEffect, setBackgroundEffectState] = useState<BackgroundEffectId>(initial.backgroundEffect);
  const [rainDensity, setRainDensityState] = useState(initial.rainDensity);
  const [glassScope, setGlassScopeState] = useState<GlassScope>(initial.glassScope);
  const [glassOpacity, setGlassOpacityState] = useState(initial.glassOpacity);
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  const colorThemeId = useMemo(
    () => resolveEffectiveColorThemeId(appearanceMode, customColorThemeId, systemPrefersDark),
    [appearanceMode, customColorThemeId, systemPrefersDark],
  );

  const colorTheme = COLOR_THEMES[colorThemeId] ?? COLOR_THEMES.obsidian;
  const theme = useMemo(
    () => resolveTheme(colorTheme, backgroundEffect, rainDensity, glassOpacity),
    [colorTheme, backgroundEffect, rainDensity, glassOpacity],
  );

  const persist = useCallback((appearance: {
    colorThemeId: ColorThemeId;
    backgroundEffect: BackgroundEffectId;
    rainDensity: number;
    glassScope: GlassScope;
    glassOpacity: number;
    appearanceMode: ThemeAppearanceMode;
  }) => {
    persistAppearance(appearance);
    syncVaultAppearance(appearance);
  }, []);

  const snapshot = useCallback(
    () => ({
      colorThemeId: customColorThemeId,
      backgroundEffect,
      rainDensity,
      glassScope,
      glassOpacity,
      appearanceMode,
    }),
    [customColorThemeId, backgroundEffect, rainDensity, glassScope, glassOpacity, appearanceMode],
  );

  const setColorTheme = useCallback(
    (id: ColorThemeId) => {
      setCustomColorThemeId(id);
      setAppearanceModeState('custom');
      persist({ colorThemeId: id, backgroundEffect, rainDensity, glassScope, glassOpacity, appearanceMode: 'custom' });
    },
    [backgroundEffect, rainDensity, glassScope, glassOpacity, persist],
  );

  const setAppearanceMode = useCallback(
    (mode: ThemeAppearanceMode) => {
      setAppearanceModeState(mode);
      persist({ ...snapshot(), appearanceMode: mode });
    },
    [snapshot, persist],
  );

  const toggleLightDark = useCallback(() => {
    const effectiveId = resolveEffectiveColorThemeId(appearanceMode, customColorThemeId, systemPrefersDark);
    const currentlyDark = COLOR_THEMES[effectiveId]?.isDark ?? true;
    const next: ThemeAppearanceMode = currentlyDark ? 'light' : 'dark';
    setAppearanceModeState(next);
    persist({ ...snapshot(), appearanceMode: next });
  }, [appearanceMode, customColorThemeId, systemPrefersDark, snapshot, persist]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setBackgroundEffect = useCallback(
    (id: BackgroundEffectId) => {
      setBackgroundEffectState(id);
      persist({ ...snapshot(), backgroundEffect: id });
    },
    [snapshot, persist],
  );

  const setRainDensity = useCallback(
    (n: number) => {
      setRainDensityState(n);
      persist({ ...snapshot(), rainDensity: n });
    },
    [snapshot, persist],
  );

  const setGlassScope = useCallback(
    (scope: GlassScope) => {
      setGlassScopeState(scope);
      persist({ ...snapshot(), glassScope: scope });
    },
    [snapshot, persist],
  );

  const setGlassOpacity = useCallback(
    (value: number) => {
      const clamped = Math.min(GLASS_OPACITY_MAX, Math.max(GLASS_OPACITY_MIN, Math.round(value)));
      setGlassOpacityState(clamped);
      persist({ ...snapshot(), glassOpacity: clamped });
    },
    [snapshot, persist],
  );

  useEffect(() => {
    applyThemeVars(theme);
  }, [theme]);

  useEffect(() => {
    applyGlassScope(glassScope);
  }, [glassScope]);

  useEffect(() => {
    if (!isDesktop()) return;
    if (glassScope === 'none') {
      desktopAPI.chrome.clearVibrancy().catch(() => {});
    } else {
      desktopAPI.chrome.syncVibrancy(theme.isDark).catch(() => {});
    }
  }, [glassScope, theme.isDark]);

  useEffect(() => {
    if (!isDesktop()) return;
    desktopAPI.vault.getConfig().then((config) => {
      if (!config) return;

      let color = customColorThemeId;
      let effect = backgroundEffect;
      let density = rainDensity;
      let glass = glassScope;
      let opacity = glassOpacity;
      let mode = appearanceMode;

      if (config.colorTheme && isColorThemeId(config.colorTheme)) {
        color = config.colorTheme;
      } else if (config.colorTheme) {
        color = migrateLegacyTheme(config.colorTheme).colorThemeId;
      } else if (config.theme) {
        const migrated = migrateLegacyTheme(config.theme);
        color = migrated.colorThemeId;
        effect = migrated.backgroundEffect;
        density = migrated.rainDensity;
      }

      if (
        config.backgroundEffect === 'none' ||
        config.backgroundEffect === 'starfield' ||
        config.backgroundEffect === 'rain'
      ) {
        effect = config.backgroundEffect;
      }

      if (typeof config.rainDensity === 'number' && Number.isFinite(config.rainDensity)) {
        density = config.rainDensity;
      }

      if (config.glassScope === 'none' || config.glassScope === 'sidebar' || config.glassScope === 'full') {
        glass = config.glassScope;
      }

      if (typeof config.glassOpacity === 'number' && Number.isFinite(config.glassOpacity)) {
        opacity = Math.min(GLASS_OPACITY_MAX, Math.max(GLASS_OPACITY_MIN, Math.round(config.glassOpacity)));
      }

      const configMode = (config as { appearanceMode?: string }).appearanceMode;
      if (
        configMode === 'system' ||
        configMode === 'light' ||
        configMode === 'dark' ||
        configMode === 'custom'
      ) {
        mode = configMode;
      }

      setCustomColorThemeId(color);
      setAppearanceModeState(mode);
      setBackgroundEffectState(effect);
      setRainDensityState(density);
      setGlassScopeState(glass);
      setGlassOpacityState(opacity);
      persistAppearance({
        colorThemeId: color,
        backgroundEffect: effect,
        rainDensity: density,
        glassScope: glass,
        glassOpacity: opacity,
        appearanceMode: mode,
      });
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        colorTheme,
        colorThemeId,
        customColorThemeId,
        appearanceMode,
        setColorTheme,
        setAppearanceMode,
        toggleLightDark,
        backgroundEffect,
        setBackgroundEffect,
        rainDensity,
        setRainDensity,
        glassScope,
        setGlassScope,
        glassOpacity,
        setGlassOpacity,
        isDark: theme.isDark,
        theme,
        themeId: colorThemeId,
        setTheme: setColorTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
