import { useMemo, useState } from 'react';
import { Check, ChevronDown, ListChecks, Search, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useTasks } from '@/hooks/useTasks';
import { useFocusTimer } from '@/contexts/FocusTimerContext';

interface PomodoroTaskPickerProps {
  /** Always show expanded list (Pomodoro page) vs collapsible chip */
  expanded?: boolean;
  disabled?: boolean;
}

export default function PomodoroTaskPicker({ expanded = false, disabled = false }: PomodoroTaskPickerProps) {
  const { theme, isDark } = useTheme();
  const { tasks } = useTasks();
  const { taskId, taskTitle, setTask } = useFocusTimer();
  const [open, setOpen] = useState(expanded);
  const [query, setQuery] = useState('');

  const openTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'concluida'),
    [tasks],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return openTasks;
    return openTasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [openTasks, query]);

  const isOpen = expanded || open;

  return (
    <div className={expanded ? 'space-y-2' : ''}>
      {!expanded && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((s) => !s)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-colors disabled:opacity-50"
          style={{
            background: taskTitle ? theme.accentLight : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
            border: `1px solid ${taskTitle ? `${theme.accent}50` : 'var(--arrow-border)'}`,
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Target className="w-4 h-4 flex-shrink-0" style={{ color: taskTitle ? theme.accent : theme.textMuted }} />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide font-medium" style={{ color: theme.textMuted }}>
                Tarefa vinculada
              </p>
              <p className="text-xs font-medium truncate" style={{ color: taskTitle ? theme.textPrimary : theme.textMuted }}>
                {taskTitle || 'Selecione uma tarefa (opcional)'}
              </p>
            </div>
          </div>
          <ChevronDown
            className="w-4 h-4 flex-shrink-0 transition-transform"
            style={{ color: theme.textMuted, transform: isOpen ? 'rotate(180deg)' : undefined }}
          />
        </button>
      )}

      {expanded && (
        <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
          <Target className="w-4 h-4" style={{ color: theme.accent }} />
          Vincular tarefa
        </p>
      )}

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={expanded ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={expanded ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={expanded ? '' : 'overflow-hidden'}
          >
            <div
              className={`space-y-2 ${expanded ? 'p-3 rounded-xl' : 'pt-2'}`}
              style={expanded ? { background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid var(--arrow-border)' } : undefined}
            >
              {openTasks.length > 0 ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: theme.textMuted }} />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar tarefa..."
                      disabled={disabled}
                      className="w-full pl-8 pr-3 py-2 rounded-lg text-xs outline-none"
                      style={{
                        background: 'var(--arrow-bg-card)',
                        border: '1px solid var(--arrow-border)',
                        color: theme.textPrimary,
                      }}
                    />
                  </div>
                  <div className={`space-y-1 overflow-y-auto ${expanded ? 'max-h-48' : 'max-h-36'}`}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => { setTask(null, null); if (!expanded) setOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors"
                      style={{
                        color: theme.textMuted,
                        background: !taskId ? theme.accentLight : 'transparent',
                      }}
                    >
                      Sem tarefa — foco livre
                    </button>
                    {filtered.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => { setTask(t.id, t.title); if (!expanded) setOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors hover:opacity-80"
                        style={{
                          background: taskId === t.id ? theme.accentLight : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                          color: taskId === t.id ? theme.accent : theme.textPrimary,
                        }}
                      >
                        {taskId === t.id ? <Check className="w-3 h-3 flex-shrink-0" /> : <ListChecks className="w-3 h-3 flex-shrink-0 opacity-40" />}
                        <span className="truncate">{t.title}</span>
                      </button>
                    ))}
                    {filtered.length === 0 && (
                      <p className="text-xs text-center py-2" style={{ color: theme.textMuted }}>Nenhuma tarefa encontrada</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs py-2 text-center" style={{ color: theme.textMuted }}>
                  Nenhuma tarefa aberta. Crie uma em Tarefas para vincular.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
