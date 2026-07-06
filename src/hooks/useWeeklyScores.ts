import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { desktopAPI } from '@/lib/desktop-api';
import { useVault } from '@/contexts/VaultContext';

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
  const { profile } = useVault();
  const qc = useQueryClient();

  const { data: scores = [], isLoading } = useQuery({
    queryKey: ['weekly-scores', cycleId],
    queryFn: async () => {
      return desktopAPI.db.weeklyScores.list(cycleId) as Promise<WeeklyScore[]>;
    },
    enabled: !!profile,
  });

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + (s.score ?? 0), 0) / scores.length)
    : 0;

  const lastScore = scores.at(-1);

  const finalizeWeek = useMutation({
    mutationFn: async (payload: FinalizeWeekPayload) => {
      return desktopAPI.db.weeklyScores.finalize(payload) as Promise<WeeklyScore>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weekly-scores'] });
      qc.invalidateQueries({ queryKey: ['cycles'] });
    },
  });

  function isWeekFinalized(weekNumber: number) {
    return scores.some(s => s.week_number === weekNumber && s.finalized_at);
  }

  function getScoreForWeek(weekNumber: number) {
    return scores.find(s => s.week_number === weekNumber) ?? null;
  }

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
