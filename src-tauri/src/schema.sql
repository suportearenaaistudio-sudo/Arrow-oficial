CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cycles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  vision TEXT,
  focus_area TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planejamento',
  weekly_checkins TEXT NOT NULL DEFAULT '[]',
  badges_earned TEXT NOT NULL DEFAULT '[]',
  final_score REAL,
  notes TEXT,
  color TEXT,
  category TEXT,
  duration INTEGER NOT NULL DEFAULT 12,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  goal_type TEXT NOT NULL,
  measurement_type TEXT,
  target_value REAL,
  current_value REAL NOT NULL DEFAULT 0,
  unit TEXT,
  cycle_id TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  priority TEXT NOT NULL DEFAULT 'media',
  sub_goals TEXT NOT NULL DEFAULT '[]',
  milestones TEXT NOT NULL DEFAULT '[]',
  weekly_targets TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  target_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'a_fazer',
  priority TEXT NOT NULL DEFAULT 'media',
  important INTEGER NOT NULL DEFAULT 0,
  due_date TEXT,
  estimated_hours REAL,
  actual_hours REAL NOT NULL DEFAULT 0,
  goal_id TEXT,
  cycle_id TEXT,
  week_number INTEGER,
  tags TEXT NOT NULL DEFAULT '[]',
  assignee TEXT,
  progress_percentage REAL NOT NULL DEFAULT 0,
  subtasks TEXT NOT NULL DEFAULT '[]',
  comments TEXT NOT NULL DEFAULT '[]',
  attachments TEXT NOT NULL DEFAULT '[]',
  blocked_reason TEXT,
  completion_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  frequency_type TEXT NOT NULL,
  frequency_value INTEGER,
  days_of_week TEXT NOT NULL DEFAULT '[]',
  time_of_day TEXT,
  routine TEXT NOT NULL DEFAULT 'qualquer',
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  completion_history TEXT NOT NULL DEFAULT '[]',
  cycle_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_checkins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  mood TEXT NOT NULL,
  energy_level INTEGER,
  productivity_score INTEGER NOT NULL,
  gratitude TEXT,
  highlight TEXT,
  challenge TEXT,
  tomorrow_focus TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS visions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  career_5y TEXT,
  health_5y TEXT,
  finance_5y TEXT,
  relationships_5y TEXT,
  impact_5y TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weekly_scores (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  tasks_planned INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  score REAL NOT NULL DEFAULT 0,
  what_went_wrong TEXT,
  lessons TEXT,
  notes TEXT,
  finalized_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, cycle_id, week_number)
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
