import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Star, CheckSquare, BarChart2,
  Smile, Meh, Frown, ChevronRight, Flag,
  ClipboardCheck, ListChecks, Target,
} from 'lucide-react';
import { useCycles, getCurrentWeek } from '@/hooks/useCycles';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { useDailyCheckin } from '@/hooks/useDailyCheckin';
import { useWeeklyScores } from '@/hooks/useWeeklyScores';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GoalGroup } from '@/components/ui/PlanningComponents';
import type { MoodType } from '@/types/arrow';

const MOODS: { mood: MoodType; Icon: React.ElementType; label: string; color: string }[] = [
  { mood: 'muito_feliz', Icon: Smile, label: 'Ótimo', color: '#22c55e' },
  { mood: 'feliz', Icon: Smile, label: 'Bem', color: '#86efac' },
  { mood: 'neutro', Icon: Meh, label: 'Ok', color: '#94a3b8' },
  { mood: 'triste', Icon: Frown, label: 'Mal', color: '#f59e0b' },
  { mood: 'muito_triste', Icon: Frown, label: 'Péssimo', color: '#ef4444' },
];

// Detects if today is the last day of a given week in the cycle
function isLastDayOfWeek(cycleStart: string, weekNumber: number): boolean {
  const start = new Date(cycleStart);
  const weekEnd = new Date(start);
  weekEnd.setDate(start.getDate() + weekNumber * 7 - 1);
  const today = new Date();
  return today.toDateString() === weekEnd.toDateString();
}

// Get checkins for the current week period
function getWeekCheckins(checkins: any[], cycleStart: string, weekNumber: number) {
  const start = new Date(cycleStart);
  const weekStart = new Date(start);
  weekStart.setDate(start.getDate() + (weekNumber - 1) * 7);
  const weekEnd = new Date(start);
  weekEnd.setDate(start.getDate() + weekNumber * 7 - 1);

  return checkins.filter(c => {
    const d = new Date(c.date);
    return d >= weekStart && d <= weekEnd;
  }).sort((a, b) => a.date.localeCompare(b.date));
}

