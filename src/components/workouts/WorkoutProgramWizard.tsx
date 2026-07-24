import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import type { DeloadMode, WorkoutExercise, WorkoutFocus, WorkoutSplitType, WorkoutTrainingType } from '@/types/arrow';
import {
  buildTemplateDrafts,
  FOCUS_OPTIONS,
  TRAINING_TYPE_OPTIONS,
  trainingUsesSplit,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
} from '@/lib/workout-config';
import TogglePill from '@/components/ui/TogglePill';
import RingDial from '@/components/ui/RingDial';
import ExercisePrescriptionRow from '@/components/workouts/ExercisePrescriptionRow';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SPLIT_OPTIONS: WorkoutSplitType[] = ['AB', 'ABC', 'ABCD', 'ABCDE'];

export interface WizardTemplateDraft {
  label: string;
  name: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutWizardForm {
  name: string;
  training_type: WorkoutTrainingType;
  split_type: WorkoutSplitType;
  frequency_per_week: number;
  focus: WorkoutFocus;
  days_of_week: number[];
  duration_weeks: number;
  end_date?: string;
  deload_mode: DeloadMode;
  deload_after_sessions?: number;
  deload_after_weeks?: number;
  deload_volume_percent: number;
  create_habit: boolean;
  templates: WizardTemplateDraft[];
}

export function createDefaultWizard(): WorkoutWizardForm {
  return {
    name: '',
    training_type: 'academia',
    split_type: 'ABC',
    frequency_per_week: 4,
    focus: 'hipertrofia',
    days_of_week: [1, 3, 5],
    duration_weeks: 12,
    deload_mode: 'manual',
    deload_after_sessions: 3,
    deload_after_weeks: 4,
    deload_volume_percent: 60,
    create_habit: true,
    templates: buildTemplateDrafts('ABC', 'hipertrofia', true),
  };
}

export const DEFAULT_WIZARD = createDefaultWizard();

interface WorkoutProgramWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: WorkoutWizardForm;
  setForm: React.Dispatch<React.SetStateAction<WorkoutWizardForm>>;
  onSubmit: (e: React.FormEvent) => void;
  onTrainingTypeChange: (type: WorkoutTrainingType) => void;
  onSplitChange: (split: WorkoutSplitType) => void;
  onFrequencyChange: (freq: number) => void;
  onToggleDay: (day: number) => void;
}

