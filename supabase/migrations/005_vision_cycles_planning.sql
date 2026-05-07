-- Migration 005: Vision, Cycles Planning & Weekly Scores
-- Arrow v2.0 — 12 Week Year System

-- 1. Campos novos em cycles
ALTER TABLE cycles ADD COLUMN IF NOT EXISTS vision TEXT;
ALTER TABLE cycles ADD COLUMN IF NOT EXISTS focus_area TEXT;

-- 2. Campos novos em tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS week_number INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS cycle_id UUID REFERENCES cycles(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;

-- 3. Tabela visions (visão de longo prazo — 5 anos)
CREATE TABLE IF NOT EXISTS visions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  career_5y TEXT,
  health_5y TEXT,
  finance_5y TEXT,
  relationships_5y TEXT,
  impact_5y TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE visions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own vision" ON visions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Tabela weekly_scores
CREATE TABLE IF NOT EXISTS weekly_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cycle_id UUID REFERENCES cycles(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 16),
  tasks_planned INTEGER DEFAULT 0 CHECK (tasks_planned >= 0),
  tasks_completed INTEGER DEFAULT 0 CHECK (tasks_completed >= 0),
  score NUMERIC GENERATED ALWAYS AS (
    CASE WHEN tasks_planned = 0 THEN 0
    ELSE ROUND((tasks_completed::NUMERIC / tasks_planned) * 100, 1)
    END
  ) STORED,
  what_went_wrong TEXT,
  lessons TEXT,
  notes TEXT,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, cycle_id, week_number)
);

ALTER TABLE weekly_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scores" ON weekly_scores
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_weekly_scores_cycle ON weekly_scores(cycle_id);
CREATE INDEX IF NOT EXISTS idx_weekly_scores_user ON weekly_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_cycle ON tasks(cycle_id);
CREATE INDEX IF NOT EXISTS idx_tasks_week ON tasks(week_number);
CREATE INDEX IF NOT EXISTS idx_tasks_goal ON tasks(goal_id);
