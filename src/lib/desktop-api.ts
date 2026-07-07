import { invoke } from '@tauri-apps/api/core';
import type { Profile } from '@/types/arrow';
import type { VaultStatus } from '../../shared/vault-types';

export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

function requireDesktop(): void {
  if (!isDesktop()) {
    throw new Error('Arrow API indisponível. Execute o app via Tauri (npm run dev:desktop).');
  }
}

export const desktopAPI = {
  vault: {
    getStatus: (): Promise<VaultStatus & { profile: Profile | null }> => {
      requireDesktop();
      return invoke('vault_get_status');
    },
    pickFolder: (options?: { create?: boolean }): Promise<string | null> => {
      requireDesktop();
      return invoke('vault_pick_folder', { options: options ?? null });
    },
    create: (path: string, profileName: string) => {
      requireDesktop();
      return invoke<{ profile: Profile; vaultPath: string }>('vault_create', { path, profileName });
    },
    open: (path: string) => {
      requireDesktop();
      return invoke<{ profile: Profile; vaultPath: string }>('vault_open', { path });
    },
    openLast: () => {
      requireDesktop();
      return invoke<{ profile: Profile; vaultPath: string } | null>('vault_open_last');
    },
    close: () => {
      requireDesktop();
      return invoke('vault_close');
    },
    updateProfile: (updates: { full_name?: string }) => {
      requireDesktop();
      return invoke<Profile>('vault_update_profile', { fullName: updates.full_name ?? null });
    },
    saveAvatar: (data: ArrayBuffer) => {
      requireDesktop();
      return invoke<Profile>('vault_save_avatar', { data: Array.from(new Uint8Array(data)) });
    },
    getConfig: () => {
      requireDesktop();
      return invoke<Record<string, unknown>>('vault_get_config');
    },
    saveConfig: (config: Record<string, unknown>) => {
      requireDesktop();
      return invoke<Record<string, unknown>>('vault_save_config', { config });
    },
  },
  db: {
    cycles: {
      list: () => invoke('db_cycles_list'),
      create: (data: unknown) => invoke('db_cycles_create', { data }),
      update: (data: unknown) => invoke('db_cycles_update', { data }),
      delete: (id: string) => invoke('db_cycles_delete', { id }),
      activate: (id: string) => invoke('db_cycles_activate', { id }),
    },
    goals: {
      list: (filters?: unknown) => invoke('db_goals_list', { filters: filters ?? null }),
      create: (data: unknown) => invoke('db_goals_create', { data }),
      update: (data: unknown) => invoke('db_goals_update', { data }),
      delete: (id: string) => invoke('db_goals_delete', { id }),
    },
    tasks: {
      list: () => invoke('db_tasks_list'),
      create: (data: unknown) => invoke('db_tasks_create', { data }),
      update: (data: unknown) => invoke('db_tasks_update', { data }),
      delete: (id: string) => invoke('db_tasks_delete', { id }),
    },
    habits: {
      list: () => invoke('db_habits_list'),
      create: (data: unknown) => invoke('db_habits_create', { data }),
      update: (data: unknown) => invoke('db_habits_update', { data }),
      delete: (id: string) => invoke('db_habits_delete', { id }),
    },
    transactions: {
      list: (filters?: unknown) => invoke('db_transactions_list', { filters: filters ?? null }),
      create: (data: unknown) => invoke('db_transactions_create', { data }),
      delete: (id: string) => invoke('db_transactions_delete', { id }),
    },
    checkins: {
      list: () => invoke('db_checkins_list'),
      getByDate: (date: string) => invoke('db_checkins_get_by_date', { date }),
      upsert: (data: unknown) => invoke('db_checkins_upsert', { data }),
    },
    vision: {
      get: () => invoke('db_vision_get'),
      save: (data: unknown) => invoke('db_vision_save', { data }),
    },
    weeklyScores: {
      list: (cycleId?: string) => invoke('db_weekly_scores_list', { cycleId: cycleId ?? null }),
      finalize: (data: unknown) => invoke('db_weekly_scores_finalize', { payload: data }),
    },
  },
  notes: {
    list: () => invoke('notes_list'),
    create: (data: unknown) => invoke('notes_create', { data }),
    update: (data: unknown) => invoke('notes_update', { data }),
    delete: (id: string) => invoke('notes_delete', { id }),
  },
  chrome: {
    syncVibrancy: (isDark: boolean) => {
      requireDesktop();
      return invoke('sync_window_vibrancy', { isDark });
    },
    clearVibrancy: () => {
      requireDesktop();
      return invoke('clear_window_vibrancy');
    },
  },
};
