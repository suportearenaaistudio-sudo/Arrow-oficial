# 🏹 Arrow — Arquitetura Completa

> *"Navegue em direção aos seus sonhos"*

---

## 1. O que é o Arrow?

Arrow é um **aplicativo de produtividade pessoal e gestão de vida** construído em torno do método **"Ano de 12 Semanas"** (*12 Week Year*). Em vez de planejar o ano inteiro, o usuário divide sua vida em **ciclos de 12 semanas**, tratando cada um como um "ano" completo — com início, execução e revisão.

O app integra em um único lugar: **ciclos, metas, tarefas, hábitos, finanças, notas e análises** — tudo com visual moderno, animações suaves e inteligência artificial integrada.

---

## 2. Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Estilização** | TailwindCSS + Shadcn/UI |
| **Animações** | Framer Motion |
| **State/Cache** | TanStack React Query |
| **Roteamento** | React Router DOM v6 |
| **Gráficos** | Recharts |
| **Drag & Drop** | @hello-pangea/dnd |
| **Editor Rico** | TipTap |
| **Backend/DB** | Supabase (PostgreSQL + Auth + Edge Functions) |
| **IA** | Supabase Edge Function + Gemini API |
| **Notificações** | Sonner (toast) |
| **Formulários** | React Hook Form + Zod |

---

## 3. Arquitetura Geral

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (React)                  │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Pages   │──│  Hooks   │──│  Supabase Client │  │
│  │ (10 pgs) │  │ (CRUD)   │  │  (API + Auth)    │  │
│  └──────────┘  └──────────┘  └────────┬─────────┘  │
│       │                               │             │
│  ┌──────────┐                         │             │
│  │Components│                         │             │
│  │(40+ comp)│                         │             │
│  └──────────┘                         │             │
└───────────────────────────────────────┼─────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────┐
│                   SUPABASE (Backend)                 │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │PostgreSQL│  │   Auth   │  │ Edge Functions   │  │
│  │ 8 tables │  │email+pwd │  │ (IA - Gemini)    │  │
│  │   + RLS  │  │          │  │                  │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Fluxo de dados:
1. **Usuário** interage com uma **Page**
2. A Page usa **Hooks** (React Query) para buscar/mutar dados
3. Os Hooks chamam o **Supabase Client** (REST API auto-gerada)
4. Supabase retorna dados filtrados por **RLS** (Row Level Security)
5. React Query faz **cache e invalidação** automática
6. Para IA, o frontend chama uma **Edge Function** que proxeia para o Gemini

---

## 4. Autenticação

- **Supabase Auth** com email + senha
- Tabela `profiles` sincronizada via trigger com `auth.users`
- Dois roles: `admin` (gestão de usuários) e `user` (dados próprios)
- **AuthContext** global provê: `user`, `session`, `signIn`, `signUp`, `signOut`
- Todas as rotas (exceto `/auth`) são protegidas via `AppLayout`
- **RLS** garante que cada usuário vê apenas seus dados (`user_id = auth.uid()`)

---

## 5. Módulos do App

### 5.1 🔄 Ciclos de 12 Semanas (`/cycles`)

O coração do app. Cada ciclo tem título, datas, categoria e duração.

**Regra principal:** Apenas **1 ciclo ativo por vez**. Ao ativar um, todos os outros são pausados automaticamente.

**Check-ins semanais:** A cada semana, o usuário registra reflexão, score (1-10), conquistas, desafios e foco da próxima semana. Array JSONB pré-populado na criação.

**Categorias:** Crescimento Pessoal, Carreira, Saúde, Relacionamentos, Criatividade, Finanças, Estudos, Equilíbrio.

**Temas visuais:** Laranja Clássico, Azul Oceano, Verde Floresta, Roxo Real, Rosa Vibrante, Amarelo Dourado.

**Views:** Cards (grid com stats) ou Timeline (visual cronológico das 12 semanas).

---

### 5.2 🎯 Metas (`/goals` + `/goal-detail/:id`)

