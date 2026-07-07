import { motion } from 'framer-motion';
import { Timer, Target, Clock, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useFocusTimer } from '@/contexts/FocusTimerContext';
import PomodoroPanel from '@/components/pomodoro/PomodoroPanel';

export default function Pomodoro() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { completedSessions, plannedSessions, taskTitle } = useFocusTimer();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold arrow-gradient-text mb-1">Pomodoro</h1>
        <p className="text-sm" style={{ color: 'var(--arrow-text-secondary)' }}>
          Sessões de foco com tarefas vinculadas e controle completo
        </p>
      </div>

      <PomodoroPanel variant="full" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        {[
          {
            icon: Target,
            label: 'Tarefa atual',
            value: taskTitle || 'Nenhuma',
          },
          {
            icon: Clock,
            label: 'Sessões feitas',
            value: `${completedSessions} / ${plannedSessions}`,
          },
          {
            icon: Bell,
            label: 'Notificações',
            value: typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'Ativas' : 'Permitir no browser',
          },
        ].map((item) => (
          <div key={item.label} className="arrow-card p-4">
            <item.icon className="w-4 h-4 mb-2" style={{ color: theme.accent }} />
            <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: 'var(--arrow-text-muted)' }}>
              {item.label}
            </p>
            <p className="text-sm font-semibold truncate mt-0.5" style={{ color: 'var(--arrow-text-primary)' }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="arrow-card p-5 mt-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2" style={{ color: 'var(--arrow-text-primary)' }}>
          <Timer className="w-4 h-4" style={{ color: theme.accent }} />
          Como usar
        </h3>
        <ul className="text-xs space-y-2" style={{ color: 'var(--arrow-text-secondary)' }}>
          <li>1. Vincule uma tarefa da lista (todas as tarefas abertas aparecem aqui).</li>
          <li>2. Defina a duração (padrão 25 min) e quantas sessões planeja fazer.</li>
          <li>3. Inicie — o timer aparece na top bar em qualquer página.</li>
          <li>4. Ao terminar, você ouve um som e pode iniciar a próxima sessão manualmente.</li>
        </ul>
        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="mt-3 text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: theme.accent }}
        >
          Ir para Tarefas →
        </button>
      </div>
    </motion.div>
  );
}
