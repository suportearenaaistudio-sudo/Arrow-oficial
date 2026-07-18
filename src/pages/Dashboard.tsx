import { motion } from 'framer-motion';
import { Compass, Target, CheckSquare, Flame, DollarSign, Heart, Smile, Meh, Frown, TrendingUp, Plus } from 'lucide-react';
import { ArrowCard } from '@/components/ui/ArrowCard';
import { useCycles, getCurrentWeek, getCycleProgress } from '@/hooks/useCycles';
import { useGoals } from '@/hooks/useGoals';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useTransactions } from '@/hooks/useTransactions';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import TimeBlocks from '@/components/ui/TimeBlocks';
import WorkoutDashboardCard from '@/components/workouts/WorkoutDashboardCard';

const moodIcons = [
  { mood: 'muito_feliz', Icon: Smile, label: 'Muito Feliz' },
  { mood: 'feliz', Icon: Smile, label: 'Feliz' },
  { mood: 'neutro', Icon: Meh, label: 'Neutro' },
  { mood: 'triste', Icon: Frown, label: 'Triste' },
  { mood: 'muito_triste', Icon: Frown, label: 'Muito Triste' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeCycle, isLoading: loadingCycles } = useCycles();
  const { goals } = useGoals();
  const { tasks, byStatus } = useTasks();
  const { habits, stats: habitStats } = useHabits();
  const { receitas, despesas, saldo } = useTransactions();

  const activeGoals = goals.filter(g => g.status === 'ativo');
  const completedGoals = goals.filter(g => g.status === 'concluido');
  const completedTasks = byStatus.concluida.length;
  const totalTasks = tasks.length;
  const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  function formatCurrency(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  if (loadingCycles) return <div className="flex justify-center py-20"><div className="arrow-spinner" /></div>;

  // No active cycle — Welcome screen
  if (!activeCycle) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500/10 to-blue-500/10 mb-6">
            <Compass className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold arrow-gradient-text mb-2">Bem-vindo ao Arrow!</h1>
          <p className="text-gray-500 max-w-lg mx-auto mb-8">
            O método de 12 semanas transforma a forma como você planeja e executa seus objetivos. Crie ciclos curtos com urgência saudável e resultados reais.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
          {[
            { Icon: Target, title: 'Foco Intenso', desc: 'Ciclos curtos criam urgencia saudavel e eliminam procrastinacao' },
            { Icon: CheckSquare, title: 'Acao Semanal', desc: 'Check-ins semanais mantem voce no caminho certo com reflexoes' },
            { Icon: TrendingUp, title: 'Resultados Reais', desc: 'Metas claras + revisao constante = evolucao garantida' },
          ].map((card, i) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
              className="arrow-card p-6 text-center">
              <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--arrow-accent-light)' }}>
                <card.Icon className="w-6 h-6" style={{ color: 'var(--arrow-accent)' }} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{card.title}</h3>
              <p className="text-xs text-gray-500">{card.desc}</p>
            </motion.div>
          ))}
        </div>
        <div className="text-center">
          <button onClick={() => navigate('/cycles')} className="arrow-btn-primary text-base px-8 py-3">
            Começar Meu Primeiro Ciclo
          </button>
        </div>
      </motion.div>
    );
  }

  // Active cycle — Full dashboard
  const week = getCurrentWeek(activeCycle);
  const progress = getCycleProgress(activeCycle);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold arrow-gradient-text">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Ciclo: {activeCycle.title} — Semana {week}/{activeCycle.duration}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/goals')} className="arrow-btn-secondary flex items-center gap-2 text-sm">
            <Target className="w-4 h-4" /> Nova Meta
          </button>
          <button onClick={() => navigate('/cycles')} className="arrow-btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Ver Ciclos
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="arrow-card p-5 stat-card-blue">
          <div className="flex items-center justify-between mb-2">
            <p className="arrow-label">Check-in Diário</p>
            <Heart className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-sm text-gray-600 mb-2">Como você está hoje?</p>
          <div className="flex gap-1.5">
            {moodIcons.map(m => (
              <button key={m.mood} className="p-1.5 rounded-lg hover:scale-110 transition-transform" style={{ color: 'var(--arrow-text-secondary)' }} title={m.label}>
                <m.Icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <ArrowCard
            variant="stat"
            className="p-5 stat-card-green"
            label="Financas do mes"
            value={formatCurrency(saldo)}
            trend={saldo >= 0 ? { value: `${formatCurrency(receitas)} receitas`, positive: true } : { value: `${formatCurrency(despesas)} despesas`, positive: false }}
            icon={
              <div className="arrow-card-stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
            }
            onCardClick={() => navigate('/finances')}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="arrow-card p-5 stat-card-purple">
          <div className="flex items-center justify-between mb-2">
            <p className="arrow-label">Metas Ativas</p>
            <Target className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{activeGoals.length}</p>
          <p className="text-xs text-gray-500">{completedGoals.length} concluídas</p>
          <Progress value={goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0} className="h-1.5 mt-2" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="arrow-card p-5 stat-card-orange">
          <div className="flex items-center justify-between mb-2">
            <p className="arrow-label">Hábitos</p>
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{habitStats.longestStreak}</p>
          <p className="text-xs text-gray-500">Melhor sequência</p>
          <button onClick={() => navigate('/habits')} className="text-[10px] text-orange-600 font-medium mt-2 hover:text-orange-700">Ver Hábitos</button>
        </motion.div>
      </div>

      {/* Cycle + Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="arrow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-800">{activeCycle.title}</h3>
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Ciclo Ativo</span>
            </div>
            <span className="text-lg font-bold arrow-gradient-text">Semana {week} <span className="text-sm font-normal text-gray-400">de {activeCycle.duration}</span></span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progresso do Ciclo</span>
            <span className="font-semibold text-green-600">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full mb-4">
            <div className="h-full bg-gradient-to-r from-orange-500 to-blue-500 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50/80 rounded-xl p-3 text-center">
              <Target className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-700">{activeGoals.length}/{goals.length}</p>
              <p className="text-[10px] text-green-600">{goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}% concluído</p>
            </div>
            <div className="bg-blue-50/80 rounded-xl p-3 text-center">
              <CheckSquare className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-700">{completedTasks}/{totalTasks}</p>
              <p className="text-[10px] text-blue-600">{taskRate}% concluído</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="arrow-card p-5">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" /> Performance Geral
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Metas Ativas</span><span className="font-semibold">{activeGoals.length}</span></div>
              <Progress value={goals.length > 0 ? (activeGoals.length / goals.length) * 100 : 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Concluídas</span><span className="font-semibold">{completedGoals.length}</span></div>
              <Progress value={goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Taxa de Sucesso</span><span className="font-semibold">{taskRate}%</span></div>
              <Progress value={taskRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Atrasadas</span><span className="font-semibold text-red-500">0</span></div>
              <Progress value={0} className="h-2" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Treinos */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.27 }}
        className="mb-6"
      >
        <WorkoutDashboardCard />
      </motion.div>

      {/* Time Blocks */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
        className="mb-6">
        <TimeBlocks />
      </motion.div>

      {/* Motivational quote */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-center text-white">
        <p className="text-lg font-light italic leading-relaxed max-w-2xl mx-auto">
          "Ö a grande vantagem de viver 12 semanas como um ano: você falha mais rápido, aprende mais rápido e cresce mais rápido."
        </p>
        <p className="text-xs text-gray-400 mt-4">Brian Moran — The 12 Week Year</p>
      </motion.div>
    </motion.div>
  );
}