Vinculadas a ciclos. 4 tipos:
- **Quantitativa** — valor numérico alvo (ex: correr 100km)
- **Qualitativa** — sem número, avaliação subjetiva
- **Hábito** — meta de consistência
- **Projeto** — entregável com milestones

Cada meta tem: categoria, prioridade (baixa/média/alta/crítica), sub-metas, marcos (milestones), targets semanais e notas.

**Página de lista:** Filtros por busca (debounce 300ms), categoria e status. Stats no topo. Grid de cards.

**Página de detalhe:** Layout 2/3 + 1/3. Barra de progresso, milestones com check visual, notas editáveis inline, sidebar com metadados.

**Unidades de medida:** dias, horas, páginas, km, kg, vezes, sessões, projetos, cursos, livros, artigos, reais, pontos, passos, outro.

---

### 5.3 ✅ Tarefas (`/tasks`)

Sistema completo com 3 visualizações:

**Kanban:** 4 colunas drag-and-drop — A Fazer (cinza), Em Andamento (azul), Revisão (roxo), Concluída (verde). Atualização otimista com rollback em erro.

**Matriz de Eisenhower:** Grid 2x2 classificando por urgência × importância. Combinação dos campos `priority` e `important`.

**Calendário:** Visualização mensal com tarefas por data de vencimento.

Cada tarefa tem: título, descrição, status, prioridade, flag importante, data vencimento, estimativa de horas, horas reais, meta vinculada, ciclo vinculado, tags, responsável, progresso %, subtarefas, comentários, anexos e motivo de bloqueio.

**Pomodoro integrado:** Timer 25min trabalho / 5min pausa em modal. Registra horas automaticamente na tarefa.

---

### 5.4 🔁 Hábitos (`/habits`)

Rastreador diário com streaks.

**Frequências:** Diário, Intermitente (X vezes/semana), Dias Específicos (seg, ter, etc.)

**Rotinas:** Manhã ☀️, Tarde 🌅, Noite 🌙, Qualquer ⏰

**Histórico:** Array JSONB de objetos `{ date, completed }`. Visualização semanal interativa com 7 botões.

**Streaks:** `current_streak` recalculado a cada toggle (conta dias consecutivos de trás pra frente). `longest_streak = Math.max(anterior, atual)`.

**Categorias:** Saúde, Produtividade, Relacionamentos, Crescimento, Lazer, Financeiro, Outro.

---

### 5.5 💰 Finanças (`/finances`)

Módulo financeiro completo.

**Transações (Supabase):** Receitas e despesas com categoria e data. Filtro por período (semanal/mensal/anual) com navegação.

**Dados complementares (localStorage):**
- Metas financeiras (título, valor alvo, valor atual, categoria, deadline)
- Dívidas (título, valor total, valor pago, vencimento, tipo)
- Faturas de cartão (banco, valor, vencimento, status: paga/em_aberto/atrasada)
- Despesas recorrentes (serviço, valor mensal, categoria, vencimento)

**Categorias de receita:** Salário, Freelance, Investimentos, Vendas, Serviços, Bônus, Rendimentos, Outros.

**Categorias de despesa:** Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, Assinaturas, Roupas, Tecnologia, Viagem, Impostos, Outros.

**Gráficos:** Fluxo financeiro (barras + linha), distribuição de despesas (pizza), tendência 12 meses (área).

**Exportação:** Botão gera arquivo `.html` com relatório completo formatado.

**Automação:** Ao criar receita, busca meta de economia ativa e atualiza `currentAmount`.

---

### 5.6 📝 Notas (`/notes`)

Editor de notas com IA integrada.

**Layout split:** Lista de notas à esquerda (busca + filtro por tags) | Editor + painel IA à direita.

**Editor:** TipTap com suporte a formatação rica (HTML/Markdown).

**Painel IA (AIAssistantPanel):**
- Ações rápidas: "Resumir Nota", "Criar Checklist", "Extrair Insights"
- Chat livre com IA sobre o conteúdo da nota
- Resultado cria automaticamente nova nota com prefixo (📄 Resumo / ✅ Checklist / 💡 Insights)
- Tags automáticas: `['ai-generated', ...tags_originais]`

