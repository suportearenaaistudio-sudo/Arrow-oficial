import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dumbbell, Plus, CheckCircle2, Circle, Calendar, TrendingUp,
  Trash2, Edit2,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useWorkouts, useWorkoutTemplates, useExerciseProgress } from '@/hooks/useWorkouts';
import { useCycles, getCurrentWeek } from '@/hooks/useCycles';
import type {
  WorkoutSplitType, WorkoutSession, WorkoutExercise, ExerciseLog, ExerciseSet, WorkoutFocus,
} from '@/types/arrow';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  SPLIT_FREQUENCY, FOCUS_OPTIONS, FOCUS_LABELS, clampFrequency, defaultExercisesForFocus,
} from '@/lib/workout-config';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const SPLIT_OPTIONS: WorkoutSplitType[] = ['AB', 'ABC', 'ABCD', 'ABCDE'];

interface WizardForm {
  name: string;
  split_type: WorkoutSplitType;
  frequency_per_week: number;
  focus: WorkoutFocus;
  create_habit: boolean;
}

const DEFAULT_WIZARD: WizardForm = {
  name: '',
  split_type: 'ABC',
  frequency_per_week: 4,
  focus: 'hipertrofia',
  create_habit: true,
};

function getWeekDatesByDayIndex(): string[] {
  const dates: string[] = new Array(7).fill('');
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    dates[i] = d.toISOString().split('T')[0];
  }
  return dates;
}

