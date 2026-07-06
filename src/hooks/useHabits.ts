import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { desktopAPI } from '@/lib/desktop-api';
import { useVault } from '@/contexts/VaultContext';
import { useNotification } from './useNotification';
import type { Habit, HabitCompletion } from '@/types/arrow';

export function useHabits() {
  const { profile } = useVault();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const habitsQuery = useQuery({
    queryKey: ['habits', profile?.id],
    queryFn: () => desktopAPI.db.habits.list() as Promise<Habit[]>,
    enabled: !!profile,
    retry: false,
  });

  const createHabit = useMutation({
    mutationFn: async (habit: Partial<Habit>) => {
      return desktopAPI.db.habits.create(habit) as Promise<Habit>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      showSuccess('Hábito criado!');
    },
    onError: () => showError('Erro ao criar hábito'),
  });

  const toggleHabitDay = useMutation({
    mutationFn: async ({ habit, date }: { habit: Habit; date: string }) => {
      const history = [...(habit.completion_history || [])];
      const existingIndex = history.findIndex((h: HabitCompletion) => h.date === date);

      if (existingIndex >= 0) {
        history[existingIndex].completed = !history[existingIndex].completed;
      } else {
        history.push({ date, completed: true });
      }

      const sortedDates = history
        .filter((h: HabitCompletion) => h.completed)
        .map((h: HabitCompletion) => h.date)
        .sort()
        .reverse();

      let currentStreak = 0;
      const today = new Date().toISOString().split('T')[0];
      let checkDate = today;

      for (const d of sortedDates) {
        if (d === checkDate || d === getPreviousDay(checkDate)) {
          currentStreak++;
          checkDate = d;
        } else if (d < checkDate) {
          break;
        }
      }

      const longestStreak = Math.max(habit.longest_streak || 0, currentStreak);

      await desktopAPI.db.habits.update({
        id: habit.id,
        completion_history: history,
        current_streak: currentStreak,
        longest_streak: longestStreak,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
    onError: () => showError('Erro ao atualizar hábito'),
  });

  const updateHabit = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Habit> & { id: string }) => {
      await desktopAPI.db.habits.update({ id, ...updates });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
    onError: () => showError('Erro ao atualizar hábito'),
  });

  const deleteHabit = useMutation({
    mutationFn: async (id: string) => {
      await desktopAPI.db.habits.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      showSuccess('Hábito excluído');
    },
    onError: () => showError('Erro ao excluir hábito'),
  });

  const habits = habitsQuery.data || [];
  const stats = {
    total: habits.length,
    activeStreaks: habits.filter(h => h.current_streak > 0).length,
    longestStreak: Math.max(0, ...habits.map(h => h.longest_streak)),
    totalCompleted: habits.reduce((sum, h) =>
      sum + (h.completion_history || []).filter((c: HabitCompletion) => c.completed).length, 0),
  };

  return { habits, stats, isLoading: habitsQuery.isLoading, createHabit, toggleHabitDay, updateHabit, deleteHabit };
}

function getPreviousDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
