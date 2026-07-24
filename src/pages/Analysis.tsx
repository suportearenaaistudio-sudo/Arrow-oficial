import { motion } from 'framer-motion';
import { Activity, TrendingUp, DollarSign, Target, Flame, AlertTriangle, CheckCircle2, BookOpen } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useTransactions } from '@/hooks/useTransactions';
import { useNotes } from '@/hooks/useNotes';
import { useTimeBlocks } from '@/hooks/useTimeBlocks';
import { useDailyPlan } from '@/hooks/useDailyPlan';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

export default function Analysis() {
  const { goals } = useGoals();
  const { tasks, byStatus } = useTasks();
  const { habits, stats: habitStats } = useHabits();
  const { receitas, despesas, saldo } = useTransactions();
  const { notes } = useNotes();
  const { totalPlannedMin, totalFilledMin } = useTimeBlocks();
  const { taskIds } = useDailyPlan();
  const navigate = useNavigate();

  const totalTasks = tasks.length;
  const completedTasks = byStatus.concluida.length;
  const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const completedGoals = goals.filter(g => g.status === 'concluido').length;
  const goalRate = goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;

  function formatCurrency(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  const focusRate = totalPlannedMin > 0 ? Math.min(100, Math.round((totalFilledMin / totalPlannedMin) * 100)) : null;
  const overdueTasks = tasks.filter(t => t.status !== 'concluida' && t.due_date && t.due_date < new Date().toISOString().slice(0, 10));
  const alerts: { type: 'danger' | 'warning'; msg: string; action: string; to: string }[] = [];
  if (saldo < 0) alerts.push({ type: 'danger', msg: 'Saldo negativo! Revise seus gastos.', action: 'Abrir finanças', to: '/finances' });
  if (overdueTasks.length) alerts.push({ type: 'warning', msg: `${overdueTasks.length} tarefa(s) está(ão) atrasada(s). Escolha o que realmente cabe hoje.`, action: 'Revisar Hoje', to: '/planning' });
  if (taskIds.length === 0) alerts.push({ type: 'warning', msg: 'Seu plano de Hoje ainda está vazio.', action: 'Escolher tarefas', to: '/planning' });
  if (focusRate !== null && focusRate < 50) alerts.push({ type: 'warning', msg: `Apenas ${focusRate}% do tempo bloqueado foi executado. Realoque ou reduza os blocos.`, action: 'Ver blocos', to: '/pomodoro' });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold arrow-gradient-text">Análise Inteligente</h1>
          <p className="text-gray-500 text-sm mt-1">Dashboard completo com insights automáticos</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Taxa de Execução', value: `${taskRate}%`, icon: Activity, tint: 'stat-card-blue' },
          { label: 'Saldo Atual', value: formatCurrency(saldo), icon: DollarSign, tint: 'stat-card-green' },
          { label: 'Metas Concluídas', value: `${goalRate}%`, icon: Target, tint: 'stat-card-purple' },
          { label: 'Maior Sequência', value: `${habitStats.longestStreak} dias`, icon: Flame, tint: 'stat-card-orange' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`arrow-card p-5 ${s.tint}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
              <div className="p-2 rounded-xl bg-white/60"><s.icon className="w-5 h-5 text-gray-400" /></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-6">
          {alerts.map((a, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
              className={`arrow-card p-4 flex items-center gap-3 ${a.type === 'danger' ? 'border-red-200 bg-red-50/60' : 'border-amber-200 bg-amber-50/60'}`}>
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${a.type === 'danger' ? 'text-red-500' : 'text-amber-500'}`} />
              <p className={`text-sm flex-1 ${a.type === 'danger' ? 'text-red-700' : 'text-amber-700'}`}>{a.msg}</p>
              <button onClick={() => navigate(a.to)} className="text-xs font-semibold underline">{a.action}</button>
            </motion.div>
          ))}
        </div>
      )}

      {totalTasks === 0 && totalPlannedMin === 0 && (
        <div className="arrow-card p-6 mb-6 text-center">
          <p className="font-semibold text-sm">Ainda não há dados suficientes para gerar insights.</p>
          <p className="text-xs text-gray-500 mt-1">Crie um plano de Hoje, conclua uma tarefa ou registre um bloco de foco.</p>
          <button onClick={() => navigate('/planning')} className="arrow-btn-primary text-xs mt-3">Planejar meu dia</button>
        </div>
      )}

      {/* Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="arrow-card p-5">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-500" /> Produtividade
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Metas</span><span className="font-semibold">{completedGoals}/{goals.length}</span></div>
              <Progress value={goalRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Tempo bloqueado</span><span className="font-semibold">{focusRate === null ? '—' : `${focusRate}%`}</span></div>
              <Progress value={focusRate ?? 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Tarefas</span><span className="font-semibold">{completedTasks}/{totalTasks}</span></div>
              <Progress value={taskRate} className="h-2" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="arrow-card p-5">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-500" /> Situação Financeira
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Receitas</span><span className="text-green-600 font-semibold">{formatCurrency(receitas)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Despesas</span><span className="text-red-600 font-semibold">{formatCurrency(despesas)}</span></div>
            <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500">Saldo</span><span className={`font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(saldo)}</span></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="arrow-card p-5">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-purple-500" /> Gestão de Conhecimento
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Notas Criadas</span><span className="text-purple-600 font-semibold">{notes.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Hábitos Ativos</span><span className="text-purple-600 font-semibold">{habitStats.total}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Maior Sequência</span><span className="text-purple-600 font-semibold">{habitStats.longestStreak} dias</span></div>
          </div>
        </motion.div>
      </div>

      {/* Reflection */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="arrow-card p-6">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-500" /> Reflexao e Planejamento
        </h3>
        <p className="text-xs text-gray-400 mb-3">Reflita sobre seus resultados e planeje os próximos passos com base na análise.</p>
        <textarea rows={4} placeholder="Com base na análise acima, quais são suas principais reflexões? O que funcionou bem? O que precisa melhorar?"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none" />
        <div className="flex items-center justify-between mt-3">
          <p className="text-[10px] text-gray-400">Suas reflexoes sao salvas automaticamente para acompanhar sua evolucao</p>
          <button className="arrow-btn-primary text-xs px-4 py-2">Salvar Reflexão</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