const DISPLAY_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function Workouts() {
  const { theme, isDark } = useTheme();
  const { activeCycle } = useCycles();
  const {
    programs, sessions, activeProgram, isLoading,
    createProgram, updateProgram, deleteProgram,
    completeSession, generateWeek, getTodaySession, getSessionsByWeek,
  } = useWorkouts();

  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const programId = selectedProgramId || activeProgram?.id || null;
  const { templates, updateTemplate } = useWorkoutTemplates(programId);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardForm, setWizardForm] = useState<WizardForm>(DEFAULT_WIZARD);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completingSession, setCompletingSession] = useState<WorkoutSession | null>(null);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [duration, setDuration] = useState(60);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [progressExercise, setProgressExercise] = useState<string | null>(null);

  const { data: progressData } = useExerciseProgress(progressExercise);
  const todaySession = getTodaySession(programId ?? undefined);
  const currentWeek = activeCycle ? getCurrentWeek(activeCycle) : 1;
  const weekSessions = activeCycle && programId
    ? getSessionsByWeek(activeCycle.id, currentWeek)
    : [];

  const program = programs.find(p => p.id === programId);
  const weekDates = getWeekDatesByDayIndex();

  function handleSplitChange(split: WorkoutSplitType) {
    const freq = SPLIT_FREQUENCY[split];
    setWizardForm(f => ({
      ...f,
      split_type: split,
      frequency_per_week: clampFrequency(split, f.frequency_per_week || freq.default),
    }));
  }

  function handleCreateProgram(e: React.FormEvent) {
    e.preventDefault();
    createProgram.mutate(wizardForm, {
      onSuccess: (p) => {
        setWizardOpen(false);
        setWizardForm(DEFAULT_WIZARD);
        setSelectedProgramId((p as { id: string }).id);
      },
    });
  }

  function openCompleteDialog(session: WorkoutSession) {
    const template = templates.find(t => t.id === session.template_id);
    const logs: ExerciseLog[] = (template?.exercises || []).map(ex => ({
      exercise_id: ex.id,
      name: ex.name,
      sets: Array.from({ length: ex.default_sets || 3 }, () => ({
        reps: ex.default_reps || 10,
        load_kg: ex.default_load_kg || 0,
        completed: false,
      })),
    }));
    setExerciseLogs(logs);
    setCompletingSession(session);
    setCompleteOpen(true);
  }

  function handleComplete() {
    if (!completingSession) return;
    completeSession.mutate({
      session: completingSession,
      exercisesLog: exerciseLogs,
      durationMinutes: duration,
    }, {
      onSuccess: () => {
        setCompleteOpen(false);
        setCompletingSession(null);
      },
    });
  }

  function handleGenerateWeek() {
    if (!programId || !activeCycle) return;
    generateWeek.mutate({
      programId,
      cycleId: activeCycle.id,
      weekNumber: currentWeek,
      weekDates,
    });
  }

  function updateSet(exIdx: number, setIdx: number, field: keyof ExerciseSet, value: number) {
    setExerciseLogs(prev => prev.map((log, i) =>
      i === exIdx
        ? { ...log, sets: log.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s) }
        : log,
    ));
  }

  if (isLoading) return <div className="flex justify-center py-20"><div className="arrow-spinner" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold arrow-gradient-text">Treinos</h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
            Programas, agenda e evolução de carga
          </p>
        </div>
        <button onClick={() => setWizardOpen(true)} className="arrow-btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Programa
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
        {/* Sidebar programas */}
        <div className="space-y-3">
          <div className="arrow-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: theme.textMuted }}>
              Programas
            </h3>
            {programs.length === 0 ? (
              <p className="text-xs" style={{ color: theme.textMuted }}>Nenhum programa ainda</p>
            ) : (
              <div className="space-y-1">
                {programs.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProgramId(p.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors"
                    style={{
                      background: programId === p.id
                        ? isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
                        : 'transparent',
                      color: programId === p.id ? theme.textPrimary : theme.textSecondary,
                      fontWeight: programId === p.id ? 600 : 400,
                    }}
                  >
                    <Dumbbell className="w-4 h-4 flex-shrink-0" style={{ color: theme.accent }} />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm truncate block">{p.name}</span>
                      <span className="text-[10px]" style={{ color: theme.textMuted }}>
                        {p.split_type}
                        {p.frequency_per_week ? ` · ${p.frequency_per_week}×/sem` : ''}
                        {p.focus ? ` · ${FOCUS_LABELS[p.focus]}` : ''}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {program && (
            <div className="arrow-card p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: theme.textMuted }}>Sessões semana</span>
                <span className="font-semibold" style={{ color: theme.textPrimary }}>
                  {weekSessions.filter(s => s.status === 'feito').length}/{weekSessions.length}
                </span>
              </div>
              {activeCycle && (
                <button onClick={handleGenerateWeek} className="arrow-btn-secondary w-full text-xs py-2 flex items-center justify-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Gerar Semana
                </button>
              )}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="space-y-5">
          {!program ? (
            <div className="arrow-card p-12 text-center">
              <Dumbbell className="w-12 h-12 mx-auto mb-3" style={{ color: theme.textMuted }} />
              <p style={{ color: theme.textMuted }}>Crie um programa de treino para começar</p>
            </div>
          ) : (
            <>
              {/* Agenda semanal + atribuição de dias */}
              <div className="arrow-card p-5">
                <h3 className="font-semibold mb-1" style={{ color: theme.textPrimary }}>Agenda Semanal</h3>
                <p className="text-xs mb-4" style={{ color: theme.textMuted }}>
                  Clique em um dia para atribuir um treino
                </p>
                <div className="grid grid-cols-7 gap-2">
                  {DISPLAY_DAY_ORDER.map((dayIndex) => {
                    const date = weekDates[dayIndex];
                    const session = weekSessions.find(s => s.date === date);
                    const scheduled = program.schedule?.find(s => s.day === dayIndex);
                    const scheduledTemplate = scheduled
                      ? templates.find(t => t.id === scheduled.template_id)
                      : null;
                    const isDone = session?.status === 'feito';

                    return (
                      <div key={date} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-medium" style={{ color: theme.textMuted }}>
                          {DAY_NAMES[dayIndex]}
                        </span>
                        <div className="relative w-full">
                          <select
                            value={scheduled?.template_id || ''}
                            onChange={e => {
                              const templateId = e.target.value;
                              const schedule = [...(program.schedule || [])].filter(s => s.day !== dayIndex);
                              if (templateId) schedule.push({ day: dayIndex, template_id: templateId });
                              updateProgram.mutate({ id: program.id, schedule });
                            }}
                            className="w-full aspect-square rounded-xl text-center text-xs appearance-none cursor-pointer"
                            style={{
                              background: isDone
                                ? 'rgba(34,197,94,0.15)'
                                : scheduledTemplate
                                  ? theme.accentLight
                                  : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                              border: `1px solid ${isDone ? 'rgba(34,197,94,0.3)' : theme.border}`,
                              color: theme.textPrimary,
                            }}
                          >
                            <option value="">—</option>
                            {templates.map(t => (
                              <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                          </select>
                          {isDone && (
                            <CheckCircle2 className="w-3 h-3 text-green-500 absolute bottom-1 right-1 pointer-events-none" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Treino de hoje */}
              {todaySession && (
                <div className="arrow-card p-5" style={{ borderLeft: `4px solid ${theme.accent}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold" style={{ color: theme.textPrimary }}>Treino de Hoje</h3>
                    <button onClick={() => openCompleteDialog(todaySession)}
                      className="arrow-btn-primary text-sm py-1.5 px-4 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Marcar Feito
                    </button>
                  </div>
                  {templates.find(t => t.id === todaySession.template_id) && (
                    <p className="text-sm" style={{ color: theme.textSecondary }}>
                      {templates.find(t => t.id === todaySession.template_id)?.name}
                    </p>
                  )}
                </div>
              )}

              {/* Templates / exercícios */}
              <div className="arrow-card p-5">
                <h3 className="font-semibold mb-4" style={{ color: theme.textPrimary }}>
                  Treinos do Programa ({program.split_type})
                </h3>
                <div className="space-y-4">
                  {templates.map(template => (
                    <div key={template.id} className="rounded-xl p-4"
                      style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                            style={{ background: theme.accent }}>
                            {template.label}
                          </span>
                          {editingTemplate === template.id ? (
                            <input
                              defaultValue={template.name}
                              onBlur={e => {
                                updateTemplate.mutate({ id: template.id, name: e.target.value });
                                setEditingTemplate(null);
                              }}
                              className="text-sm font-semibold bg-transparent border-b outline-none"
                              autoFocus
                            />
                          ) : (
                            <h4 className="font-semibold text-sm" style={{ color: theme.textPrimary }}>
                              {template.name}
                            </h4>
                          )}
                          <button onClick={() => setEditingTemplate(template.id)}>
                            <Edit2 className="w-3.5 h-3.5" style={{ color: theme.textMuted }} />
                          </button>
                        </div>
                        <button onClick={() => setProgressExercise(template.exercises[0]?.name || null)}>
                          <TrendingUp className="w-4 h-4" style={{ color: theme.accent }} />
                        </button>
                      </div>

                      {/* Exercícios */}
                      <div className="space-y-2">
                        {(template.exercises || []).map((ex, i) => (
                          <div key={ex.id || i} className="flex items-center gap-3 text-sm px-2 py-1.5 rounded-lg"
                            style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                            <Circle className="w-3 h-3 flex-shrink-0" style={{ color: theme.textMuted }} />
                            <span className="flex-1" style={{ color: theme.textPrimary }}>{ex.name}</span>
                            <span className="text-xs" style={{ color: theme.textMuted }}>
                              {ex.default_sets}×{ex.default_reps}
                              {ex.default_load_kg ? ` @ ${ex.default_load_kg}kg` : ''}
                            </span>
                            <button onClick={() => setProgressExercise(ex.name)}>
                              <TrendingUp className="w-3 h-3" style={{ color: theme.textMuted }} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const defs = defaultExercisesForFocus(program?.focus || 'hipertrofia');
                            const newEx: WorkoutExercise = {
                              id: crypto.randomUUID(),
                              name: 'Novo Exercício',
                              ...defs,
                            };
                            updateTemplate.mutate({
                              id: template.id,
                              exercises: [...(template.exercises || []), newEx],
                            });
                          }}
                          className="text-xs flex items-center gap-1 mt-1"
                          style={{ color: theme.accent }}
                        >
                          <Plus className="w-3 h-3" /> Adicionar exercício
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evolução de carga */}
              {progressExercise && progressData && progressData.length > 0 && (
                <div className="arrow-card p-5">
                  <h3 className="font-semibold mb-4" style={{ color: theme.textPrimary }}>
                    Evolução: {progressExercise}
                  </h3>
                  <div className="flex items-end gap-2 h-32">
                    {progressData.map((point, i) => {
                      const maxLoad = Math.max(...progressData.map(p => p.max_load_kg), 1);
                      const height = (point.max_load_kg / maxLoad) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[10px] font-medium" style={{ color: theme.accent }}>
                            {point.max_load_kg}kg
                          </span>
                          <div className="w-full rounded-t-md transition-all"
                            style={{ height: `${height}%`, background: theme.accent, minHeight: 4 }} />
                          <span className="text-[9px]" style={{ color: theme.textMuted }}>
                            {point.date.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sessões da semana */}
              {weekSessions.length > 0 && (
                <div className="arrow-card p-5">
                  <h3 className="font-semibold mb-3" style={{ color: theme.textPrimary }}>Sessões da Semana</h3>
                  <div className="space-y-2">
                    {weekSessions.map(session => {
                      const tmpl = templates.find(t => t.id === session.template_id);
                      return (
                        <div key={session.id} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                          style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
                          {session.status === 'feito'
                            ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                            : <Circle className="w-4 h-4" style={{ color: theme.textMuted }} />}
                          <span className="text-sm flex-1" style={{ color: theme.textPrimary }}>
                            {tmpl?.label} — {tmpl?.name} ({session.date})
                          </span>
                          {session.status !== 'feito' && (
                            <button onClick={() => openCompleteDialog(session)}
                              className="text-xs px-3 py-1 rounded-lg"
                              style={{ background: theme.accentLight, color: theme.accent }}>
                              Concluir
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button onClick={() => programId && deleteProgram.mutate(programId)}
                className="text-xs flex items-center gap-1 text-red-400 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" /> Excluir programa
              </button>
            </>
          )}
        </div>
      </div>

      {/* Wizard novo programa */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Novo Programa de Treino</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateProgram} className="space-y-5 mt-2">
            <div>
              <label className="arrow-label block mb-1.5">Nome do programa</label>
              <input required value={wizardForm.name}
                onChange={e => setWizardForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border text-sm" placeholder="Ex: Hipertrofia 2026" />
            </div>

            <div>
              <label className="arrow-label block mb-1.5">Divisão (split)</label>
              <div className="flex gap-2 flex-wrap">
                {SPLIT_OPTIONS.map(s => (
                  <button key={s} type="button"
                    onClick={() => handleSplitChange(s)}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      background: wizardForm.split_type === s ? theme.accent : theme.accentLight,
                      color: wizardForm.split_type === s ? '#fff' : theme.accent,
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="arrow-label">Frequência semanal</label>
                <span className="text-sm font-bold" style={{ color: theme.accent }}>
                  {wizardForm.frequency_per_week}× por semana
                </span>
              </div>
              <p className="text-[11px] mb-2" style={{ color: theme.textMuted }}>
                {SPLIT_FREQUENCY[wizardForm.split_type].label}
              </p>
              <input
                type="range"
                min={SPLIT_FREQUENCY[wizardForm.split_type].min}
                max={SPLIT_FREQUENCY[wizardForm.split_type].max}
                value={wizardForm.frequency_per_week}
                onChange={e => setWizardForm(f => ({
                  ...f,
                  frequency_per_week: Number(e.target.value),
                }))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] mt-1" style={{ color: theme.textMuted }}>
                <span>{SPLIT_FREQUENCY[wizardForm.split_type].min}×</span>
                <span>{SPLIT_FREQUENCY[wizardForm.split_type].max}×</span>
              </div>
            </div>

            <div>
              <label className="arrow-label block mb-2">Foco do treino</label>
              <div className="grid grid-cols-3 gap-2">
                {FOCUS_OPTIONS.map(opt => {
                  const FocusIcon = opt.icon;
                  return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setWizardForm(f => ({ ...f, focus: opt.id }))}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl text-center transition-all"
                    style={{
                      background: wizardForm.focus === opt.id ? theme.accentLight : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                      border: `2px solid ${wizardForm.focus === opt.id ? theme.accent : 'transparent'}`,
                    }}
                  >
                    <FocusIcon className="w-5 h-5" style={{ color: wizardForm.focus === opt.id ? theme.accent : theme.textMuted }} />
                    <span className="text-xs font-semibold" style={{ color: theme.textPrimary }}>{opt.label}</span>
                    <span className="text-[9px] leading-tight" style={{ color: theme.textMuted }}>{opt.description}</span>
                  </button>
                  );
                })}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={wizardForm.create_habit}
                onChange={e => setWizardForm(f => ({ ...f, create_habit: e.target.checked }))} />
              Criar hábito vinculado ({wizardForm.frequency_per_week}× por semana)
            </label>
            <button type="submit" className="arrow-btn-primary w-full">Criar Programa</button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog completar treino */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar Treino</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            {exerciseLogs.map((log, exIdx) => (
              <div key={exIdx} className="rounded-xl p-3" style={{ background: theme.accentLight }}>
                <h4 className="font-semibold text-sm mb-2" style={{ color: theme.textPrimary }}>{log.name}</h4>
                <div className="space-y-1">
                  {log.sets.map((set, setIdx) => (
                    <div key={setIdx} className="flex items-center gap-2 text-sm">
                      <span className="w-6 text-xs" style={{ color: theme.textMuted }}>S{setIdx + 1}</span>
                      <input type="number" value={set.reps}
                        onChange={e => updateSet(exIdx, setIdx, 'reps', Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded border text-xs" placeholder="reps" />
                      <span className="text-xs" style={{ color: theme.textMuted }}>×</span>
                      <input type="number" value={set.load_kg || 0}
                        onChange={e => updateSet(exIdx, setIdx, 'load_kg', Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded border text-xs" placeholder="kg" />
                      <span className="text-xs" style={{ color: theme.textMuted }}>kg</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <label className="arrow-label block mb-1.5">Duração (min)</label>
              <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-xl border text-sm" />
            </div>
            <button onClick={handleComplete} className="arrow-btn-primary w-full flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Confirmar Treino
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
