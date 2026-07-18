import { useMemo } from 'react';
import { useWorkouts, useWorkoutTemplates } from '@/hooks/useWorkouts';
import { useCycles, getCurrentWeek } from '@/hooks/useCycles';
import type { ExerciseLog, WorkoutProgram, WorkoutSession } from '@/types/arrow';

function sessionVolume(log: ExerciseLog[]): number {
  return log.reduce((sum, ex) => {
    const vol = ex.sets.reduce((s, set) => s + (set.reps || 0) * (set.load_kg || 0), 0);
    return sum + vol;
  }, 0);
}

function computeStreak(doneSessions: WorkoutSession[]): number {
  const dates = [...new Set(doneSessions.map((s) => s.date))].sort().reverse();
  if (dates.length === 0) return 0;
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  let cursor = new Date(today);
  const dateSet = new Set(dates);
  for (let i = 0; i < 365; i++) {
    const key = cursor.toISOString().split('T')[0];
    if (dateSet.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function topLoadGains(sessions: WorkoutSession[], limit = 3) {
  const byExercise = new Map<string, { name: string; first: number; last: number }>();
  const done = [...sessions]
    .filter((s) => s.status === 'feito')
    .sort((a, b) => a.date.localeCompare(b.date));

  for (const session of done) {
    for (const ex of session.exercises_log || []) {
      const maxLoad = Math.max(0, ...ex.sets.map((s) => s.load_kg || 0));
      const key = ex.exercise_id || ex.name;
      const prev = byExercise.get(key);
      if (!prev) {
        byExercise.set(key, { name: ex.name, first: maxLoad, last: maxLoad });
      } else {
        byExercise.set(key, { name: ex.name, first: prev.first, last: maxLoad });
      }
    }
  }

  return [...byExercise.values()]
    .map((e) => ({ ...e, gain: e.last - e.first }))
    .filter((e) => e.gain > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, limit);
}

export function useWorkoutDashboardStats(programId?: string | null) {
  const { programs, sessions, getSessionsByWeek, getTodaySession } = useWorkouts();
  const { activeCycle } = useCycles();
  const resolvedProgramId = programId ?? programs.find((p) => p.is_active)?.id ?? programs[0]?.id ?? null;
  const { templates } = useWorkoutTemplates(resolvedProgramId);

  const program = programs.find((p) => p.id === resolvedProgramId) ?? null;
  const currentWeek = activeCycle ? getCurrentWeek(activeCycle) : 1;
  const weekSessions =
    activeCycle && resolvedProgramId
      ? getSessionsByWeek(activeCycle.id, currentWeek, resolvedProgramId)
      : [];

  return useMemo(() => {
    const planned = weekSessions.length;
    const completed = weekSessions.filter((s) => s.status === 'feito').length;
    const adherence = planned > 0 ? Math.round((completed / planned) * 100) : 0;

    const weekVolume = weekSessions
      .filter((s) => s.status === 'feito')
      .reduce((sum, s) => sum + sessionVolume(s.exercises_log || []), 0);

    const programSessions = resolvedProgramId
      ? sessions.filter((s) => s.program_id === resolvedProgramId)
      : sessions;
    const streak = computeStreak(programSessions.filter((s) => s.status === 'feito'));
    const topGains = topLoadGains(programSessions);

    const today = new Date().toISOString().split('T')[0];
    const todaySession = getTodaySession(resolvedProgramId ?? undefined);
    const upcoming = weekSessions
      .filter((s) => s.status !== 'feito' && s.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.planned_start_time || '').localeCompare(b.planned_start_time || ''))[0];

    const nextSession = todaySession ?? upcoming ?? null;
    const nextTemplate = nextSession
      ? templates.find((t) => t.id === nextSession.template_id)
      : null;

    let lastLoad: { exercise: string; load: number } | null = null;
    const recentDone = [...programSessions]
      .filter((s) => s.status === 'feito')
      .sort((a, b) => b.date.localeCompare(a.date));
    for (const session of recentDone) {
      for (const ex of [...(session.exercises_log || [])].reverse()) {
        const maxLoad = Math.max(0, ...ex.sets.map((s) => s.load_kg || 0));
        if (maxLoad > 0) {
          lastLoad = { exercise: ex.name, load: maxLoad };
          break;
        }
      }
      if (lastLoad) break;
    }

    return {
      program: program as WorkoutProgram | null,
      programId: resolvedProgramId,
      adherence,
      planned,
      completed,
      weekVolume,
      streak,
      topGains,
      nextSession,
      nextTemplate,
      lastLoad,
      weekSessions,
    };
  }, [
    weekSessions,
    sessions,
    resolvedProgramId,
    program,
    templates,
    getTodaySession,
  ]);
}
