import { ArrowRight, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useWorkoutDashboardStats } from '@/hooks/useWorkoutDashboardStats';
import ProgressRing from '@/components/ui/ProgressRing';

export default function WorkoutDashboardCard() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const {
    adherence,
    completed,
    planned,
    nextSession,
    nextTemplate,
    lastLoad,
    program,
  } = useWorkoutDashboardStats();

  if (!program) {
    return (
      <div
        className="arrow-card p-5 cursor-pointer transition-opacity hover:opacity-95 h-full"
        onClick={() => navigate('/workouts')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/workouts')}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: theme.accentLight }}
          >
            <Dumbbell className="w-4 h-4" style={{ color: theme.accent }} />
          </div>
          <h3 className="font-semibold text-sm" style={{ color: theme.textPrimary }}>
            Treinos
          </h3>
        </div>
        <p className="text-xs mb-3" style={{ color: theme.textMuted }}>
          Nenhum programa de treino ainda. Crie um para acompanhar adesão e evolução de carga.
        </p>
        <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: theme.accent }}>
          Criar programa <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    );
  }

  return (
    <div
      className="arrow-card p-5 cursor-pointer transition-opacity hover:opacity-95 h-full"
      onClick={() => navigate('/workouts')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate('/workouts')}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: theme.accentLight }}
          >
            <Dumbbell className="w-4 h-4" style={{ color: theme.accent }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate" style={{ color: theme.textPrimary }}>
              Treinos
            </h3>
            <p className="text-[10px] truncate" style={{ color: theme.textMuted }}>
              {program.name}
            </p>
          </div>
        </div>
        <ProgressRing progress={adherence} size={44} strokeWidth={4}>
          <span className="text-[8px] font-bold">{adherence}%</span>
        </ProgressRing>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span style={{ color: theme.textMuted }}>Esta semana</span>
          <span className="font-semibold" style={{ color: theme.textPrimary }}>
            {completed}/{planned} sessões
          </span>
        </div>
        {nextSession && nextTemplate && (
          <div className="flex justify-between gap-2">
            <span style={{ color: theme.textMuted }}>Próximo</span>
            <span className="font-medium text-right truncate" style={{ color: theme.textPrimary }}>
              {nextTemplate.label} — {nextSession.planned_start_time || nextSession.date}
            </span>
          </div>
        )}
        {lastLoad && (
          <div className="flex justify-between gap-2">
            <span style={{ color: theme.textMuted }}>Última carga</span>
            <span className="font-medium truncate" style={{ color: theme.accent }}>
              {lastLoad.exercise} · {lastLoad.load}kg
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); navigate('/workouts'); }}
        className="mt-3 text-[10px] font-medium flex items-center gap-1"
        style={{ color: theme.accent }}
      >
        Ver treinos <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