---

### 5.7 📊 Dashboard (`/`)

Visão centralizada de tudo.

**Sem ciclo ativo:** Tela de boas-vindas com 3 cards (Foco Intenso, Ação Semanal, Resultados Reais) + botão "Criar Primeiro Ciclo".

**Com ciclo ativo:**
- Dica do dia com IA (Gemini, 2 frases, pt-BR)
- Check-in diário inline (humor com emojis + produtividade 1-10 + energia 1-10)
- 4 cards rápidos: Check-in, Finanças (saldo + metas %), Metas Ativas, Hábitos (melhor streak)
- Card do ciclo ativo + progresso semanal (barras)
- Stats gerais de produtividade
- HabitStreaks + Roda da Vida (RadarChart 7 categorias)
- Citação motivacional no rodapé

---

### 5.8 📈 Análise (`/analysis`)

Relatórios e insights.

- Botão "Análise Completa com IA" → Gemini gera relatório Markdown
- Filtros: período (Atual/Mês/Trimestre/Ano) + ciclo específico
- 4 stats: Taxa de Execução, Saldo, Metas %, Maior Sequência
- Alertas inteligentes automáticos (saldo negativo, concentração >40% em categoria, taxa <30%)
- Gráficos: Evolução financeira 6 meses (linhas), gastos por categoria (pizza)
- 3 cards insight: Produtividade, Financeiro, Conhecimento
- Campo "Reflexão e Planejamento" (salva em localStorage)

---

### 5.9 📋 Planejamento (`/planning`)

Organização do ciclo ativo.

- Card visão geral: semana atual, total metas, total hábitos, % progresso
- Botão "Check-in Semanal" → modal com: reflexão, score 1-10, conquistas, desafios, foco próxima semana
- **Tabs:** Metas (filtro por categoria) | Hábitos (cards do ciclo) | Revisão (performance + consistência)

---

### 5.10 ⚙️ Configurações (`/settings`)

- **Temas:** 8 opções visuais (Laranja Clássico, Azul Oceano, Verde Floresta, Roxo Real, Rosa Vibrante, Amarelo Dourado, Turquesa Moderno, Cinza Elegante). Aplicadas via CSS vars em `document.documentElement`, persistidas em localStorage.
- **Exportação:** JSON, CSV, HTML (Goals, Tasks, Habits, Transactions, Notes, Cycles)
- **Conta:** Alterar senha, Excluir conta
- **Privacidade:** Texto informativo com garantias

---

## 6. Banco de Dados (Supabase PostgreSQL)

### 6.1 Tabelas

```
profiles ──────── 1:N ──── cycles
                            │
                   1:N ─────┼───── goals ──── 1:N ──── tasks
                            │
                   1:N ─────┼───── habits
                            │
                            └───── (via user_id)

profiles ──── 1:N ──── transactions
profiles ──── 1:N ──── notes
profiles ──── 1:N ──── daily_checkins (UNIQUE: user_id + date)
```

### 6.2 Campos padrão (todas as tabelas)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid (PK) | `gen_random_uuid()` |
| `user_id` | uuid (FK → auth.users) | Dono do registro |
| `created_at` | timestamptz | `now()` |
| `updated_at` | timestamptz | `now()`, trigger auto-update |

### 6.3 RLS (Row Level Security)

Todas as tabelas seguem o mesmo padrão:
```sql
-- SELECT: user vê apenas seus dados
CREATE POLICY "select_own" ON tabela FOR SELECT USING (user_id = auth.uid());
-- INSERT: user só insere com seu próprio user_id
CREATE POLICY "insert_own" ON tabela FOR INSERT WITH CHECK (user_id = auth.uid());
-- UPDATE: user só atualiza seus dados
CREATE POLICY "update_own" ON tabela FOR UPDATE USING (user_id = auth.uid());
-- DELETE: user só deleta seus dados
CREATE POLICY "delete_own" ON tabela FOR DELETE USING (user_id = auth.uid());
```

