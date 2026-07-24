import type { PomodoroSessionLog, SessionMode } from '@/types/pomodoro';
import { todayKey } from '@/lib/time-blocks';
import { desktopAPI, isDesktop } from '@/lib/desktop-api';

// O timer pode continuar em memória durante uma sessão, mas o histórico vive no Vault.
const LEGACY_STORAGE_KEY = 'arrow-pomodoro-sessions';
let cache: PomodoroSessionLog[] = [];
let hydrated = false;

function notify() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('arrow-pomodoro-sessions-updated'));
}

function fromVault(row: Record<string, unknown>): PomodoroSessionLog {
  return {
    id: String(row.id), date: String(row.date), startedAt: String(row.started_at),
    durationMin: Number(row.duration_min), mode: row.mode as SessionMode,
    taskId: row.task_id ? String(row.task_id) : null, taskTitle: row.task_title ? String(row.task_title) : null,
    blockId: row.block_id ? String(row.block_id) : null, completed: Boolean(row.completed),
    note: row.note ? String(row.note) : undefined, manual: Boolean(row.manual),
  };
}

async function migrateLegacy() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    const legacy = raw ? JSON.parse(raw) as PomodoroSessionLog[] : [];
    if (!Array.isArray(legacy) || !legacy.length) return;
    for (const item of legacy) {
      await desktopAPI.db.pomodoroSessions.create({
        date: item.date, started_at: item.startedAt, duration_min: item.durationMin, mode: item.mode,
        task_id: item.taskId, task_title: item.taskTitle, block_id: item.blockId, completed: item.completed,
        note: item.note, manual: item.manual ?? false, source_key: `legacy:${item.id}`,
      });
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch { /* legado permanece para uma próxima abertura; nunca interrompe o timer */ }
}

export async function hydratePomodoroSessions() {
  if (!isDesktop() || hydrated) return;
  try {
    await migrateLegacy();
    const rows = await desktopAPI.db.pomodoroSessions.list() as Record<string, unknown>[];
    cache = rows.map(fromVault);
    hydrated = true;
    notify();
  } catch { /* Vault ainda não aberto: a próxima tela tenta novamente */ }
}

export function loadAllSessions(): PomodoroSessionLog[] { void hydratePomodoroSessions(); return cache; }

export function logSession(entry: Omit<PomodoroSessionLog, 'id'>): PomodoroSessionLog {
  const session: PomodoroSessionLog = { ...entry, id: crypto.randomUUID() };
  cache = [session, ...cache]; notify();
  if (isDesktop()) {
    void desktopAPI.db.pomodoroSessions.create({
      id: session.id, date: session.date, started_at: session.startedAt, duration_min: session.durationMin,
      mode: session.mode, task_id: session.taskId, task_title: session.taskTitle, block_id: session.blockId,
      completed: session.completed, note: session.note, manual: session.manual ?? false, source_key: `timer:${session.id}`,
    }).then((row) => {
      const saved = fromVault(row as Record<string, unknown>);
      cache = cache.map((item) => item.id === session.id ? saved : item); notify();
    }).catch(() => { /* a interface mantém o registro em memória e mostra novamente ao reabrir o Vault */ });
  }
  return session;
}

export function getSessionsForDate(date: string): PomodoroSessionLog[] { return loadAllSessions().filter((s) => s.date === date).sort((a, b) => b.startedAt.localeCompare(a.startedAt)); }
export function getTodaySessions(): PomodoroSessionLog[] { return getSessionsForDate(todayKey()); }
export function countCompletedFocusToday(): number { return getTodaySessions().filter((s) => s.mode === 'focus' && s.completed).length; }
export function countFocusMinutesToday(): number { return getTodaySessions().filter((s) => s.mode === 'focus' && s.completed).reduce((sum, s) => sum + s.durationMin, 0); }
export function countBreaksToday(): number { return getTodaySessions().filter((s) => (s.mode === 'short_break' || s.mode === 'long_break') && s.completed).length; }

export function updateSessionNote(id: string, note: string) {
  cache = cache.map((item) => item.id === id ? { ...item, note: note.trim() || undefined } : item); notify();
  if (isDesktop()) void desktopAPI.db.pomodoroSessions.update({ id, note: note.trim() || null });
}

export function createSessionLog(mode: SessionMode, durationMin: number, startedAt: Date, opts: { taskId?: string | null; taskTitle?: string | null; blockId?: string | null; completed: boolean; manual?: boolean }): Omit<PomodoroSessionLog, 'id'> {
  return { date: todayKey(startedAt), startedAt: startedAt.toISOString(), durationMin, mode, taskId: opts.taskId ?? null, taskTitle: opts.taskTitle ?? null, blockId: opts.blockId ?? null, completed: opts.completed, manual: opts.manual };
}
