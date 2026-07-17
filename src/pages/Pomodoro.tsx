import { motion } from 'framer-motion';
import PomodoroHero from '@/components/pomodoro/PomodoroHero';
import PomodoroSessionHistory from '@/components/pomodoro/PomodoroSessionHistory';
import PomodoroStats from '@/components/pomodoro/PomodoroStats';
import TimeBlockSection from '@/components/time-blocks/TimeBlockSection';

export default function Pomodoro() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold arrow-gradient-text mb-1">Pomodoro & Time Blocks</h1>
        <p className="text-sm" style={{ color: 'var(--arrow-text-secondary)' }}>
          Foque no topo, planeje e execute blocos de tempo abaixo
        </p>
      </div>

      <PomodoroHero variant="full" />

      <div className="arrow-card p-5">
        <TimeBlockSection />
      </div>

      <div className="arrow-card p-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--arrow-text-primary)' }}>
          Histórico de hoje
        </h3>
        <PomodoroSessionHistory />
      </div>

      <div className="arrow-card p-5">
        <PomodoroStats />
      </div>
    </motion.div>
  );
}
