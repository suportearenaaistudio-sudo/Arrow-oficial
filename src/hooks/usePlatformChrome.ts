import { useMemo } from 'react';
import { isDesktop, isMacOSDesktop, isWindowsDesktop } from '@/lib/platform';

/** macOS traffic-light vertical band */
export const TITLE_BAR_HEIGHT = 28;
/** Single-row toolbar — controls align with traffic lights (Cursor-style) */
export const TOPBAR_HEIGHT = 36;
/** Extra top inset so controls sit below traffic lights (macOS) */
export const TOPBAR_DESKTOP_PADDING_TOP = 6;
/** Small top inset on Windows frameless window */
export const TOPBAR_WINDOWS_PADDING_TOP = 6;
/** Extra space below macOS traffic lights before sidebar nav */
export const SIDEBAR_HEADER_EXTRA = 14;
/** Shared easing for sidebar ↔ main column sync */
export const SIDEBAR_TRANSITION = '0.25s ease-out';
export const TOPBAR_TOTAL_HEIGHT_DESKTOP = TOPBAR_HEIGHT;
export const TOPBAR_TOTAL_HEIGHT_WEB = TOPBAR_HEIGHT;

export interface PlatformChrome {
  isDesktopApp: boolean;
  isWindowsApp: boolean;
  titleBarHeight: number;
  topBarHeight: number;
  topBarTotalHeight: number;
  topBarPaddingTop: number;
  /** Extra left padding when sidebar is collapsed (traffic lights over content) */
  trafficLightInset: number;
}

export function usePlatformChrome(sidebarCollapsed: boolean): PlatformChrome {
  return useMemo(() => {
    const isDesktopApp = isDesktop();
    const isMacApp = isMacOSDesktop();
    const isWindowsApp = isWindowsDesktop();
    const titleBarHeight = isMacApp ? TITLE_BAR_HEIGHT : 0;
    const topBarHeight = TOPBAR_HEIGHT;
    const topBarPaddingTop = isMacApp
      ? TOPBAR_DESKTOP_PADDING_TOP
      : isWindowsApp
        ? TOPBAR_WINDOWS_PADDING_TOP
        : 0;
    const topBarTotalHeight = isWindowsApp
      ? TOPBAR_TOTAL_HEIGHT_DESKTOP + topBarPaddingTop
      : isDesktopApp
        ? TOPBAR_TOTAL_HEIGHT_DESKTOP
        : TOPBAR_TOTAL_HEIGHT_WEB;
    const trafficLightInset = isMacApp && sidebarCollapsed ? 76 : 0;
    return {
      isDesktopApp,
      isWindowsApp,
      titleBarHeight,
      topBarHeight,
      topBarTotalHeight,
      topBarPaddingTop,
      trafficLightInset,
    };
  }, [sidebarCollapsed]);
}
