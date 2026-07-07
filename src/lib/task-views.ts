import type { LucideIcon } from 'lucide-react';
import { Inbox, Loader, Eye, CheckCircle2 } from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from '@/types/arrow';

export interface TaskColumnConfig {
  id: TaskStatus;
  label: string;
  statClass: string;
  icon: LucideIcon;
  iconColor: string;
  description: string;
}

export const TASK_COLUMNS: TaskColumnConfig[] = [
  {
    id: 'a_fazer',
    label: 'A Fazer',
    statClass: 'stat-card-orange',
    icon: Inbox,
    iconColor: 'text-orange-400',
    description: 'Prontas para começar',
  },
  {
    id: 'em_andamento',
    label: 'Em Andamento',
    statClass: 'stat-card-blue',
    icon: Loader,
    iconColor: 'text-blue-400',
    description: 'Em execução agora',
  },
  {
    id: 'revisao',
    label: 'Revisão',
    statClass: 'stat-card-purple',
    icon: Eye,
    iconColor: 'text-purple-400',
    description: 'Aguardando revisão',
  },
  {
    id: 'concluida',
    label: 'Concluída',
    statClass: 'stat-card-green',
    icon: CheckCircle2,
    iconColor: 'text-green-400',
    description: 'Finalizadas',
  },
];

export type EisenhowerQuadrant = 'do' | 'schedule' | 'delegate' | 'eliminate';

export function isUrgent(task: Task): boolean {
  return task.priority === 'urgente' || task.priority === 'alta';
}

export function getEisenhowerQuadrant(task: Task): EisenhowerQuadrant {
  const urgent = isUrgent(task);
  if (urgent && task.important) return 'do';
  if (!urgent && task.important) return 'schedule';
  if (urgent && !task.important) return 'delegate';
  return 'eliminate';
}

export const EISENHOWER_QUADRANTS: {
  id: EisenhowerQuadrant;
  title: string;
  subtitle: string;
  statClass: string;
  action: string;
}[] = [
  {
    id: 'do',
    title: 'Fazer agora',
    subtitle: 'Urgente e importante',
    statClass: 'stat-card-red',
    action: 'Prioridade máxima',
  },
  {
    id: 'schedule',
    title: 'Agendar',
    subtitle: 'Importante, não urgente',
    statClass: 'stat-card-blue',
    action: 'Planeje com calma',
  },
  {
    id: 'delegate',
    title: 'Delegar',
    subtitle: 'Urgente, não importante',
    statClass: 'stat-card-amber',
    action: 'Pode ser terceirizado',
  },
  {
    id: 'eliminate',
    title: 'Eliminar',
    subtitle: 'Nem urgente nem importante',
    statClass: 'stat-card-green',
    action: 'Reavalie a necessidade',
  },
];

export function getEisenhowerQuadrantFromFlags(
  important: boolean,
  priority: TaskPriority,
): EisenhowerQuadrant {
  const urgent = priority === 'urgente' || priority === 'alta';
  if (urgent && important) return 'do';
  if (!urgent && important) return 'schedule';
  if (urgent && !important) return 'delegate';
  return 'eliminate';
}

export function getEisenhowerQuadrantInfo(id: EisenhowerQuadrant) {
  return EISENHOWER_QUADRANTS.find((q) => q.id === id)!;
}

export function normalizeDateKey(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return toDateKey(parsed);
}

export function buildTasksByDate(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = normalizeDateKey(task.due_date);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(task);
    map.set(key, list);
  }
  return map;
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getCalendarGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];

  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

export const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
