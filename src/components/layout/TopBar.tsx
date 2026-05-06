import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Search, Bell, Plus, Target, ListChecks, StickyNote,
  PanelLeft, ChevronDown, LogOut, Settings,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const quickActions = [
  { label: 'Nova Tarefa', icon: ListChecks, path: '/tasks' },
  { label: 'Nova Meta', icon: Target, path: '/goals' },
  { label: 'Nova Nota', icon: StickyNote, path: '/notes' },
];

export default function TopBar() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { collapsed, toggle } = useSidebar();
  const { theme, isDark } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = (profile?.full_name || 'U').slice(0, 2).toUpperCase();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen]);

  return (
    <header
      className="h-16 flex items-center gap-4 px-5 flex-shrink-0 relative z-20"
      style={{
        background: `linear-gradient(to bottom, ${theme.bgTopbar}, transparent)`,
      }}
    >
      {/* Sidebar toggle */}
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
          hover:bg-white/10 dark:hover:bg-white/5"
        style={{ color: theme.textSecondary }}
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        <PanelLeft className="w-[18px] h-[18px]" />
      </button>

      {/* Quick actions */}
      <div className="flex items-center gap-1.5">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200"
            style={{
              color: theme.textSecondary,
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${theme.border}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.accentLight;
              e.currentTarget.style.color = theme.accent;
              e.currentTarget.style.borderColor = theme.accent + '40';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
              e.currentTarget.style.color = theme.textSecondary;
              e.currentTarget.style.borderColor = theme.border;
            }}
          >
            <action.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="w-full max-w-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.textMuted }} />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl text-sm outline-none transition-all duration-200"
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${theme.border}`,
              color: theme.textPrimary,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.accent + '60';
              e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.accentLight}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Notifications */}
      <button
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
          hover:bg-white/10 dark:hover:bg-white/5"
        style={{ color: theme.textSecondary }}
      >
        <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ background: theme.accent }}
        />
      </button>

      {/* Profile */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="flex items-center gap-2.5 rounded-2xl px-2 py-1.5 transition-all duration-200"
          style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${theme.border}`,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = theme.accentLight)}
          onMouseLeave={(e) => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || ''}
              className="w-7 h-7 rounded-lg object-cover"
            />
          ) : (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold"
              style={{
                background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                color: isDark ? '#0B0B0B' : 'white',
              }}
            >
              {initials}
            </div>
          )}
          <span className="text-xs font-medium hidden sm:inline" style={{ color: theme.textPrimary }}>
            {profile?.full_name || 'Usuario'}
          </span>
          <ChevronDown className="w-3 h-3" style={{ color: theme.textMuted }} />
        </button>

        {profileOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-2xl py-1.5 z-50 shadow-2xl"
              style={{
                background: isDark ? '#1a1a1a' : 'white',
                border: `1px solid ${theme.border}`,
              }}
            >
              <div className="px-3 py-2.5" style={{ borderBottom: `1px solid ${theme.border}` }}>
                <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{profile?.full_name}</p>
                <p className="text-[11px]" style={{ color: theme.textMuted }}>{profile?.email}</p>
              </div>
              <button
                onClick={() => { navigate('/settings'); setProfileOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2"
                style={{ color: theme.textSecondary }}
                onMouseEnter={(e) => (e.currentTarget.style.background = theme.accentLight)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Settings className="w-3.5 h-3.5" /> Configuracoes
              </button>
              <button
                onClick={() => signOut()}
                className="w-full text-left px-3 py-2 text-sm text-red-500 transition-colors flex items-center gap-2"
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut className="w-3.5 h-3.5" /> Sair
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
