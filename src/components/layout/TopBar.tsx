import { useNavigate } from 'react-router-dom';
import { useVault } from '@/contexts/VaultContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlatformChrome, SIDEBAR_TRANSITION } from '@/hooks/usePlatformChrome';
import {
  Search, Bell, Target, ListChecks, StickyNote, Sparkles,
  PanelLeft, ChevronDown, LogOut, Settings, X,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FocusTimerPill from '@/components/layout/FocusTimerPill';
import ThemeToggle from '@/components/layout/ThemeToggle';
import WindowControls from '@/components/layout/WindowControls';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const quickActions = [
  { label: 'Nova Tarefa', icon: ListChecks, path: '/tasks' },
  { label: 'Nova Meta', icon: Target, path: '/goals' },
  { label: 'Nova Nota', icon: StickyNote, path: '/notes' },
];

export default function TopBar({ visible = true }: { visible?: boolean }) {
  const navigate = useNavigate();
  const { profile, closeVault, vaultPath } = useVault();
  const { collapsed, toggle } = useSidebar();
  const { theme, isDark } = useTheme();
  const { isDesktopApp, isWindowsApp, topBarTotalHeight, topBarPaddingTop, trafficLightInset } = usePlatformChrome(collapsed);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const initials = (profile?.full_name || 'U').slice(0, 2).toUpperCase();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (searchOpen && searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen, searchOpen]);

  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  const controlHover = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  return (
    <header
      className="arrow-topbar flex items-center gap-2 px-3 flex-shrink-0 relative z-30"
      data-hidden={visible ? undefined : 'true'}
      style={{
        height: topBarTotalHeight,
        paddingTop: topBarPaddingTop,
        paddingLeft: trafficLightInset > 0 ? trafficLightInset : 12,
        paddingRight: 12,
        transition: `padding-left ${SIDEBAR_TRANSITION}`,
      }}
      data-tauri-drag-region={isDesktopApp ? true : undefined}
    >
      <button
        onClick={toggle}
        className="w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-150 flex-shrink-0"
        style={{ color: theme.textSecondary }}
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        onMouseEnter={(e) => (e.currentTarget.style.background = controlHover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <PanelLeft className="w-[17px] h-[17px]" strokeWidth={1.5} />
      </button>

      <div className="flex items-center gap-0.5 flex-shrink-0">
        {quickActions.map((action) => (
          <Tooltip key={action.label} delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate(action.path)}
                className="w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-150"
                style={{ color: theme.textSecondary }}
                aria-label={action.label}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = controlHover;
                  e.currentTarget.style.color = theme.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = theme.textSecondary;
                }}
              >
                <action.icon className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {action.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div
        className="flex-1 min-w-0"
        data-tauri-drag-region={isDesktopApp ? true : undefined}
      />

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate('/assistant')}
              className="w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-150"
              style={{ color: theme.textSecondary }}
              aria-label="Assistente IA"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = controlHover;
                e.currentTarget.style.color = theme.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = theme.textSecondary;
              }}
            >
              <Sparkles className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Assistente IA
          </TooltipContent>
        </Tooltip>
        <FocusTimerPill />
        <ThemeToggle />

        <div ref={searchRef} className="relative flex items-center">
          <AnimatePresence initial={false}>
            {searchOpen && (
              <motion.div
                initial={{ width: 32, opacity: 0 }}
                animate={{ width: 220, opacity: 1 }}
                exit={{ width: 32, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="overflow-hidden mr-1"
              >
                <div className="relative">
                  <Search
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                    style={{ color: theme.textMuted }}
                    strokeWidth={1.5}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full pl-8 pr-8 h-8 rounded-full text-[12px] outline-none"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      border: `1px solid ${theme.border}`,
                      color: theme.textPrimary,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = `${theme.accent}50`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = theme.border;
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ color: theme.textMuted }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!searchOpen && (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-150"
              style={{ color: theme.textSecondary }}
              title="Buscar"
              onMouseEnter={(e) => (e.currentTarget.style.background = controlHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Search className="w-[17px] h-[17px]" strokeWidth={1.5} />
            </button>
          )}
        </div>

        <button
          className="relative w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-150 flex-shrink-0"
          style={{ color: theme.textSecondary }}
          onMouseEnter={(e) => (e.currentTarget.style.background = controlHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Bell className="w-[17px] h-[17px]" strokeWidth={1.5} />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ background: theme.accent }}
          />
        </button>

        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-1.5 h-8 rounded-full px-2 transition-colors duration-150"
            style={{
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              border: `1px solid ${theme.border}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = theme.accentLight)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = isDark
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(0,0,0,0.03)')
            }
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || ''}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold"
                style={{
                  background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                  color: isDark ? '#000' : '#fff',
                }}
              >
                {initials}
              </div>
            )}
            <span className="text-[11px] font-medium hidden sm:inline" style={{ color: theme.textPrimary }}>
              {profile?.full_name || 'Usuario'}
            </span>
            <ChevronDown className="w-2.5 h-2.5" style={{ color: theme.textMuted }} />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-52 rounded-xl py-1.5 z-50"
                style={{
                  background: isDark ? '#1c1c1e' : '#ffffff',
                  border: `1px solid ${theme.border}`,
                  boxShadow: 'var(--arrow-rim-light), 0 8px 32px rgba(0,0,0,0.2)',
                }}
              >
                <div className="px-3 py-2.5" style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
                    {profile?.full_name}
                  </p>
                  <p
                    className="text-[11px] truncate max-w-[180px]"
                    style={{ color: theme.textMuted }}
                    title={vaultPath || ''}
                  >
                    {vaultPath?.split(/[\\/]/).pop() || 'Vault'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setProfileOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2"
                  style={{ color: theme.textSecondary }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = theme.accentLight)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Settings className="w-3.5 h-3.5" /> Configuracoes
                </button>
                <button
                  onClick={() => closeVault()}
                  className="w-full text-left px-3 py-2 text-sm text-red-500 transition-colors flex items-center gap-2"
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut className="w-3.5 h-3.5" /> Fechar vault
                </button>
              </div>
            </>
          )}
        </div>

        {isWindowsApp && <WindowControls />}
      </div>
    </header>
  );
}
