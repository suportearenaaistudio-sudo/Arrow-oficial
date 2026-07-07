import { isDesktop as checkDesktop } from '@/lib/desktop-api';

export function isDesktop(): boolean {
  return checkDesktop();
}

export function markDesktopRoot(): void {
  if (typeof document !== 'undefined' && isDesktop()) {
    document.documentElement.classList.add('desktop', 'is-desktop');
  }
}

export type VisualQuality = 'alta' | 'balanceada' | 'economia';

const QUALITY_KEY = 'arrow-visual-quality';

export function getVisualQuality(): VisualQuality {
  const saved = localStorage.getItem(QUALITY_KEY);
  if (saved === 'alta' || saved === 'balanceada' || saved === 'economia') return saved;
  return 'alta';
}

export function setVisualQuality(quality: VisualQuality): void {
  localStorage.setItem(QUALITY_KEY, quality);
  window.dispatchEvent(new CustomEvent('arrow:visual-quality', { detail: quality }));
}

export function shouldRenderHeavyEffects(quality: VisualQuality = getVisualQuality()): boolean {
  return quality !== 'economia';
}

const SCROLL_SELECTORS = ['main', '[data-sidebar="inset"]', '.overflow-auto', '.overflow-y-auto'];

export function getAppScrollY(scrollElRef: { current: HTMLElement | null }): number {
  if (scrollElRef.current && scrollElRef.current.scrollTop > 0) {
    return scrollElRef.current.scrollTop;
  }
  for (const sel of SCROLL_SELECTORS) {
    const els = document.querySelectorAll(sel);
    for (const el of els) {
      const st = (el as HTMLElement).scrollTop;
      if (st > 0) {
        scrollElRef.current = el as HTMLElement;
        return st;
      }
    }
  }
  return window.scrollY || 0;
}

export function bindScrollWake(loop: { wake: () => void }, scrollElRef: { current: HTMLElement | null }): () => void {
  const onScroll = () => {
    for (const sel of SCROLL_SELECTORS) {
      const els = document.querySelectorAll(sel);
      for (const el of els) {
        const st = (el as HTMLElement).scrollTop;
        if (st > 0) {
          scrollElRef.current = el as HTMLElement;
          break;
        }
      }
    }
    loop.wake();
  };

  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  return () => document.removeEventListener('scroll', onScroll, { capture: true });
}
