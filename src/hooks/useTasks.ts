import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from './useNotification';
import type { Task, TaskStatus } from '@/types/arrow';

export function useTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const tasksQuery = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Task[];
    },
    enabled: !!user,
    retry: false,
  });

  const createTask = useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...task, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showSuccess('Tarefa criada!');
    },
    onError: () => showError('Erro ao criar tarefa'),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
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
      const { error } = await supabase.from('tasks').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (status === 'concluida') showSuccess('Tarefa concluida!');
    },
    onError: () => showError('Erro ao mover tarefa'),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showSuccess('Tarefa excluída');
    },
    onError: () => showError('Erro ao excluir tarefa'),
  });

  // Vincula tarefa existente a ciclo + semana + meta
  const linkTask = useMutation({
    mutationFn: async ({ id, cycle_id, week_number, goal_id }: {
      id: string; cycle_id?: string; week_number?: number; goal_id?: string;
    }) => {
      const { error } = await supabase.from('tasks')
        .update({ cycle_id: cycle_id ?? null, week_number: week_number ?? null, goal_id: goal_id ?? null } as any)
        .eq('id', id);
      if (error) throw error;
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

  // Score de execução em tempo real (%)
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
