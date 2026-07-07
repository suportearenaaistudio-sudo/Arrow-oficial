import { Outlet, Navigate } from 'react-router-dom';
import { useVault } from '@/contexts/VaultContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useVisualQuality } from '@/contexts/VisualQualityContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { StarfieldBackground } from '@/components/ui/StarfieldBackground';
import { RainBackground } from '@/components/ui/RainBackground';
import TopBar from './TopBar';
import AppSidebar, { SIDEBAR_WIDTH } from './AppSidebar';
import { useRef } from 'react';
import { useHideOnScroll } from '@/hooks/useHideOnScroll';
import { SIDEBAR_TRANSITION } from '@/hooks/usePlatformChrome';
import { isDesktop } from '@/lib/platform';

function LayoutInner() {
  const { isReady, loading } = useVault();
  const { theme, backgroundEffect, glassScope } = useTheme();
  const { collapsed } = useSidebar();
  const { showHeavyEffects } = useVisualQuality();
  const mainRef = useRef<HTMLElement>(null);
  const topBarVisible = useHideOnScroll(mainRef);

  const desktop = isDesktop();
  const glassEnabled = glassScope !== 'none';
  const sidebarOnlyGlass = glassScope === 'sidebar';
  const fullGlass = glassScope === 'full';
  const shellTransparent = glassEnabled && (desktop || fullGlass);
  const showMainFill = sidebarOnlyGlass;
  const showMainGlass = fullGlass;

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
    <div
      className="app-shell relative"
      style={{ background: shellTransparent ? 'transparent' : theme.bg }}
    >
      {showHeavyEffects && backgroundEffect === 'starfield' && (
        <StarfieldBackground isDark={theme.isDark} />
      )}
      {showHeavyEffects && backgroundEffect === 'rain' && <RainBackground />}

      {showMainFill && (
        <div
          aria-hidden
          className="fixed top-0 right-0 bottom-0 z-[2] pointer-events-none"
          style={{
            left: desktop ? (collapsed ? 0 : SIDEBAR_WIDTH) : 0,
            background: theme.bg,
            transition: desktop ? `left ${SIDEBAR_TRANSITION}` : undefined,
          }}
        />
      )}

      {showMainGlass && (
        <div
          aria-hidden
          className="app-main-glass fixed top-0 right-0 bottom-0 z-[1] pointer-events-none"
          style={{
            left: desktop ? (collapsed ? 0 : SIDEBAR_WIDTH) : 0,
            transition: desktop ? `left ${SIDEBAR_TRANSITION}` : undefined,
          }}
        />
      )}

      <AppSidebar />

      <div
        className="app-main-column relative z-10"
        style={{
          marginLeft: collapsed ? 0 : SIDEBAR_WIDTH,
          transition: `margin-left ${SIDEBAR_TRANSITION}`,
          background: 'transparent',
        }}
      >
        <main ref={mainRef} className="flex-1 overflow-y-auto min-h-0">
          <TopBar visible={topBarVisible} />
          <div className="p-6 lg:p-8">
            <Outlet />
          </div>
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
