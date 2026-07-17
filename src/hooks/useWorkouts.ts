import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { desktopAPI } from '@/lib/desktop-api';
import { useVault } from '@/contexts/VaultContext';
import { useNotification } from './useNotification';
import type {
  WorkoutProgram, WorkoutTemplate, WorkoutSession,
  ExerciseLog, ExerciseProgressPoint, WorkoutSplitType, WorkoutFocus,
} from '@/types/arrow';

const SPLIT_LABELS: Record<WorkoutSplitType, string[]> = {
  AB: ['A', 'B'],
  ABC: ['A', 'B', 'C'],
  ABCD: ['A', 'B', 'C', 'D'],
  ABCDE: ['A', 'B', 'C', 'D', 'E'],
  custom: [],
};

export function useWorkouts() {
  const { profile } = useVault();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const programsQuery = useQuery({
    queryKey: ['workout-programs', profile?.id],
    queryFn: () => desktopAPI.db.workouts.programs.list() as Promise<WorkoutProgram[]>,
    enabled: !!profile,
    retry: false,
  });

  const sessionsQuery = useQuery({
    queryKey: ['workout-sessions', profile?.id],
    queryFn: () => desktopAPI.db.workouts.sessions.list() as Promise<WorkoutSession[]>,
    enabled: !!profile,
    retry: false,
  });

  const createProgram = useMutation({
    mutationFn: async (data: {
      name: string;
      split_type: WorkoutSplitType;
      frequency_per_week: number;
      focus: WorkoutFocus;
      create_habit?: boolean;
    }) => {
      const program = await desktopAPI.db.workouts.programs.create({
        name: data.name,
        split_type: data.split_type,
        frequency_per_week: data.frequency_per_week,
        focus: data.focus,
        schedule: [],
        is_active: true,
      }) as WorkoutProgram;

      const labels = SPLIT_LABELS[data.split_type];
      for (const label of labels) {
        await desktopAPI.db.workouts.templates.create({
          program_id: program.id,
          label,
          name: `Treino ${label}`,
          exercises: [],
        });
      }

      if (data.create_habit) {
        const habit = await desktopAPI.db.habits.create({
          title: data.name,
          category: 'saude',
          frequency_type: 'intermitente',
          frequency_value: data.frequency_per_week,
          routine: 'qualquer',
        });
        await desktopAPI.db.workouts.programs.update({
          id: program.id,
          habit_id: (habit as { id: string }).id,
        });
      }

      return program;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-programs'] });
      showSuccess('Programa criado!');
    },
    onError: () => showError('Erro ao criar programa'),
  });

  const updateProgram = useMutation({
    mutationFn: (data: Partial<WorkoutProgram> & { id: string }) =>
      desktopAPI.db.workouts.programs.update(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout-programs'] }),
    onError: () => showError('Erro ao atualizar programa'),
  });

  const deleteProgram = useMutation({
    mutationFn: (id: string) => desktopAPI.db.workouts.programs.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-programs'] });
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
      showSuccess('Programa excluído');
    },
    onError: () => showError('Erro ao excluir programa'),
  });

  const completeSession = useMutation({
    mutationFn: async ({
      session,
      exercisesLog,
      durationMinutes,
    }: {
      session: WorkoutSession;
      exercisesLog: ExerciseLog[];
      durationMinutes?: number;
    }) => {
      const updated = await desktopAPI.db.workouts.sessions.complete(
        session.id,
        exercisesLog,
        durationMinutes,
      ) as WorkoutSession;

      if (session.task_id) {
        await desktopAPI.db.tasks.update({
          id: session.task_id,
          status: 'concluida',
          completion_date: new Date().toISOString().split('T')[0],
        });
      }

      const programs = programsQuery.data || [];
      const program = programs.find(p => p.id === session.program_id);
      if (program?.habit_id) {
        const habits = await desktopAPI.db.habits.list() as Array<{
          id: string;
          completion_history: Array<{ date: string; completed: boolean }>;
          current_streak: number;
          longest_streak: number;
        }>;
        const habit = habits.find(h => h.id === program.habit_id);
        if (habit) {
          const history = [...(habit.completion_history || [])];
          const idx = history.findIndex(h => h.date === session.date);
          if (idx >= 0) {
            history[idx].completed = true;
          } else {
            history.push({ date: session.date, completed: true });
          }
          await desktopAPI.db.habits.update({
            id: habit.id,
            completion_history: history,
            current_streak: (habit.current_streak || 0) + 1,
            longest_streak: Math.max(habit.longest_streak || 0, (habit.current_streak || 0) + 1),
          });
        }
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      showSuccess('Treino concluído!');
    },
    onError: () => showError('Erro ao concluir treino'),
  });

  const generateWeek = useMutation({
    mutationFn: ({
      programId,
      cycleId,
      weekNumber,
      weekDates,
    }: {
      programId: string;
      cycleId: string;
      weekNumber: number;
      weekDates: string[];
    }) =>
      desktopAPI.db.workouts.sessions.generateWeek(programId, cycleId, weekNumber, weekDates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showSuccess('Agenda da semana gerada!');
    },
    onError: () => showError('Erro ao gerar agenda'),
  });

  const programs = programsQuery.data || [];
  const sessions = sessionsQuery.data || [];
  const activeProgram = programs.find(p => p.is_active) || programs[0];

  function getSessionsByWeek(cycleId: string, weekNumber: number) {
    return sessions.filter(s => s.cycle_id === cycleId && s.week_number === weekNumber);
  }

  function getWeekWorkoutScore(cycleId: string, weekNumber: number) {
    const weekSessions = getSessionsByWeek(cycleId, weekNumber);
    if (weekSessions.length === 0) return { planned: 0, completed: 0 };
    return {
      planned: weekSessions.length,
      completed: weekSessions.filter(s => s.status === 'feito').length,
    };
  }

  function getTodaySession(programId?: string) {
    const today = new Date().toISOString().split('T')[0];
    return sessions.find(s =>
      s.date === today && s.status !== 'feito' &&
      (!programId || s.program_id === programId),
    );
  }

  return {
    programs,
    sessions,
    activeProgram,
    isLoading: programsQuery.isLoading || sessionsQuery.isLoading,
    createProgram,
    updateProgram,
    deleteProgram,
    completeSession,
    generateWeek,
    getSessionsByWeek,
    getWeekWorkoutScore,
    getTodaySession,
  };
}

export function useWorkoutTemplates(programId: string | null) {
  const { profile } = useVault();
  const queryClient = useQueryClient();
  const { showError } = useNotification();

  const templatesQuery = useQuery({
    queryKey: ['workout-templates', programId, profile?.id],
    queryFn: () => desktopAPI.db.workouts.templates.list(programId!) as Promise<WorkoutTemplate[]>,
    enabled: !!profile && !!programId,
    retry: false,
  });

  const updateTemplate = useMutation({
    mutationFn: (data: Partial<WorkoutTemplate> & { id: string }) =>
      desktopAPI.db.workouts.templates.update(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout-templates', programId] }),
    onError: () => showError('Erro ao atualizar template'),
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    updateTemplate,
  };
}

export function useExerciseProgress(exerciseName: string | null) {
  const { profile } = useVault();

  return useQuery({
    queryKey: ['exercise-progress', exerciseName, profile?.id],
    queryFn: () =>
      desktopAPI.db.workouts.progress(exerciseName!) as Promise<ExerciseProgressPoint[]>,
    enabled: !!profile && !!exerciseName,
    retry: false,
  });
}
