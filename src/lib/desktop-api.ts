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
    workouts: {
      programs: {
        list: () => invoke('db_workout_programs_list'),
        create: (data: unknown) => invoke('db_workout_programs_create', { data }),
        update: (data: unknown) => invoke('db_workout_programs_update', { data }),
        delete: (id: string) => invoke('db_workout_programs_delete', { id }),
      },
      templates: {
        list: (programId: string) => invoke('db_workout_templates_list', { programId }),
        create: (data: unknown) => invoke('db_workout_templates_create', { data }),
        update: (data: unknown) => invoke('db_workout_templates_update', { data }),
        delete: (id: string) => invoke('db_workout_templates_delete', { id }),
      },
      sessions: {
        list: (filters?: unknown) => invoke('db_workout_sessions_list', { filters: filters ?? null }),
        create: (data: unknown) => invoke('db_workout_sessions_create', { data }),
        update: (data: unknown) => invoke('db_workout_sessions_update', { data }),
        delete: (id: string) => invoke('db_workout_sessions_delete', { id }),
        complete: (id: string, exercisesLog: unknown, durationMinutes?: number) =>
          invoke('db_workout_sessions_complete', { id, exercisesLog, durationMinutes: durationMinutes ?? null }),
        generateWeek: (programId: string, cycleId: string, weekNumber: number, weekDates: string[]) =>
          invoke('db_workout_sessions_generate_week', { programId, cycleId, weekNumber, weekDates }),
      },
      progress: (exerciseName: string, exerciseId?: string) =>
        invoke('db_workout_exercise_progress', { exerciseName, exerciseId: exerciseId ?? null }),
    },
    mediaLists: {
      lists: {
        list: () => invoke('db_media_lists_list'),
        create: (data: unknown) => invoke('db_media_lists_create', { data }),
        update: (data: unknown) => invoke('db_media_lists_update', { data }),
        delete: (id: string) => invoke('db_media_lists_delete', { id }),
      },
      items: {
        list: (listId: string) => invoke('db_media_items_list', { listId }),
        create: (data: unknown) => invoke('db_media_items_create', { data }),
        update: (data: unknown) => invoke('db_media_items_update', { data }),
        delete: (id: string) => invoke('db_media_items_delete', { id }),
        move: (id: string, status: string, rank?: number) =>
          invoke('db_media_items_move', { id, status, rank: rank ?? null }),
      },
    },
    releaseSchedules: {
      list: (mediaType?: string) =>
        invoke('db_release_schedules_list', { mediaType: mediaType ?? null }),
      create: (data: unknown) => invoke('db_release_schedules_create', { data }),
      update: (data: unknown) => invoke('db_release_schedules_update', { data }),
      delete: (id: string, deleteLinkedTask?: boolean) =>
        invoke('db_release_schedules_delete', { id, deleteLinkedTask: deleteLinkedTask ?? null }),
      markReleased: (id: string) => invoke('db_release_schedules_mark_released', { id }),
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
  ai: {
    getSettings: () => {
      requireDesktop();
      return invoke('ai_get_settings');
    },
    saveApiKey: (apiKey: string) => {
      requireDesktop();
      return invoke('ai_save_api_key', { apiKey });
    },
    removeApiKey: () => {
      requireDesktop();
      return invoke('ai_remove_api_key');
    },
    saveModel: (model: string) => {
      requireDesktop();
      return invoke('ai_save_model', { model });
    },
    testApiKey: (apiKey?: string, model?: string) => {
      requireDesktop();
      return invoke('ai_test_api_key', { apiKey: apiKey ?? null, model: model ?? null });
    },
    getWeeklyUsage: () => {
      requireDesktop();
      return invoke('ai_get_weekly_usage');
    },
    getContextStats: (conversationId?: string | null) => {
      requireDesktop();
      return invoke('ai_get_context_stats', { conversationId: conversationId ?? null });
    },
    listConversations: () => {
      requireDesktop();
      return invoke('ai_list_conversations');
    },
    createConversation: (title?: string) => {
      requireDesktop();
      return invoke('ai_create_conversation', { title: title ?? null });
    },
    deleteConversation: (id: string) => {
      requireDesktop();
      return invoke('ai_delete_conversation', { id });
    },
    renameConversation: (id: string, title: string) => {
      requireDesktop();
      return invoke('ai_rename_conversation', { id, title });
    },
    listMessages: (conversationId: string) => {
      requireDesktop();
      return invoke('ai_list_messages', { conversationId });
    },
    sendMessage: (conversationId: string, message: string) => {
      requireDesktop();
      return invoke('ai_send_message', { conversationId, message });
    },
    confirmTool: (pendingId: string, confirmed: boolean) => {
      requireDesktop();
      return invoke('ai_confirm_tool', { pendingId, confirmed });
    },
  },
};
