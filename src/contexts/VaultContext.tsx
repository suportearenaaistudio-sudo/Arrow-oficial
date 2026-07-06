import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { desktopAPI, isDesktop } from '@/lib/desktop-api';
import type { Profile } from '@/types/arrow';

interface VaultContextType {
  profile: Profile | null;
  vaultPath: string | null;
  loading: boolean;
  isReady: boolean;
  isDesktopApp: boolean;
  createVault: (path: string, profileName: string) => Promise<{ error: string | null }>;
  openVault: (path: string) => Promise<{ error: string | null }>;
  pickAndCreateVault: (profileName: string) => Promise<{ error: string | null }>;
  pickAndOpenVault: () => Promise<{ error: string | null }>;
  closeVault: () => Promise<void>;
  updateProfile: (updates: { full_name?: string; avatar_url?: string }) => Promise<{ error: string | null }>;
  saveAvatar: (blob: Blob) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vaultPath, setVaultPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshStatus = useCallback(async () => {
    if (!isDesktop()) {
      setLoading(false);
      return;
    }
    try {
      const status = await desktopAPI.vault.getStatus();
      setProfile(status.profile);
      setVaultPath(status.vaultPath);
    } catch (err) {
      console.error('Vault status error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      if (!isDesktop()) {
        setLoading(false);
        return;
      }
      const opened = await desktopAPI.vault.openLast();
      if (opened) {
        setProfile(opened.profile);
        setVaultPath(opened.vaultPath);
      }
      setLoading(false);
    }
    init();
  }, []);

  async function createVault(path: string, profileName: string) {
    try {
      const result = await desktopAPI.vault.create(path, profileName);
      setProfile(result.profile);
      setVaultPath(result.vaultPath);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erro ao criar vault' };
    }
  }

  async function openVault(path: string) {
    try {
      const result = await desktopAPI.vault.open(path);
      setProfile(result.profile);
      setVaultPath(result.vaultPath);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erro ao abrir vault' };
    }
  }

  async function pickAndCreateVault(profileName: string) {
    const path = await desktopAPI.vault.pickFolder({ create: true });
    if (!path) return { error: null };
    return createVault(path, profileName);
  }

  async function pickAndOpenVault() {
    const path = await desktopAPI.vault.pickFolder();
    if (!path) return { error: null };
    return openVault(path);
  }

  async function closeVault() {
    await desktopAPI.vault.close();
    setProfile(null);
    setVaultPath(null);
  }

  async function updateProfile(updates: { full_name?: string; avatar_url?: string }) {
    try {
      const next = await desktopAPI.vault.updateProfile({ full_name: updates.full_name });
      setProfile(next);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erro ao atualizar perfil' };
    }
  }

  async function saveAvatar(blob: Blob) {
    try {
      const buffer = await blob.arrayBuffer();
      const next = await desktopAPI.vault.saveAvatar(buffer);
      setProfile(next);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erro ao salvar avatar' };
    }
  }

  return (
    <VaultContext.Provider value={{
      profile,
      vaultPath,
      loading,
      isReady: !!profile && !!vaultPath,
      isDesktopApp: isDesktop(),
      createVault,
      openVault,
      pickAndCreateVault,
      pickAndOpenVault,
      closeVault,
      updateProfile,
      saveAvatar,
      refreshProfile: refreshStatus,
    }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within VaultProvider');
  return ctx;
}
