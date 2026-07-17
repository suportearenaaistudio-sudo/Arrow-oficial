export type SessionMode = 'focus' | 'short_break' | 'long_break';
export type TimerMode = 'gentle' | 'strict';
export type AmbientSound = 'none' | 'rain' | 'cafe' | 'white';

export interface PomodoroSessionLog {
  id: string;
  date: string;
  startedAt: string;
  durationMin: number;
  mode: SessionMode;
  taskId: string | null;
  taskTitle: string | null;
  blockId: string | null;
  completed: boolean;
}

export interface PomodoroPreset {
  id: string;
  name: string;
  durationMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  sessionsUntilLongBreak: number;
  builtIn?: boolean;
}

export const BUILTIN_PRESETS: PomodoroPreset[] = [
  {
    id: 'classic',
    name: 'Clássico 25/5',
    durationMin: 25,
    shortBreakMin: 5,
    longBreakMin: 15,
    sessionsUntilLongBreak: 4,
    builtIn: true,
  },
  {
    id: 'deep',
    name: 'Deep Work 50/10',
    durationMin: 50,
    shortBreakMin: 10,
    longBreakMin: 20,
    sessionsUntilLongBreak: 3,
    builtIn: true,
  },
  {
    id: 'sprint',
    name: 'Sprint 15/3',
    durationMin: 15,
    shortBreakMin: 3,
    longBreakMin: 10,
    sessionsUntilLongBreak: 4,
    builtIn: true,
  },
];
