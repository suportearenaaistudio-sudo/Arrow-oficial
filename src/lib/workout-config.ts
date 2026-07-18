import type { LucideIcon } from 'lucide-react';
import {
  Dumbbell, TrendingUp, Activity, Footprints, Waves, Bike, Swords, LayoutGrid,
} from 'lucide-react';
import type { WorkoutSplitType, WorkoutFocus, WorkoutTrainingType } from '@/types/arrow';

export const SPLIT_FREQUENCY: Record<WorkoutSplitType, {
  min: number;
  max: number;
  default: number;
  label: string;
}> = {
  AB: { min: 2, max: 4, default: 3, label: '2–4× por semana' },
  ABC: { min: 3, max: 6, default: 4, label: '3–6× por semana' },
  ABCD: { min: 1, max: 7, default: 4, label: 'Personalizado (1–7×)' },
  ABCDE: { min: 1, max: 7, default: 5, label: 'Personalizado (1–7×)' },
  custom: { min: 1, max: 7, default: 3, label: 'Personalizado (1–7×)' },
};

export const FOCUS_OPTIONS: {
  id: WorkoutFocus;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  { id: 'forca', label: 'Força', description: 'Cargas altas, 3–6 reps', icon: Dumbbell },
  { id: 'hipertrofia', label: 'Hipertrofia', description: 'Volume moderado, 8–12 reps', icon: TrendingUp },
  { id: 'resistencia', label: 'Resistência', description: 'Alta repetição, menor carga', icon: Activity },
];

export const FOCUS_LABELS: Record<WorkoutFocus, string> = {
  forca: 'Força',
  hipertrofia: 'Hipertrofia',
  resistencia: 'Resistência',
};

export function clampFrequency(split: WorkoutSplitType, value: number): number {
  const { min, max } = SPLIT_FREQUENCY[split];
  return Math.min(max, Math.max(min, value));
}

export function defaultExercisesForFocus(focus: WorkoutFocus): {
  default_sets: number;
  default_reps: number;
  rest_seconds: number;
} {
  switch (focus) {
    case 'forca':
      return { default_sets: 5, default_reps: 5, rest_seconds: 180 };
    case 'resistencia':
      return { default_sets: 3, default_reps: 15, rest_seconds: 60 };
    case 'hipertrofia':
    default:
      return { default_sets: 4, default_reps: 10, rest_seconds: 90 };
  }
}

export const TRAINING_TYPE_OPTIONS: {
  id: WorkoutTrainingType;
  label: string;
  icon: LucideIcon;
  usesSplit: boolean;
  defaultFocus: WorkoutFocus;
}[] = [
  { id: 'academia', label: 'Academia', icon: Dumbbell, usesSplit: true, defaultFocus: 'hipertrofia' },
  { id: 'corrida', label: 'Corrida', icon: Footprints, usesSplit: false, defaultFocus: 'resistencia' },
  { id: 'natacao', label: 'Natação', icon: Waves, usesSplit: false, defaultFocus: 'resistencia' },
  { id: 'ciclismo', label: 'Ciclismo', icon: Bike, usesSplit: false, defaultFocus: 'resistencia' },
  { id: 'luta', label: 'Luta', icon: Swords, usesSplit: true, defaultFocus: 'forca' },
  { id: 'funcional', label: 'Funcional', icon: LayoutGrid, usesSplit: true, defaultFocus: 'resistencia' },
  { id: 'outro', label: 'Outro', icon: Activity, usesSplit: false, defaultFocus: 'hipertrofia' },
];

export const TRAINING_TYPE_LABELS: Record<WorkoutTrainingType, string> = {
  academia: 'Academia',
  corrida: 'Corrida',
  natacao: 'Natação',
  ciclismo: 'Ciclismo',
  luta: 'Luta',
  funcional: 'Funcional',
  outro: 'Outro',
};

export function trainingUsesSplit(type: WorkoutTrainingType): boolean {
  return TRAINING_TYPE_OPTIONS.find((t) => t.id === type)?.usesSplit ?? false;
}

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
