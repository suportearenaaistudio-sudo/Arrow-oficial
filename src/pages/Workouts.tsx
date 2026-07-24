import { useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ClipboardPlus,
  Dumbbell,
  FileText,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { desktopAPI } from '@/lib/desktop-api';
import { useCycles, getCurrentWeek } from '@/hooks/useCycles';
import {
  useExerciseProgress,
  useWorkouts,
  useWorkoutTemplates,
} from '@/hooks/useWorkouts';
import type { ExerciseLog, WorkoutCheckin, WorkoutSession } from '@/types/arrow';
import WorkoutCompleteDialog, {
  type ExerciseResultDraft,
} from '@/components/workouts/WorkoutCompleteDialog';
import WorkoutCheckinDialog from '@/components/workouts/WorkoutCheckinDialog';
import WorkoutHealthPanel from '@/components/workouts/WorkoutHealthPanel';
import ExerciseProgressChart from '@/components/workouts/ExerciseProgressChart';
import { TRAINING_TYPE_LABELS } from '@/lib/workout-config';

function datesForCurrentWeek() {
  const now = new Date();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - now.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(
    'pt-BR',
    options ?? { day: '2-digit', month: 'short' },
  );
}

export default function Workouts() {
  const navigate = useNavigate();
  const { activeCycle } = useCycles();
  const {
    programs,
    activePrograms,
    sessions,
    completeSession,
    updateSession,
    createCheckin,
    generateWeek,
    getSessionsByWeek,
    isLoading,
  } = useWorkouts();
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const selectedProgram =
    programs.find((program) => program.id === selectedProgramId)
    ?? activePrograms[0]
    ?? programs[0];
  const programId = selectedProgram?.id ?? null;
  const { templates } = useWorkoutTemplates(programId);
  const currentWeek = activeCycle ? getCurrentWeek(activeCycle) : 1;
  const agenda =
    activeCycle && programId
      ? getSessionsByWeek(activeCycle.id, currentWeek, programId).sort((a, b) =>
          a.date.localeCompare(b.date),
        )
      : [];
  const completedSessions = sessions
    .filter((session) => session.program_id === programId && session.status === 'feito')
    .sort((a, b) => b.date.localeCompare(a.date));

  const [recording, setRecording] = useState<WorkoutSession | null>(null);
  const [results, setResults] = useState<ExerciseResultDraft[]>([]);
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [checkinSession, setCheckinSession] = useState<WorkoutSession | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [quickRecordOpen, setQuickRecordOpen] = useState(false);
  const [quickTemplateId, setQuickTemplateId] = useState('');
  const [quickDate, setQuickDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedExercise, setSelectedExercise] = useState<{
    name: string;
    id?: string;
  } | null>(null);
  const progress =
    useExerciseProgress(selectedExercise?.name ?? null, selectedExercise?.id).data ?? [];

  const exerciseOptions = useMemo(() => {
    const items = [
      ...templates.flatMap((template) => template.exercises),
      ...completedSessions.flatMap((session) =>
        (session.exercises_log ?? []).map((entry) => ({
          id: entry.exercise_id ?? entry.name,
          name: entry.name,
        })),
      ),
    ];
    return Array.from(
      new Map(items.map((exercise) => [exercise.id || exercise.name, exercise])).values(),
    );
  }, [completedSessions, templates]);

  function openRecord(session: WorkoutSession) {
    const template = templates.find((item) => item.id === session.template_id);
    const pastLogs = completedSessions.flatMap((item) => item.exercises_log ?? []);
    const nextResults = (template?.exercises ?? []).map((exercise) => {
      const previous = pastLogs.find(
        (entry) => entry.exercise_id === exercise.id || entry.name === exercise.name,
      );
      const priorResult = previous?.sets?.[0];
      return {
        exercise_id: exercise.id,
        name: exercise.name,
        load_kg: priorResult?.load_kg ?? exercise.default_load_kg ?? 0,
        reps: priorResult?.reps ?? exercise.default_reps ?? 0,
        rpe: previous?.rpe ?? 7,
        completed: true,
      };
    });
    setResults(nextResults);
    setDuration(session.planned_duration_minutes ?? 60);
    setNotes(session.notes ?? '');
    setRecording(session);
  }

  async function createQuickRecord() {
    if (!programId || !quickTemplateId) return;
    const created = (await desktopAPI.db.workouts.sessions.create({
      program_id: programId,
      template_id: quickTemplateId,
      date: quickDate,
      status: 'a_fazer',
      cycle_id: activeCycle?.id,
      week_number: currentWeek,
      planned_duration_minutes: 60,
    })) as WorkoutSession;
    setQuickRecordOpen(false);
    openRecord(created);
  }

  function saveRecord() {
    if (!recording) return;
    const exercisesLog: ExerciseLog[] = results.map((result) => ({
      exercise_id: result.exercise_id,
      name: result.name,
      rpe: result.rpe || undefined,
      sets: [
        {
          load_kg: result.load_kg,
          reps: result.reps,
          completed: result.completed,
        },
      ],
    }));
    const rpeResults = results.filter((result) => result.rpe > 0);
    const averageRpe = rpeResults.length
      ? Math.round(
          (rpeResults.reduce((sum, result) => sum + result.rpe, 0) / rpeResults.length)
            * 10,
        ) / 10
      : undefined;
    completeSession.mutate(
      { session: recording, exercisesLog, durationMinutes: duration },
      {
        onSuccess: () => {
          updateSession.mutate({
            id: recording.id,
            notes: notes.trim() || undefined,
            rpe: averageRpe,
          });
          setRecording(null);
        },
      },
    );
  }

  function saveCheckin(
    checkin: Omit<WorkoutCheckin, 'id' | 'session_id'>,
  ) {
    if (!checkinSession) return;
    createCheckin.mutate(
      { session: checkinSession, checkin },
      { onSuccess: () => setCheckinSession(null) },
    );
  }

  function generateCurrentWeek() {
    if (!programId || !activeCycle) return;
    generateWeek.mutate({
      programId,
      cycleId: activeCycle.id,
      weekNumber: currentWeek,
      weekDates: datesForCurrentWeek(),
    });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="arrow-spinner" />
      </div>
    );
  }

  if (!selectedProgram) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold">Treinos</h1>
        <div className="arrow-card p-8 mt-5 text-center">
          <Dumbbell
            className="w-10 h-10 mx-auto"
            style={{ color: 'var(--arrow-text-muted)' }}
          />
          <p className="font-semibold mt-3">Nenhum programa de treino</p>
          <p className="text-sm mt-1" style={{ color: 'var(--arrow-text-muted)' }}>
            Crie o programa em Planejamento → Ciclo para começar.
          </p>
          <button onClick={() => navigate('/planning')} className="arrow-btn-primary mt-4">
            Abrir Planejamento
          </button>
        </div>
      </div>
    );
  }

  const completedThisWeek = agenda.filter((session) => session.status === 'feito').length;
  const adherence = agenda.length
    ? Math.round((completedThisWeek / agenda.length) * 100)
    : 0;
  const latestSession = completedSessions[0];

  return (
    <div className="max-w-6xl space-y-5">
      <header className="flex flex-wrap justify-between gap-4 items-end">
        <div>
          <h1 className="text-2xl font-bold">Treinos</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--arrow-text-muted)' }}>
            Consulte a sessão, faça o check-in e registre o resultado depois do treino.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={programId ?? ''}
            onChange={(event) => setSelectedProgramId(event.target.value)}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setQuickRecordOpen((current) => !current)}
            className="arrow-btn-primary text-sm"
          >
            <ClipboardPlus className="w-4 h-4 inline mr-1.5" />
            Registrar treino
          </button>
        </div>
      </header>

      {quickRecordOpen && (
        <section className="arrow-card p-4">
          <h2 className="font-semibold text-sm">Registrar treino avulso ou atrasado</h2>
          <div className="grid sm:grid-cols-[1fr_180px_auto] gap-2 mt-3">
            <select
              value={quickTemplateId}
              onChange={(event) => setQuickTemplateId(event.target.value)}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              <option value="">Escolha o treino realizado</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label} · {template.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={quickDate}
              onChange={(event) => setQuickDate(event.target.value)}
              className="rounded-xl border px-3 py-2 text-sm"
            />
            <button
              onClick={() => void createQuickRecord()}
              disabled={!quickTemplateId}
              className="arrow-btn-primary text-sm disabled:opacity-40"
            >
              Continuar
            </button>
          </div>
        </section>
      )}

      <section className="grid md:grid-cols-4 gap-3">
        {[
          {
            label: 'Adesão semanal',
            value: `${adherence}%`,
            detail: `${completedThisWeek}/${agenda.length} sessões`,
          },
          {
            label: 'Último treino',
            value: latestSession ? formatDate(latestSession.date) : '—',
            detail: latestSession
              ? `${latestSession.exercises_log?.length ?? 0} exercícios`
              : 'Sem registros',
          },
          {
            label: 'Programa',
            value: selectedProgram.name,
            detail: `${TRAINING_TYPE_LABELS[selectedProgram.training_type ?? 'academia']} · ${selectedProgram.focus ?? 'geral'}`,
          },
          {
            label: 'Próxima sessão',
            value:
              agenda.find((session) => session.status === 'a_fazer')
                ? formatDate(
                    agenda.find((session) => session.status === 'a_fazer')!.date,
                  )
                : '—',
            detail: 'Semana atual',
          },
        ].map((metric) => (
          <div key={metric.label} className="arrow-card p-4 min-w-0">
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--arrow-text-muted)' }}>
              {metric.label}
            </p>
            <p className="text-lg font-bold mt-1 truncate">{metric.value}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--arrow-text-muted)' }}>
              {metric.detail}
            </p>
          </div>
        ))}
      </section>

      <section className="arrow-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold flex gap-2 items-center">
              <CalendarDays className="w-4 h-4" style={{ color: 'var(--arrow-accent)' }} />
              Agenda da Semana {currentWeek}
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--arrow-text-muted)' }}>
              Abra a sessão para consultar exercícios, faça o check-in e registre depois.
            </p>
          </div>
          <button onClick={generateCurrentWeek} className="arrow-btn-secondary text-xs">
            <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
            Atualizar agenda
          </button>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
          {agenda.map((session) => {
            const template = templates.find((item) => item.id === session.template_id);
            const expanded = expandedSessionId === session.id;
            const done = session.status === 'feito';
            return (
              <article key={session.id} className="rounded-2xl border overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedSessionId((current) =>
                      current === session.id ? null : session.id,
                    )
                  }
                  className="w-full p-4 text-left"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase" style={{ color: 'var(--arrow-text-muted)' }}>
                        {formatDate(session.date, {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                      <p className="font-semibold text-sm mt-1">
                        {template?.label} · {template?.name ?? 'Sessão'}
                      </p>
                      <p className="text-xs mt-1 capitalize" style={{ color: 'var(--arrow-text-muted)' }}>
                        {session.session_mode ?? 'completa'} ·{' '}
                        {template?.exercises.length ?? 0} exercícios
                      </p>
                    </div>
                    {expanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>
                {expanded && (
                  <div
                    className="px-4 pb-3 pt-1 border-t"
                    style={{ borderColor: 'var(--arrow-border)' }}
                  >
                    <div className="space-y-2 mt-3">
                      {(template?.exercises ?? []).map((exercise) => (
                        <div
                          key={exercise.id}
                          className="flex justify-between gap-3 text-xs"
                        >
                          <span>{exercise.name}</span>
                          <span style={{ color: 'var(--arrow-text-muted)' }}>
                            {exercise.default_sets ?? 3}×{exercise.default_reps ?? 10}
                            {exercise.default_load_kg
                              ? ` · ${exercise.default_load_kg} kg`
                              : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div
                  className="grid grid-cols-2 gap-2 px-4 py-3 border-t"
                  style={{ borderColor: 'var(--arrow-border)' }}
                >
                  <button
                    type="button"
                    disabled={done || Boolean(session.checkin_id)}
                    onClick={() => setCheckinSession(session)}
                    className="arrow-btn-secondary text-xs disabled:opacity-50"
                  >
                    <Activity className="w-3.5 h-3.5 inline mr-1" />
                    {session.checkin_id ? 'Check-in salvo' : 'Fazer check-in'}
                  </button>
                  <button
                    type="button"
                    disabled={done}
                    onClick={() => openRecord(session)}
                    className="arrow-btn-primary text-xs disabled:opacity-50"
                  >
                    {done ? 'Treino registrado' : 'Registrar resultado'}
                  </button>
                </div>
              </article>
            );
          })}
          {!agenda.length && (
            <div className="rounded-2xl border border-dashed p-8 text-center md:col-span-2 xl:col-span-3">
              <p className="text-sm" style={{ color: 'var(--arrow-text-muted)' }}>
                A agenda desta semana ainda não foi gerada.
              </p>
              <button onClick={generateCurrentWeek} className="arrow-btn-primary text-sm mt-3">
                Gerar agenda da semana
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="arrow-card p-5">
        <div className="flex flex-wrap justify-between gap-3 items-end">
          <div>
            <h2 className="font-semibold flex gap-2 items-center">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--arrow-accent)' }} />
              Evolução de carga
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--arrow-text-muted)' }}>
              Carga registrada, repetições e força estimada por exercício.
            </p>
          </div>
          <select
            value={selectedExercise?.id ?? ''}
            onChange={(event) => {
              const exercise = exerciseOptions.find(
                (item) => (item.id || item.name) === event.target.value,
              );
              setSelectedExercise(
                exercise ? { name: exercise.name, id: exercise.id } : null,
              );
            }}
            className="min-w-[220px] rounded-xl border px-3 py-2 text-sm"
          >
            <option value="">Escolha um exercício</option>
            {exerciseOptions.map((exercise) => (
              <option key={exercise.id || exercise.name} value={exercise.id || exercise.name}>
                {exercise.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4">
          {selectedExercise ? (
            <ExerciseProgressChart points={progress} />
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <p className="text-sm" style={{ color: 'var(--arrow-text-muted)' }}>
                Selecione um exercício para abrir o gráfico.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-5">
        <div className="arrow-card p-5">
          <h2 className="font-semibold flex gap-2 items-center">
            <Dumbbell className="w-4 h-4" style={{ color: 'var(--arrow-accent)' }} />
            Treinos do programa
          </h2>
          <div className="mt-3 space-y-3">
            {templates.map((template) => (
              <details key={template.id} className="rounded-xl border p-3">
                <summary className="cursor-pointer text-sm font-semibold">
                  {template.label} · {template.name}
                  <span
                    className="ml-2 text-xs font-normal"
                    style={{ color: 'var(--arrow-text-muted)' }}
                  >
                    {template.exercises.length} exercícios
                  </span>
                </summary>
                <div className="mt-3 space-y-2">
                  {template.exercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="flex justify-between gap-3 text-xs"
                    >
                      <span>{exercise.name}</span>
                      <span style={{ color: 'var(--arrow-text-muted)' }}>
                        {exercise.default_sets ?? 3}×{exercise.default_reps ?? 10}
                        {exercise.default_load_kg ? ` · ${exercise.default_load_kg} kg` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
        <WorkoutHealthPanel programId={programId} />
      </section>

      <section className="arrow-card p-5">
        <h2 className="font-semibold flex gap-2 items-center">
          <FileText className="w-4 h-4" style={{ color: 'var(--arrow-accent)' }} />
          Histórico registrado
        </h2>
        <div className="mt-3 space-y-2">
          {completedSessions.slice(0, 10).map((session) => {
            const template = templates.find((item) => item.id === session.template_id);
            return (
              <div
                key={session.id}
                className="grid sm:grid-cols-[110px_1fr_auto] gap-2 items-center rounded-xl border px-3 py-2.5 text-sm"
              >
                <span>{formatDate(session.date)}</span>
                <div className="min-w-0">
                  <p className="font-medium truncate">{template?.name ?? 'Treino'}</p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--arrow-text-muted)' }}>
                    {(session.exercises_log ?? [])
                      .map((exercise) => `${exercise.name} ${exercise.sets?.[0]?.load_kg ?? 0}kg`)
                      .join(' · ')}
                  </p>
                </div>
                <span className="text-xs" style={{ color: 'var(--arrow-text-muted)' }}>
                  {session.duration_minutes ? `${session.duration_minutes} min` : ''}
                  {session.rpe ? ` · RPE ${session.rpe}` : ''}
                </span>
              </div>
            );
          })}
          {!completedSessions.length && (
            <p className="text-sm py-3" style={{ color: 'var(--arrow-text-muted)' }}>
              Nenhum treino registrado ainda.
            </p>
          )}
        </div>
      </section>

      <WorkoutCheckinDialog
        open={Boolean(checkinSession)}
        onOpenChange={(open) => !open && setCheckinSession(null)}
        onConfirm={saveCheckin}
      />
      <WorkoutCompleteDialog
        open={Boolean(recording)}
        onOpenChange={(open) => !open && setRecording(null)}
        results={results}
        duration={duration}
        notes={notes}
        onDurationChange={setDuration}
        onNotesChange={setNotes}
        onResultChange={(index, field, value) =>
          setResults((current) =>
            current.map((result, resultIndex) =>
              index === resultIndex ? { ...result, [field]: value } : result,
            ),
          )
        }
        onConfirm={saveRecord}
      />
    </div>
  );
}