### 6.4 Dados em localStorage

| Chave | Conteúdo |
|-------|---------|
| `financial-goals` | Metas financeiras |
| `financial-debts` | Dívidas |
| `credit-card-invoices` | Faturas de cartão |
| `recurring-expenses` | Gastos recorrentes |
| `arrow-theme` | Tema visual ativo |
| `user-reflections` | Reflexões da página Análise |

---

## 7. Design System

### 7.1 Paleta de Cores

| Nome | Hex | Uso |
|------|-----|-----|
| Primary Orange | `#ea580c` | Gradientes, botões primários |
| Secondary Orange | `#fb923c` | Variações |
| Primary Blue | `#1e40af` | Gradientes, links |
| Secondary Blue | `#3b82f6` | Variações |
| Accent Purple | `#7c3aed` | Destaques terciários |
| Success Green | `#10b981` | Status positivo |
| Warning Amber | `#f59e0b` | Avisos |
| Danger Red | `#ef4444` | Erros, urgente |

### 7.2 Estilo Visual

- **Modo claro** apenas
- **Gradiente principal:** `from-orange-500 to-blue-600`
- **Background:** `bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50`
- **Cards:** `bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-xl transition-300`
- **Títulos:** Gradiente de texto `from-orange-600 to-blue-600`
- **Sidebar:** `bg-white/90 backdrop-blur-sm border-orange-200/40`
- **Animações:** Framer Motion — fade-in (opacity 0→1, y 20→0) com delay escalonado
- **Fonte:** Inter (Google Fonts)

### 7.3 Componentes Especiais

| Componente | Descrição |
|-----------|-----------|
| KanbanBoard | 4 colunas drag-and-drop coloridas |
| LifeWheelChart | RadarChart com 7 categorias (Recharts) |
| HabitCard | Grid semanal de 7 botões interativos |
| PomodoroTracker | Timer 25/5 min com play/pause/reset |
| AIResponseBlock | Renderiza Markdown da IA |
| WeeklyProgress | Barras de score dos check-ins semanais |
| CycleTimeline | Linha do tempo visual das 12 semanas |
| EisenhowerMatrix | Grid 2x2 urgente × importante |
| TaskCalendar | Calendário mensal com tarefas |
| DailyCheckinWidget | Emojis de humor + sliders |

---

## 8. Inteligência Artificial

### 8.1 Supabase Edge Function (`arrow-ai`)

Proxeia chamadas para a API do Gemini. Aceita diferentes `action` types:

| Action | Input | Output |
|--------|-------|--------|
| `daily_tip` | — | Dica motivacional (2 frases, pt-BR) |
| `note_summarize` | Conteúdo da nota | Resumo conciso |
| `note_checklist` | Conteúdo da nota | Checklist extraída |
| `note_insights` | Conteúdo da nota | Insights relevantes |
| `note_chat` | Conteúdo + pergunta | Resposta contextual |
| `full_analysis` | Dados financeiros + produtividade + hábitos | Relatório Markdown completo |

### 8.2 Formato do Relatório de Análise

```markdown
## 💡 Insights Principais
## 📈 Análise Financeira
## ⚡ Análise de Produtividade
## 🚨 Alertas Importantes
## 🎯 Recomendações Estratégicas
## 📊 Previsões e Tendências
```

---

## 9. Fluxos Críticos

### 9.1 Criação de Ciclo
1. Usuário preenche título, descrição, data início, duração, categoria, cor
2. `end_date` = `start_date + (duration × 7 dias)`
3. Array `weekly_checkins` pré-populado com N objetos vazios
4. Ciclo criado com `status = 'planejamento'`

### 9.2 Ativação de Ciclo
1. Usuário clica switch "Ativar"
2. Sistema busca todos os ciclos com `status = 'ativo'`
3. Todos são atualizados para `status = 'pausado'`
4. Ciclo selecionado é atualizado para `status = 'ativo'`
5. Dashboard passa a exibir dados deste ciclo

