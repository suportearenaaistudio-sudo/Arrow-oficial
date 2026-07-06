import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import {
  getVisualQuality,
  setVisualQuality as persistQuality,
  shouldRenderHeavyEffects,
  type VisualQuality,
  isDesktop,
} from '@/lib/platform';
import { desktopAPI } from '@/lib/desktop-api';

interface VisualQualityContextType {
  quality: VisualQuality;
  setQuality: (q: VisualQuality) => void;
  showHeavyEffects: boolean;
}

const VisualQualityContext = createContext<VisualQualityContextType | undefined>(undefined);

export function VisualQualityProvider({ children }: { children: ReactNode }) {
  const [quality, setQualityState] = useState<VisualQuality>(getVisualQuality);

  const setQuality = useCallback(async (q: VisualQuality) => {
    setQualityState(q);
    persistQuality(q);
    if (isDesktop()) {
      try {
        const config = await desktopAPI.vault.getConfig();
        await desktopAPI.vault.saveConfig({ ...config, visualQuality: q });
      } catch {
        // vault may not be open yet
      }
    }
  }, []);

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<VisualQuality>).detail;
      if (detail) setQualityState(detail);
    };
    window.addEventListener('arrow:visual-quality', onChange);
    return () => window.removeEventListener('arrow:visual-quality', onChange);
  }, []);

  useEffect(() => {
    if (!isDesktop()) return;
    desktopAPI.vault.getConfig().then((config) => {
      const saved = config?.visualQuality as VisualQuality | undefined;
      if (saved === 'alta' || saved === 'balanceada' || saved === 'economia') {
        setQualityState(saved);
        persistQuality(saved);
      }
    }).catch(() => {});
  }, []);

  return (
    <VisualQualityContext.Provider
      value={{
        quality,
        setQuality,
        showHeavyEffects: shouldRenderHeavyEffects(quality),
      }}
    >
      {children}
    </VisualQualityContext.Provider>
  );
}

export function useVisualQuality() {
  const ctx = useContext(VisualQualityContext);
  if (!ctx) throw new Error('useVisualQuality must be used within VisualQualityProvider');
  return ctx;
}