export default function WorkoutProgramWizard({
  open,
  onOpenChange,
  form,
  setForm,
  onSubmit,
  onTrainingTypeChange,
  onSplitChange,
  onFrequencyChange,
  onToggleDay,
}: WorkoutProgramWizardProps) {
  const { theme, isDark } = useTheme();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) setStep(0);
  }, [open]);

  function updateTemplateExercises(
    templateLabel: string,
    updater: (exercises: WorkoutExercise[]) => WorkoutExercise[],
  ) {
    setForm((f) => ({
      ...f,
      templates: f.templates.map((t) =>
        t.label === templateLabel ? { ...t, exercises: updater(t.exercises) } : t,
      ),
    }));
  }

  function handleSplitWithTemplates(split: WorkoutSplitType) {
    onSplitChange(split);
    const usesSplit = trainingUsesSplit(form.training_type);
    setForm((f) => ({
      ...f,
      split_type: split,
      templates: buildTemplateDrafts(split, f.focus, usesSplit),
    }));
  }

  const steps = ['Programa', 'Exercícios', 'Revisão'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[min(88vh,720px)] p-0 gap-0 flex flex-col overflow-hidden rounded-2xl">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0 border-b" style={{ borderColor: 'var(--arrow-border)' }}>
          <DialogTitle className="text-base">Novo Programa de Treino</DialogTitle>
          <div className="flex gap-1 mt-2">
            {steps.map((label, i) => (
              <span
                key={label}
                className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: i === step ? theme.accent : theme.accentLight,
                  color: i === step ? theme.accentForeground : theme.accent,
                }}
              >
                {i + 1}. {label}
              </span>
            ))}
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {step === 0 && (
              <>
                <div>
                  <label className="arrow-label block mb-1">Nome do programa</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    placeholder="Ex: Hipertrofia 2026"
                  />
                </div>

                <div className="rounded-2xl p-3 space-y-3" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)' }}>
                  <div><label className="arrow-label block mb-1">Deload e recuperação</label>
                    <select value={form.deload_mode} onChange={(e) => setForm((f) => ({ ...f, deload_mode: e.target.value as DeloadMode }))} className="w-full px-3 py-2 rounded-xl border text-sm">
                      <option value="manual">Manual</option>
                      <option value="sessions">Após um número de sessões de força</option>
                      <option value="weeks">A cada número de semanas</option>
                      <option value="checkin_auto">Automático por queda de desempenho</option>
                    </select>
                  </div>
                  {form.deload_mode === 'sessions' && <label className="text-xs block">Após <input type="number" min={1} value={form.deload_after_sessions ?? 3} onChange={(e) => setForm((f) => ({ ...f, deload_after_sessions: Number(e.target.value) }))} className="w-14 mx-1 px-1 rounded border" /> sessões de força, programar a próxima como recuperação.</label>}
                  {form.deload_mode === 'weeks' && <label className="text-xs block">A cada <input type="number" min={2} value={form.deload_after_weeks ?? 4} onChange={(e) => setForm((f) => ({ ...f, deload_after_weeks: Number(e.target.value) }))} className="w-14 mx-1 px-1 rounded border" /> semanas, programar uma semana reduzida.</label>}
                  {form.deload_mode !== 'manual' && <label className="text-xs block">Volume no deload: <input type="number" min={30} max={90} value={form.deload_volume_percent} onChange={(e) => setForm((f) => ({ ...f, deload_volume_percent: Number(e.target.value) }))} className="w-14 mx-1 px-1 rounded border" />%</label>}
                </div>

                <div
                  className="grid grid-cols-2 gap-3 p-3 rounded-2xl"
                  style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)' }}
                >
                  <RingDial
                    label="Duração"
                    min={4}
                    max={24}
                    value={form.duration_weeks}
                    onChange={(duration_weeks) => setForm((f) => ({ ...f, duration_weeks }))}
                    color={theme.accent}
                    formatValue={(v) => (
                      <>
                        <span className="text-xl font-black tabular-nums leading-none" style={{ color: theme.accent }}>{v}</span>
                        <span className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--arrow-text-muted)' }}>semanas</span>
                      </>
                    )}
                  />
                  <RingDial
                    label="Frequência"
                    min={1}
                    max={7}
                    value={form.frequency_per_week}
                    onChange={onFrequencyChange}
                    color={theme.accent}
                    formatValue={(v) => (
                      <>
                        <span className="text-xl font-black tabular-nums leading-none" style={{ color: theme.accent }}>{v}×</span>
                        <span className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--arrow-text-muted)' }}>por semana</span>
                      </>
                    )}
                  />
                </div>

                <div>
                  <label className="arrow-label block mb-1.5">Tipo de treino</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TRAINING_TYPE_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const selected = form.training_type === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => onTrainingTypeChange(opt.id)}
                          className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl"
                          style={{
                            background: selected ? theme.accentLight : 'transparent',
                            border: `1.5px solid ${selected ? theme.accent : 'var(--arrow-border)'}`,
                          }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color: selected ? theme.accent : theme.textMuted }} />
                          <span className="text-[9px] font-semibold">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {trainingUsesSplit(form.training_type) && (
                  <div>
                    <label className="arrow-label block mb-1.5">Divisão (split)</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {SPLIT_OPTIONS.map((s) => (
                        <TogglePill key={s} selected={form.split_type === s} onClick={() => handleSplitWithTemplates(s)} className="px-3 py-1.5 rounded-full text-xs">
                          {s}
                        </TogglePill>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="arrow-label">Dias da semana</label>
                    <span className="text-[10px] tabular-nums" style={{ color: theme.textMuted }}>
                      {form.days_of_week.length}/{form.frequency_per_week}
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {WEEKDAY_ORDER.map((day) => (
                      <TogglePill
                        key={day}
                        selected={form.days_of_week.includes(day)}
                        disabled={!form.days_of_week.includes(day) && form.days_of_week.length >= form.frequency_per_week}
                        onClick={() => onToggleDay(day)}
                        className="py-1.5 rounded-lg text-[10px]"
                      >
                        {WEEKDAY_LABELS[day]}
                      </TogglePill>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="arrow-label block mb-1.5">Foco do treino</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {FOCUS_OPTIONS.map((opt) => {
                      const FocusIcon = opt.icon;
                      const selected = form.focus === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              focus: opt.id,
                              templates: buildTemplateDrafts(f.split_type, opt.id, trainingUsesSplit(f.training_type)),
                            }));
                          }}
                          className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl"
                          style={{
                            background: selected ? theme.accentLight : 'transparent',
                            border: `1.5px solid ${selected ? theme.accent : 'var(--arrow-border)'}`,
                          }}
                        >
                          <FocusIcon className="w-4 h-4" style={{ color: selected ? theme.accent : theme.textMuted }} />
                          <span className="text-[10px] font-semibold">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <div className="space-y-4">
                {form.templates.map((template) => (
                  <div key={template.label} className="rounded-xl p-3 space-y-2" style={{ border: '1px solid var(--arrow-border)' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: theme.accent, color: theme.accentForeground }}>
                        {template.label}
                      </span>
                      <input
                        value={template.name}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            templates: f.templates.map((t) =>
                              t.label === template.label ? { ...t, name: e.target.value } : t,
                            ),
                          }))
                        }
                        className="flex-1 text-sm font-semibold bg-transparent border-b outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      {template.exercises.map((ex) => (
                        <ExercisePrescriptionRow
                          key={ex.id}
                          exercise={ex}
                          onChange={(patch) =>
                            updateTemplateExercises(template.label, (list) =>
                              list.map((item) => (item.id === ex.id ? { ...item, ...patch } : item)),
                            )
                          }
                          onRemove={() =>
                            updateTemplateExercises(template.label, (list) => list.filter((item) => item.id !== ex.id))
                          }
                          onDuplicate={() =>
                            updateTemplateExercises(template.label, (list) => {
                              const copy = { ...ex, id: crypto.randomUUID(), name: `${ex.name} (cópia)` };
                              const idx = list.findIndex((item) => item.id === ex.id);
                              const next = [...list];
                              next.splice(idx + 1, 0, copy);
                              return next;
                            })
                          }
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const defs = { default_sets: 3, default_reps: 10, rest_seconds: 90 };
                        updateTemplateExercises(template.label, (list) => [
                          ...list,
                          { id: crypto.randomUUID(), name: 'Novo exercício', ...defs },
                        ]);
                      }}
                      className="text-xs flex items-center gap-1"
                      style={{ color: theme.accent }}
                    >
                      <Plus className="w-3 h-3" /> Adicionar exercício
                    </button>
                  </div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3 text-sm">
                <p><strong>Nome:</strong> {form.name || '—'}</p>
                <p><strong>Duração:</strong> {form.duration_weeks} semanas</p>
                <p><strong>Frequência:</strong> {form.frequency_per_week}×/semana</p>
                <p><strong>Dias:</strong> {form.days_of_week.map((d) => WEEKDAY_LABELS[d]).join(', ')}</p>
                {form.templates.map((t) => (
                  <div key={t.label} className="rounded-lg p-2" style={{ background: 'var(--arrow-bg-elevated)' }}>
                    <p className="font-semibold">{t.label} — {t.name}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--arrow-text-muted)' }}>
                      {t.exercises.length} exercícios · {t.exercises.map((e) => e.name).join(', ')}
                    </p>
                  </div>
                ))}
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.create_habit}
                    onChange={(e) => setForm((f) => ({ ...f, create_habit: e.target.checked }))}
                  />
                  Criar hábito vinculado ({form.frequency_per_week}× por semana)
                </label>
              </div>
            )}
          </div>

          <div className="shrink-0 px-5 py-4 flex gap-2 border-t" style={{ borderColor: 'var(--arrow-border)' }}>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: '1px solid var(--arrow-border)', color: theme.textSecondary }}
              >
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 0 && !form.name.trim()) return;
                  setStep((s) => s + 1);
                }}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: theme.accent, color: theme.accentForeground }}
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: theme.accent, color: theme.accentForeground }}
              >
                Criar Programa
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
