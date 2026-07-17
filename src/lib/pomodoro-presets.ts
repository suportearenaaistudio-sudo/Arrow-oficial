import type { PomodoroPreset } from '@/types/pomodoro';
import { BUILTIN_PRESETS } from '@/types/pomodoro';

const STORAGE_KEY = 'arrow-pomodoro-presets';

export function loadCustomPresets(): PomodoroPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PomodoroPreset[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomPresets(presets: PomodoroPreset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets.filter((p) => !p.builtIn)));
}

export function getAllPresets(): PomodoroPreset[] {
  return [...BUILTIN_PRESETS, ...loadCustomPresets()];
}

export function savePreset(preset: Omit<PomodoroPreset, 'id' | 'builtIn'>): PomodoroPreset {
  const next: PomodoroPreset = { ...preset, id: crypto.randomUUID() };
  saveCustomPresets([...loadCustomPresets(), next]);
  return next;
}

export function deletePreset(id: string) {
  saveCustomPresets(loadCustomPresets().filter((p) => p.id !== id));
}
