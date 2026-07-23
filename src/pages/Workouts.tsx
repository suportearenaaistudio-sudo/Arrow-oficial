import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dumbbell, Plus, CheckCircle2, Circle, Calendar, TrendingUp,
  Trash2, SkipForward,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useWorkouts, useWorkoutTemplates, useExerciseProgress } from '@/hooks/useWorkouts';
import { useCycles, getCurrentWeek } from '@/hooks/useCycles';
import { usePageContextMenu } from '@/contexts/DesktopContextMenuContext';
import type {
  WorkoutSplitType, WorkoutSession, ExerciseLog, ExerciseSet, WorkoutFocus,
  WorkoutTrainingType, WorkoutScheduleEntry,
} from '@/types/arrow';
import WorkoutProgramWizard, { DEFAULT_WIZARD, type WorkoutWizardForm } from '@/components/workouts/WorkoutProgramWizard';
import WorkoutTemplateEditor from '@/components/workouts/WorkoutTemplateEditor';
import WorkoutCompleteDialog from '@/components/workouts/WorkoutCompleteDialog';
import WorkoutPerformancePanel from '@/components/workouts/WorkoutPerformancePanel';
import {
  SPLIT_FREQUENCY, clampFrequency, buildTemplateDrafts,
  TRAINING_TYPE_OPTIONS, TRAINING_TYPE_LABELS, trainingUsesSplit, WEEKDAY_LABELS, WEEKDAY_ORDER,
} from '@/lib/workout-config';

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

const DISPLAY_DAY_ORDER = WEEKDAY_ORDER;

