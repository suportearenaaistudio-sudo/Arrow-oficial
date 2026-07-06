import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { desktopAPI } from '@/lib/desktop-api';
import { useVault } from '@/contexts/VaultContext';
import { useNotification } from './useNotification';
import type { Task, TaskStatus } from '@/types/arrow';

export function useTasks() {
  const { profile } = useVault();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const tasksQuery = useQuery({
    queryKey: ['tasks', profile?.id],
    queryFn: () => desktopAPI.db.tasks.list() as Promise<Task[]>,
    enabled: !!profile,
    retry: false,
  });

  const createTask = useMutation({
    mutationFn: async (task: Partial<Task>) => {
      return desktopAPI.db.tasks.create(task) as Promise<Task>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showSuccess('Tarefa criada!');
    },
    onError: () => showError('Erro ao criar tarefa'),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      return desktopAPI.db.tasks.update({ id, ...updates }) as Promise<Task>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if ((variables as Record<string, unknown>).status === 'concluida') {
        showSuccess('Tarefa concluida!');
      }
    },
    onError: () => showError('Erro ao atualizar tarefa'),
  });

  const moveTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const updates: Partial<Task> = { status };
      if (status === 'concluida') {
        updates.completion_date = new Date().toISOString().split('T')[0];
      }
      await desktopAPI.db.tasks.update({ id, ...updates });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (status === 'concluida') showSuccess('Tarefa concluida!');
    },
    onError: () => showError('Erro ao mover tarefa'),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await desktopAPI.db.tasks.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showSuccess('Tarefa excluída');
    },
    onError: () => showError('Erro ao excluir tarefa'),
  });

  const linkTask = useMutation({
    mutationFn: async ({ id, cycle_id, week_number, goal_id }: {
      id: string; cycle_id?: string; week_number?: number; goal_id?: string;
    }) => {
      await desktopAPI.db.tasks.update({
        id,
        cycle_id: cycle_id ?? null,
        week_number: week_number ?? null,
        goal_id: goal_id ?? null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showSuccess('Tarefa vinculada!');
    },
    onError: () => showError('Erro ao vincular tarefa'),
  });

  const tasks = tasksQuery.data || [];

  const byStatus = {
    a_fazer: tasks.filter(t => t.status === 'a_fazer'),
    em_andamento: tasks.filter(t => t.status === 'em_andamento'),
    revisao: tasks.filter(t => t.status === 'revisao'),
    concluida: tasks.filter(t => t.status === 'concluida'),
  };

  function getTasksByWeek(cycleId: string, weekNumber: number) {
    return tasks.filter(t => t.cycle_id === cycleId && t.week_number === weekNumber);
  }

  function getTasksByGoal(goalId: string) {
    return tasks.filter(t => t.goal_id === goalId);
  }

  function getTasksByCycle(cycleId: string) {
    return tasks.filter(t => t.cycle_id === cycleId);
  }

  function getWeekScore(cycleId: string, weekNumber: number) {
    const weekTasks = getTasksByWeek(cycleId, weekNumber);
    if (weekTasks.length === 0) return null;
    const done = weekTasks.filter(t => t.status === 'concluida').length;
    return Math.round((done / weekTasks.length) * 100);
  }

  return {
    tasks, byStatus, isLoading: tasksQuery.isLoading,
    createTask, updateTask, moveTask, deleteTask, linkTask,
    getTasksByWeek, getTasksByGoal, getTasksByCycle, getWeekScore,
  };
}
