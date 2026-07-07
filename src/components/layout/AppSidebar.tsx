import { useLocation, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlatformChrome, SIDEBAR_TRANSITION, SIDEBAR_HEADER_EXTRA } from '@/hooks/usePlatformChrome';
import {
  LayoutDashboard, Calendar, Target, ListChecks,
  Repeat, Wallet, StickyNote, BarChart3,
  Settings, Compass, Flame, Eye, Timer,
} from 'lucide-react';

export const SIDEBAR_WIDTH = 240;

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Visao Geral',
    items: [{ path: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Planejamento',
    items: [
      { path: '/vision', label: 'Visao', icon: Eye },
      { path: '/planning', label: 'Planejamento', icon: Calendar },
      { path: '/cycles', label: 'Ciclos', icon: Flame },
    ],
  },
  {
    title: 'Execucao',
    items: [
      { path: '/pomodoro', label: 'Pomodoro', icon: Timer },
      { path: '/goals', label: 'Metas', icon: Target },
      { path: '/tasks', label: 'Tarefas', icon: ListChecks },
      { path: '/habits', label: 'Habitos', icon: Repeat },
    ],
  },
  {
    title: 'Dados',
    items: [
      { path: '/finances', label: 'Financas', icon: Wallet },
      { path: '/notes', label: 'Notas', icon: StickyNote },
      { path: '/analysis', label: 'Analise', icon: BarChart3 },
    ],
  },
];

export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const { theme, isDark, glassScope } = useTheme();
  const { isDesktopApp, titleBarHeight } = usePlatformChrome(collapsed);

  const glassNav = isDark && glassScope !== 'none';
  const textColor = theme.textPrimary;
  const inactiveColor = isDark ? (glassNav ? theme.textSecondary : theme.textMuted) : '#48484a';
  const sectionColor = isDark ? (glassNav ? theme.textSecondary : theme.textMuted) : '#6e6e73';
  const activeBg = isDark
    ? glassNav
      ? 'rgba(255,255,255,0.16)'
      : 'rgba(255,255,255,0.08)'
    : 'rgba(0,0,0,0.06)';
  const isSettingsActive = location.pathname === '/settings';

  const navButton = (item: NavItem, isActive: boolean) => {
    const Icon = item.icon;
    return (
      <button
        key={item.path}
        onClick={() => navigate(item.path)}
        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors duration-150 text-left"
        style={{
          color: isActive ? textColor : inactiveColor,
          background: isActive ? activeBg : 'transparent',
          fontWeight: isActive ? 600 : 500,
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = activeBg;
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent';
        }}
      >
        <Icon
          className="w-4 h-4 flex-shrink-0"
          strokeWidth={isActive ? 2.25 : 2}
          style={{ color: isActive ? theme.accent : inactiveColor }}
        />
        <span className="text-[13px] whitespace-nowrap">{item.label}</span>
      </button>
    );
  };

  return (
    <aside
      className={`arrow-sidebar fixed top-0 bottom-0 z-30 overflow-hidden${glassNav ? ' arrow-sidebar--glass-nav' : ''}`}
      style={{
        width: SIDEBAR_WIDTH,
        height: '100vh',
        left: collapsed ? -SIDEBAR_WIDTH : 0,
        transition: `left ${SIDEBAR_TRANSITION}`,
        pointerEvents: collapsed ? 'none' : 'auto',
      }}
      aria-hidden={collapsed}
    >
      <div className="flex flex-col h-full">
        {/* Traffic-light band — drag region, no branding */}
        <div
          className="flex-shrink-0 w-full"
          style={{ height: isDesktopApp ? titleBarHeight + SIDEBAR_HEADER_EXTRA : 8 }}
          data-tauri-drag-region
        />

        <nav className="flex-1 px-2 pt-1 overflow-y-auto space-y-4">
          {navSections.map((section) => (
            <div key={section.title}>
              <p
                className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: sectionColor }}
              >
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) =>
                  navButton(item, location.pathname === item.path),
                )}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer brand + settings */}
        <div
          className="mt-auto flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
          style={{ borderTop: `1px solid ${theme.border}` }}
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
            }}
          >
            <Compass className="w-3 h-3" style={{ color: isDark ? '#000' : '#fff' }} />
          </div>
          <span className="text-[13px] font-semibold flex-1" style={{ color: textColor }}>
            Arrow
          </span>
          <button
            onClick={() => navigate('/settings')}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-150 flex-shrink-0"
            style={{
              color: isSettingsActive ? theme.accent : inactiveColor,
              background: isSettingsActive ? activeBg : 'transparent',
            }}
            title="Configuracoes"
            onMouseEnter={(e) => {
              if (!isSettingsActive) e.currentTarget.style.background = activeBg;
            }}
            onMouseLeave={(e) => {
              if (!isSettingsActive) e.currentTarget.style.background = 'transparent';
            }}
          >
            <Settings className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}
