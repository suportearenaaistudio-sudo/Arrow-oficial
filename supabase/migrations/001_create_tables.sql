-- ============================================
-- ARROW v2 — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- === ENUMS ===
CREATE TYPE cycle_status AS ENUM ('planejamento', 'ativo', 'concluido', 'pausado');
CREATE TYPE cycle_category AS ENUM ('crescimento', 'profissional', 'saude', 'relacionamentos', 'criatividade', 'financeiro', 'aprendizado', 'equilibrio');
CREATE TYPE goal_type AS ENUM ('quantitativa', 'qualitativa', 'habito', 'projeto');
CREATE TYPE goal_category AS ENUM ('pessoal', 'profissional', 'saude', 'financeiro', 'educacao', 'relacionamentos', 'criatividade', 'viagem');
CREATE TYPE goal_status AS ENUM ('ativo', 'concluido', 'pausado', 'cancelado');
CREATE TYPE priority_level AS ENUM ('baixa', 'media', 'alta', 'critica');
CREATE TYPE task_status AS ENUM ('a_fazer', 'em_andamento', 'revisao', 'concluida');
CREATE TYPE task_priority AS ENUM ('baixa', 'media', 'alta', 'urgente');
CREATE TYPE habit_category AS ENUM ('saude', 'produtividade', 'relacionamentos', 'crescimento', 'lazer', 'financeiro', 'outro');
CREATE TYPE habit_frequency AS ENUM ('diario', 'intermitente', 'dias_especificos');
CREATE TYPE habit_routine AS ENUM ('manha', 'tarde', 'noite', 'qualquer');
CREATE TYPE transaction_type AS ENUM ('receita', 'despesa');
CREATE TYPE mood_type AS ENUM ('muito_feliz', 'feliz', 'neutro', 'triste', 'muito_triste');
CREATE TYPE measurement_type AS ENUM ('dias', 'horas', 'paginas', 'km', 'kg', 'vezes', 'sessoes', 'projetos', 'cursos', 'livros', 'artigos', 'reais', 'pontos', 'passos', 'outro');

-- === PROFILES ===
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === CYCLES ===
CREATE TABLE cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status cycle_status NOT NULL DEFAULT 'planejamento',
  weekly_checkins JSONB NOT NULL DEFAULT '[]',
  badges_earned TEXT[] DEFAULT '{}',
  final_score NUMERIC,
  notes TEXT,
  color TEXT,
  category cycle_category,
  duration INTEGER NOT NULL DEFAULT 12,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === GOALS ===
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category goal_category NOT NULL DEFAULT 'pessoal',
  goal_type goal_type NOT NULL DEFAULT 'quantitativa',
  measurement_type measurement_type DEFAULT 'outro',
  target_value NUMERIC,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT,
  cycle_id UUID REFERENCES cycles(id) ON DELETE SET NULL,
  status goal_status NOT NULL DEFAULT 'ativo',
  priority priority_level NOT NULL DEFAULT 'media',
  sub_goals JSONB NOT NULL DEFAULT '[]',
  milestones JSONB NOT NULL DEFAULT '[]',
  weekly_targets JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === TASKS ===
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'a_fazer',
  priority task_priority NOT NULL DEFAULT 'media',
  important BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  estimated_hours NUMERIC,
  actual_hours NUMERIC NOT NULL DEFAULT 0,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  cycle_id UUID REFERENCES cycles(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  assignee TEXT,
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  subtasks JSONB NOT NULL DEFAULT '[]',
  comments JSONB NOT NULL DEFAULT '[]',
  attachments JSONB NOT NULL DEFAULT '[]',
  blocked_reason TEXT,
  completion_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === HABITS ===
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category habit_category NOT NULL DEFAULT 'saude',
  frequency_type habit_frequency NOT NULL DEFAULT 'diario',
  frequency_value INTEGER,
  days_of_week TEXT[] DEFAULT '{}',
  time_of_day TIME,
  routine habit_routine NOT NULL DEFAULT 'qualquer',
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  completion_history JSONB NOT NULL DEFAULT '[]',
  cycle_id UUID REFERENCES cycles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === TRANSACTIONS ===
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type transaction_type NOT NULL,
  category TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === NOTES ===
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === DAILY CHECK-INS ===
CREATE TABLE daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood mood_type NOT NULL,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  productivity_score INTEGER NOT NULL CHECK (productivity_score BETWEEN 1 AND 10),
  gratitude TEXT,
  highlight TEXT,
  challenge TEXT,
  tomorrow_focus TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- === INDEXES ===
CREATE INDEX idx_cycles_user_status ON cycles(user_id, status);
CREATE INDEX idx_goals_user_status ON goals(user_id, status);
CREATE INDEX idx_goals_cycle ON goals(cycle_id);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_cycle ON tasks(cycle_id);
CREATE INDEX idx_tasks_goal ON tasks(goal_id);
CREATE INDEX idx_habits_user ON habits(user_id);
CREATE INDEX idx_habits_cycle ON habits(cycle_id);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_checkins_user_date ON daily_checkins(user_id, date);

-- === AUTO-UPDATE updated_at TRIGGER ===
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_cycles_updated BEFORE UPDATE ON cycles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_goals_updated BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_tasks_updated BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_habits_updated BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_transactions_updated BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_notes_updated BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_checkins_updated BEFORE UPDATE ON daily_checkins FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- === AUTO-CREATE PROFILE ON SIGNUP ===
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- === ROW LEVEL SECURITY ===
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());

-- All other tables: users CRUD their own data
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['cycles','goals','tasks','habits','transactions','notes','daily_checkins'])
  LOOP
    EXECUTE format('CREATE POLICY "%s_select_own" ON %I FOR SELECT USING (user_id = auth.uid())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_insert_own" ON %I FOR INSERT WITH CHECK (user_id = auth.uid())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_update_own" ON %I FOR UPDATE USING (user_id = auth.uid())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_delete_own" ON %I FOR DELETE USING (user_id = auth.uid())', tbl, tbl);
  END LOOP;
END $$;
