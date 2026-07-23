import { useEffect, useRef } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { checkForAppUpdates } from '@/lib/app-updater';
import { isDesktop } from '@/lib/platform';

/** Checa updates silenciosamente após o vault carregar (somente release desktop). */
export default function AppUpdateChecker() {
  const { isReady, loading } = useVault();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!isDesktop() || import.meta.env.DEV) return;
    if (loading || !isReady || checkedRef.current) return;

    checkedRef.current = true;
    const timer = window.setTimeout(() => {
      void checkForAppUpdates({ silent: true });
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [isReady, loading]);

  return null;
}
