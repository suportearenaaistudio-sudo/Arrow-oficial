import { Calendar, Dumbbell, Flame, TrendingUp } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useWorkoutDashboardStats } from '@/hooks/useWorkoutDashboardStats';
import ProgressRing from '@/components/ui/ProgressRing';

interface WorkoutPerformancePanelProps {
  programId?: string | null;
}

export default function WorkoutPerformancePanel({ programId }: WorkoutPerformancePanelProps) {
  const { theme } = useTheme();
  const {
    adherence,
    planned,
    completed,
    weekVolume,
    streak,
    topGains,
    program,
  } = useWorkoutDashboardStats(programId);

  if (!program) return null;

  return (
    <div className="arrow-card p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: theme.textPrimary }}>
        <TrendingUp className="w-4 h-4" style={{ color: theme.accent }} />
        Desempenho — {program.name}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl p-3 text-center" style={{ background: theme.accentLight }}>
          <ProgressRing progress={adherence} size={48} strokeWidth={4} className="mx-auto mb-1">
            <span className="text-[9px] font-bold">{adherence}%</span>
          </ProgressRing>
          <p className="text-[10px]" style={{ color: theme.textMuted }}>Adesão semanal</p>
          <p className="text-xs font-semibold" style={{ color: theme.textPrimary }}>
            {completed}/{planned}
          </p>
        </div>

        <div className="rounded-xl p-3 text-center" style={{ background: theme.accentLight }}>
          <Dumbbell className="w-5 h-5 mx-auto mb-1" style={{ color: theme.accent }} />
          <p className="text-lg font-black" style={{ color: theme.textPrimary }}>
            {Math.round(weekVolume).toLocaleString('pt-BR')}
          </p>
          <p className="text-[10px]" style={{ color: theme.textMuted }}>kg volume/semana</p>
        </div>

        <div className="rounded-xl p-3 text-center" style={{ background: theme.accentLight }}>
          <Flame className="w-5 h-5 mx-auto mb-1" style={{ color: theme.accent }} />
          <p className="text-lg font-black" style={{ color: theme.textPrimary }}>{streak}</p>
          <p className="text-[10px]" style={{ color: theme.textMuted }}>dias seguidos</p>
        </div>

        <div className="rounded-xl p-3" style={{ background: theme.accentLight }}>
          <p className="text-[10px] font-medium mb-2" style={{ color: theme.textMuted }}>
            Maior evolução de carga
          </p>
          {topGains.length === 0 ? (
            <p className="text-xs" style={{ color: theme.textMuted }}>Sem dados ainda</p>
          ) : (
            <ul className="space-y-1">
              {topGains.map((g) => (
                <li key={g.name} className="text-xs flex justify-between gap-2">
                  <span className="truncate" style={{ color: theme.textPrimary }}>{g.name}</span>
                  <span className="font-semibold shrink-0" style={{ color: theme.accent }}>
                    +{g.gain}kg
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {planned === 0 && (
        <p className="text-xs flex items-center gap-1.5" style={{ color: theme.textMuted }}>
          <Calendar className="w-3.5 h-3.5" />
          Gere a agenda da semana para acompanhar a adesão.
        </p>
      )}
    </div>
  );
}
