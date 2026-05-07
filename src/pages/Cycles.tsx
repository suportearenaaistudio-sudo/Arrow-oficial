import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Play, Pause, Trash2, Edit2, Plus, Clock, Target, Repeat, ChevronRight, Eye } from 'lucide-react';
import { useCycles, getCurrentWeek, getCycleProgress } from '@/hooks/useCycles';
import { useWeeklyScores } from '@/hooks/useWeeklyScores';
import { useTheme } from '@/contexts/ThemeContext';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Cycle, CycleCategory } from '@/types/arrow';
import { useNavigate } from 'react-router-dom';

const categoryConfig: Record<CycleCategory, { label: string; emoji: string }> = {
  crescimento: { label: 'Crescimento Pessoal', emoji: '🌱' },
  profissional: { label: 'Carreira e Negócios', emoji: '💼' },
  saude: { label: 'Saúde e Bem-estar', emoji: '💪' },
  relacionamentos: { label: 'Relacionamentos', emoji: '❤️' },
  criatividade: { label: 'Arte e Criatividade', emoji: '🎨' },
  financeiro: { label: 'Finanças Pessoais', emoji: '💰' },
  aprendizado: { label: 'Estudos e Habilidades', emoji: '📚' },
  equilibrio: { label: 'Equilíbrio de Vida', emoji: '⚖️' },
};

const emptyForm = {
  title: '',
  description: '',
  vision: '',
  focus_area: '',
  start_date: '',
  category: '' as CycleCategory,
  duration: 12,
};

function ScorePill({ score }: { score: number | null }) {
  if (score === null) return null;
  const color = score >= 85 ? '#22c55e' : score >= 70 ? '#eab308' : '#ef4444';
  const bg = score >= 85 ? 'rgba(34,197,94,0.12)' : score >= 70 ? 'rgba(234,179,8,0.12)' : 'rgba(239,68,68,0.12)';
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color, background: bg }}>
      {score}%
    </span>
  );
}

