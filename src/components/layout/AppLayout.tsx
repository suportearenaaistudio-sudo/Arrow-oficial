import { Outlet, Navigate } from 'react-router-dom';
import { useVault } from '@/contexts/VaultContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useVisualQuality } from '@/contexts/VisualQualityContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { StarfieldBackground } from '@/components/ui/StarfieldBackground';
import { RainBackground } from '@/components/ui/RainBackground';
import TopBar from './TopBar';
import AppSidebar from './AppSidebar';

function LayoutInner() {
  const { isReady, loading } = useVault();
  const { theme } = useTheme();
  const { collapsed } = useSidebar();
  const { showHeavyEffects } = useVisualQuality();

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

  if (!isReady) {
    return <Navigate to="/setup" replace />;
  }

  return (
    <div className="min-h-screen" style={{ background: theme.bg }}>
      {showHeavyEffects && theme.hasStarfield && <StarfieldBackground isDark={theme.isDark} />}
      {showHeavyEffects && theme.hasRain && <RainBackground />}

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
