import type { PomodoroSessionLog, SessionMode } from '@/types/pomodoro';
import { todayKey } from '@/lib/time-blocks';

const STORAGE_KEY = 'arrow-pomodoro-sessions';
const MAX_DAYS = 90;

export function loadAllSessions(): PomodoroSessionLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PomodoroSessionLog[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function pruneSessions(sessions: PomodoroSessionLog[]): PomodoroSessionLog[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MAX_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return sessions.filter((s) => s.date >= cutoffStr);
}

function saveAllSessions(sessions: PomodoroSessionLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pruneSessions(sessions)));
}

export function logSession(entry: Omit<PomodoroSessionLog, 'id'>): PomodoroSessionLog {
  const session: PomodoroSessionLog = { ...entry, id: crypto.randomUUID() };
  const all = loadAllSessions();
  saveAllSessions([session, ...all]);
  window.dispatchEvent(new CustomEvent('arrow-pomodoro-sessions-updated'));
  return session;
}

export function getSessionsForDate(date: string): PomodoroSessionLog[] {
  return loadAllSessions()
    .filter((s) => s.date === date)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function getTodaySessions(): PomodoroSessionLog[] {
  return getSessionsForDate(todayKey());
}

export function countCompletedFocusToday(): number {
  return getTodaySessions().filter((s) => s.mode === 'focus' && s.completed).length;
}

export function countFocusMinutesToday(): number {
  return getTodaySessions()
    .filter((s) => s.mode === 'focus' && s.completed)
    .reduce((sum, s) => sum + s.durationMin, 0);
}

export function countBreaksToday(): number {
  return getTodaySessions().filter(
    (s) => (s.mode === 'short_break' || s.mode === 'long_break') && s.completed,
  ).length;
}

export function updateSessionNote(id: string, note: string) {
  const all = loadAllSessions();
  const idx = all.findIndex((s) => s.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], note: note.trim() || undefined };
    saveAllSessions(all);
    window.dispatchEvent(new CustomEvent('arrow-pomodoro-sessions-updated'));
  }
}

export function createSessionLog(
  mode: SessionMode,
  durationMin: number,
  startedAt: Date,
  opts: {
    taskId?: string | null;
    taskTitle?: string | null;
    blockId?: string | null;
    completed: boolean;
    manual?: boolean;
  },
): Omit<PomodoroSessionLog, 'id'> {
  return {
    date: todayKey(startedAt),
    startedAt: startedAt.toISOString(),
    durationMin,
    mode,
    taskId: opts.taskId ?? null,
    taskTitle: opts.taskTitle ?? null,
    blockId: opts.blockId ?? null,
    completed: opts.completed,
    manual: opts.manual,
  };
}