### 9.3 Toggle de Hábito
1. Usuário clica no dia no grid semanal
2. Atualização otimista na UI
3. Atualiza `completion_history` (adiciona/remove entrada do dia)
4. Recalcula `current_streak` (conta consecutivos de hoje para trás)
5. `longest_streak = Math.max(longest_streak, current_streak)`
6. Se erro na API, reverte UI

### 9.4 Drag & Drop de Tarefa
1. Usuário arrasta card de uma coluna para outra
2. Atualização otimista: card move instantaneamente
3. `Task.update(id, { status: nova_coluna })`
4. Se `concluida`: toast "Tarefa concluída! 🎉"
5. Se erro: reverte posição + toast de erro

### 9.5 Check-in Diário
1. Dashboard detecta se já existe check-in para hoje
2. Se não: mostra formulário inline (humor, produtividade, energia, gratidão, destaque, desafio, foco)
3. Se sim: mostra resumo do check-in com opção de editar
4. Constraint UNIQUE garante 1 por dia por usuário

---

## 10. Estrutura de Pastas

```
src/
├── components/
│   ├── layout/          → AppSidebar, AppLayout
│   ├── cycles/          → CycleCard, CycleForm, CycleTimeline
│   ├── goals/           → GoalCard, GoalForm, ProgressUpdateModal, GoalMoveModal
│   ├── tasks/           → KanbanBoard, TaskCard, TaskForm, EisenhowerMatrix, TaskCalendar, PomodoroTracker
│   ├── habits/          → HabitCard, HabitForm
│   ├── finances/        → TransactionForm, FinancialGoalCard, DebtCard, CreditCardInvoiceCard, RecurringExpenseCard, FinanceCharts
│   ├── notes/           → NoteEditor, AIAssistantPanel
│   ├── dashboard/       → DailyCheckinWidget, ActiveCycleCard, WeeklyProgress, StatsOverview, HabitStreaks, LifeWheelChart
│   ├── planning/        → WeeklyCheckinModal
│   └── ui/              → Shadcn components (49 componentes)
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── useCycles.ts
│   ├── useGoals.ts
│   ├── useTasks.ts
│   ├── useHabits.ts
│   ├── useTransactions.ts
│   ├── useFinancialData.ts
│   ├── useNotes.ts
│   ├── useDailyCheckin.ts
│   └── useNotification.ts
├── lib/
│   ├── themes.ts        → Definição dos 8 temas + apply/get
│   └── export.ts        → Funções exportação JSON/CSV/HTML
├── pages/               → 12 páginas (Auth, Dashboard, Planning, Cycles, Goals, GoalDetail, Tasks, Habits, Finances, Notes, Analysis, Settings)
├── types/
│   └── arrow.ts         → Todos os types/interfaces/enums
└── integrations/
    └── supabase/        → Client + Types gerados
```

---

## 11. Navegação (Sidebar)

| Ícone | Label | Rota |
|-------|-------|------|
| BarChart3 | Dashboard | `/` |
| PieChart | Planejamento | `/planning` |
| Calendar | Ciclos | `/cycles` |
| Target | Metas | `/goals` |
| CheckSquare | Tarefas | `/tasks` |
| Repeat | Hábitos | `/habits` |
| Landmark | Finanças | `/finances` |
| Notebook | Notas | `/notes` |
| Activity | Análise | `/analysis` |
| Settings | Configurações | `/settings` |

**Ação rápida:** Botão "Nova Meta" na sidebar.

---

## 12. Responsividade

- **Mobile (< 768px):** Sidebar como drawer (hamburguer), cards em coluna única, Kanban com scroll horizontal
- **Tablet (768-1024px):** Sidebar colapsável, grid 2 colunas
- **Desktop (> 1024px):** Sidebar fixa, grids completos, layout split para notas

---

*Arrow v2.0 — Arquitetura documentada em Abril/2026*
