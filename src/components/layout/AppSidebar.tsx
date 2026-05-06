import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LayoutDashboard, Calendar, Target, ListChecks,
  Repeat, Wallet, StickyNote, BarChart3,
  Settings, Compass, Flame,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/planning', label: 'Planejamento', icon: Calendar },
  { path: '/cycles', label: 'Ciclos', icon: Flame },
  { path: '/goals', label: 'Metas', icon: Target },
  { path: '/tasks', label: 'Tarefas', icon: ListChecks },
  { path: '/habits', label: 'Habitos', icon: Repeat },
  { path: '/finances', label: 'Financas', icon: Wallet },
  { path: '/notes', label: 'Notas', icon: StickyNote },
  { path: '/analysis', label: 'Analise', icon: BarChart3 },
];

export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const { theme, isDark } = useTheme();

  const textColor = isDark ? '#e4e4e7' : '#1a1a2e';
  const textMuted = isDark ? '#71717a' : '#9ca3af';

  return (
    <AnimatePresence>
      {!collapsed && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 220, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="fixed left-0 top-0 z-30 h-screen flex-shrink-0"
        >
          <div
            className="flex flex-col h-[calc(100vh-16px)] my-2 ml-2 rounded-2xl overflow-hidden w-[204px]"
            style={{
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.border}`,
            }}
          >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 h-14 flex-shrink-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                }}
              >
                <Compass className="w-4.5 h-4.5" style={{ color: isDark ? '#0B0B0B' : 'white' }} />
              </div>
              <span
                key={theme.id}
                className="text-base font-bold"
                style={{
                  background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Arrow
              </span>
            </div>

            <div className="mx-3 h-px" style={{ background: theme.border }} />

            {/* Navigation */}
            <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 relative text-left overflow-hidden"
                    style={{
                      color: isActive ? textColor : textMuted,
                      background: isActive
                        ? `linear-gradient(90deg, ${theme.accentLight}, transparent)`
                        : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
                        e.currentTarget.style.color = textColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = textMuted;
                      }
                    }}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-[20%] w-[3px] rounded-r-full"
                        style={{
                          height: '60%',
                          background: `linear-gradient(to bottom, ${theme.gradientFrom}, ${theme.gradientTo})`,
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon
                      className="w-[17px] h-[17px] flex-shrink-0"
                      strokeWidth={isActive ? 2.2 : 1.8}
                      style={{ color: isActive ? theme.accent : undefined }}
                    />
                    <span
                      className="text-[13px] whitespace-nowrap"
                      style={{ fontWeight: isActive ? 600 : 400 }}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mx-3 h-px" style={{ background: theme.border }} />

            {/* Settings */}
            <div className="px-2 py-2 flex-shrink-0">
              <button
                onClick={() => navigate('/settings')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 text-left relative overflow-hidden"
                style={{
                  color: location.pathname === '/settings' ? textColor : textMuted,
                  background: location.pathname === '/settings'
                    ? `linear-gradient(90deg, ${theme.accentLight}, transparent)`
                    : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== '/settings') {
                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
                    e.currentTarget.style.color = textColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== '/settings') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = textMuted;
                  }
                }}
              >
                {location.pathname === '/settings' && (
                  <motion.div
                    className="absolute left-0 top-[20%] w-[3px] rounded-r-full"
                    style={{
                      height: '60%',
                      background: `linear-gradient(to bottom, ${theme.gradientFrom}, ${theme.gradientTo})`,
                    }}
                  />
                )}
                <Settings
                  className="w-[17px] h-[17px] flex-shrink-0"
                  strokeWidth={1.8}
                  style={{ color: location.pathname === '/settings' ? theme.accent : undefined }}
                />
                <span className="text-[13px]" style={{ fontWeight: location.pathname === '/settings' ? 600 : 400 }}>
                  Configuracoes
                </span>
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
