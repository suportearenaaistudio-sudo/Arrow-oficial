import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Edit3, Save, X, TrendingUp, TrendingDown, Minus, CheckCircle2, Circle } from 'lucide-react';
import { useVision, VISION_AREAS } from '@/hooks/useVision';
import { useCycles, getCurrentWeek } from '@/hooks/useCycles';
import { useWeeklyScores } from '@/hooks/useWeeklyScores';
import { useTasks } from '@/hooks/useTasks';
import { useTheme } from '@/contexts/ThemeContext';
import { useGoals } from '@/hooks/useGoals';

export default function Vision() {
  const { theme, isDark } = useTheme();
  const { vision, isLoading, saveVision } = useVision();
  const { activeCycle } = useCycles();
  const { scores, avgScore, scoreColor, scoreBg } = useWeeklyScores(activeCycle?.id);
  const { getWeekScore, getTasksByCycle } = useTasks();
  const { goals } = useGoals();

  // Edição da visão de 5 anos
  const [editing5y, setEditing5y] = useState<string | null>(null);
  const [draft5y, setDraft5y] = useState('');

  // Edição da visão 12 semanas
  const [editing12w, setEditing12w] = useState(false);
  const [draft12w, setDraft12w] = useState('');

  function startEdit5y(key: string, current: string) {
    setEditing5y(key);
    setDraft5y(current || '');
  }

  function save5y(key: string) {
    saveVision.mutate({ [key]: draft5y }, {
      onSuccess: () => setEditing5y(null),
    });
  }

  function startEdit12w() {
    setEditing12w(true);
    setDraft12w(activeCycle?.vision || '');
  }

  const currentWeek = activeCycle ? getCurrentWeek(activeCycle) : 0;
  const weekScore = activeCycle ? getWeekScore(activeCycle.id, currentWeek) : null;
  const cycleTasks = activeCycle ? getTasksByCycle(activeCycle.id) : [];
  const activeGoals = goals.filter(g => g.status === 'ativo');
  const completedGoals = goals.filter(g => g.status === 'concluido');
  const resultScore = activeGoals.length + completedGoals.length > 0
    ? Math.round((completedGoals.length / (activeGoals.length + completedGoals.length)) * 100)
    : 0;

  function ScoreBar({ value, label }: { value: number; label: string }) {
    const color = value >= 85 ? '#22c55e' : value >= 70 ? '#eab308' : '#ef4444';
    return (
      <div>
        <div className="flex justify-between text-xs mb-1" style={{ color: theme.textSecondary }}>
          <span>{label}</span>
          <span style={{ color, fontWeight: 700 }}>{value}%</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: color }}
          />
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="flex justify-center py-20"><div className="arrow-spinner" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold arrow-gradient-text">Minha Visão</h1>
        <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
          Onde você quer chegar — a longo prazo e neste ciclo de 12 semanas
        </p>
      </div>

      {/* KPIs do Ciclo Ativo */}
      {activeCycle && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="arrow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium mb-0.5" style={{ color: theme.textMuted }}>Ciclo Ativo</p>
              <h3 className="font-bold text-base" style={{ color: theme.textPrimary }}>{activeCycle.title}</h3>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: theme.textMuted }}>Semana</p>
              <p className="text-2xl font-black" style={{ color: theme.accent }}>
                {currentWeek}<span className="text-sm font-normal" style={{ color: theme.textMuted }}> / {activeCycle.duration}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <ScoreBar value={weekScore ?? avgScore} label="Score de Execução (semana atual)" />
            <ScoreBar value={resultScore} label="Score de Resultado (metas)" />
          </div>

          {/* Mini histórico semanal */}
          {scores.length > 0 && (
            <div>
              <p className="text-xs mb-2" style={{ color: theme.textMuted }}>Histórico de scores semanais</p>
              <div className="flex gap-1.5 flex-wrap">
                {Array.from({ length: activeCycle.duration }, (_, i) => {
                  const weekNum = i + 1;
                  const s = scores.find(sc => sc.week_number === weekNum);
                  const isCurrent = weekNum === currentWeek;
                  const scoreVal = s?.score ?? null;
                  const bg = scoreVal === null
                    ? (isCurrent ? theme.accent : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'))
                    : scoreVal >= 85 ? '#22c55e' : scoreVal >= 70 ? '#eab308' : '#ef4444';
                  return (
                    <div key={weekNum} title={`Semana ${weekNum}${scoreVal !== null ? `: ${scoreVal}%` : ''}`}
                      className="relative"
                      style={{
                        width: 20, height: 28, borderRadius: 4,
                        background: bg,
                        opacity: scoreVal === null && !isCurrent ? 0.3 : 1,
                      }}>
                      {isCurrent && scoreVal === null && (
                        <div className="absolute inset-0 rounded animate-pulse" style={{ background: theme.accent, opacity: 0.4 }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-2 text-[10px]" style={{ color: theme.textMuted }}>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> ≥ 85%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> 70–84%</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &lt; 70%</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {!activeCycle && (
        <div className="arrow-card p-8 text-center">
          <Eye className="w-10 h-10 mx-auto mb-3" style={{ color: theme.textMuted }} />
          <p className="font-medium" style={{ color: theme.textPrimary }}>Nenhum ciclo ativo</p>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Ative um ciclo para ver os KPIs de execução e resultado</p>
        </div>
      )}

      {/* Visão das 12 Semanas */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="arrow-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
              style={{ background: theme.accentLight }}>🎯</div>
            <div>
              <h2 className="font-bold text-sm" style={{ color: theme.textPrimary }}>Visão das 12 Semanas</h2>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                {activeCycle ? `Ciclo: ${activeCycle.title}` : 'Nenhum ciclo ativo'}
              </p>
            </div>
          </div>
          {activeCycle && !editing12w && (
            <button onClick={startEdit12w}
              className="p-1.5 rounded-lg transition-colors hover:opacity-70"
              style={{ color: theme.textMuted }}>
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {editing12w ? (
          <div className="space-y-3">
            <textarea
              value={draft12w}
              onChange={e => setDraft12w(e.target.value)}
              autoFocus
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2"
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${theme.border}`,
                color: theme.textPrimary,
                caretColor: theme.accent,
              }}
              placeholder="O que você quer ter conquistado ao final destas 12 semanas? Seja específico e ambicioso..."
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing12w(false)}
                className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                style={{ color: theme.textMuted }}>
                <X className="w-3.5 h-3.5" /> Cancelar
              </button>
              <button
                onClick={() => {
                  if (activeCycle) {
                    // Salva vision no ciclo via useCycles (implementado abaixo)
                    // Por ora salva no localStorage como rascunho
                    localStorage.setItem(`cycle-vision-${activeCycle.id}`, draft12w);
                    setEditing12w(false);
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 font-medium"
                style={{ background: theme.accent, color: isDark ? '#000' : '#fff' }}>
                <Save className="w-3.5 h-3.5" /> Salvar
              </button>
            </div>
          </div>
        ) : (
          <div>
            {activeCycle?.vision || (activeCycle && localStorage.getItem(`cycle-vision-${activeCycle.id}`)) ? (
              <p className="text-sm leading-relaxed" style={{ color: theme.textPrimary }}>
                {activeCycle.vision || localStorage.getItem(`cycle-vision-${activeCycle.id}`)}
              </p>
            ) : (
              <button onClick={activeCycle ? startEdit12w : undefined}
                className="w-full py-6 rounded-xl text-sm border-2 border-dashed transition-all text-center"
                style={{ borderColor: theme.border, color: theme.textMuted }}>
                {activeCycle
                  ? '+ Defina sua visão para este ciclo de 12 semanas'
                  : 'Ative um ciclo para definir sua visão'}
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Visão de 5 Anos */}
      <div>
        <h2 className="text-base font-bold mb-3" style={{ color: theme.textPrimary }}>Visão de Longo Prazo — 5 Anos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VISION_AREAS.map((area, i) => {
            const value = vision?.[area.key] || '';
            const isEditingThis = editing5y === area.key;

            return (
              <motion.div key={area.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="arrow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{area.emoji}</span>
                    <span className="text-sm font-semibold" style={{ color: theme.textPrimary }}>{area.label}</span>
                  </div>
                  {!isEditingThis && (
                    <button onClick={() => startEdit5y(area.key, value)}
                      className="p-1 rounded-lg transition-colors"
                      style={{ color: theme.textMuted }}>
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isEditingThis ? (
                  <div className="space-y-2">
                    <textarea
                      value={draft5y}
                      onChange={e => setDraft5y(e.target.value)}
                      autoFocus
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-1"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        border: `1px solid ${theme.border}`,
                        color: theme.textPrimary,
                        caretColor: theme.accent,
                      }}
                      placeholder={area.placeholder}
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditing5y(null)}
                        className="p-1.5 rounded-lg" style={{ color: theme.textMuted }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => save5y(area.key)}
                        disabled={saveVision.isPending}
                        className="p-1.5 rounded-lg"
                        style={{ background: theme.accent, color: isDark ? '#000' : '#fff' }}>
                        <Save className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {value ? (
                      <p className="text-sm leading-relaxed" style={{ color: theme.textSecondary }}>{value}</p>
                    ) : (
                      <button onClick={() => startEdit5y(area.key, '')}
                        className="w-full py-4 rounded-lg text-xs border-dashed border transition-all text-center"
                        style={{ borderColor: theme.border, color: theme.textMuted }}>
                        + Escrever minha visão de {area.label.toLowerCase()}
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

    </motion.div>
  );
}