export default function Planning() {
  const navigate = useNavigate();
  const { theme, isDark } = useTheme();
  const { activeCycle, isLoading } = useCycles();
  const { goals } = useGoals();
  const { tasks, getTasksByWeek, getWeekScore } = useTasks();
  const { todayCheckin, allCheckins, saveCheckin } = useDailyCheckin();
  const { finalizeWeek, isWeekFinalized, getScoreForWeek } = useWeeklyScores(activeCycle?.id);

  // MIT state — persisted in localStorage
  const mitKey = activeCycle ? `mit-${activeCycle.id}-${new Date().toISOString().split('T')[0]}` : '';
  const [mitText, setMitText] = useState(() => mitKey ? (localStorage.getItem(mitKey) || '') : '');
  const [mitTaskId, setMitTaskId] = useState<string | null>(null);
  const [editingMit, setEditingMit] = useState(false);

  // Daily check-in modal
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinForm, setCheckinForm] = useState({
    mood: 'neutro' as MoodType,
    productivity_score: 7,
    highlight: '',
    tomorrow_focus: '',
    gratitude: '',
  });

  // Weekly report modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ what_went_wrong: '', lessons: '' });

  if (isLoading) return <div className="flex justify-center py-20"><div className="arrow-spinner" /></div>;

  if (!activeCycle) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold arrow-gradient-text mb-1">Planejamento</h1>
        <p className="text-sm mb-6" style={{ color: theme.textMuted }}>Planejamento semanal do ciclo ativo</p>
        <div className="arrow-card p-12 text-center">
          <ListChecks className="w-14 h-14 mx-auto mb-4" style={{ color: theme.textMuted, opacity: 0.3 }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: theme.textPrimary }}>Nenhum ciclo ativo</h3>
          <p className="text-sm mb-4" style={{ color: theme.textMuted }}>Ative um ciclo para usar o planejamento semanal</p>
          <button onClick={() => navigate('/cycles')} className="arrow-btn-primary">Ir para Ciclos</button>
        </div>
      </motion.div>
    );
  }

  const currentWeek = getCurrentWeek(activeCycle);
  const weekTasks = getTasksByWeek(activeCycle.id, currentWeek);
  const weekScore = getWeekScore(activeCycle.id, currentWeek);
  const savedScore = getScoreForWeek(currentWeek);
  const weekFinalized = isWeekFinalized(currentWeek);
  const showReportBanner = isLastDayOfWeek(activeCycle.start_date, currentWeek) && !weekFinalized;
  const weekCheckins = getWeekCheckins(allCheckins, activeCycle.start_date, currentWeek);

  // Group week tasks by goal
  const activeGoals = goals.filter(g => g.status === 'ativo');
  const tasksByGoal = useMemo(() => {
    const groups: { goalId: string | null; title: string; tasks: typeof weekTasks }[] = [];

    activeGoals.forEach(goal => {
      const gt = weekTasks.filter(t => t.goal_id === goal.id);
      groups.push({ goalId: goal.id, title: goal.title, tasks: gt });
    });

    // Unlinked tasks (no goal)
    const unlinked = weekTasks.filter(t => !t.goal_id);
    if (unlinked.length > 0 || activeGoals.length === 0) {
      groups.push({ goalId: null, title: 'Sem meta vinculada', tasks: unlinked });
    }

    return groups;
  }, [weekTasks, activeGoals]);

  const scoreColor = weekScore === null ? theme.textMuted
    : weekScore >= 85 ? '#22c55e' : weekScore >= 70 ? '#eab308' : '#ef4444';

  function saveMit() {
    if (mitKey) localStorage.setItem(mitKey, mitText);
    setEditingMit(false);
  }

  function handleSaveCheckin(e: React.FormEvent) {
    e.preventDefault();
    saveCheckin.mutate(checkinForm, { onSuccess: () => setCheckinOpen(false) });
  }

  function handleFinalizeWeek(e: React.FormEvent) {
    e.preventDefault();
    const done = weekTasks.filter(t => t.status === 'concluida').length;
    finalizeWeek.mutate({
      cycle_id: activeCycle.id,
      week_number: currentWeek,
      tasks_planned: weekTasks.length,
      tasks_completed: done,
      what_went_wrong: reportForm.what_went_wrong,
      lessons: reportForm.lessons,
    }, { onSuccess: () => setReportOpen(false) });
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="space-y-5 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold arrow-gradient-text">Planejamento</h1>
          <p className="text-sm mt-0.5" style={{ color: theme.textMuted }}>
            {activeCycle.title} — Semana {currentWeek} de {activeCycle.duration}
          </p>
        </div>
        <button onClick={() => setCheckinOpen(true)}
          className="arrow-btn-primary flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4" />
          {todayCheckin ? 'Check-in feito ✓' : 'Check-in Diário'}
        </button>
      </div>

      {/* Weekly report banner */}
      {showReportBanner && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl flex items-center justify-between"
          style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.25)' }}>
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-yellow-500" />
            <p className="text-sm font-medium text-yellow-700">
              Hoje é o último dia da Semana {currentWeek}! Faça o relatório semanal.
            </p>
          </div>
          <button onClick={() => setReportOpen(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: '#eab308', color: '#000' }}>
            Relatório
          </button>
        </motion.div>
      )}

      {/* Score bar */}
      <div className="arrow-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4" style={{ color: theme.accent }} />
            <span className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
              Score da Semana {currentWeek}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {weekFinalized && savedScore && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                Finalizado: {savedScore.score}%
              </span>
            )}
            <span className="text-lg font-black" style={{ color: scoreColor }}>
              {weekScore !== null ? `${weekScore}%` : '—'}
            </span>
          </div>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden"
          style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
          <motion.div className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${weekScore ?? 0}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ background: scoreColor }} />
        </div>
        <div className="flex justify-between text-xs mt-1.5" style={{ color: theme.textMuted }}>
          <span>{weekTasks.filter(t => t.status === 'concluida').length} de {weekTasks.length} tarefas concluídas</span>
          <span style={{ color: weekScore !== null && weekScore >= 85 ? '#22c55e' : theme.textMuted }}>
            {weekScore !== null && weekScore >= 85 ? '✓ Meta de 85% atingida!' : 'Meta: ≥ 85%'}
          </span>
        </div>
      </div>

      {/* MIT do Dia */}
      <div className="arrow-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4" style={{ color: theme.accent }} />
          <span className="text-sm font-semibold" style={{ color: theme.textPrimary }}>MIT — Tarefa Mais Importante de Hoje</span>
        </div>

        {editingMit ? (
          <div className="space-y-2">
            <input value={mitText} onChange={e => setMitText(e.target.value)}
              autoFocus onKeyDown={e => e.key === 'Enter' && saveMit()}
              placeholder="Qual a tarefa mais importante de hoje?"
              className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
            {/* Select from week tasks */}
            {weekTasks.filter(t => t.status !== 'concluida').length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                <p className="text-xs" style={{ color: theme.textMuted }}>Ou selecione uma tarefa da semana:</p>
                {weekTasks.filter(t => t.status !== 'concluida').map(t => (
                  <button key={t.id} type="button"
                    onClick={() => { setMitText(t.title); setMitTaskId(t.id); }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors hover:opacity-70"
                    style={{
                      background: mitTaskId === t.id ? theme.accentLight : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                      color: mitTaskId === t.id ? theme.accent : theme.textSecondary,
                      border: `1px solid ${mitTaskId === t.id ? theme.accent : 'transparent'}`,
                    }}>
                    {t.title}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setEditingMit(false)}
                className="flex-1 py-1.5 rounded-lg text-xs" style={{ color: theme.textMuted }}>
                Cancelar
              </button>
              <button onClick={saveMit}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: theme.accent, color: isDark ? '#000' : '#fff' }}>
                Salvar MIT
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditingMit(true)}
            className="w-full text-left px-4 py-3 rounded-xl transition-all hover:opacity-80"
            style={{
              background: mitText ? theme.accentLight : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
              border: `1px solid ${mitText ? theme.accent : theme.border}`,
            }}>
            {mitText
              ? <span className="text-sm font-medium" style={{ color: theme.textPrimary }}>{mitText}</span>
              : <span className="text-sm" style={{ color: theme.textMuted }}>+ Definir a tarefa mais importante de hoje</span>
            }
          </button>
        )}
      </div>

      {/* Week tasks by goal */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: theme.textPrimary }}>
            Tarefas da Semana {currentWeek}
          </h2>
          <span className="text-xs" style={{ color: theme.textMuted }}>
            {weekTasks.length} tarefa{weekTasks.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-3">
          {tasksByGoal.length === 0 ? (
            <div className="arrow-card p-8 text-center">
              <CheckSquare className="w-10 h-10 mx-auto mb-3" style={{ color: theme.textMuted, opacity: 0.3 }} />
              <p className="text-sm" style={{ color: theme.textMuted }}>
                Nenhuma tarefa para esta semana. Adicione tarefas em cada meta abaixo.
              </p>
            </div>
          ) : (
            tasksByGoal.map(group => (
              <GoalGroup
                key={group.goalId ?? 'unlinked'}
                goalId={group.goalId}
                goalTitle={group.title}
                tasks={group.tasks}
                cycleId={activeCycle.id}
                weekNumber={currentWeek}
              />
            ))
          )}

          {/* Add group for each active goal not shown */}
          {activeGoals.filter(g => !tasksByGoal.find(tg => tg.goalId === g.id)).map(goal => (
            <GoalGroup
              key={goal.id}
              goalId={goal.id}
              goalTitle={goal.title}
              tasks={[]}
              cycleId={activeCycle.id}
              weekNumber={currentWeek}
            />
          ))}
        </div>
      </div>

      {/* Check-in status */}
      <div className="arrow-card p-4 flex items-center justify-between"
        style={{ background: todayCheckin ? 'rgba(34,197,94,0.06)' : undefined }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: theme.textPrimary }}>Check-in de Hoje</p>
          {todayCheckin
            ? <p className="text-xs mt-0.5" style={{ color: '#22c55e' }}>
                Concluído — {MOODS.find(m => m.mood === todayCheckin.mood)?.label} · Produtividade {todayCheckin.productivity_score}/10
              </p>
            : <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>Pendente</p>
          }
        </div>
        {!todayCheckin && (
          <button onClick={() => setCheckinOpen(true)} className="arrow-btn-primary text-xs">
            Fazer agora
          </button>
        )}
      </div>

      {/* ── DAILY CHECK-IN MODAL ── */}
      <Dialog open={checkinOpen} onOpenChange={setCheckinOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: theme.accent }} /> Check-in Diário
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCheckin} className="space-y-4 mt-2">
            {/* Mood */}
            <div>
              <label className="arrow-label block mb-2">Como você está?</label>
              <div className="flex gap-2">
                {MOODS.map(m => (
                  <button key={m.mood} type="button"
                    onClick={() => setCheckinForm(f => ({ ...f, mood: m.mood }))}
                    className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all"
                    style={{
                      background: checkinForm.mood === m.mood ? `${m.color}20` : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                      border: `1px solid ${checkinForm.mood === m.mood ? m.color : theme.border}`,
                      transform: checkinForm.mood === m.mood ? 'scale(1.05)' : 'scale(1)',
                    }}>
                    <m.Icon className="w-5 h-5" style={{ color: checkinForm.mood === m.mood ? m.color : theme.textMuted }} />
                    <span className="text-[10px]" style={{ color: checkinForm.mood === m.mood ? m.color : theme.textMuted }}>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Productivity */}
            <div>
              <label className="arrow-label block mb-1.5">
                Produtividade: <span className="font-bold" style={{ color: theme.accent }}>{checkinForm.productivity_score}/10</span>
              </label>
              <input type="range" min={1} max={10} value={checkinForm.productivity_score}
                onChange={e => setCheckinForm(f => ({ ...f, productivity_score: Number(e.target.value) }))}
                className="w-full accent-orange-500" />
            </div>

            {/* Highlight */}
            <div>
              <label className="arrow-label block mb-1.5">Destaque do dia</label>
              <input type="text" value={checkinForm.highlight}
                onChange={e => setCheckinForm(f => ({ ...f, highlight: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                placeholder="Maior conquista de hoje" />
            </div>

            {/* Tomorrow focus */}
            <div>
              <label className="arrow-label block mb-1.5">Foco de amanha</label>
              <input type="text" value={checkinForm.tomorrow_focus}
                onChange={e => setCheckinForm(f => ({ ...f, tomorrow_focus: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                placeholder="Qual a prioridade para amanhã?" />
            </div>

            <button type="submit" className="w-full arrow-btn-primary" disabled={saveCheckin.isPending}>
              Salvar Check-in
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── WEEKLY REPORT MODAL ── */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" style={{ color: theme.accent }} />
              Relatório — Semana {currentWeek}
            </DialogTitle>
          </DialogHeader>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 my-4">
            {[
              { label: 'Planejadas', value: weekTasks.length },
              { label: 'Concluídas', value: weekTasks.filter(t => t.status === 'concluida').length },
              { label: 'Score', value: weekScore !== null ? `${weekScore}%` : '—' },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-xl"
                style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                <p className="text-xl font-black" style={{ color: theme.accent }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Check-in timeline */}
          {weekCheckins.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold mb-2" style={{ color: theme.textMuted }}>Check-ins da semana</p>
              <div className="space-y-2">
                {weekCheckins.map((c, i) => {
                  const moodCfg = MOODS.find(m => m.mood === c.mood);
                  return (
                    <div key={c.id} className="flex gap-3 items-start">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: moodCfg ? `${moodCfg.color}20` : 'transparent', color: moodCfg?.color }}>
                          {i + 1}
                        </div>
                        {i < weekCheckins.length - 1 && (
                          <div className="w-px flex-1 mt-1" style={{ background: theme.border, minHeight: 16 }} />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium" style={{ color: theme.textPrimary }}>
                            {new Date(c.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-xs" style={{ color: moodCfg?.color }}>{moodCfg?.label}</span>
                          <span className="text-xs" style={{ color: theme.textMuted }}>· {c.productivity_score}/10</span>
                        </div>
                        {c.highlight && <p className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>{c.highlight}</p>}
                        {c.tomorrow_focus && <p className="text-xs" style={{ color: theme.textMuted }}>{c.tomorrow_focus}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <form onSubmit={handleFinalizeWeek} className="space-y-3">
            <div>
              <label className="arrow-label block mb-1.5">❌ O que não funcionou?</label>
              <textarea value={reportForm.what_went_wrong}
                onChange={e => setReportForm(f => ({ ...f, what_went_wrong: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm resize-none h-20 focus:outline-none"
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                placeholder="O que impediu sua execução esta semana?" />
            </div>
            <div>
              <label className="arrow-label block mb-1.5">Aprendizado da semana</label>
              <textarea value={reportForm.lessons}
                onChange={e => setReportForm(f => ({ ...f, lessons: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm resize-none h-20 focus:outline-none"
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                placeholder="O que você vai fazer diferente na próxima semana?" />
            </div>
            <button type="submit" className="w-full arrow-btn-primary" disabled={finalizeWeek.isPending}>
              Finalizar Semana {currentWeek}
            </button>
          </form>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
