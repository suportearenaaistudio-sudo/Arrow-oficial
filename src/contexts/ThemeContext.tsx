import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeId =
  | 'aurora'
  | 'crimson'
  | 'ocean'
  | 'rose'
  | 'cosmos'
  | 'midnight'
  | 'sunset'
  | 'lavender'
  | 'monochrome'
  | 'rain'
  | 'tempestade'
  | 'chuvisco';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  isDark: boolean;
  hasStarfield: boolean;
  hasRain?: boolean;
  rainDensity?: number; // 0-1, default 1
  bg: string;
  bgCard: string;
  bgSidebar: string;
  bgTopbar: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  accent: string;
  accentLight: string;
  gradientFrom: string;
  gradientTo: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  aurora: {
    id: 'aurora', name: 'Aurora Boreal', isDark: false, hasStarfield: true,
    bg: '#f8f8fb',
    bgCard: 'rgba(255,255,255,0.85)',
    bgSidebar: 'rgba(255,255,255,0.92)',
    bgTopbar: 'rgba(255,255,255,0.85)',
    textPrimary: '#1a1a2e',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    border: 'rgba(0,0,0,0.06)',
    accent: '#f97316',
    accentLight: 'rgba(249,115,22,0.1)',
    gradientFrom: '#f97316',
    gradientTo: '#3b82f6',
  },
  crimson: {
    id: 'crimson', name: 'Vermelho', isDark: false, hasStarfield: true,
    bg: '#fff5f5',
    bgCard: 'rgba(255,255,255,0.85)',
    bgSidebar: 'rgba(255,255,255,0.92)',
    bgTopbar: 'rgba(255,255,255,0.85)',
    textPrimary: '#1a1a2e',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    border: 'rgba(0,0,0,0.06)',
    accent: '#FF0000',
    accentLight: 'rgba(255,0,0,0.1)',
    gradientFrom: '#FF0000',
    gradientTo: '#CC0000',
  },
  ocean: {
    id: 'ocean', name: 'Oceano', isDark: false, hasStarfield: true,
    bg: '#f0f7ff',
    bgCard: 'rgba(255,255,255,0.85)',
    bgSidebar: 'rgba(255,255,255,0.92)',
    bgTopbar: 'rgba(255,255,255,0.85)',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    border: 'rgba(0,0,0,0.06)',
    accent: '#0066FF',
    accentLight: 'rgba(0,102,255,0.1)',
    gradientFrom: '#0066FF',
    gradientTo: '#0044CC',
  },
  rose: {
    id: 'rose', name: 'Rose', isDark: false, hasStarfield: true,
    bg: '#fdf2f8',
    bgCard: 'rgba(255,255,255,0.85)',
    bgSidebar: 'rgba(255,255,255,0.92)',
    bgTopbar: 'rgba(255,255,255,0.85)',
    textPrimary: '#1a1a2e',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    border: 'rgba(0,0,0,0.06)',
    accent: '#ec4899',
    accentLight: 'rgba(236,72,153,0.1)',
    gradientFrom: '#ec4899',
    gradientTo: '#a855f7',
  },
  cosmos: {
    id: 'cosmos', name: 'Cosmos', isDark: true, hasStarfield: true,
    bg: '#0B0B0B',
    bgCard: 'rgba(255,255,255,0.04)',
    bgSidebar: 'rgba(255,255,255,0.03)',
    bgTopbar: 'rgba(255,255,255,0.04)',
    textPrimary: '#f0f0f0',
    textSecondary: '#a0a0a0',
    textMuted: '#666666',
    border: 'rgba(255,255,255,0.08)',
    accent: '#A2FF4C',
    accentLight: 'rgba(162,255,76,0.1)',
    gradientFrom: '#A2FF4C',
    gradientTo: '#4CFFA2',
  },
  midnight: {
    id: 'midnight', name: 'Meia-Noite', isDark: true, hasStarfield: true,
    bg: '#0a0e1a',
    bgCard: 'rgba(255,255,255,0.05)',
    bgSidebar: 'rgba(255,255,255,0.03)',
    bgTopbar: 'rgba(255,255,255,0.05)',
    textPrimary: '#e2e8f0',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: 'rgba(255,255,255,0.08)',
    accent: '#60a5fa',
    accentLight: 'rgba(96,165,250,0.12)',
    gradientFrom: '#3b82f6',
    gradientTo: '#8b5cf6',
  },
  sunset: {
    id: 'sunset', name: 'Por do Sol', isDark: true, hasStarfield: true,
    bg: '#150a05',
    bgCard: 'rgba(255,255,255,0.04)',
    bgSidebar: 'rgba(255,255,255,0.03)',
    bgTopbar: 'rgba(255,255,255,0.04)',
    textPrimary: '#fef3c7',
    textSecondary: '#fbbf24',
    textMuted: '#d97706',
    border: 'rgba(255,255,255,0.06)',
    accent: '#f59e0b',
    accentLight: 'rgba(245,158,11,0.12)',
    gradientFrom: '#f59e0b',
    gradientTo: '#ef4444',
  },
  lavender: {
    id: 'lavender', name: 'Lavanda', isDark: true, hasStarfield: true,
    bg: '#0f0a1a',
    bgCard: 'rgba(255,255,255,0.04)',
    bgSidebar: 'rgba(255,255,255,0.03)',
    bgTopbar: 'rgba(255,255,255,0.04)',
    textPrimary: '#ede9fe',
    textSecondary: '#a78bfa',
    textMuted: '#7c3aed',
    border: 'rgba(255,255,255,0.08)',
    accent: '#a78bfa',
    accentLight: 'rgba(167,139,250,0.12)',
    gradientFrom: '#8b5cf6',
    gradientTo: '#ec4899',
  },
  monochrome: {
    id: 'monochrome', name: 'Monocromatico', isDark: true, hasStarfield: true,
    bg: '#080808',
    bgCard: 'rgba(255,255,255,0.04)',
    bgSidebar: 'rgba(255,255,255,0.03)',
    bgTopbar: 'rgba(255,255,255,0.04)',
    textPrimary: '#e4e4e7',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    border: 'rgba(255,255,255,0.08)',
    accent: '#ffffff',
    accentLight: 'rgba(255,255,255,0.08)',
    gradientFrom: '#e4e4e7',
    gradientTo: '#a1a1aa',
  },
  rain: {
    id: 'rain', name: 'Chuva', isDark: true, hasStarfield: false, hasRain: true, rainDensity: 1,
    bg: '#0c1117',
    bgCard: 'rgba(100,150,200,0.05)',
    bgSidebar: 'rgba(100,150,200,0.04)',
    bgTopbar: 'rgba(100,150,200,0.05)',
    textPrimary: '#c8d6e5',
    textSecondary: '#7f8fa6',
    textMuted: '#576574',
    border: 'rgba(100,150,200,0.1)',
    accent: '#74b9ff',
    accentLight: 'rgba(116,185,255,0.12)',
    gradientFrom: '#74b9ff',
    gradientTo: '#0984e3',
  },
  tempestade: {
    id: 'tempestade', name: 'Tempestade', isDark: true, hasStarfield: false, hasRain: true, rainDensity: 1.3,
    bg: '#050505',
    bgCard: 'rgba(255,255,255,0.025)',
    bgSidebar: 'rgba(255,255,255,0.02)',
    bgTopbar: 'rgba(255,255,255,0.025)',
    textPrimary: '#b0b0b0',
    textSecondary: '#707070',
    textMuted: '#505050',
    border: 'rgba(255,255,255,0.05)',
    accent: '#808080',
    accentLight: 'rgba(128,128,128,0.08)',
    gradientFrom: '#a0a0a0',
    gradientTo: '#505050',
  },
  chuvisco: {
    id: 'chuvisco', name: 'Chuvisco', isDark: false, hasStarfield: false, hasRain: true, rainDensity: 0.3,
    bg: '#faf5ef',
    bgCard: 'rgba(255,255,255,0.7)',
    bgSidebar: 'rgba(255,255,255,0.8)',
    bgTopbar: 'rgba(255,255,255,0.7)',
    textPrimary: '#3d2c1a',
    textSecondary: '#8b7355',
    textMuted: '#b09878',
    border: 'rgba(0,0,0,0.06)',
    accent: '#e67e22',
    accentLight: 'rgba(230,126,34,0.1)',
    gradientFrom: '#e67e22',
    gradientTo: '#e74c3c',
  },
};

