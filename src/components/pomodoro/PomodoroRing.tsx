import { useId } from 'react';
import ProgressRing from '@/components/ui/ProgressRing';

interface PomodoroRingProps {
  progress: number;
  size?: number;
  active?: boolean;
  isBreak?: boolean;
  children?: React.ReactNode;
}

export default function PomodoroRing({
  progress,
  size = 280,
  active = false,
  isBreak = false,
  children,
}: PomodoroRingProps) {
  const gradientId = useId();
  const strokeWidth = size > 220 ? 10 : size > 80 ? 7 : 4;
  const color = isBreak ? '#22c55e' : active ? `url(#${gradientId})` : 'var(--arrow-border)';

  return (
    <div className={`relative ${active && !isBreak ? 'pomodoro-glow' : ''}`}>
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
      </svg>
      <ProgressRing
        progress={active ? progress : 0}
        size={size}
        strokeWidth={strokeWidth}
        color={color}
        trackColor="rgba(128,128,128,0.12)"
        glow={active && !isBreak}
      >
        {children}
      </ProgressRing>
    </div>
  );
}
