import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface WeeklyScore {
  id: string;
  user_id: string;
  cycle_id: string;
  week_number: number;
  tasks_planned: number;
  tasks_completed: number;
  score: number;
  what_went_wrong: string | null;
  lessons: string | null;
  notes: string | null;
  finalized_at: string | null;
  created_at: string;
}

export interface FinalizeWeekPayload {
  cycle_id: string;
  week_number: number;
  tasks_planned: number;
  tasks_completed: number;
  what_went_wrong?: string;
  lessons?: string;
  notes?: string;
}

export function useWeeklyScores(cycleId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: scores = [], isLoading } = useQuery({
    queryKey: ['weekly-scores', cycleId],
    queryFn: async () => {
      const query = (supabase as any)
        .from('weekly_scores')
        .select('*')
        .order('week_number', { ascending: true });
      if (cycleId) query.eq('cycle_id', cycleId);
      const { data, error } = await query;
      if (error) throw error;
      return data as WeeklyScore[];
    },
    enabled: !!user,
  });

  // Score médio do ciclo (somente semanas finalizadas)
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + (s.score ?? 0), 0) / scores.length)
    : 0;

  // Último score disponível
  const lastScore = scores.at(-1);

  const finalizeWeek = useMutation({
    mutationFn: async (payload: FinalizeWeekPayload) => {
      const { data, error } = await (supabase as any)
        .from('weekly_scores')
        .upsert({
          ...payload,
          user_id: user!.id,
          finalized_at: new Date().toISOString(),
        }, { onConflict: 'user_id,cycle_id,week_number' })
        .select()
        .single();
      if (error) throw error;
      return data as WeeklyScore;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weekly-scores'] });
      qc.invalidateQueries({ queryKey: ['cycles'] });
    },
  });

  // Verifica se a semana já foi finalizada
  function isWeekFinalized(weekNumber: number) {
    return scores.some(s => s.week_number === weekNumber && s.finalized_at);
  }

  function getScoreForWeek(weekNumber: number) {
    return scores.find(s => s.week_number === weekNumber) ?? null;
  }

  // Cor do score
  function scoreColor(score: number) {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  }

  function scoreBg(score: number) {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  return {
    scores,
    avgScore,
    lastScore,
    isLoading,
    finalizeWeek,
    isWeekFinalized,
    getScoreForWeek,
    scoreColor,
    scoreBg,
  };
}
