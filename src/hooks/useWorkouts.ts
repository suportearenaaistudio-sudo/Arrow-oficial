import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { desktopAPI } from '@/lib/desktop-api';
import { useVault } from '@/contexts/VaultContext';
import { useNotification } from './useNotification';
import { trainingUsesSplit, buildScheduleFromDays } from '@/lib/workout-config';
import type {
  WorkoutProgram, WorkoutTemplate, WorkoutSession,
  ExerciseLog, ExerciseProgressPoint, WorkoutSplitType, WorkoutFocus,
  WorkoutTrainingType, WorkoutExercise,
  WorkoutCheckin, WorkoutGoal, HealthDocument,
} from '@/types/arrow';

const SPLIT_LABELS: Record<WorkoutSplitType, string[]> = {
  AB: ['A', 'B'],
  ABC: ['A', 'B', 'C'],
  ABCD: ['A', 'B', 'C', 'D'],
  ABCDE: ['A', 'B', 'C', 'D', 'E'],
  custom: ['S'],
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

  const goalsQuery = useQuery({
    queryKey: ['workout-goals', profile?.id],
    queryFn: () => desktopAPI.db.workouts.goals.list() as Promise<WorkoutGoal[]>,
    enabled: !!profile,
    retry: false,
  });

  const documentsQuery = useQuery({
    queryKey: ['health-documents', profile?.id],
    queryFn: () => desktopAPI.db.workouts.healthDocuments.list() as Promise<HealthDocument[]>,
    enabled: !!profile,
    retry: false,
  });

  const createProgram = useMutation({
    mutationFn: async (data: {
      name: string;
      split_type: WorkoutSplitType;
      frequency_per_week: number;
      focus: WorkoutFocus;
      training_type: WorkoutTrainingType;
      days_of_week: number[];
      duration_weeks: number;
      cycle_id?: string;
      end_date?: string;
      deload_mode?: WorkoutProgram['deload_mode'];
      deload_after_sessions?: number;
      deload_after_weeks?: number;
      deload_volume_percent?: number;
      create_habit?: boolean;
      templates?: { label: string; name: string; exercises: WorkoutExercise[] }[];
    }) => {
      const usesSplit = trainingUsesSplit(data.training_type);
      const labels = usesSplit ? SPLIT_LABELS[data.split_type] : ['S'];
      const templateDrafts = data.templates?.length
        ? data.templates
        : labels.map((label) => ({
            label,
            name: usesSplit ? `Treino ${label}` : 'Sessão',
            exercises: [] as WorkoutExercise[],
          }));

      const program = await desktopAPI.db.workouts.programs.create({
        name: data.name,
        split_type: data.split_type,
        frequency_per_week: data.frequency_per_week,
        focus: data.focus,
        training_type: data.training_type,
        days_of_week: data.days_of_week,
        duration_weeks: data.duration_weeks,
        cycle_id: data.cycle_id,
        end_date: data.end_date,
        deload_mode: data.deload_mode ?? 'manual',
        deload_after_sessions: data.deload_after_sessions ?? null,
        deload_after_weeks: data.deload_after_weeks ?? null,
        deload_volume_percent: data.deload_volume_percent ?? 60,
        schedule: [],
        is_active: true,
      }) as WorkoutProgram;

      const createdTemplates: { id: string; label: string }[] = [];
      for (const draft of templateDrafts) {
        const tmpl = await desktopAPI.db.workouts.templates.create({
          program_id: program.id,
          label: draft.label,
          name: draft.name,
          exercises: draft.exercises,
        }) as WorkoutTemplate;
        createdTemplates.push({ id: tmpl.id, label: draft.label });
      }

      const labelToId = Object.fromEntries(createdTemplates.map((t) => [t.label, t.id]));
      const scheduledTemplates = createdTemplates.filter((template) => {
        const draft = templateDrafts.find((item) => item.label === template.label);
        return template.label.toLowerCase() !== 'r'
          && !/recupera|deload/i.test(draft?.name ?? '');
      });
      const scheduleDrafts = buildScheduleFromDays(
        data.days_of_week,
        (scheduledTemplates.length ? scheduledTemplates : createdTemplates).map((t) => t.label),
      );
      const schedule = scheduleDrafts.map((s) => ({
        day: s.day,
        template_id: labelToId[s.templateLabel],
        planned_start_time: s.planned_start_time,
        planned_duration_minutes: 60,
      }));

      if (schedule.length > 0) {
        await desktopAPI.db.workouts.programs.update({
          id: program.id,
          schedule,
        });
      }

      if (data.create_habit) {
        try {
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
        } catch {
          // Programa criado; hábito é opcional
        }
      }

      return program;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-programs'] });
      showSuccess('Programa criado!');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      showError(msg.includes('Erro') ? msg : `Erro ao criar programa: ${msg}`);
    },
  });

  const updateProgram = useMutation({
    mutationFn: (data: Partial<WorkoutProgram> & { id: string }) =>
      desktopAPI.db.workouts.programs.update(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout-programs'] }),
    onError: () => showError('Erro ao atualizar programa'),
  });

  const updateSession = useMutation({
    mutationFn: (data: Partial<WorkoutSession> & { id: string }) =>
      desktopAPI.db.workouts.sessions.update(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout-sessions'] }),
    onError: () => showError('Erro ao atualizar sessão'),
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

      const programs = programsQuery.data || [];
      const program = programs.find(p => p.id === session.program_id);
      if (program?.deload_mode === 'sessions' && program.deload_after_sessions) {
        const completedStrength = (sessionsQuery.data || []).filter((item) => item.program_id === session.program_id && item.status === 'feito' && item.session_mode !== 'deload' && item.session_mode !== 'recuperacao').length + 1;
        if (completedStrength % program.deload_after_sessions === 0) {
          const next = (sessionsQuery.data || []).filter((item) => item.program_id === session.program_id && item.date > session.date && item.status === 'a_fazer')
            .sort((a, b) => a.date.localeCompare(b.date))[0];
          if (next) {
            const templates = await desktopAPI.db.workouts.templates.list(session.program_id) as WorkoutTemplate[];
            const recovery = templates.find((template) => template.label.toLowerCase() === 'r' || /recupera|deload/i.test(template.name));
            await desktopAPI.db.workouts.sessions.update({ id: next.id, session_mode: 'recuperacao', ...(recovery ? { template_id: recovery.id } : {}) });
          }
        }
      }
      const completedForProgram = (sessionsQuery.data || []).filter((item) => item.program_id === session.program_id && item.status === 'feito').length + 1;
      for (const goal of (goalsQuery.data || []).filter((item) => item.program_id === session.program_id && item.goal_type === 'frequencia' && item.status === 'ativo')) {
        await desktopAPI.db.workouts.goals.update({
          id: goal.id,
          current_value: completedForProgram,
          status: goal.target_frequency && completedForProgram >= goal.target_frequency ? 'concluido' : 'ativo',
        });
      }
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
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['workout-goals'] });
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

  const createCheckin = useMutation({
    mutationFn: async ({ session, checkin }: { session: WorkoutSession; checkin: Omit<WorkoutCheckin, 'id' | 'session_id'> }) => {
      const saved = await desktopAPI.db.workouts.checkins.create({ session_id: session.id, ...checkin }) as WorkoutCheckin;
      await desktopAPI.db.workouts.sessions.update({ id: session.id, checkin_id: saved.id });
      const program = (programsQuery.data || []).find((item) => item.id === session.program_id);
      if (checkin.performance_drop && program?.deload_mode === 'checkin_auto') {
        const next = (sessionsQuery.data || []).filter((item) => item.program_id === session.program_id && item.date > session.date && item.status === 'a_fazer')
          .sort((a, b) => a.date.localeCompare(b.date))[0];
        if (next) {
          const templates = await desktopAPI.db.workouts.templates.list(session.program_id) as WorkoutTemplate[];
          const recovery = templates.find((template) => template.label.toLowerCase() === 'r' || /recupera|deload/i.test(template.name));
          await desktopAPI.db.workouts.sessions.update({ id: next.id, session_mode: 'recuperacao', ...(recovery ? { template_id: recovery.id } : {}) });
        }
      }
      return saved;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
      showSuccess('Check-in registrado');
    },
    onError: () => showError('Erro ao registrar check-in'),
  });

  const createGoal = useMutation({
    mutationFn: (data: Partial<WorkoutGoal>) => desktopAPI.db.workouts.goals.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout-goals'] }),
  });
  const updateGoal = useMutation({
    mutationFn: (data: Partial<WorkoutGoal> & { id: string }) => desktopAPI.db.workouts.goals.update(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout-goals'] }),
  });
  const deleteGoal = useMutation({
    mutationFn: (id: string) => desktopAPI.db.workouts.goals.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout-goals'] }),
  });
  const importHealthDocument = useMutation({
    mutationFn: async ({ sourcePath, data }: { sourcePath: string; data: Partial<HealthDocument> }) =>
      desktopAPI.db.workouts.healthDocuments.import(sourcePath, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['health-documents'] }); showSuccess('Documento salvo no vault'); },
    onError: () => showError('Não foi possível importar o documento'),
  });
  const deleteHealthDocument = useMutation({
    mutationFn: (id: string) => desktopAPI.db.workouts.healthDocuments.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health-documents'] }),
  });

  const programs = programsQuery.data || [];
  const sessions = sessionsQuery.data || [];
  const goals = goalsQuery.data || [];
  const healthDocuments = documentsQuery.data || [];
  const activePrograms = programs.filter(p => p.is_active);
  const activeProgram = activePrograms[0] || programs[0];

  function getSessionsByWeek(cycleId: string, weekNumber: number, programId?: string) {
    return sessions.filter(s =>
      s.cycle_id === cycleId &&
      s.week_number === weekNumber &&
      (!programId || s.program_id === programId),
    );
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
      s.date === today && s.status !== 'feito' && s.status !== 'pulado' &&
      (!programId || s.program_id === programId),
    );
  }

  return {
    programs,
    activePrograms,
    sessions,
    goals,
    healthDocuments,
    activeProgram,
    isLoading: programsQuery.isLoading || sessionsQuery.isLoading,
    createProgram,
    updateProgram,
    updateSession,
    deleteProgram,
    completeSession,
    generateWeek,
    createCheckin,
    createGoal,
    updateGoal,
    deleteGoal,
    importHealthDocument,
    deleteHealthDocument,
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

export function useExerciseProgress(exerciseName: string | null, exerciseId?: string | null) {
  const { profile } = useVault();

  return useQuery({
    queryKey: ['exercise-progress', exerciseName, exerciseId, profile?.id],
    queryFn: () =>
      desktopAPI.db.workouts.progress(exerciseName!, exerciseId ?? undefined) as Promise<ExerciseProgressPoint[]>,
    enabled: !!profile && !!exerciseName,
    retry: false,
  });
}
