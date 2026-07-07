import { desktopAPI } from '@/lib/desktop-api';
import { isDesktop } from '@/lib/platform';
import type { Task, TaskStatus } from '@/types/arrow';

export const POMODORO_TAG_PREFIX = 'pomodoros:';

export function getPomodoroCount(tags: string[] = []): number {
  const tag = tags.find((t) => t.startsWith(POMODORO_TAG_PREFIX));
  if (!tag) return 0;
  const n = parseInt(tag.slice(POMODORO_TAG_PREFIX.length), 10);
  return Number.isFinite(n) ? n : 0;
}

export function incrementPomodoroTag(tags: string[] = []): string[] {
  const next = getPomodoroCount(tags) + 1;
  return [
    ...tags.filter((t) => !t.startsWith(POMODORO_TAG_PREFIX)),
    `${POMODORO_TAG_PREFIX}${next}`,
  ];
}

export async function syncTaskOnPomodoroStart(taskId: string): Promise<void> {
  if (!isDesktop()) return;

  const tasks = (await desktopAPI.db.tasks.list()) as Task[];
  const task = tasks.find((t) => t.id === taskId);
  if (!task || task.status !== 'a_fazer') return;

  await desktopAPI.db.tasks.update({ id: taskId, status: 'em_andamento' });
}

export async function syncTaskOnPomodoroComplete(
  taskId: string,
  durationMin: number,
): Promise<void> {
  if (!isDesktop()) return;

  const tasks = (await desktopAPI.db.tasks.list()) as Task[];
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  const tags = incrementPomodoroTag(task.tags ?? []);
  const updates: Record<string, unknown> = {
    id: taskId,
    actual_hours: (task.actual_hours ?? 0) + durationMin / 60,
    tags,
  };

  if (task.status === 'a_fazer' || task.status === 'em_andamento') {
    updates.status = 'revisao' as TaskStatus;
  }

  await desktopAPI.db.tasks.update(updates);
}
