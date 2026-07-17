import { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFocusTimer } from '@/contexts/FocusTimerContext';
import { deletePreset, savePreset } from '@/lib/pomodoro-presets';
import type { AmbientSound } from '@/types/pomodoro';

interface PomodoroSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Stepper({
  value,
  onChange,
  min,
  max,
  suffix = '',
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-muted"
        style={{ border: '1px solid var(--arrow-border)' }}
      >
        <Minus className="w-4 h-4" />
      </button>
      <div className="text-center min-w-[4rem]">
        <span className="text-3xl font-black tabular-nums" style={{ color: 'var(--arrow-text-primary)' }}>
          {value}
        </span>
        {suffix && (
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--arrow-text-muted)' }}>
            {suffix}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-muted"
        style={{ border: '1px solid var(--arrow-border)' }}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

const AMBIENT_OPTIONS: { id: AmbientSound; label: string }[] = [
  { id: 'none', label: 'Nenhum' },
  { id: 'rain', label: 'Chuva' },
  { id: 'cafe', label: 'Café' },
  { id: 'white', label: 'Ruído branco' },
];

export default function PomodoroSettings({ open, onOpenChange }: PomodoroSettingsProps) {
  const {
    durationMin,
    shortBreakMin,
    longBreakMin,
    sessionsUntilLongBreak,
    soundEnabled,
    autoStartBreak,
    dailyPomodoroGoal,
    timerMode,
    ambientSound,
    ambientVolume,
    presets,
    setDuration,
    setShortBreakMin,
    setLongBreakMin,
    setSessionsUntilLongBreak,
    setSoundEnabled,
    setAutoStartBreak,
    setDailyPomodoroGoal,
    setTimerMode,
    setAmbientSound,
    setAmbientVolume,
    applyPreset,
    refreshPresets,
    resetCycle,
  } = useFocusTimer();

  const [durationFocus, setDurationFocus] = useState(durationMin);
  const [newPresetName, setNewPresetName] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" style={{ background: 'var(--arrow-bg-card)', border: '1px solid var(--arrow-border)' }}>
        <DialogHeader>
          <DialogTitle>Configurações do Pomodoro</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="duration" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="duration" className="text-[10px]">Duração</TabsTrigger>
            <TabsTrigger value="notifications" className="text-[10px]">Alertas</TabsTrigger>
            <TabsTrigger value="sounds" className="text-[10px]">Sons</TabsTrigger>
            <TabsTrigger value="behavior" className="text-[10px]">Comport.</TabsTrigger>
          </TabsList>

          <TabsContent value="duration" className="space-y-4 mt-4">
            <div className="rounded-xl p-4" style={{ background: 'var(--arrow-bg-elevated)' }}>
              <p className="text-xs font-medium mb-3 text-center" style={{ color: 'var(--arrow-text-secondary)' }}>
                Sessão de foco
              </p>
              <Stepper
                value={durationFocus}
                onChange={(n) => {
                  setDurationFocus(n);
                  setDuration(n);
                }}
                min={5}
                max={120}
                suffix="min"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3 text-center" style={{ background: 'var(--arrow-bg-elevated)' }}>
                <p className="text-[10px] mb-2" style={{ color: 'var(--arrow-text-muted)' }}>Pausa curta</p>
                <Stepper value={shortBreakMin} onChange={setShortBreakMin} min={3} max={30} suffix="min" />
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: 'var(--arrow-bg-elevated)' }}>
                <p className="text-[10px] mb-2" style={{ color: 'var(--arrow-text-muted)' }}>Pausa longa</p>
                <Stepper value={longBreakMin} onChange={setLongBreakMin} min={5} max={45} suffix="min" />
              </div>
            </div>

            <div className="rounded-xl p-3" style={{ background: 'var(--arrow-bg-elevated)' }}>
              <p className="text-[10px] mb-2 text-center" style={{ color: 'var(--arrow-text-muted)' }}>
                Sessões até pausa longa
              </p>
              <Stepper
                value={sessionsUntilLongBreak}
                onChange={setSessionsUntilLongBreak}
                min={2}
                max={8}
                suffix="sessões"
              />
            </div>

            <div>
              <p className="text-[10px] font-medium mb-2" style={{ color: 'var(--arrow-text-muted)' }}>Presets</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {presets.map((p) => (
                  <div key={p.id} className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        applyPreset(p);
                        setDurationFocus(p.durationMin);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors hover:opacity-80"
                      style={{
                        background: 'var(--arrow-accent-light)',
                        color: 'var(--arrow-accent)',
                        border: '1px solid var(--arrow-border)',
                      }}
                    >
                      {p.name}
                    </button>
                    {!p.builtIn && (
                      <button
                        type="button"
                        onClick={() => {
                          deletePreset(p.id);
                          refreshPresets();
                          toast.success('Preset removido');
                        }}
                        className="p-1 rounded hover:bg-muted"
                        style={{ color: 'var(--arrow-text-muted)' }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Nome do preset"
                  className="flex-1 px-2 py-1.5 rounded-lg text-xs"
                  style={{ background: 'var(--arrow-bg-card)', border: '1px solid var(--arrow-border)' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const name = newPresetName.trim();
                    if (!name) return;
                    savePreset({
                      name,
                      durationMin,
                      shortBreakMin,
                      longBreakMin,
                      sessionsUntilLongBreak,
                    });
                    refreshPresets();
                    setNewPresetName('');
                    toast.success(`Preset "${name}" criado`);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold"
                  style={{ background: 'var(--arrow-accent)', color: '#fff' }}
                >
                  Salvar
                </button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-3 mt-4">
            <ToggleRow
              label="Som ao concluir"
              checked={soundEnabled}
              onChange={setSoundEnabled}
            />
            <ToggleRow
              label="Iniciar pausa automaticamente"
              checked={autoStartBreak}
              onChange={setAutoStartBreak}
            />
            <div className="rounded-xl p-3" style={{ background: 'var(--arrow-bg-elevated)' }}>
              <p className="text-[10px] mb-2" style={{ color: 'var(--arrow-text-muted)' }}>Meta diária</p>
              <Stepper value={dailyPomodoroGoal} onChange={setDailyPomodoroGoal} min={1} max={20} suffix="pomodoros" />
            </div>
          </TabsContent>

          <TabsContent value="sounds" className="space-y-3 mt-4">
            <p className="text-xs" style={{ color: 'var(--arrow-text-secondary)' }}>
              Som ambiente durante sessões de foco
            </p>
            <div className="grid grid-cols-2 gap-2">
              {AMBIENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAmbientSound(opt.id)}
                  className="px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                  style={{
                    background: ambientSound === opt.id ? 'var(--arrow-accent)' : 'var(--arrow-bg-elevated)',
                    color: ambientSound === opt.id ? '#fff' : 'var(--arrow-text-secondary)',
                    border: '1px solid var(--arrow-border)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <label className="block text-[10px]" style={{ color: 'var(--arrow-text-muted)' }}>
              Volume ambiente: {Math.round(ambientVolume * 100)}%
              <input
                type="range"
                min={0}
                max={100}
                value={ambientVolume * 100}
                onChange={(e) => setAmbientVolume(Number(e.target.value) / 100)}
                className="w-full mt-1"
              />
            </label>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-3 mt-4">
            <p className="text-xs" style={{ color: 'var(--arrow-text-secondary)' }}>
              Modo do timer
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['gentle', 'strict'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTimerMode(mode)}
                  className="px-3 py-2.5 rounded-xl text-xs font-medium"
                  style={{
                    background: timerMode === mode ? 'var(--arrow-accent)' : 'var(--arrow-bg-elevated)',
                    color: timerMode === mode ? '#fff' : 'var(--arrow-text-secondary)',
                    border: '1px solid var(--arrow-border)',
                  }}
                >
                  {mode === 'gentle' ? 'Leve' : 'Estrito'}
                </button>
              ))}
            </div>
            <p className="text-[10px]" style={{ color: 'var(--arrow-text-muted)' }}>
              {timerMode === 'strict'
                ? 'Estrito: máx. 2 pausas por sessão, reset e skip exigem confirmação.'
                : 'Leve: pause, reset e skip livres.'}
            </p>
            <button
              type="button"
              onClick={() => {
                resetCycle();
                toast.success('Ciclo do dia reiniciado');
              }}
              className="w-full py-2 rounded-xl text-xs font-medium"
              style={{
                background: 'var(--arrow-bg-elevated)',
                border: '1px solid var(--arrow-border)',
                color: 'var(--arrow-text-secondary)',
              }}
            >
              Reiniciar ciclo do dia
            </button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-xl"
      style={{ background: 'var(--arrow-bg-elevated)', border: '1px solid var(--arrow-border)' }}
    >
      <span className="text-xs font-medium" style={{ color: 'var(--arrow-text-primary)' }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-colors"
        style={{ background: checked ? 'var(--arrow-accent)' : 'rgba(128,128,128,0.25)' }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? '1.25rem' : '0.125rem' }}
        />
      </button>
    </div>
  );
}
