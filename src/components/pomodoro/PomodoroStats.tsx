import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { computeHeatmap, computeStreak, computeWeekStats } from '@/lib/pomodoro-stats';
import ProgressRing from '@/components/ui/ProgressRing';

interface PomodoroStatsProps {
  compact?: boolean;
}

export default function PomodoroStats({ compact }: PomodoroStatsProps) {
  const [streak, setStreak] = useState(() => computeStreak());
  const [week, setWeek] = useState(() => computeWeekStats());
  const [heatmap, setHeatmap] = useState(() => computeHeatmap(compact ? 2 : 4));

  useEffect(() => {
    const refresh = () => {
      setStreak(computeStreak());
      setWeek(computeWeekStats());
      setHeatmap(computeHeatmap(compact ? 2 : 4));
    };
    window.addEventListener('arrow-pomodoro-sessions-updated', refresh);
    return () => window.removeEventListener('arrow-pomodoro-sessions-updated', refresh);
  }, [compact]);

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4" style={{ color: 'var(--arrow-accent)' }} />
          <span className="text-sm font-bold">{streak}</span>
          <span className="text-[10px]" style={{ color: 'var(--arrow-text-muted)' }}>dias</span>
        </div>
        <span className="text-[10px]" style={{ color: 'var(--arrow-text-muted)' }}>
          {week.focusMinutes} min esta semana
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="arrow-card p-3 text-center" style={{ background: 'var(--arrow-bg-elevated)' }}>
          <Flame className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--arrow-accent)' }} />
          <p className="text-xl font-black">{streak}</p>
          <p className="text-[10px]" style={{ color: 'var(--arrow-text-muted)' }}>dias seguidos</p>
        </div>
        <div className="arrow-card p-3 text-center" style={{ background: 'var(--arrow-bg-elevated)' }}>
          <ProgressRing progress={Math.min(100, week.focusSessions * 10)} size={40} strokeWidth={4} className="mx-auto mb-1">
            <span className="text-[10px] font-bold">{week.focusSessions}</span>
          </ProgressRing>
          <p className="text-[10px]" style={{ color: 'var(--arrow-text-muted)' }}>pomodoros/semana</p>
        </div>
        <div className="arrow-card p-3 text-center" style={{ background: 'var(--arrow-bg-elevated)' }}>
          <p className="text-xl font-black">{week.focusMinutes}</p>
          <p className="text-[10px]" style={{ color: 'var(--arrow-text-muted)' }}>min focados</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--arrow-text-muted)' }}>
          Atividade recente
        </p>
        <div className="flex flex-wrap gap-1">
          {heatmap.map((day) => (
            <div
              key={day.date}
              className="w-3 h-3 rounded-sm"
              title={`${day.date}: ${day.count} sessões`}
              style={{
                background:
                  day.count === 0
                    ? 'rgba(128,128,128,0.15)'
                    : `rgba(249,115,22,${0.2 + day.intensity * 0.8})`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