function CycleCard({ cycle, onEdit }: { cycle: Cycle; onEdit: (c: Cycle) => void }) {
  const { updateCycle, deleteCycle, activateCycle } = useCycles();
  const { avgScore, scores } = useWeeklyScores(cycle.id);
  const { theme, isDark } = useTheme();
  const navigate = useNavigate();
  const week = getCurrentWeek(cycle);
  const progress = getCycleProgress(cycle);
  const cat = categoryConfig[cycle.category as CycleCategory];
  const isActive = cycle.status === 'ativo';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="arrow-card overflow-hidden"
    >
      {/* Accent bar top */}
      <div className="h-1 w-full" style={{
        background: isActive
          ? `linear-gradient(90deg, ${theme.gradientFrom}, ${theme.gradientTo})`
          : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
      }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl">{cat?.emoji || '🔄'}</span>
            <div className="min-w-0">
              <h3 className="text-base font-bold truncate" style={{ color: theme.textPrimary }}>{cycle.title}</h3>
              <span className="text-xs" style={{ color: theme.textMuted }}>{cat?.label || 'Sem categoria'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <span className="text-xs" style={{ color: theme.textMuted }}>Ativo</span>
            <Switch
              checked={isActive}
              onCheckedChange={(checked) => {
                if (checked) activateCycle.mutate(cycle.id);
                else updateCycle.mutate({ id: cycle.id, status: 'pausado' as const });
              }}
            />
          </div>
        </div>

        {/* Visão do ciclo */}
        {cycle.vision && (
          <div className="mb-3 px-3 py-2 rounded-lg" style={{
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderLeft: `3px solid ${theme.accent}`,
          }}>
            <p className="text-xs italic line-clamp-2" style={{ color: theme.textSecondary }}>
              "{cycle.vision}"
            </p>
          </div>
        )}

        {/* Score + Semana */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: theme.textMuted }}>Semana</span>
            <span className="text-sm font-bold" style={{ color: theme.textPrimary }}>{week}/{cycle.duration}</span>
          </div>
          {scores.length > 0 && (
            <>
              <div className="w-px h-3" style={{ background: theme.border }} />
              <div className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color: theme.textMuted }}>Score médio</span>
                <ScorePill score={avgScore} />
              </div>
            </>
          )}
          {cycle.focus_area && (
            <>
              <div className="w-px h-3" style={{ background: theme.border }} />
              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                background: theme.accentLight, color: theme.accent
              }}>{cycle.focus_area}</span>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-1">
          <div className="h-2 rounded-full overflow-hidden" style={{
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
          }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${theme.gradientFrom}, ${theme.gradientTo})`
              }} />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: theme.textMuted }}>
            <span>{new Date(cycle.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
            <span style={{ color: theme.accent, fontWeight: 600 }}>{progress}%</span>
            <span>{new Date(cycle.end_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
          </div>
        </div>

        {/* Mini score history */}
        {scores.length > 0 && (
          <div className="flex gap-1 mt-3 mb-1">
            {Array.from({ length: cycle.duration }, (_, i) => {
              const s = scores.find(sc => sc.week_number === i + 1);
              const val = s?.score ?? null;
              const isCurr = (i + 1) === week;
              return (
                <div key={i} title={`S${i + 1}${val !== null ? `: ${val}%` : ''}`}
                  style={{
                    flex: 1, height: 4, borderRadius: 2,
                    background: val === null
                      ? (isCurr ? theme.accent : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'))
                      : val >= 85 ? '#22c55e' : val >= 70 ? '#eab308' : '#ef4444',
                    opacity: val === null && !isCurr ? 0.3 : 1,
                  }} />
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-3 mt-2" style={{ borderTop: `1px solid ${theme.border}` }}>
          <button onClick={() => onEdit(cycle)}
            className="p-2 rounded-lg transition-colors hover:opacity-70"
            style={{ color: theme.textMuted }} title="Editar">
            <Edit2 className="w-4 h-4" />
          </button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="p-2 rounded-lg transition-colors hover:opacity-70"
                style={{ color: theme.textMuted }} title="Excluir">
                <Trash2 className="w-4 h-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir ciclo?</AlertDialogTitle>
                <AlertDialogDescription>
                  O ciclo "{cycle.title}" e todos os scores serão excluídos permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteCycle.mutate(cycle.id)}
                  className="bg-red-500 hover:bg-red-600">Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex-1" />

          {isActive && (
            <button onClick={() => navigate('/planning')}
              className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-70"
              style={{ color: theme.accent }}>
              <Calendar className="w-3.5 h-3.5" /> Planejar <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Cycles() {
  const { cycles, isLoading, createCycle, updateCycle } = useCycles();
  const { theme, isDark } = useTheme();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState<1 | 2>(1);

  const stats = {
    total: cycles.length,
    ativo: cycles.filter(c => c.status === 'ativo').length,
    concluidos: cycles.filter(c => c.status === 'concluido').length,
    pausados: cycles.filter(c => c.status === 'pausado').length,
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingCycle) {
      updateCycle.mutate({ id: editingCycle.id, ...form } as any, {
        onSuccess: () => { setFormOpen(false); setEditingCycle(null); setForm(emptyForm); setStep(1); }
      });
    } else {
      createCycle.mutate(form as any, {
        onSuccess: () => { setFormOpen(false); setForm(emptyForm); setStep(1); }
      });
    }
  }

  function handleEdit(cycle: Cycle) {
    setEditingCycle(cycle);
    setForm({
      title: cycle.title,
      description: cycle.description || '',
      vision: cycle.vision || '',
      focus_area: cycle.focus_area || '',
      start_date: cycle.start_date,
      category: cycle.category || '' as CycleCategory,
      duration: cycle.duration,
    });
    setStep(1);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingCycle(null);
    setForm(emptyForm);
    setStep(1);
  }

  if (isLoading) return <div className="flex justify-center py-20"><div className="arrow-spinner" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold arrow-gradient-text">Ciclos de 12 Semanas</h1>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
            Cada ciclo é um "ano" — foco total por 12 semanas
          </p>
        </div>
        <Dialog open={formOpen} onOpenChange={(open) => { if (!open) closeForm(); else setFormOpen(true); }}>
          <DialogTrigger asChild>
            <button className="arrow-btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Ciclo
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCycle ? 'Editar Ciclo' : 'Novo Ciclo de 12 Semanas'}</DialogTitle>
              {/* Step indicator */}
              <div className="flex gap-2 mt-2">
                {[1, 2].map(s => (
                  <div key={s} className="flex items-center gap-1">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: step === s ? theme.accent : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                        color: step === s ? (isDark ? '#000' : '#fff') : theme.textMuted,
                      }}>{s}</div>
                    <span className="text-xs" style={{ color: step === s ? theme.textPrimary : theme.textMuted }}>
                      {s === 1 ? 'Informações' : 'Visão e Foco'}
                    </span>
                    {s < 2 && <ChevronRight className="w-3 h-3" style={{ color: theme.textMuted }} />}
                  </div>
                ))}
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {step === 1 && (
                <>
                  <div>
                    <label className="arrow-label block mb-1.5">Título *</label>
                    <input type="text" required value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                      style={{ borderColor: theme.border, color: theme.textPrimary, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}
                      placeholder="Ex: Sprint de Produto" />
                  </div>
                  <div>
                    <label className="arrow-label block mb-1.5">Descrição</label>
                    <textarea value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 resize-none h-16"
                      style={{ borderColor: theme.border, color: theme.textPrimary, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}
                      placeholder="Contexto do ciclo..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="arrow-label block mb-1.5">Data de Início *</label>
                      <input type="date" required value={form.start_date}
                        onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                        style={{ borderColor: theme.border, color: theme.textPrimary, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }} />
                    </div>
                    <div>
                      <label className="arrow-label block mb-1.5">Duração (semanas)</label>
                      <input type="number" min={4} max={16} value={form.duration}
                        onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                        className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                        style={{ borderColor: theme.border, color: theme.textPrimary, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }} />
                    </div>
                  </div>
                  <div>
                    <label className="arrow-label block mb-1.5">Categoria</label>
                    <select value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value as CycleCategory }))}
                      className="w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                      style={{ borderColor: theme.border, color: theme.textPrimary, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)' }}>
                      <option value="">Selecione...</option>
                      {Object.entries(categoryConfig).map(([key, { label, emoji }]) => (
                        <option key={key} value={key}>{emoji} {label}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={() => setStep(2)}
                    disabled={!form.title || !form.start_date}
                    className="w-full arrow-btn-primary">
                    Próximo → Visão e Foco
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label className="arrow-label block mb-1.5">
                      🎯 Visão das 12 Semanas
                      <span className="text-xs ml-1 font-normal" style={{ color: theme.textMuted }}>— O que quer conquistar?</span>
                    </label>
                    <textarea value={form.vision}
                      onChange={e => setForm(f => ({ ...f, vision: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 resize-none h-28"
                      style={{ borderColor: theme.border, color: theme.textPrimary, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }}
                      placeholder="Ao final destas 12 semanas, terei... (seja específico e ambicioso)" />
                  </div>
                  <div>
                    <label className="arrow-label block mb-1.5">
                      ⚡ Área de Foco Principal
                      <span className="text-xs ml-1 font-normal" style={{ color: theme.textMuted }}>— Onde sua energia vai?</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Carreira', 'Saúde', 'Finanças', 'Relacionamentos', 'Criatividade', 'Aprendizado', 'Negócios', 'Equilíbrio'].map(area => (
                        <button key={area} type="button"
                          onClick={() => setForm(f => ({ ...f, focus_area: f.focus_area === area ? '' : area }))}
                          className="px-3 py-2 rounded-xl text-sm text-left transition-all"
                          style={{
                            border: `1px solid ${form.focus_area === area ? theme.accent : theme.border}`,
                            background: form.focus_area === area ? theme.accentLight : 'transparent',
                            color: form.focus_area === area ? theme.accent : theme.textSecondary,
                            fontWeight: form.focus_area === area ? 600 : 400,
                          }}>
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStep(1)}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm border transition-all"
                      style={{ borderColor: theme.border, color: theme.textSecondary }}>
                      ← Voltar
                    </button>
                    <button type="submit"
                      disabled={createCycle.isPending || updateCycle.isPending}
                      className="flex-2 arrow-btn-primary flex-1">
                      {editingCycle ? 'Salvar' : 'Criar Ciclo'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: Calendar },
          { label: 'Ativo', value: stats.ativo, icon: Play },
          { label: 'Concluídos', value: stats.concluidos, icon: Target },
          { label: 'Em Pausa', value: stats.pausados, icon: Pause },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="arrow-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-bold" style={{ color: theme.textPrimary }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: theme.textMuted }}>{s.label}</p>
              </div>
              <div className="p-2 rounded-xl" style={{ background: theme.accentLight }}>
                <s.icon className="w-5 h-5" style={{ color: theme.accent }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Cycles Grid */}
      {cycles.length === 0 ? (
        <div className="arrow-card p-12 text-center">
          <Repeat className="w-14 h-14 mx-auto mb-4" style={{ color: theme.textMuted, opacity: 0.3 }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: theme.textPrimary }}>Nenhum ciclo ainda</h3>
          <p className="text-sm mb-4" style={{ color: theme.textMuted }}>Crie seu primeiro ciclo de 12 semanas para começar</p>
          <button onClick={() => setFormOpen(true)} className="arrow-btn-primary">Criar Primeiro Ciclo</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cycles.map(cycle => (
            <CycleCard key={cycle.id} cycle={cycle} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </motion.div>
  );
}
