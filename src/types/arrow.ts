// ============================================
// ARROW v2 — TypeScript Types & Interfaces
// ============================================

// === Enums ===

export type CycleStatus = 'planejamento' | 'ativo' | 'concluido' | 'pausado';

export type CycleCategory =
  | 'crescimento' | 'profissional' | 'saude'
  | 'relacionamentos' | 'criatividade' | 'financeiro'
  | 'aprendizado' | 'equilibrio';

export type CycleColor =
  | 'laranja' | 'azul' | 'verde'
  | 'roxo' | 'rosa' | 'amarelo';

export type GoalType = 'quantitativa' | 'qualitativa' | 'habito' | 'projeto';

export type GoalCategory =
  | 'pessoal' | 'profissional' | 'saude' | 'financeiro'
  | 'educacao' | 'relacionamentos' | 'criatividade' | 'viagem';

export type GoalStatus = 'ativo' | 'concluido' | 'pausado' | 'cancelado';

export type MeasurementType =
  | 'dias' | 'horas' | 'paginas' | 'km' | 'kg'
  | 'vezes' | 'sessoes' | 'projetos' | 'cursos'
  | 'livros' | 'artigos' | 'reais' | 'pontos'
  | 'passos' | 'outro';

export type Priority = 'baixa' | 'media' | 'alta' | 'critica';

export type TaskStatus = 'a_fazer' | 'em_andamento' | 'revisao' | 'concluida';

export type TaskPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export type HabitCategory =
  | 'saude' | 'produtividade' | 'relacionamentos'
  | 'crescimento' | 'lazer' | 'financeiro' | 'outro';

export type HabitFrequency = 'diario' | 'intermitente' | 'dias_especificos';

export type HabitRoutine = 'manha' | 'tarde' | 'noite' | 'qualquer';

export type TransactionType = 'receita' | 'despesa';

export type IncomeCategory =
  | 'salario' | 'freelance' | 'investimentos' | 'vendas'
  | 'servicos' | 'bonus' | 'rendimentos' | 'outros_receita';

export type ExpenseCategory =
  | 'alimentacao' | 'transporte' | 'moradia' | 'lazer'
  | 'saude' | 'educacao' | 'assinaturas' | 'roupas'
  | 'tecnologia' | 'viagem' | 'impostos' | 'outros_despesa';

export type MoodType = 'muito_feliz' | 'feliz' | 'neutro' | 'triste' | 'muito_triste';

export type UserRole = 'admin' | 'user';

export type InvoiceStatus = 'paga' | 'em_aberto' | 'atrasada';

// === Nested Object Types (JSONB) ===

export interface WeeklyCheckin {
  week_number: number;
  date: string;
  reflection: string;
  score: number; // 1-10
  achievements: string[];
  challenges: string;
  next_week_focus: string;
}

export interface SubGoal {
  id: string;
  title: string;
  target_value?: number;
  current_value?: number;
  completed: boolean;
  due_date?: string;
}

export interface Milestone {
  id: string;
  title: string;
  target_value?: number;
  completed: boolean;
  completed_date?: string;
}

export interface WeeklyTarget {
  week_number: number;
  target: number;
  actual: number;
  notes: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  due_date?: string;
}

export interface TaskComment {
  id: string;
  author: string;
  content: string;
  date: string;
}

export interface TaskAttachment {
  name: string;
  url: string;
  type: string;
}

export interface HabitCompletion {
  date: string; // YYYY-MM-DD
  completed: boolean;
}

