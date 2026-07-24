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
  weekly_subgoal_id TEXT,
  cycle_id TEXT,
  week_number INTEGER,
  pomodoros_planned INTEGER NOT NULL DEFAULT 0,
  legacy_pomodoros_completed INTEGER NOT NULL DEFAULT 0,
  energy_level TEXT,
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

CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nova conversa',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tool_name TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_token_usage (
  user_id TEXT NOT NULL,
  week_start TEXT NOT NULL,
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  tokens_total INTEGER NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, week_start)
);

CREATE TABLE IF NOT EXISTS workout_programs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  split_type TEXT NOT NULL DEFAULT 'ABC',
  schedule TEXT NOT NULL DEFAULT '[]',
  frequency_per_week INTEGER,
  focus TEXT,
  training_type TEXT DEFAULT 'academia',
  days_of_week TEXT NOT NULL DEFAULT '[]',
  habit_id TEXT,
  cycle_id TEXT,
  duration_weeks INTEGER DEFAULT 12,
  end_date TEXT,
  deload_mode TEXT DEFAULT 'manual',
  deload_after_sessions INTEGER,
  deload_after_weeks INTEGER,
  deload_volume_percent INTEGER DEFAULT 60,
  is_active INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workout_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  label TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  exercises TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (program_id) REFERENCES workout_programs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'a_fazer',
  exercises_log TEXT NOT NULL DEFAULT '[]',
  duration_minutes INTEGER,
  planned_start_time TEXT,
  planned_duration_minutes INTEGER,
  notes TEXT,
  task_id TEXT,
  cycle_id TEXT,
  week_number INTEGER,
  session_mode TEXT DEFAULT 'completa',
  rpe REAL,
  skip_reason TEXT,
  checkin_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (program_id) REFERENCES workout_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS media_lists (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  list_type TEXT NOT NULL,
  is_system INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media_list_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  list_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  status TEXT NOT NULL DEFAULT 'a_ver',
  rank INTEGER,
  rating REAL,
  notes TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  cover_path TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (list_id) REFERENCES media_lists(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS release_schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  media_type TEXT NOT NULL,
  release_date TEXT NOT NULL,
  release_time TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming',
  media_list_id TEXT,
  media_item_id TEXT,
  link_to_calendar INTEGER NOT NULL DEFAULT 0,
  task_id TEXT,
  color TEXT,
  notes TEXT,
  recurrence TEXT,
  notify_days_before INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (media_list_id) REFERENCES media_lists(id) ON DELETE SET NULL,
  FOREIGN KEY (media_item_id) REFERENCES media_list_items(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_release_schedules_user_date
  ON release_schedules(user_id, release_date);

CREATE TABLE IF NOT EXISTS daily_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  mit_task_id TEXT,
  mit_text TEXT,
  energy_level TEXT,
  task_ids TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS time_blocks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  start_min INTEGER NOT NULL,
  end_min INTEGER NOT NULL,
  tasks TEXT NOT NULL DEFAULT '[]',
  label TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'focus',
  color TEXT NOT NULL,
  filled_min REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date ON time_blocks(user_id, date);

CREATE TABLE IF NOT EXISTS workout_checkins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  energy INTEGER,
  sleep_quality INTEGER,
  pain_level INTEGER,
  fatigue_level INTEGER,
  performance_drop INTEGER NOT NULL DEFAULT 0,
  available_minutes INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workout_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  cycle_id TEXT,
  goal_type TEXT NOT NULL,
  title TEXT NOT NULL,
  exercise_id TEXT,
  exercise_name TEXT,
  target_value REAL,
  target_reps INTEGER,
  target_frequency INTEGER,
  current_value REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (program_id) REFERENCES workout_programs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS health_documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  program_id TEXT,
  cycle_id TEXT,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  document_date TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (program_id) REFERENCES workout_programs(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS weekly_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  objective TEXT,
  capacity_hours REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, cycle_id, week_number)
);

CREATE TABLE IF NOT EXISTS weekly_subgoals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  cycle_id TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  goal_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativa',
  priority TEXT NOT NULL DEFAULT 'media',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_weekly_subgoals_cycle_week ON weekly_subgoals(user_id, cycle_id, week_number);

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  started_at TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  mode TEXT NOT NULL,
  task_id TEXT,
  task_title TEXT,
  block_id TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  manual INTEGER NOT NULL DEFAULT 0,
  source_key TEXT UNIQUE,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_date ON pomodoro_sessions(user_id, date);
