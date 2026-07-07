import { useMemo } from 'react';
import { isDesktop } from '@/lib/platform';

/** macOS traffic-light vertical band */
export const TITLE_BAR_HEIGHT = 28;
/** Single-row toolbar — controls align with traffic lights (Cursor-style) */
export const TOPBAR_HEIGHT = 36;
/** Extra top inset so controls sit below traffic lights */
export const TOPBAR_DESKTOP_PADDING_TOP = 6;
/** Extra space below macOS traffic lights before sidebar nav */
export const SIDEBAR_HEADER_EXTRA = 14;
/** Shared easing for sidebar ↔ main column sync */
export const SIDEBAR_TRANSITION = '0.25s ease-out';
export const TOPBAR_TOTAL_HEIGHT_DESKTOP = TOPBAR_HEIGHT;
export const TOPBAR_TOTAL_HEIGHT_WEB = TOPBAR_HEIGHT;

export interface PlatformChrome {
  isDesktopApp: boolean;
  titleBarHeight: number;
  topBarHeight: number;
  topBarTotalHeight: number;
  /** Extra left padding when sidebar is collapsed (traffic lights over content) */
  trafficLightInset: number;
}

export function usePlatformChrome(sidebarCollapsed: boolean): PlatformChrome {
  return useMemo(() => {
    const isDesktopApp = isDesktop();
    const titleBarHeight = isDesktopApp ? TITLE_BAR_HEIGHT : 0;
    const topBarHeight = TOPBAR_HEIGHT;
    const topBarTotalHeight = isDesktopApp
      ? TOPBAR_TOTAL_HEIGHT_DESKTOP
      : TOPBAR_TOTAL_HEIGHT_WEB;
    const trafficLightInset = isDesktopApp && sidebarCollapsed ? 76 : 0;
    return {
      isDesktopApp,
      titleBarHeight,
      topBarHeight,
      topBarTotalHeight,
      trafficLightInset,
    };
  }, [sidebarCollapsed]);
}
