import PomodoroHero from '@/components/pomodoro/PomodoroHero';

interface PomodoroPanelProps {
  variant?: 'compact' | 'full';
}

/** Thin wrapper around PomodoroHero for backward compatibility */
export default function PomodoroPanel({ variant = 'compact' }: PomodoroPanelProps) {
  return <PomodoroHero variant={variant} />;
}
