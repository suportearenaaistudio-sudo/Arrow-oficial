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

const SPLIT_LABELS: Record<WorkoutSplitType, string[]> = {
  AB: ['A', 'B'],
  ABC: ['A', 'B', 'C'],
  ABCD: ['A', 'B', 'C', 'D'],
  ABCDE: ['A', 'B', 'C', 'D', 'E'],
  custom: ['S'],
};

/** Exercícios sugeridos por letra do treino */
export function starterExercisesForTemplate(
  label: string,
): { name: string; muscle_group: string }[] {
  const templates: Record<string, { name: string; muscle_group: string }[]> = {
    A: [
      { name: 'Supino reto', muscle_group: 'Peito' },
      { name: 'Supino inclinado', muscle_group: 'Peito' },
      { name: 'Crucifixo', muscle_group: 'Peito' },
      { name: 'Tríceps pulley', muscle_group: 'Tríceps' },
    ],
    B: [
      { name: 'Puxada frontal', muscle_group: 'Costas' },
      { name: 'Remada curvada', muscle_group: 'Costas' },
      { name: 'Rosca direta', muscle_group: 'Bíceps' },
      { name: 'Rosca martelo', muscle_group: 'Bíceps' },
    ],
    C: [
      { name: 'Agachamento', muscle_group: 'Pernas' },
      { name: 'Leg press', muscle_group: 'Pernas' },
      { name: 'Cadeira extensora', muscle_group: 'Quadríceps' },
      { name: 'Panturrilha em pé', muscle_group: 'Panturrilha' },
    ],
    D: [
      { name: 'Desenvolvimento', muscle_group: 'Ombros' },
      { name: 'Elevação lateral', muscle_group: 'Ombros' },
      { name: 'Encolhimento', muscle_group: 'Trapézio' },
    ],
    E: [
      { name: 'Levantamento terra', muscle_group: 'Posterior' },
      { name: 'Mesa flexora', muscle_group: 'Posterior' },
      { name: 'Abdominal', muscle_group: 'Core' },
    ],
    S: [
      { name: 'Aquecimento', muscle_group: 'Geral' },
      { name: 'Exercício principal', muscle_group: 'Geral' },
      { name: 'Finalização', muscle_group: 'Geral' },
    ],
  };
  const list = templates[label] ?? templates.S;
  return list;
}

export function buildTemplateDrafts(
  split: WorkoutSplitType,
  focus: WorkoutFocus,
  usesSplit: boolean,
): { label: string; name: string; exercises: import('@/types/arrow').WorkoutExercise[] }[] {
  const labels = usesSplit ? SPLIT_LABELS[split] : ['S'];
  const defs = defaultExercisesForFocus(focus);
  return labels.map((label) => ({
    label,
    name: usesSplit ? `Treino ${label}` : 'Sessão',
    exercises: starterExercisesForTemplate(label).map((ex) => ({
      id: crypto.randomUUID(),
      name: ex.name,
      muscle_group: ex.muscle_group,
      default_sets: defs.default_sets,
      default_reps: defs.default_reps,
      rest_seconds: defs.rest_seconds,
      default_load_kg: focus === 'forca' ? 60 : focus === 'hipertrofia' ? 40 : 20,
    })),
  }));
}

/** Gera entradas de schedule (template_id preenchido depois do create) */
export function buildScheduleFromDays(
  days: number[],
  templateLabels: string[],
  defaultTime = '08:00',
): { day: number; templateLabel: string; planned_start_time: string }[] {
  const sorted = [...days].sort((a, b) => a - b);
  return sorted.map((day, i) => ({
    day,
    templateLabel: templateLabels[i % templateLabels.length],
    planned_start_time: defaultTime,
  }));
}
