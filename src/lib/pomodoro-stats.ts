import { loadAllSessions } from '@/lib/pomodoro-sessions';
import { todayKey } from '@/lib/time-blocks';

export interface WeekStats {
  focusSessions: number;
  focusMinutes: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
  intensity: number;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function computeStreak(): number {
  const sessions = loadAllSessions().filter((s) => s.mode === 'focus' && s.completed);
  const daysWithFocus = new Set(sessions.map((s) => s.date));

  let streak = 0;
  const cursor = new Date();
  const today = todayKey();

  if (!daysWithFocus.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (let i = 0; i < 365; i++) {
    const key = dateKey(cursor);
    if (daysWithFocus.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function computeWeekStats(): WeekStats {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const cutoff = dateKey(weekAgo);

  const sessions = loadAllSessions().filter(
    (s) => s.date >= cutoff && s.mode === 'focus' && s.completed,
  );

  return {
    focusSessions: sessions.length,
    focusMinutes: sessions.reduce((acc, s) => acc + s.durationMin, 0),
  };
}

export function computeHeatmap(weeks = 4): HeatmapDay[] {
  const sessions = loadAllSessions().filter((s) => s.mode === 'focus' && s.completed);
  const byDate = new Map<string, number>();
  for (const s of sessions) {
    byDate.set(s.date, (byDate.get(s.date) ?? 0) + 1);
  }

  const max = Math.max(1, ...byDate.values());
  const days: HeatmapDay[] = [];
  const totalDays = weeks * 7;

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const count = byDate.get(key) ?? 0;
    days.push({ date: key, count, intensity: count / max });
  }
  return days;
}