interface ThemeContextType {
  theme: ThemeConfig;
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeVars(t: ThemeConfig) {
  const root = document.documentElement;
  root.style.setProperty('--arrow-bg', t.bg);
  root.style.setProperty('--arrow-bg-card', t.bgCard);
  root.style.setProperty('--arrow-bg-sidebar', t.bgSidebar);
  root.style.setProperty('--arrow-bg-topbar', t.bgTopbar);
  root.style.setProperty('--arrow-text-primary', t.textPrimary);
  root.style.setProperty('--arrow-text-secondary', t.textSecondary);
  root.style.setProperty('--arrow-text-muted', t.textMuted);
  root.style.setProperty('--arrow-border', t.border);
  root.style.setProperty('--arrow-accent', t.accent);
  root.style.setProperty('--arrow-accent-light', t.accentLight);
  root.style.setProperty('--arrow-gradient-from', t.gradientFrom);
  root.style.setProperty('--arrow-gradient-to', t.gradientTo);

  if (t.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('arrow-theme');
    return (saved && saved in THEMES) ? saved as ThemeId : 'cosmos';
  });

  const theme = THEMES[themeId];

  useEffect(() => {
    applyThemeVars(theme);
    localStorage.setItem('arrow-theme', themeId);
  }, [themeId, theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme: setThemeId, isDark: theme.isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