export default function Workouts() {
  const { theme, isDark } = useTheme();
  const { activeCycle } = useCycles();
  const {
    programs, activePrograms, isLoading,
    createProgram, updateProgram, deleteProgram, updateSession,
    completeSession, generateWeek, getTodaySession, getSessionsByWeek,
  } = useWorkouts();

  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const programId = selectedProgramId || activePrograms[0]?.id || programs[0]?.id || null;
  const { templates, updateTemplate } = useWorkoutTemplates(programId);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardForm, setWizardForm] = useState<WorkoutWizardForm>(DEFAULT_WIZARD);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completingSession, setCompletingSession] = useState<WorkoutSession | null>(null);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [duration, setDuration] = useState(60);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [progressExercise, setProgressExercise] = useState<{ name: string; id?: string } | null>(null);

  usePageContextMenu(
    () => [
      {
        id: 'new-program',
        label: 'Novo programa',
        icon: Plus,
        onClick: () => setWizardOpen(true),
      },
    ],
    [],
  );

  const { data: progressData } = useExerciseProgress(
    progressExercise?.name ?? null,
    progressExercise?.id,
  );
  const todaySession = getTodaySession(programId ?? undefined);
  const currentWeek = activeCycle ? getCurrentWeek(activeCycle) : 1;
  const weekSessions = activeCycle && programId
    ? getSessionsByWeek(activeCycle.id, currentWeek, programId)
    : [];

  const program = programs.find(p => p.id === programId);
  const weekDates = getWeekDatesByDayIndex();

  function handleTrainingTypeChange(type: WorkoutTrainingType) {
    const opt = TRAINING_TYPE_OPTIONS.find(t => t.id === type)!;
    const usesSplit = trainingUsesSplit(type);
    setWizardForm(f => ({
      ...f,
      training_type: type,
      focus: opt.defaultFocus,
      split_type: usesSplit ? f.split_type : 'custom',
      frequency_per_week: usesSplit ? f.frequency_per_week : Math.min(f.frequency_per_week, f.days_of_week.length || 3),
      templates: buildTemplateDrafts(f.split_type, opt.defaultFocus, usesSplit),
    }));
  }

  function toggleWizardDay(day: number) {
    setWizardForm(f => {
      const has = f.days_of_week.includes(day);
      if (has) {
        return { ...f, days_of_week: f.days_of_week.filter(d => d !== day) };
      }
      if (f.days_of_week.length >= f.frequency_per_week) return f;
      return { ...f, days_of_week: [...f.days_of_week, day].sort((a, b) => a - b) };
    });
  }

  function handleFrequencyChange(freq: number) {
    setWizardForm(f => {
      let days = [...f.days_of_week];
      while (days.length > freq) days = days.slice(0, -1);
      return { ...f, frequency_per_week: freq, days_of_week: days };
    });
  }

  function handleSplitChange(split: WorkoutSplitType) {
    const freq = SPLIT_FREQUENCY[split];
    setWizardForm(f => {
      const usesSplit = trainingUsesSplit(f.training_type);
      return {
        ...f,
        split_type: split,
        frequency_per_week: clampFrequency(split, f.frequency_per_week || freq.default),
        templates: buildTemplateDrafts(split, f.focus, usesSplit),
      };
    });
  }

  function handleCreateProgram(e: React.FormEvent) {
    e.preventDefault();
    if (!wizardForm.name.trim()) return;
    if (wizardForm.days_of_week.length === 0) return;
    createProgram.mutate({
      ...wizardForm,
      cycle_id: activeCycle?.id,
    }, {
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
    setDuration(session.planned_duration_minutes || 60);
    setCompletingSession(session);
    setCompleteOpen(true);
  }

  function handleComplete() {
    if (!completingSession) return;
    const logsWithCompleted = exerciseLogs.map(log => ({
      ...log,
      sets: log.sets.map(s => ({ ...s, completed: s.completed ?? true })),
    }));
    completeSession.mutate({
      session: completingSession,
      exercisesLog: logsWithCompleted,
      durationMinutes: duration,
    }, {
      onSuccess: () => {
        setCompleteOpen(false);
        setCompletingSession(null);
      },
    });
  }

  function handleSkipSession(session: WorkoutSession) {
    updateSession.mutate({ id: session.id, status: 'pulado' });
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

  function updateSet(exIdx: number, setIdx: number, field: keyof ExerciseSet, value: number | boolean) {
    setExerciseLogs(prev => prev.map((log, i) =>
      i === exIdx
        ? { ...log, sets: log.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s) }
        : log,
    ));
  }

  function toggleSetComplete(exIdx: number, setIdx: number) {
    setExerciseLogs(prev => prev.map((log, i) =>
      i === exIdx
        ? {
            ...log,
            sets: log.sets.map((s, j) =>
              j === setIdx ? { ...s, completed: !s.completed } : s,
            ),
          }
        : log,
    ));
  }

  function addSet(exIdx: number) {
    setExerciseLogs(prev => prev.map((log, i) => {
      if (i !== exIdx) return log;
      const last = log.sets[log.sets.length - 1];
      return {
        ...log,
        sets: [...log.sets, {
          reps: last?.reps ?? 10,
          load_kg: last?.load_kg ?? 0,
          completed: false,
        }],
      };
    }));
  }

  function removeSet(exIdx: number, setIdx: number) {
    setExerciseLogs(prev => prev.map((log, i) =>
      i === exIdx
        ? { ...log, sets: log.sets.filter((_, j) => j !== setIdx) }
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
                      opacity: p.is_active ? 1 : 0.65,
                    }}
                  >
                    <Dumbbell className="w-4 h-4 flex-shrink-0" style={{ color: theme.accent }} />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm truncate block">{p.name}</span>
                      <span className="text-[10px]" style={{ color: theme.textMuted }}>
                        {TRAINING_TYPE_LABELS[p.training_type || 'academia']}
                        {p.split_type && trainingUsesSplit(p.training_type || 'academia') ? ` · ${p.split_type}` : ''}
                        {p.frequency_per_week ? ` · ${p.frequency_per_week}×/sem` : ''}
                        {p.duration_weeks ? ` · ${p.duration_weeks} sem` : ''}
                      </span>
                    </div>
                    {p.is_active && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold"
                        style={{ background: theme.accentLight, color: theme.accent }}>
                        ativo
                      </span>
                    )}
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

        <div className="space-y-5">
          {!program ? (
            <div className="arrow-card p-12 text-center">
              <Dumbbell className="w-12 h-12 mx-auto mb-3" style={{ color: theme.textMuted }} />
              <p style={{ color: theme.textMuted }}>Crie um programa de treino para começar</p>
            </div>
          ) : (
            <>
              <WorkoutPerformancePanel programId={programId} />

              <div className="arrow-card p-5">
                <h3 className="font-semibold mb-1" style={{ color: theme.textPrimary }}>Agenda Semanal</h3>
                <p className="text-xs mb-4" style={{ color: theme.textMuted }}>
                  Adicione um ou mais treinos por dia
                </p>
                <div className="grid grid-cols-7 gap-2">
                  {DISPLAY_DAY_ORDER.map((dayIndex) => {
                    const date = weekDates[dayIndex];
                    const daySessions = weekSessions.filter(s => s.date === date);
                    const scheduled = (program.schedule || []).filter(s => s.day === dayIndex);

                    return (
                      <div key={date} className="flex flex-col items-center gap-1 min-w-0">
                        <span className="text-[10px] font-medium" style={{ color: theme.textMuted }}>
                          {WEEKDAY_LABELS[dayIndex]}
                        </span>
                        <div className="w-full space-y-1">
                          {scheduled.map((entry, idx) => {
                            const session = daySessions.find(s => s.template_id === entry.template_id);
                            const isDone = session?.status === 'feito';
                            return (
                              <div key={`${dayIndex}-${idx}`} className="relative">
                                <select
                                  value={entry.template_id}
                                  onChange={e => {
                                    const schedule = [...(program.schedule || [])];
                                    const globalIdx = schedule.findIndex(
                                      (s, i) => s.day === dayIndex &&
                                        schedule.filter(x => x.day === dayIndex).indexOf(s) === idx,
                                    );
                                    if (globalIdx >= 0) {
                                      schedule[globalIdx] = { ...schedule[globalIdx], template_id: e.target.value };
                                      updateProgram.mutate({ id: program.id, schedule });
                                    }
                                  }}
                                  className="w-full rounded-lg text-[10px] px-1 py-1 appearance-none cursor-pointer"
                                  style={{
                                    background: isDone ? 'rgba(34,197,94,0.15)' : theme.accentLight,
                                    border: `1px solid ${theme.border}`,
                                    color: theme.textPrimary,
                                  }}
                                >
                                  {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const schedule = [...(program.schedule || [])];
                                    let count = 0;
                                    const next = schedule.filter(s => {
                                      if (s.day !== dayIndex) return true;
                                      if (count === idx) { count++; return false; }
                                      count++;
                                      return true;
                                    });
                                    updateProgram.mutate({ id: program.id, schedule: next });
                                  }}
                                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[9px] leading-none"
                                  style={{ background: theme.border, color: theme.textMuted }}
                                >
                                  ×
                                </button>
                                <p className="text-[8px] text-center truncate mt-0.5" style={{ color: theme.textMuted }}>
                                  {entry.planned_start_time || '—'}
                                </p>
                              </div>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => {
                              if (templates.length === 0) return;
                              const entry: WorkoutScheduleEntry = {
                                day: dayIndex,
                                template_id: templates[0].id,
                                planned_start_time: '08:00',
                                planned_duration_minutes: 60,
                              };
                              updateProgram.mutate({
                                id: program.id,
                                schedule: [...(program.schedule || []), entry],
                              });
                            }}
                            className="w-full py-1 rounded-lg text-[10px] font-medium"
                            style={{ border: `1px dashed ${theme.border}`, color: theme.accent }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {todaySession && (
                <div className="arrow-card p-5" style={{ borderLeft: `4px solid ${theme.accent}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold" style={{ color: theme.textPrimary }}>Treino de Hoje</h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSkipSession(todaySession)}
                        className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
                        style={{ border: `1px solid ${theme.border}`, color: theme.textMuted }}
                      >
                        <SkipForward className="w-3.5 h-3.5" /> Pular
                      </button>
                      <button onClick={() => openCompleteDialog(todaySession)}
                        className="arrow-btn-primary text-sm py-1.5 px-4 flex items-center gap-1.5"
                        style={{ color: theme.accentForeground }}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Marcar Feito
                      </button>
                    </div>
                  </div>
                  {templates.find(t => t.id === todaySession.template_id) && (
                    <p className="text-sm" style={{ color: theme.textSecondary }}>
                      {templates.find(t => t.id === todaySession.template_id)?.name}
                    </p>
                  )}
                </div>
              )}

              <WorkoutTemplateEditor
                templates={templates}
                programFocus={program.focus}
                editingTemplateId={editingTemplate}
                onEditTemplate={setEditingTemplate}
                onUpdateTemplate={(id, patch) => updateTemplate.mutate({ id, ...patch })}
                onProgressExercise={(name, id) => setProgressExercise({ name, id })}
              />

              {progressExercise && progressData && progressData.length > 0 && (
                <div className="arrow-card p-5">
                  <h3 className="font-semibold mb-4" style={{ color: theme.textPrimary }}>
                    Evolução: {progressExercise.name}
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

              {weekSessions.length > 0 && (
                <div className="arrow-card p-5">
                  <h3 className="font-semibold mb-3" style={{ color: theme.textPrimary }}>Sessões da Semana</h3>
                  <div className="space-y-2">
                    {weekSessions.map(session => {
                      const tmpl = templates.find(t => t.id === session.template_id);
                      const prog = programs.find(p => p.id === session.program_id);
                      const timeLabel = session.planned_start_time
                        ? `${session.planned_start_time}${session.planned_duration_minutes ? ` · ${session.planned_duration_minutes}min` : ''}`
                        : null;
                      const isSkipped = session.status === 'pulado';
                      return (
                        <div key={session.id} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                          style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}>
                          {session.status === 'feito'
                            ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                            : isSkipped
                              ? <SkipForward className="w-4 h-4" style={{ color: theme.textMuted }} />
                              : <Circle className="w-4 h-4" style={{ color: theme.textMuted }} />}
                          <div className="flex-1 min-w-0">
                            <span className="text-sm block truncate" style={{ color: theme.textPrimary }}>
                              {timeLabel ? `${timeLabel} · ` : ''}{tmpl?.label} — {tmpl?.name}
                              {isSkipped ? ' (pulado)' : ''}
                            </span>
                            <span className="text-[10px]" style={{ color: theme.textMuted }}>
                              {session.date}
                              {prog ? ` · ${TRAINING_TYPE_LABELS[prog.training_type || 'academia']}` : ''}
                            </span>
                          </div>
                          {session.status !== 'feito' && session.status !== 'pulado' && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleSkipSession(session)}
                                className="text-xs px-2 py-1 rounded-lg"
                                style={{ color: theme.textMuted }}
                              >
                                Pular
                              </button>
                              <button onClick={() => openCompleteDialog(session)}
                                className="text-xs px-3 py-1 rounded-lg"
                                style={{ background: theme.accentLight, color: theme.accent }}>
                                Concluir
                              </button>
                            </div>
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

      <WorkoutProgramWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        form={wizardForm}
        setForm={setWizardForm}
        onSubmit={handleCreateProgram}
        onTrainingTypeChange={handleTrainingTypeChange}
        onSplitChange={handleSplitChange}
        onFrequencyChange={handleFrequencyChange}
        onToggleDay={toggleWizardDay}
      />

      <WorkoutCompleteDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        exerciseLogs={exerciseLogs}
        duration={duration}
        onDurationChange={setDuration}
        onUpdateSet={updateSet}
        onToggleSetComplete={toggleSetComplete}
        onAddSet={addSet}
        onRemoveSet={removeSet}
        onConfirm={handleComplete}
      />
    </motion.div>
  );
}
