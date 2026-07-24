import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Dumbbell,
  Plus,
  Save,
  X,
} from 'lucide-react';
import { useCycles, getCurrentWeek } from '@/hooks/useCycles';
import { useWorkouts } from '@/hooks/useWorkouts';
import {
  buildTemplateDrafts,
  FOCUS_OPTIONS,
  SPLIT_FREQUENCY,
  TRAINING_TYPE_LABELS,
  TRAINING_TYPE_OPTIONS,
  trainingUsesSplit,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
} from '@/lib/workout-config';
import {
  createDefaultWizard,
  type WorkoutWizardForm,
  type WizardTemplateDraft,
} from '@/components/workouts/WorkoutProgramWizard';
import ExercisePrescriptionRow from '@/components/workouts/ExercisePrescriptionRow';
import type {
  DeloadMode,
  WorkoutExercise,
  WorkoutFocus,
  WorkoutSplitType,
  WorkoutTrainingType,
} from '@/types/arrow';

const STEPS = ['Contexto', 'Estrutura', 'Exercícios', 'Agenda e deload', 'Revisão'];
const SPLITS: WorkoutSplitType[] = ['AB', 'ABC', 'ABCD', 'ABCDE', 'custom'];

function weekDates() {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function recoveryTemplate(): WizardTemplateDraft {
  return {
    label: 'R',
    name: 'Recuperação / Deload',
    exercises: [
      {
        id: crypto.randomUUID(),
        name: 'Mobilidade e aquecimento',
        muscle_group: 'Geral',
        default_sets: 2,
        default_reps: 10,
        default_load_kg: 0,
        rest_seconds: 45,
      },
    ],
  };
}

export default function WorkoutProgramPlanner() {
  const { activeCycle } = useCycles();
  const { createProgram, programs, generateWeek } = useWorkouts();
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState(0);
  const [untilCycleEnd, setUntilCycleEnd] = useState(true);
  const [form, setForm] = useState<WorkoutWizardForm>(() => createDefaultWizard());

  const cyclePrograms = programs.filter((program) => program.cycle_id === activeCycle?.id);
  const remainingWeeks = activeCycle
    ? Math.max(1, activeCycle.duration - getCurrentWeek(activeCycle) + 1)
    : form.duration_weeks;
  const regularTemplates = form.templates.filter((template) => template.label !== 'R');
  const recovery = form.templates.find((template) => template.label === 'R');

  function resetBuilder() {
    setCreating(false);
    setStep(0);
    setUntilCycleEnd(true);
    setForm(createDefaultWizard());
  }

  function openBuilder() {
    const initial = createDefaultWizard();
    setForm({
      ...initial,
      duration_weeks: remainingWeeks,
      end_date: activeCycle?.end_date,
    });
    setStep(0);
    setCreating(true);
  }

  function changeTrainingType(trainingType: WorkoutTrainingType) {
    const option = TRAINING_TYPE_OPTIONS.find((item) => item.id === trainingType)!;
    const split = option.usesSplit ? form.split_type : 'custom';
    const frequency = option.usesSplit
      ? SPLIT_FREQUENCY[split].default
      : Math.max(1, form.frequency_per_week);
    setForm((current) => ({
      ...current,
      training_type: trainingType,
      focus: option.defaultFocus,
      split_type: split,
      frequency_per_week: frequency,
      days_of_week: current.days_of_week.slice(0, frequency),
      templates: buildTemplateDrafts(split, option.defaultFocus, option.usesSplit),
    }));
  }

  function changeFocus(focus: WorkoutFocus) {
    setForm((current) => ({
      ...current,
      focus,
      templates: buildTemplateDrafts(
        current.split_type,
        focus,
        trainingUsesSplit(current.training_type),
      ),
    }));
  }

  function changeSplit(split: WorkoutSplitType) {
    const frequency = SPLIT_FREQUENCY[split].default;
    setForm((current) => ({
      ...current,
      split_type: split,
      frequency_per_week: frequency,
      days_of_week: current.days_of_week.slice(0, frequency),
      templates: buildTemplateDrafts(split, current.focus, true),
    }));
  }

  function changeFrequency(value: number) {
    const frequency = Math.min(7, Math.max(1, value));
    setForm((current) => ({
      ...current,
      frequency_per_week: frequency,
      days_of_week: current.days_of_week.slice(0, frequency),
    }));
  }

  function toggleDay(day: number) {
    setForm((current) => {
      if (current.days_of_week.includes(day)) {
        return {
          ...current,
          days_of_week: current.days_of_week.filter((item) => item !== day),
        };
      }
      if (current.days_of_week.length >= current.frequency_per_week) return current;
      return {
        ...current,
        days_of_week: [...current.days_of_week, day].sort((a, b) => a - b),
      };
    });
  }

  function updateTemplate(
    templateIndex: number,
    updater: (template: WizardTemplateDraft) => WizardTemplateDraft,
  ) {
    setForm((current) => ({
      ...current,
      templates: current.templates.map((template, index) =>
        index === templateIndex ? updater(template) : template,
      ),
    }));
  }

  function updateExercise(
    templateIndex: number,
    exerciseIndex: number,
    patch: Partial<WorkoutExercise>,
  ) {
    updateTemplate(templateIndex, (template) => ({
      ...template,
      exercises: template.exercises.map((exercise, index) =>
        index === exerciseIndex ? { ...exercise, ...patch } : exercise,
      ),
    }));
  }

  function selectDeloadMode(mode: DeloadMode) {
    setForm((current) => ({
      ...current,
      deload_mode: mode,
      templates:
        mode !== 'manual' && !current.templates.some((template) => template.label === 'R')
          ? [...current.templates, recoveryTemplate()]
          : current.templates,
    }));
  }

  function canContinue() {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) {
      return form.frequency_per_week > 0 && form.days_of_week.length > 0;
    }
    if (step === 2) {
      return regularTemplates.length > 0
        && regularTemplates.every(
          (template) =>
            template.name.trim()
            && template.exercises.length > 0
            && template.exercises.every((exercise) => exercise.name.trim()),
        );
    }
    if (step === 3 && form.deload_mode !== 'manual') {
      return Boolean(recovery?.exercises.some((exercise) => exercise.name.trim()));
    }
    return true;
  }

  function submit() {
    if (!activeCycle || !canContinue()) return;
    createProgram.mutate(
      {
        ...form,
        cycle_id: activeCycle.id,
        duration_weeks: untilCycleEnd ? remainingWeeks : form.duration_weeks,
        end_date: untilCycleEnd ? activeCycle.end_date : form.end_date,
        templates: form.templates,
      },
      {
        onSuccess: (program) => {
          generateWeek.mutate({
            programId: (program as { id: string }).id,
            cycleId: activeCycle.id,
            weekNumber: getCurrentWeek(activeCycle),
            weekDates: weekDates(),
          });
          resetBuilder();
        },
      },
    );
  }

  const summary = useMemo(
    () => [
      ['Tipo', TRAINING_TYPE_LABELS[form.training_type]],
      ['Foco', FOCUS_OPTIONS.find((option) => option.id === form.focus)?.label ?? form.focus],
      ['Estrutura', trainingUsesSplit(form.training_type) ? form.split_type : 'Sessões'],
      ['Frequência', `${form.frequency_per_week}x por semana`],
      ['Duração', untilCycleEnd ? `até o fim do ciclo (${remainingWeeks} semanas)` : `${form.duration_weeks} semanas`],
      [
        'Deload',
        form.deload_mode === 'manual'
          ? 'Manual'
          : form.deload_mode === 'sessions'
            ? `Após ${form.deload_after_sessions ?? 3} sessões`
            : form.deload_mode === 'weeks'
              ? `A cada ${form.deload_after_weeks ?? 4} semanas`
              : 'Automático por check-in',
      ],
    ],
    [form, remainingWeeks, untilCycleEnd],
  );

  if (!creating) {
    return (
      <section className="arrow-card p-5">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h2 className="font-semibold flex gap-2 items-center">
              <Dumbbell className="w-4 h-4" style={{ color: 'var(--arrow-accent)' }} />
              Programas de treino
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--arrow-text-muted)' }}>
              Configure sessões, exercícios, agenda e recuperação dentro do ciclo.
            </p>
          </div>
          <button className="arrow-btn-primary text-sm" onClick={openBuilder}>
            <Plus className="w-4 h-4 inline mr-1" />
            Novo programa
          </button>
        </div>
        <div className="mt-4 grid md:grid-cols-2 gap-3">
          {cyclePrograms.map((program) => (
            <div key={program.id} className="rounded-xl border p-4">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">{program.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--arrow-text-muted)' }}>
                    {TRAINING_TYPE_LABELS[program.training_type ?? 'academia']} ·{' '}
                    {program.frequency_per_week}x/semana
                  </p>
                </div>
                <span
                  className="text-[10px] rounded-full px-2 py-1 h-fit"
                  style={{
                    background: program.is_active
                      ? 'rgba(34,197,94,0.12)'
                      : 'var(--arrow-bg-elevated)',
                    color: program.is_active ? '#22c55e' : 'var(--arrow-text-muted)',
                  }}
                >
                  {program.is_active ? 'Ativo' : 'Pausado'}
                </span>
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--arrow-text-muted)' }}>
                {program.end_date
                  ? `Até ${new Date(`${program.end_date}T12:00:00`).toLocaleDateString('pt-BR')}`
                  : `${program.duration_weeks} semanas`}
              </p>
            </div>
          ))}
          {!cyclePrograms.length && (
            <div className="rounded-xl border border-dashed p-6 text-center md:col-span-2">
              <p className="text-sm" style={{ color: 'var(--arrow-text-muted)' }}>
                Nenhum programa vinculado a este ciclo.
              </p>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="arrow-card overflow-hidden">
      <header
        className="p-5 flex justify-between gap-4 border-b"
        style={{ borderColor: 'var(--arrow-border)' }}
      >
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.18em] font-semibold"
            style={{ color: 'var(--arrow-accent)' }}
          >
            Programa vinculado a {activeCycle?.title}
          </p>
          <h2 className="text-xl font-bold mt-1">Criar programa de treino</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--arrow-text-muted)' }}>
            Etapa {step + 1} de {STEPS.length} · {STEPS[step]}
          </p>
        </div>
        <button onClick={resetBuilder} className="p-2 h-fit" title="Fechar">
          <X className="w-4 h-4" />
        </button>
      </header>

      <div
        className="grid grid-cols-5 border-b"
        style={{ borderColor: 'var(--arrow-border)' }}
      >
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => index <= step && setStep(index)}
            className="px-2 py-3 text-[10px] font-semibold border-r last:border-r-0"
            style={{
              borderColor: 'var(--arrow-border)',
              background: index === step ? 'var(--arrow-accent-light)' : 'transparent',
              color:
                index === step
                  ? 'var(--arrow-accent)'
                  : index < step
                    ? 'var(--arrow-text-primary)'
                    : 'var(--arrow-text-muted)',
            }}
          >
            {index < step && <Check className="w-3 h-3 inline mr-1" />}
            {index + 1}. {label}
          </button>
        ))}
      </div>

      <div className="p-5 min-h-[420px]">
        {step === 0 && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="text-sm font-medium">
                Nome do programa
                <input
                  autoFocus
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Ex.: Força 12 semanas"
                  className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
                />
              </label>
              <div className="text-sm font-medium">
                Período
                <label className="mt-2 flex gap-2 items-center text-xs font-normal">
                  <input
                    type="checkbox"
                    checked={untilCycleEnd}
                    onChange={(event) => setUntilCycleEnd(event.target.checked)}
                  />
                  Seguir até o fim do ciclo ({remainingWeeks} semanas restantes)
                </label>
                {!untilCycleEnd && (
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={form.duration_weeks}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        duration_weeks: Number(event.target.value),
                      }))
                    }
                    className="mt-2 w-28 rounded-xl border px-3 py-2 text-sm"
                  />
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Tipo de treino</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {TRAINING_TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = form.training_type === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => changeTrainingType(option.id)}
                      className="rounded-xl border p-3 text-center"
                      style={{
                        borderColor: selected
                          ? 'var(--arrow-accent)'
                          : 'var(--arrow-border)',
                        background: selected ? 'var(--arrow-accent-light)' : 'transparent',
                      }}
                    >
                      <Icon
                        className="w-5 h-5 mx-auto mb-1.5"
                        style={{
                          color: selected
                            ? 'var(--arrow-accent)'
                            : 'var(--arrow-text-muted)',
                        }}
                      />
                      <span className="text-xs font-semibold">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Objetivo principal</p>
              <div className="grid sm:grid-cols-3 gap-2">
                {FOCUS_OPTIONS.map((option) => {
                  const selected = form.focus === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => changeFocus(option.id)}
                      className="rounded-xl border p-3 text-left"
                      style={{
                        borderColor: selected
                          ? 'var(--arrow-accent)'
                          : 'var(--arrow-border)',
                        background: selected ? 'var(--arrow-accent-light)' : 'transparent',
                      }}
                    >
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="text-[10px] mt-1" style={{ color: 'var(--arrow-text-muted)' }}>
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            {trainingUsesSplit(form.training_type) && (
              <div>
                <p className="text-sm font-medium">Divisão das sessões</p>
                <p className="text-xs mt-1" style={{ color: 'var(--arrow-text-muted)' }}>
                  Define os modelos que você personalizará na próxima etapa.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {SPLITS.map((split) => (
                    <button
                      key={split}
                      type="button"
                      onClick={() => changeSplit(split)}
                      className="rounded-full border px-4 py-2 text-xs font-semibold"
                      style={{
                        background:
                          form.split_type === split
                            ? 'var(--arrow-accent-light)'
                            : 'transparent',
                        borderColor:
                          form.split_type === split
                            ? 'var(--arrow-accent)'
                            : 'var(--arrow-border)',
                      }}
                    >
                      {split === 'custom' ? 'Personalizado' : split}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className="text-sm font-medium block max-w-xs">
              Frequência semanal
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={form.frequency_per_week}
                  onChange={(event) => changeFrequency(Number(event.target.value))}
                  className="flex-1 accent-orange-500"
                />
                <strong className="text-lg">{form.frequency_per_week}x</strong>
              </div>
            </label>

            <div>
              <p className="text-sm font-medium">Dias sugeridos</p>
              <p className="text-xs mt-1" style={{ color: 'var(--arrow-text-muted)' }}>
                Você poderá mudar a agenda de cada semana depois.
              </p>
              <div className="grid grid-cols-7 gap-2 mt-3">
                {WEEKDAY_ORDER.map((day) => {
                  const selected = form.days_of_week.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className="rounded-xl border py-3 text-xs font-semibold"
                      style={{
                        background: selected ? 'var(--arrow-accent-light)' : 'transparent',
                        borderColor: selected
                          ? 'var(--arrow-accent)'
                          : 'var(--arrow-border)',
                      }}
                    >
                      {WEEKDAY_LABELS[day]}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] mt-2" style={{ color: 'var(--arrow-text-muted)' }}>
                {form.days_of_week.length}/{form.frequency_per_week} dias selecionados
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Exercícios prescritos</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--arrow-text-muted)' }}>
                Séries e reps são a prescrição. Ao registrar o treino, a carga é preenchida uma vez por exercício.
              </p>
            </div>
            {regularTemplates.map((template) => {
              const templateIndex = form.templates.findIndex(
                (item) => item.label === template.label,
              );
              return (
                <div key={template.label} className="rounded-2xl border p-4">
                  <div className="flex gap-2 mb-3">
                    <input
                      value={template.label}
                      onChange={(event) =>
                        updateTemplate(templateIndex, (current) => ({
                          ...current,
                          label: event.target.value,
                        }))
                      }
                      className="w-14 rounded-xl border px-2 py-2 text-sm font-bold text-center"
                    />
                    <input
                      value={template.name}
                      onChange={(event) =>
                        updateTemplate(templateIndex, (current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className="flex-1 rounded-xl border px-3 py-2 text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-2 overflow-x-auto">
                    {template.exercises.map((exercise, exerciseIndex) => (
                      <ExercisePrescriptionRow
                        key={exercise.id}
                        exercise={exercise}
                        onChange={(patch) =>
                          updateExercise(templateIndex, exerciseIndex, patch)
                        }
                        onDuplicate={() =>
                          updateTemplate(templateIndex, (current) => ({
                            ...current,
                            exercises: [
                              ...current.exercises.slice(0, exerciseIndex + 1),
                              { ...exercise, id: crypto.randomUUID() },
                              ...current.exercises.slice(exerciseIndex + 1),
                            ],
                          }))
                        }
                        onRemove={() =>
                          updateTemplate(templateIndex, (current) => ({
                            ...current,
                            exercises: current.exercises.filter(
                              (_, index) => index !== exerciseIndex,
                            ),
                          }))
                        }
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateTemplate(templateIndex, (current) => ({
                        ...current,
                        exercises: [
                          ...current.exercises,
                          {
                            id: crypto.randomUUID(),
                            name: '',
                            default_sets: 3,
                            default_reps: 10,
                            default_load_kg: 0,
                            rest_seconds: 90,
                          },
                        ],
                      }))
                    }
                    className="arrow-btn-secondary text-xs mt-3"
                  >
                    <Plus className="w-3.5 h-3.5 inline mr-1" />
                    Exercício
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4" style={{ color: 'var(--arrow-accent)' }} />
                Deload e recuperação
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--arrow-text-muted)' }}>
                A recuperação usa um modelo próprio e substitui a próxima sessão quando a regra for acionada.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {([
                ['manual', 'Manual', 'Você decide quando usar recuperação'],
                ['sessions', 'Por sessões', 'Após N sessões de força'],
                ['weeks', 'Por semanas', 'A cada N semanas'],
                ['checkin_auto', 'Por check-in', 'Queda de desempenho aciona a próxima'],
              ] as Array<[DeloadMode, string, string]>).map(([mode, title, description]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => selectDeloadMode(mode)}
                  className="rounded-xl border p-3 text-left"
                  style={{
                    background:
                      form.deload_mode === mode ? 'var(--arrow-accent-light)' : 'transparent',
                    borderColor:
                      form.deload_mode === mode
                        ? 'var(--arrow-accent)'
                        : 'var(--arrow-border)',
                  }}
                >
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--arrow-text-muted)' }}>
                    {description}
                  </p>
                </button>
              ))}
            </div>

            {form.deload_mode === 'sessions' && (
              <label className="text-sm font-medium block max-w-sm">
                Programar recuperação após
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min={1}
                    value={form.deload_after_sessions ?? 3}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        deload_after_sessions: Number(event.target.value),
                      }))
                    }
                    className="w-20 rounded-xl border px-3 py-2"
                  />
                  <span className="text-xs">sessões de força</span>
                </div>
              </label>
            )}
            {form.deload_mode === 'weeks' && (
              <label className="text-sm font-medium block max-w-sm">
                Criar semana de recuperação a cada
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min={2}
                    value={form.deload_after_weeks ?? 4}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        deload_after_weeks: Number(event.target.value),
                      }))
                    }
                    className="w-20 rounded-xl border px-3 py-2"
                  />
                  <span className="text-xs">semanas</span>
                </div>
              </label>
            )}

            {form.deload_mode !== 'manual' && recovery && (
              <div className="rounded-2xl border p-4">
                <input
                  value={recovery.name}
                  onChange={(event) => {
                    const index = form.templates.findIndex(
                      (template) => template.label === 'R',
                    );
                    updateTemplate(index, (current) => ({
                      ...current,
                      name: event.target.value,
                    }));
                  }}
                  className="w-full rounded-xl border px-3 py-2 text-sm font-semibold mb-3"
                />
                {recovery.exercises.map((exercise, exerciseIndex) => {
                  const templateIndex = form.templates.findIndex(
                    (template) => template.label === 'R',
                  );
                  return (
                    <ExercisePrescriptionRow
                      key={exercise.id}
                      exercise={exercise}
                      onChange={(patch) =>
                        updateExercise(templateIndex, exerciseIndex, patch)
                      }
                      onDuplicate={() =>
                        updateTemplate(templateIndex, (current) => ({
                          ...current,
                          exercises: [
                            ...current.exercises,
                            { ...exercise, id: crypto.randomUUID() },
                          ],
                        }))
                      }
                      onRemove={() =>
                        updateTemplate(templateIndex, (current) => ({
                          ...current,
                          exercises: current.exercises.filter(
                            (_, index) => index !== exerciseIndex,
                          ),
                        }))
                      }
                    />
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    const index = form.templates.findIndex(
                      (template) => template.label === 'R',
                    );
                    updateTemplate(index, (current) => ({
                      ...current,
                      exercises: [
                        ...current.exercises,
                        {
                          id: crypto.randomUUID(),
                          name: '',
                          default_sets: 2,
                          default_reps: 10,
                          default_load_kg: 0,
                        },
                      ],
                    }));
                  }}
                  className="arrow-btn-secondary text-xs mt-3"
                >
                  + exercício de recuperação
                </button>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-5">
            <div className="rounded-2xl border p-4">
              <h3 className="font-semibold">Resumo do programa</h3>
              <dl className="mt-4 space-y-3">
                {summary.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 text-sm">
                    <dt style={{ color: 'var(--arrow-text-muted)' }}>{label}</dt>
                    <dd className="font-medium text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded-2xl border p-4">
              <h3 className="font-semibold">Sessões</h3>
              <div className="mt-3 space-y-2">
                {form.templates.map((template) => (
                  <div key={template.label} className="rounded-xl border px-3 py-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">
                        {template.label} · {template.name}
                      </span>
                      <span style={{ color: 'var(--arrow-text-muted)' }}>
                        {template.exercises.length} exercícios
                      </span>
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--arrow-text-muted)' }}>
                      {template.exercises.map((exercise) => exercise.name).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer
        className="p-4 border-t flex justify-between gap-3"
        style={{ borderColor: 'var(--arrow-border)' }}
      >
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0}
          className="arrow-btn-secondary text-sm disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          Voltar
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => canContinue() && setStep((current) => current + 1)}
            disabled={!canContinue()}
            className="arrow-btn-primary text-sm disabled:opacity-40"
          >
            Continuar
            <ArrowRight className="w-4 h-4 inline ml-1" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={createProgram.isPending}
            className="arrow-btn-primary text-sm"
          >
            <Save className="w-4 h-4 inline mr-1" />
            Salvar no Vault
          </button>
        )}
      </footer>
    </section>
  );
}
