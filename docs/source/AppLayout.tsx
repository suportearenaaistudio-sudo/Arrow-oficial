import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { StarfieldBackground } from '@/components/ui/StarfieldBackground';
import { RainBackground } from '@/components/ui/RainBackground';
import TopBar from './TopBar';
import AppSidebar from './AppSidebar';

function LayoutInner() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const { collapsed } = useSidebar();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.bg }}>
        <div className="flex flex-col items-center gap-3">
          <div className="arrow-spinner" />
          <p className="text-sm font-light" style={{ color: theme.textMuted }}>Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen" style={{ background: theme.bg }}>
      {theme.hasStarfield && <StarfieldBackground isDark={theme.isDark} />}
      {theme.hasRain && <RainBackground />}

      <AppSidebar />

      <div
        className="flex flex-col min-h-screen relative z-10 transition-all duration-250"
        style={{ marginLeft: collapsed ? 0 : 220 }}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AppLayout() {
  return (
    <SidebarProvider>
      <LayoutInner />
    </SidebarProvider>
  );
}