// === Main Entity Interfaces ===

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Cycle {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  vision?: string;        // visão das 12 semanas deste ciclo
  focus_area?: string;    // área de foco principal do ciclo
  start_date: string;
  end_date: string;
  status: CycleStatus;
  weekly_checkins: WeeklyCheckin[];
  badges_earned: string[];
  final_score?: number;
  notes?: string;
  color?: CycleColor;
  category?: CycleCategory;
  duration: number;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  goal_type: GoalType;
  measurement_type: MeasurementType;
  target_value?: number;
  current_value: number;
  unit?: string;
  cycle_id?: string;
  status: GoalStatus;
  priority: Priority;
  sub_goals: SubGoal[];
  milestones: Milestone[];
  weekly_targets: WeeklyTarget[];
  notes?: string;
  target_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  important: boolean;
  due_date?: string;
  estimated_hours?: number;
  actual_hours: number;
  goal_id?: string;
  cycle_id?: string;
  week_number?: number;     // semana do ciclo (1-12)
  tags: string[];
  assignee?: string;
  progress_percentage: number;
  subtasks: SubTask[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
  blocked_reason?: string;
  completion_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: HabitCategory;
  frequency_type: HabitFrequency;
  frequency_value?: number;
  days_of_week: string[];
  time_of_day?: string;
  routine: HabitRoutine;
  current_streak: number;
  longest_streak: number;
  completion_history: HabitCompletion[];
  cycle_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  tags: string[];
  folder?: string;
  file_path?: string;
  created_at: string;
  updated_at: string;
}

export interface NoteBacklink {
  source_note_id: string;
  source_title: string;
  link_type: string;
}

export interface NoteUnresolvedLink {
  target_title: string;
  alias?: string;
  link_type: string;
}

export interface NoteGraphNode {
  id: string;
  title: string;
  folder: string;
  linkCount: number;
}

export interface NoteGraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface NoteGraphData {
  nodes: NoteGraphNode[];
  edges: NoteGraphEdge[];
}

export interface NoteBacklinksData {
  backlinks: NoteBacklink[];
  unresolved: NoteUnresolvedLink[];
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  date: string;
  mood: MoodType;
  energy_level?: number;
  productivity_score: number;
  gratitude?: string;
  highlight?: string;
  challenge?: string;
  tomorrow_focus?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// === localStorage Types ===

export interface FinancialGoal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  deadline?: string;
}

export interface FinancialDebt {
  id: string;
  title: string;
  description?: string;
  amount: number;
  paidAmount: number;
  dueDate?: string;
  type: string;
}

export interface CreditCardInvoice {
  id: string;
  bank: string;
  totalAmount: number;
  dueDate: string;
  status: InvoiceStatus;
}

export interface RecurringExpense {
  id: string;
  serviceName: string;
  monthlyAmount: number;
  category: string;
  dueDate?: string;
}

// === UI Helper Types ===

export interface NavigationItem {
  icon: string;
  label: string;
  path: string;
}

export type ViewMode = 'cards' | 'timeline' | 'kanban' | 'matrix' | 'calendar';

export type FinancePeriod = 'semanal' | 'mensal' | 'anual';

export type AnalysisPeriod = 'atual' | 'mes' | 'trimestre' | 'ano';

// === Workouts ===

export type WorkoutSplitType = 'AB' | 'ABC' | 'ABCD' | 'ABCDE' | 'custom';
export type WorkoutSessionStatus = 'a_fazer' | 'feito' | 'pulado';
export type WorkoutFocus = 'forca' | 'resistencia' | 'hipertrofia';
export type WorkoutTrainingType =
  | 'academia' | 'corrida' | 'natacao' | 'luta' | 'ciclismo' | 'funcional' | 'outro';

export interface WorkoutScheduleEntry {
  day: number;
  template_id: string;
  planned_start_time?: string;
  planned_duration_minutes?: number;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  muscle_group?: string;
  default_sets?: number;
  default_reps?: number;
  default_load_kg?: number;
  rest_seconds?: number;
  notes?: string;
}

export interface ExerciseSet {
  reps: number;
  load_kg?: number;
  completed?: boolean;
}

export interface ExerciseLog {
  exercise_id?: string;
  name: string;
  sets: ExerciseSet[];
}

export interface WorkoutProgram {
  id: string;
  user_id: string;
  name: string;
  split_type: WorkoutSplitType;
  schedule: WorkoutScheduleEntry[];
  frequency_per_week?: number;
  focus?: WorkoutFocus;
  training_type?: WorkoutTrainingType;
  days_of_week?: number[];
  habit_id?: string;
  cycle_id?: string;
  duration_weeks?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  program_id: string;
  label: string;
  name: string;
  color?: string;
  exercises: WorkoutExercise[];
  created_at: string;
  updated_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  program_id: string;
  template_id: string;
  date: string;
  status: WorkoutSessionStatus;
  exercises_log: ExerciseLog[];
  duration_minutes?: number;
  planned_start_time?: string;
  planned_duration_minutes?: number;
  notes?: string;
  task_id?: string;
  cycle_id?: string;
  week_number?: number;
  created_at: string;
  updated_at: string;
}

export interface ExerciseProgressPoint {
  date: string;
  max_load_kg: number;
  max_reps?: number;
  total_volume?: number;
}

// === Media Lists ===

export type MediaListType =
  | 'filmes' | 'series' | 'animes' | 'animacao'
  | 'jogos' | 'esportes' | 'livros' | 'custom';

export type MediaItemStatus = 'top' | 'visto' | 'a_ver';

export interface MediaList {
  id: string;
  user_id: string;
  name: string;
  list_type: MediaListType;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MediaListItem {
  id: string;
  user_id: string;
  list_id: string;
  title: string;
  subtitle?: string;
  status: MediaItemStatus;
  rank?: number;
  rating?: number;
  notes?: string;
  tags: string[];
  cover_path?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export type ReleaseScheduleStatus = 'upcoming' | 'released' | 'cancelled';
export type ReleaseRecurrence = 'weekly' | 'monthly' | 'yearly';

export interface ReleaseSchedule {
  id: string;
  user_id: string;
  title: string;
  subtitle?: string;
  media_type: MediaListType;
  release_date: string;
  release_time?: string;
  status: ReleaseScheduleStatus;
  media_list_id?: string;
  media_item_id?: string;
  link_to_calendar: boolean;
  task_id?: string;
  color?: string;
  notes?: string;
  recurrence?: ReleaseRecurrence;
  notify_days_before?: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
