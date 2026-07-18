use rusqlite::{params, Connection, Row, types::Value as SqlValue};
use serde_json::{json, Map, Value};
use uuid::Uuid;

const SCHEMA_SQL: &str = include_str!("schema.sql");

fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}

fn json_fields(table: &str) -> &'static [&'static str] {
    match table {
        "cycles" => &["weekly_checkins", "badges_earned"],
        "goals" => &["sub_goals", "milestones", "weekly_targets"],
        "tasks" => &["tags", "subtasks", "comments", "attachments"],
        "habits" => &["days_of_week", "completion_history"],
        "workout_programs" => &["schedule", "days_of_week"],
        "workout_templates" => &["exercises"],
        "workout_sessions" => &["exercises_log"],
        "media_list_items" => &["tags"],
        _ => &[],
    }
}

fn bool_fields(table: &str) -> &'static [&'static str] {
    match table {
        "tasks" => &["important"],
        "workout_programs" => &["is_active"],
        "media_lists" => &["is_system"],
        "release_schedules" => &["link_to_calendar"],
        _ => &[],
    }
}

fn sql_value_to_json(val: SqlValue) -> Value {
    match val {
        SqlValue::Null => Value::Null,
        SqlValue::Integer(i) => json!(i),
        SqlValue::Real(f) => json!(f),
        SqlValue::Text(s) => Value::String(s),
        SqlValue::Blob(b) => Value::String(String::from_utf8_lossy(&b).to_string()),
    }
}

fn row_to_map(row: &Row<'_>) -> rusqlite::Result<Map<String, Value>> {
    let mut map = Map::new();
    let count = row.as_ref().column_count();
    for i in 0..count {
        let name = row.as_ref().column_name(i)?.to_string();
        let val: SqlValue = row.get(i)?;
        map.insert(name, sql_value_to_json(val));
    }
    Ok(map)
}

fn parse_row(table: &str, mut row: Map<String, Value>) -> Map<String, Value> {
    for field in json_fields(table) {
        if let Some(Value::String(s)) = row.get(*field) {
            if let Ok(parsed) = serde_json::from_str::<Value>(s) {
                row.insert(field.to_string(), parsed);
            } else {
                row.insert(field.to_string(), json!([]));
            }
        }
    }
    for field in bool_fields(table) {
        if let Some(v) = row.get(*field) {
            let b = match v {
                Value::Bool(b) => *b,
                Value::Number(n) => n.as_i64().unwrap_or(0) != 0,
                _ => false,
            };
            row.insert(field.to_string(), json!(b));
        }
    }
    row
}

fn stringify_fields(table: &str, mut row: Map<String, Value>) -> Map<String, Value> {
    for field in json_fields(table) {
        if let Some(v) = row.remove(*field) {
            row.insert(
                field.to_string(),
                Value::String(serde_json::to_string(&v).unwrap_or_else(|_| "[]".to_string())),
            );
        }
    }
    for field in bool_fields(table) {
        if let Some(v) = row.remove(*field) {
            let b = v.as_bool().unwrap_or(false);
            row.insert(field.to_string(), json!(if b { 1 } else { 0 }));
        }
    }
    row
}

fn value_to_sql(val: &Value) -> SqlValue {
    match val {
        Value::Null => SqlValue::Null,
        Value::Bool(b) => SqlValue::Integer(if *b { 1 } else { 0 }),
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                SqlValue::Integer(i)
            } else if let Some(f) = n.as_f64() {
                SqlValue::Real(f)
            } else {
                SqlValue::Text(n.to_string())
            }
        }
        Value::String(s) => SqlValue::Text(s.clone()),
        other => SqlValue::Text(other.to_string()),
    }
}

fn table_columns(conn: &Connection, table: &str) -> Result<std::collections::HashSet<String>, String> {
    let sql = format!("PRAGMA table_info({})", table);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|e| e.to_string())?;
    Ok(rows.filter_map(|r| r.ok()).collect())
}

fn insert_row(conn: &Connection, table: &str, data: Map<String, Value>) -> Result<String, String> {
    let id = data
        .get("id")
        .and_then(|v| v.as_str())
        .map(String::from)
        .unwrap_or_else(|| Uuid::new_v4().to_string());
    let mut row = data;
    row.insert("id".to_string(), json!(id));
    let allowed = table_columns(conn, table)?;
    row.retain(|k, _| allowed.contains(k));
    let row = stringify_fields(table, row);
    let cols: Vec<String> = row.keys().cloned().collect();
    let placeholders: Vec<&str> = cols.iter().map(|_| "?").collect();
    let sql = format!(
        "INSERT INTO {} ({}) VALUES ({})",
        table,
        cols.join(", "),
        placeholders.join(", ")
    );
    let values: Vec<SqlValue> = cols.iter().map(|c| value_to_sql(&row[c])).collect();
    conn.execute(&sql, rusqlite::params_from_iter(values.iter()))
        .map_err(|e| e.to_string())?;
    Ok(id)
}

fn update_row(conn: &Connection, table: &str, id: &str, updates: Map<String, Value>) -> Result<(), String> {
    let row = stringify_fields(table, updates);
    let cols: Vec<String> = row.keys().cloned().collect();
    if cols.is_empty() {
        return Ok(());
    }
    let sets: Vec<String> = cols.iter().map(|c| format!("{} = ?", c)).collect();
    let sql = format!("UPDATE {} SET {} WHERE id = ?", table, sets.join(", "));
    let mut values: Vec<SqlValue> = cols.iter().map(|c| value_to_sql(&row[c])).collect();
    values.push(SqlValue::Text(id.to_string()));
    conn.execute(&sql, rusqlite::params_from_iter(values.iter()))
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn get_by_id(conn: &Connection, table: &str, id: &str) -> Result<Map<String, Value>, String> {
    let sql = format!("SELECT * FROM {} WHERE id = ?", table);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let row = stmt
        .query_row(params![id], |row| row_to_map(row))
        .map_err(|e| e.to_string())?;
    Ok(parse_row(table, row))
}

fn value_to_map(val: Value) -> Map<String, Value> {
    val.as_object().cloned().unwrap_or_default()
}

pub struct ArrowDatabase {
    conn: Connection,
}

impl ArrowDatabase {
    pub fn open(db_file: &str) -> Result<Self, String> {
        let conn = Connection::open(db_file).map_err(|e| e.to_string())?;
        conn.pragma_update(None, "journal_mode", "WAL")
            .map_err(|e| e.to_string())?;
        conn.pragma_update(None, "foreign_keys", "ON")
            .map_err(|e| e.to_string())?;
        Ok(Self { conn })
    }

    pub fn init(&self) -> Result<(), String> {
        self.conn.execute_batch(SCHEMA_SQL).map_err(|e| e.to_string())?;
        let current: i32 = self
            .conn
            .query_row("SELECT version FROM schema_version LIMIT 1", [], |row| row.get(0))
            .unwrap_or(0);
        if current == 0 {
            self.conn
                .execute(
                    "INSERT INTO schema_version (version) VALUES (?)",
                    params![crate::types::SCHEMA_VERSION],
                )
                .map_err(|e| e.to_string())?;
        } else if current < crate::types::SCHEMA_VERSION {
            self.migrate_schema(current)?;
            self.conn
                .execute(
                    "UPDATE schema_version SET version = ?",
                    params![crate::types::SCHEMA_VERSION],
                )
                .map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    fn column_exists(&self, table: &str, column: &str) -> bool {
        let sql = format!("PRAGMA table_info({})", table);
        let mut stmt = match self.conn.prepare(&sql) {
            Ok(s) => s,
            Err(_) => return false,
        };
        let names: Vec<String> = stmt
            .query_map([], |row| row.get::<_, String>(1))
            .ok()
            .into_iter()
            .flatten()
            .filter_map(|r| r.ok())
            .collect();
        names.iter().any(|name| name == column)
    }

    fn ensure_column(&self, table: &str, column: &str, definition: &str) -> Result<(), String> {
        if !self.column_exists(table, column) {
            self.conn
                .execute(&format!("ALTER TABLE {} ADD COLUMN {}", table, definition), [])
                .map_err(|e| format!("Falha ao migrar {}.{}: {}", table, column, e))?;
        }
        Ok(())
    }

    fn migrate_schema(&self, from: i32) -> Result<(), String> {
        if from < 3 {
            let _ = self.conn.execute(
                "ALTER TABLE workout_programs ADD COLUMN frequency_per_week INTEGER",
                [],
            );
            let _ = self.conn.execute(
                "ALTER TABLE workout_programs ADD COLUMN focus TEXT",
                [],
            );
        }
        if from < 4 {
            self.ensure_column(
                "workout_programs",
                "training_type",
                "training_type TEXT DEFAULT 'academia'",
            )?;
            self.ensure_column(
                "workout_programs",
                "days_of_week",
                "days_of_week TEXT NOT NULL DEFAULT '[]'",
            )?;
            self.ensure_column(
                "workout_sessions",
                "planned_start_time",
                "planned_start_time TEXT",
            )?;
            self.ensure_column(
                "workout_sessions",
                "planned_duration_minutes",
                "planned_duration_minutes INTEGER",
            )?;
            self.conn
                .execute_batch(
                    "CREATE TABLE IF NOT EXISTS release_schedules (
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
                      updated_at TEXT NOT NULL
                    );
                    CREATE INDEX IF NOT EXISTS idx_release_schedules_user_date
                      ON release_schedules(user_id, release_date);",
                )
                .map_err(|e| e.to_string())?;
        }
        if from < 5 {
            self.ensure_column(
                "workout_programs",
                "duration_weeks",
                "duration_weeks INTEGER DEFAULT 12",
            )?;
        }
        Ok(())
    }

    fn clamp_rating(val: Option<f64>) -> Option<f64> {
        val.map(|r| (r * 10.0).round() / 10.0).map(|r| r.clamp(0.0, 10.0))
    }

    pub fn seed_default_media_lists(&self, user_id: &str) -> Result<(), String> {
        let count: i32 = self
            .conn
            .query_row(
                "SELECT COUNT(*) FROM media_lists WHERE user_id = ? AND is_system = 1",
                params![user_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        if count > 0 {
            return Ok(());
        }
        let defaults = [
            ("filmes", "Filmes", 0),
            ("series", "Séries", 1),
            ("animes", "Animes", 2),
            ("animacao", "Animação", 3),
            ("jogos", "Jogos", 4),
            ("esportes", "Esportes", 5),
            ("livros", "Livros", 6),
        ];
        let ts = now_iso();
        for (list_type, name, sort_order) in defaults {
            let mut row = Map::new();
            row.insert("id".to_string(), json!(Uuid::new_v4().to_string()));
            row.insert("user_id".to_string(), json!(user_id));
            row.insert("name".to_string(), json!(name));
            row.insert("list_type".to_string(), json!(list_type));
            row.insert("is_system".to_string(), json!(true));
            row.insert("sort_order".to_string(), json!(sort_order));
            row.insert("created_at".to_string(), json!(ts));
            row.insert("updated_at".to_string(), json!(ts));
            insert_row(&self.conn, "media_lists", row)?;
        }
        Ok(())
    }

    // ─── Cycles ───────────────────────────────────────────────

    pub fn list_cycles(&self, user_id: &str) -> Result<Vec<Map<String, Value>>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT * FROM cycles WHERE user_id = ? ORDER BY created_at DESC")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![user_id], |row| row_to_map(row))
            .map_err(|e| e.to_string())?;
        rows.map(|r| r.map(|row| parse_row("cycles", row)))
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())
    }

    pub fn create_cycle(&self, user_id: &str, data: Value) -> Result<Map<String, Value>, String> {
        let ts = now_iso();
        let mut row = value_to_map(data);
        row.insert("user_id".to_string(), json!(user_id));
        row.entry("weekly_checkins".to_string()).or_insert(json!([]));
        row.entry("badges_earned".to_string()).or_insert(json!([]));
        row.insert("created_at".to_string(), json!(ts));
        row.insert("updated_at".to_string(), json!(ts));
        let id = insert_row(&self.conn, "cycles", row)?;
        get_by_id(&self.conn, "cycles", &id)
    }

    pub fn update_cycle(&self, id: &str, updates: Value) -> Result<Map<String, Value>, String> {
        let mut row = value_to_map(updates);
        row.insert("updated_at".to_string(), json!(now_iso()));
        update_row(&self.conn, "cycles", id, row)?;
        get_by_id(&self.conn, "cycles", id)
    }

    pub fn delete_cycle(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM cycles WHERE id = ?", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn activate_cycle(&self, user_id: &str, cycle_id: &str) -> Result<(), String> {
        let ts = now_iso();
        self.conn
            .execute(
                "UPDATE cycles SET status = 'pausado', updated_at = ? WHERE status = 'ativo' AND user_id = ?",
                params![ts, user_id],
            )
            .map_err(|e| e.to_string())?;
        self.conn
            .execute(
                "UPDATE cycles SET status = 'ativo', updated_at = ? WHERE id = ?",
                params![now_iso(), cycle_id],
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ─── Goals ────────────────────────────────────────────────

    pub fn list_goals(
        &self,
        user_id: &str,
        filters: Option<Value>,
    ) -> Result<Vec<Map<String, Value>>, String> {
        let mut sql = String::from("SELECT * FROM goals WHERE user_id = ?");
        let f = filters.unwrap_or(json!({}));
        let mut bind: Vec<SqlValue> = vec![SqlValue::Text(user_id.to_string())];
        if let Some(cat) = f.get("category").and_then(|v| v.as_str()).filter(|s| !s.is_empty()) {
            sql.push_str(" AND category = ?");
            bind.push(SqlValue::Text(cat.to_string()));
        }
        if let Some(status) = f.get("status").and_then(|v| v.as_str()).filter(|s| !s.is_empty()) {
            sql.push_str(" AND status = ?");
            bind.push(SqlValue::Text(status.to_string()));
        }
        if let Some(cycle_id) = f.get("cycleId").and_then(|v| v.as_str()).filter(|s| !s.is_empty()) {
            sql.push_str(" AND cycle_id = ?");
            bind.push(SqlValue::Text(cycle_id.to_string()));
        }
        if let Some(search) = f.get("search").and_then(|v| v.as_str()).filter(|s| !s.is_empty()) {
            sql.push_str(" AND title LIKE ?");
            bind.push(SqlValue::Text(format!("%{}%", search)));
        }
        sql.push_str(" ORDER BY updated_at DESC");
        let mut stmt = self.conn.prepare(&sql).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(rusqlite::params_from_iter(bind.iter()), |row| row_to_map(row))
            .map_err(|e| e.to_string())?;
        rows.map(|r| r.map(|row| parse_row("goals", row)))
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())
    }

    pub fn create_goal(&self, user_id: &str, data: Value) -> Result<Map<String, Value>, String> {
        let ts = now_iso();
        let mut row = value_to_map(data);
        row.entry("current_value".to_string()).or_insert(json!(0));
        row.entry("sub_goals".to_string()).or_insert(json!([]));
        row.entry("milestones".to_string()).or_insert(json!([]));
        row.entry("weekly_targets".to_string()).or_insert(json!([]));
        row.entry("status".to_string()).or_insert(json!("ativo"));
        row.entry("priority".to_string()).or_insert(json!("media"));
        row.insert("user_id".to_string(), json!(user_id));
        row.insert("created_at".to_string(), json!(ts));
        row.insert("updated_at".to_string(), json!(ts));
        let id = insert_row(&self.conn, "goals", row)?;
        get_by_id(&self.conn, "goals", &id)
    }

    pub fn update_goal(&self, id: &str, updates: Value) -> Result<Map<String, Value>, String> {
        let mut row = value_to_map(updates);
        row.remove("id");
        row.insert("updated_at".to_string(), json!(now_iso()));
        update_row(&self.conn, "goals", id, row)?;
        get_by_id(&self.conn, "goals", id)
    }

    pub fn delete_goal(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM goals WHERE id = ?", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ─── Tasks ────────────────────────────────────────────────

    pub fn list_tasks(&self, user_id: &str) -> Result<Vec<Map<String, Value>>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![user_id], |row| row_to_map(row))
            .map_err(|e| e.to_string())?;
        rows.map(|r| r.map(|row| parse_row("tasks", row)))
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())
    }

    pub fn create_task(&self, user_id: &str, data: Value) -> Result<Map<String, Value>, String> {
        let ts = now_iso();
        let mut row = value_to_map(data);
        row.entry("actual_hours".to_string()).or_insert(json!(0));
        row.entry("progress_percentage".to_string()).or_insert(json!(0));
        row.entry("tags".to_string()).or_insert(json!([]));
        row.entry("subtasks".to_string()).or_insert(json!([]));
        row.entry("comments".to_string()).or_insert(json!([]));
        row.entry("attachments".to_string()).or_insert(json!([]));
        row.entry("status".to_string()).or_insert(json!("a_fazer"));
        row.entry("priority".to_string()).or_insert(json!("media"));
        row.entry("important".to_string()).or_insert(json!(false));
        row.insert("user_id".to_string(), json!(user_id));
        row.insert("created_at".to_string(), json!(ts));
        row.insert("updated_at".to_string(), json!(ts));
        let id = insert_row(&self.conn, "tasks", row)?;
        get_by_id(&self.conn, "tasks", &id)
    }

    pub fn update_task(&self, id: &str, updates: Value) -> Result<Map<String, Value>, String> {
        let mut row = value_to_map(updates);
        row.remove("id");
        row.insert("updated_at".to_string(), json!(now_iso()));
        update_row(&self.conn, "tasks", id, row)?;
        get_by_id(&self.conn, "tasks", &id)
    }

    pub fn delete_task(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM tasks WHERE id = ?", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ─── Habits ───────────────────────────────────────────────

    pub fn list_habits(&self, user_id: &str) -> Result<Vec<Map<String, Value>>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT * FROM habits WHERE user_id = ? ORDER BY updated_at DESC")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![user_id], |row| row_to_map(row))
            .map_err(|e| e.to_string())?;
        rows.map(|r| r.map(|row| parse_row("habits", row)))
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())
    }

    pub fn create_habit(&self, user_id: &str, data: Value) -> Result<Map<String, Value>, String> {
        let ts = now_iso();
        let mut row = value_to_map(data);
        row.entry("current_streak".to_string()).or_insert(json!(0));
        row.entry("longest_streak".to_string()).or_insert(json!(0));
        row.entry("completion_history".to_string()).or_insert(json!([]));
        row.entry("days_of_week".to_string()).or_insert(json!([]));
        row.entry("routine".to_string()).or_insert(json!("qualquer"));
        row.insert("user_id".to_string(), json!(user_id));
        row.insert("created_at".to_string(), json!(ts));
        row.insert("updated_at".to_string(), json!(ts));
        let id = insert_row(&self.conn, "habits", row)?;
        get_by_id(&self.conn, "habits", &id)
    }

    pub fn update_habit(&self, id: &str, updates: Value) -> Result<(), String> {
        let mut row = value_to_map(updates);
        row.remove("id");
        row.insert("updated_at".to_string(), json!(now_iso()));
        update_row(&self.conn, "habits", id, row)
    }

    pub fn delete_habit(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM habits WHERE id = ?", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ─── Transactions ─────────────────────────────────────────

    pub fn list_transactions(
        &self,
        user_id: &str,
        filters: Option<Value>,
    ) -> Result<Vec<Map<String, Value>>, String> {
        let mut sql = String::from("SELECT * FROM transactions WHERE user_id = ?");
        let f = filters.unwrap_or(json!({}));
        let mut bind: Vec<SqlValue> = vec![SqlValue::Text(user_id.to_string())];
        if let Some(start) = f.get("startDate").and_then(|v| v.as_str()) {
            sql.push_str(" AND date >= ?");
            bind.push(SqlValue::Text(start.to_string()));
        }
        if let Some(end) = f.get("endDate").and_then(|v| v.as_str()) {
            sql.push_str(" AND date <= ?");
            bind.push(SqlValue::Text(end.to_string()));
        }
        sql.push_str(" ORDER BY date DESC");
        let mut stmt = self.conn.prepare(&sql).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(rusqlite::params_from_iter(bind.iter()), |row| row_to_map(row))
            .map_err(|e| e.to_string())?;
        rows.collect::<rusqlite::Result<Vec<_>>>().map_err(|e| e.to_string())
    }

    pub fn create_transaction(&self, user_id: &str, data: Value) -> Result<Map<String, Value>, String> {
        let ts = now_iso();
        let mut row = value_to_map(data);
        row.insert("user_id".to_string(), json!(user_id));
        row.insert("created_at".to_string(), json!(ts));
        row.insert("updated_at".to_string(), json!(ts));
        let id = insert_row(&self.conn, "transactions", row)?;
        get_by_id(&self.conn, "transactions", &id)
    }

    pub fn delete_transaction(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM transactions WHERE id = ?", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ─── Checkins ───────────────────────────────────────────

    pub fn list_checkins(&self, user_id: &str) -> Result<Vec<Map<String, Value>>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT * FROM daily_checkins WHERE user_id = ? ORDER BY date DESC")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![user_id], |row| row_to_map(row))
            .map_err(|e| e.to_string())?;
        rows.collect::<rusqlite::Result<Vec<_>>>().map_err(|e| e.to_string())
    }

    pub fn get_checkin_by_date(&self, user_id: &str, date: &str) -> Result<Option<Map<String, Value>>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT * FROM daily_checkins WHERE user_id = ? AND date = ?")
            .map_err(|e| e.to_string())?;
        let row = stmt
            .query_row(params![user_id, date], |row| row_to_map(row))
            .ok();
        Ok(row)
    }

    pub fn upsert_checkin(&self, user_id: &str, data: Value) -> Result<Map<String, Value>, String> {
        let row = value_to_map(data);
        let date = row
            .get("date")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "date é obrigatório".to_string())?;
        let existing = self.get_checkin_by_date(user_id, date)?;
        let ts = now_iso();
        if let Some(ex) = existing {
            let id = ex.get("id").and_then(|v| v.as_str()).unwrap_or("");
            let fields = [
                "mood",
                "energy_level",
                "productivity_score",
                "gratitude",
                "highlight",
                "challenge",
                "tomorrow_focus",
                "notes",
            ];
            let mut updates = Map::new();
            for f in fields {
                if let Some(v) = row.get(f) {
                    updates.insert(f.to_string(), v.clone());
                }
            }
            updates.insert("updated_at".to_string(), json!(ts));
            update_row(&self.conn, "daily_checkins", id, updates)?;
            return get_by_id(&self.conn, "daily_checkins", id);
        }
        let mut insert = row;
        insert.insert("id".to_string(), json!(Uuid::new_v4().to_string()));
        insert.insert("user_id".to_string(), json!(user_id));
        insert.insert("created_at".to_string(), json!(ts));
        insert.insert("updated_at".to_string(), json!(ts));
        let id = insert_row(&self.conn, "daily_checkins", insert)?;
        get_by_id(&self.conn, "daily_checkins", &id)
    }

    // ─── Vision ───────────────────────────────────────────────

    pub fn get_vision(&self, user_id: &str) -> Result<Option<Map<String, Value>>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT * FROM visions WHERE user_id = ?")
            .map_err(|e| e.to_string())?;
        Ok(stmt
            .query_row(params![user_id], |row| row_to_map(row))
            .ok())
    }

    pub fn save_vision(&self, user_id: &str, updates: Value) -> Result<Option<Map<String, Value>>, String> {
        let ts = now_iso();
        let row = value_to_map(updates);
        let existing = self.get_vision(user_id)?;
        if existing.is_some() {
            let mut upd = row;
            upd.insert("updated_at".to_string(), json!(ts));
            let cols: Vec<String> = upd.keys().cloned().collect();
            let sets: Vec<String> = cols.iter().map(|c| format!("{} = ?", c)).collect();
            let sql = format!("UPDATE visions SET {} WHERE user_id = ?", sets.join(", "));
            let mut values: Vec<SqlValue> = cols.iter().map(|c| value_to_sql(&upd[c])).collect();
            values.push(SqlValue::Text(user_id.to_string()));
            self.conn
                .execute(&sql, rusqlite::params_from_iter(values.iter()))
                .map_err(|e| e.to_string())?;
        } else {
            let mut ins = row;
            ins.insert("id".to_string(), json!(Uuid::new_v4().to_string()));
            ins.insert("user_id".to_string(), json!(user_id));
            ins.insert("updated_at".to_string(), json!(ts));
            insert_row(&self.conn, "visions", ins)?;
        }
        self.get_vision(user_id)
    }

    // ─── Weekly scores ────────────────────────────────────────

    pub fn list_weekly_scores(
        &self,
        user_id: &str,
        cycle_id: Option<&str>,
    ) -> Result<Vec<Map<String, Value>>, String> {
        let mut sql = String::from("SELECT * FROM weekly_scores WHERE user_id = ?");
        let mut bind: Vec<SqlValue> = vec![SqlValue::Text(user_id.to_string())];
        if let Some(cid) = cycle_id {
            sql.push_str(" AND cycle_id = ?");
            bind.push(SqlValue::Text(cid.to_string()));
        }
        sql.push_str(" ORDER BY week_number ASC");
        let mut stmt = self.conn.prepare(&sql).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(rusqlite::params_from_iter(bind.iter()), |row| row_to_map(row))
            .map_err(|e| e.to_string())?;
        rows.collect::<rusqlite::Result<Vec<_>>>().map_err(|e| e.to_string())
    }

    pub fn upsert_weekly_score(&self, user_id: &str, payload: Value) -> Result<Map<String, Value>, String> {
        let row = value_to_map(payload);
        let cycle_id = row
            .get("cycle_id")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "cycle_id é obrigatório".to_string())?;
        let week_number = row
            .get("week_number")
            .and_then(|v| v.as_i64())
            .ok_or_else(|| "week_number é obrigatório".to_string())?;

        let existing: Option<String> = self
            .conn
            .query_row(
                "SELECT id FROM weekly_scores WHERE user_id = ? AND cycle_id = ? AND week_number = ?",
                params![user_id, cycle_id, week_number],
                |row| row.get(0),
            )
            .ok();

        let ts = now_iso();
        if let Some(id) = existing {
            let fields = [
                "tasks_planned",
                "tasks_completed",
                "score",
                "what_went_wrong",
                "lessons",
                "notes",
            ];
            let mut updates = Map::new();
            for f in fields {
                if let Some(v) = row.get(f) {
                    updates.insert(f.to_string(), v.clone());
                }
            }
            updates.insert("finalized_at".to_string(), json!(ts));
            update_row(&self.conn, "weekly_scores", &id, updates)?;
            return get_by_id(&self.conn, "weekly_scores", &id);
        }

        let mut insert = row;
        insert.insert("id".to_string(), json!(Uuid::new_v4().to_string()));
        insert.insert("user_id".to_string(), json!(user_id));
        insert.insert("created_at".to_string(), json!(ts));
        insert.entry("finalized_at".to_string()).or_insert(json!(ts));
        insert.entry("tasks_planned".to_string()).or_insert(json!(0));
        insert.entry("tasks_completed".to_string()).or_insert(json!(0));
        insert.entry("score".to_string()).or_insert(json!(0));
        let id = insert_row(&self.conn, "weekly_scores", insert)?;
        get_by_id(&self.conn, "weekly_scores", &id)
    }

    // ─── App settings ─────────────────────────────────────────

    pub fn get_setting(&self, key: &str) -> Result<Option<String>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT value FROM app_settings WHERE key = ?")
            .map_err(|e| e.to_string())?;
        let row = stmt
            .query_row(params![key], |row| row.get::<_, String>(0))
            .ok();
        Ok(row)
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                params![key, value],
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_setting(&self, key: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM app_settings WHERE key = ?", params![key])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ─── AI conversations ─────────────────────────────────────

    pub fn list_ai_conversations(&self, user_id: &str) -> Result<Vec<Map<String, Value>>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT * FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![user_id], |row| row_to_map(row))
            .map_err(|e| e.to_string())?;
        rows.collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())
    }

    pub fn create_ai_conversation(&self, user_id: &str, title: Option<&str>) -> Result<Map<String, Value>, String> {
        let ts = now_iso();
        let id = Uuid::new_v4().to_string();
        let title = title.unwrap_or("Nova conversa");
        self.conn
            .execute(
                "INSERT INTO ai_conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                params![id, user_id, title, ts, ts],
            )
            .map_err(|e| e.to_string())?;
        get_by_id(&self.conn, "ai_conversations", &id)
    }

    pub fn update_ai_conversation_title(&self, id: &str, title: &str) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE ai_conversations SET title = ?, updated_at = ? WHERE id = ?",
                params![title, now_iso(), id],
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn touch_ai_conversation(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE ai_conversations SET updated_at = ? WHERE id = ?",
                params![now_iso(), id],
            )
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete_ai_conversation(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM ai_messages WHERE conversation_id = ?", params![id])
            .map_err(|e| e.to_string())?;
        self.conn
            .execute("DELETE FROM ai_conversations WHERE id = ?", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn list_ai_messages(&self, conversation_id: &str, limit: Option<i64>) -> Result<Vec<Map<String, Value>>, String> {
        let limit = limit.unwrap_or(100);
        let mut stmt = self
            .conn
            .prepare(
                "SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT ?",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![conversation_id, limit], |row| row_to_map(row))
            .map_err(|e| e.to_string())?;
        rows.collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())
    }

    pub fn insert_ai_message(
        &self,
        conversation_id: &str,
        role: &str,
        content: &str,
        tool_name: Option<&str>,
        tokens_in: i64,
        tokens_out: i64,
    ) -> Result<Map<String, Value>, String> {
        let id = Uuid::new_v4().to_string();
        let ts = now_iso();
        self.conn
            .execute(
                "INSERT INTO ai_messages (id, conversation_id, role, content, tool_name, tokens_in, tokens_out, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                params![id, conversation_id, role, content, tool_name, tokens_in, tokens_out, ts],
            )
            .map_err(|e| e.to_string())?;
        get_by_id(&self.conn, "ai_messages", &id)
    }

    pub fn increment_token_usage(
        &self,
        user_id: &str,
        week_start: &str,
        tokens_in: i64,
        tokens_out: i64,
    ) -> Result<Map<String, Value>, String> {
        let ts = now_iso();
        let total = tokens_in + tokens_out;
        self.conn
            .execute(
                "INSERT INTO ai_token_usage (user_id, week_start, tokens_in, tokens_out, tokens_total, request_count, updated_at)
                 VALUES (?, ?, ?, ?, ?, 1, ?)
                 ON CONFLICT(user_id, week_start) DO UPDATE SET
                   tokens_in = tokens_in + excluded.tokens_in,
                   tokens_out = tokens_out + excluded.tokens_out,
                   tokens_total = tokens_total + excluded.tokens_total,
                   request_count = request_count + 1,
                   updated_at = excluded.updated_at",
                params![user_id, week_start, tokens_in, tokens_out, total, ts],
            )
            .map_err(|e| e.to_string())?;
        self.get_token_usage(user_id, week_start)
    }

    pub fn get_token_usage(&self, user_id: &str, week_start: &str) -> Result<Map<String, Value>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT * FROM ai_token_usage WHERE user_id = ? AND week_start = ?",
            )
            .map_err(|e| e.to_string())?;
        let row = stmt
            .query_row(params![user_id, week_start], |row| row_to_map(row))
            .unwrap_or_else(|_| {
                let mut m = Map::new();
                m.insert("user_id".to_string(), json!(user_id));
                m.insert("week_start".to_string(), json!(week_start));
                m.insert("tokens_in".to_string(), json!(0));
                m.insert("tokens_out".to_string(), json!(0));
                m.insert("tokens_total".to_string(), json!(0));
                m.insert("request_count".to_string(), json!(0));
                m
            });
        Ok(row)
    }

    // ─── Workout programs ─────────────────────────────────────

    pub fn list_workout_programs(&self, user_id: &str) -> Result<Vec<Map<String, Value>>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT * FROM workout_programs WHERE user_id = ? ORDER BY created_at DESC")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![user_id], |row| row_to_map(row))
            .map_err(|e| e.to_string())?;
        rows.map(|r| r.map(|row| parse_row("workout_programs", row)))
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())
    }

    pub fn create_workout_program(&self, user_id: &str, data: Value) -> Result<Map<String, Value>, String> {
        let ts = now_iso();
        let mut row = value_to_map(data);
        row.insert("user_id".to_string(), json!(user_id));
        row.entry("schedule".to_string()).or_insert(json!([]));
        row.entry("days_of_week".to_string()).or_insert(json!([]));
        row.entry("training_type".to_string()).or_insert(json!("academia"));
        row.entry("duration_weeks".to_string()).or_insert(json!(12));
        row.entry("is_active".to_string()).or_insert(json!(true));
        row.insert("created_at".to_string(), json!(ts));
        row.insert("updated_at".to_string(), json!(ts));
        let id = insert_row(&self.conn, "workout_programs", row)?;
        get_by_id(&self.conn, "workout_programs", &id)
    }

    pub fn update_workout_program(&self, id: &str, updates: Value) -> Result<Map<String, Value>, String> {
        let mut row = value_to_map(updates);
        row.insert("updated_at".to_string(), json!(now_iso()));
        update_row(&self.conn, "workout_programs", id, row)?;
        get_by_id(&self.conn, "workout_programs", id)
    }

    pub fn delete_workout_program(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM workout_sessions WHERE program_id = ?", params![id])
            .map_err(|e| e.to_string())?;
        self.conn
            .execute("DELETE FROM workout_templates WHERE program_id = ?", params![id])
            .map_err(|e| e.to_string())?;
        self.conn
            .execute("DELETE FROM workout_programs WHERE id = ?", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ─── Workout templates ────────────────────────────────────

    pub fn list_workout_templates(&self, program_id: &str) -> Result<Vec<Map<String, Value>>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT * FROM workout_templates WHERE program_id = ? ORDER BY label ASC")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![program_id], |row| row_to_map(row))
            .map_err(|e| e.to_string())?;
        rows.map(|r| r.map(|row| parse_row("workout_templates", row)))
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())
    }

    pub fn create_workout_template(&self, user_id: &str, data: Value) -> Result<Map<String, Value>, String> {
        let ts = now_iso();
        let mut row = value_to_map(data);
        row.insert("user_id".to_string(), json!(user_id));
        row.entry("exercises".to_string()).or_insert(json!([]));
        row.insert("created_at".to_string(), json!(ts));
        row.insert("updated_at".to_string(), json!(ts));
        let id = insert_row(&self.conn, "workout_templates", row)?;
        get_by_id(&self.conn, "workout_templates", &id)
    }

    pub fn update_workout_template(&self, id: &str, updates: Value) -> Result<Map<String, Value>, String> {
        let mut row = value_to_map(updates);
        row.insert("updated_at".to_string(), json!(now_iso()));
        update_row(&self.conn, "workout_templates", id, row)?;
        get_by_id(&self.conn, "workout_templates", id)
    }

    pub fn delete_workout_template(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM workout_sessions WHERE template_id = ?", params![id])
            .map_err(|e| e.to_string())?;
        self.conn
            .execute("DELETE FROM workout_templates WHERE id = ?", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ─── Workout sessions ─────────────────────────────────────

    pub fn list_workout_sessions(
        &self,
        user_id: &str,
        filters: Option<Value>,
    ) -> Result<Vec<Map<String, Value>>, String> {
        let mut sql = String::from("SELECT * FROM workout_sessions WHERE user_id = ?");
        let f = filters.unwrap_or(json!({}));
        let mut bind: Vec<SqlValue> = vec![SqlValue::Text(user_id.to_string())];
        if let Some(pid) = f.get("program_id").and_then(|v| v.as_str()).filter(|s| !s.is_empty()) {
            sql.push_str(" AND program_id = ?");
            bind.push(SqlValue::Text(pid.to_string()));
        }
        if let Some(cid) = f.get("cycle_id").and_then(|v| v.as_str()).filter(|s| !s.is_empty()) {
            sql.push_str(" AND cycle_id = ?");
            bind.push(SqlValue::Text(cid.to_string()));
        }
        if let Some(wn) = f.get("week_number").and_then(|v| v.as_i64()) {
            sql.push_str(" AND week_number = ?");
            bind.push(SqlValue::Integer(wn));
        }
        if let Some(date) = f.get("date").and_then(|v| v.as_str()).filter(|s| !s.is_empty()) {
            sql.push_str(" AND date = ?");
            bind.push(SqlValue::Text(date.to_string()));
        }
        sql.push_str(" ORDER BY date ASC");
        let mut stmt = self.conn.prepare(&sql).map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(rusqlite::params_from_iter(bind.iter()), |row| row_to_map(row))
            .map_err(|e| e.to_string())?;
        rows.map(|r| r.map(|row| parse_row("workout_sessions", row)))
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())
    }

    pub fn create_workout_session(&self, user_id: &str, data: Value) -> Result<Map<String, Value>, String> {
        let ts = now_iso();
        let mut row = value_to_map(data);
        row.insert("user_id".to_string(), json!(user_id));
        row.entry("exercises_log".to_string()).or_insert(json!([]));
        row.entry("status".to_string()).or_insert(json!("a_fazer"));
        row.insert("created_at".to_string(), json!(ts));
        row.insert("updated_at".to_string(), json!(ts));
        let id = insert_row(&self.conn, "workout_sessions", row)?;
        get_by_id(&self.conn, "workout_sessions", &id)
    }

    pub fn update_workout_session(&self, id: &str, updates: Value) -> Result<Map<String, Value>, String> {
        let mut row = value_to_map(updates);
        row.insert("updated_at".to_string(), json!(now_iso()));
        update_row(&self.conn, "workout_sessions", id, row)?;
        get_by_id(&self.conn, "workout_sessions", &id)
    }

    pub fn delete_workout_session(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM workout_sessions WHERE id = ?", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn complete_workout_session(
        &self,
        id: &str,
        exercises_log: Value,
        duration_minutes: Option<i64>,
    ) -> Result<Map<String, Value>, String> {
        let mut updates = Map::new();
        updates.insert("status".to_string(), json!("feito"));
        updates.insert("exercises_log".to_string(), exercises_log);
        if let Some(d) = duration_minutes {
            updates.insert("duration_minutes".to_string(), json!(d));
        }
        self.update_workout_session(id, Value::Object(updates))
    }

    pub fn get_exercise_progress(
        &self,
        user_id: &str,
        exercise_name: &str,
    ) -> Result<Vec<Map<String, Value>>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT date, exercises_log FROM workout_sessions WHERE user_id = ? AND status = 'feito' ORDER BY date ASC",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![user_id], |row| row_to_map(row))
            .map_err(|e| e.to_string())?;
        let mut progress = Vec::new();
        for row in rows {
            let row = row.map_err(|e| e.to_string())?;
            let date = row.get("date").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let log_str = row.get("exercises_log").and_then(|v| v.as_str()).unwrap_or("[]");
            let log: Value = serde_json::from_str(log_str).unwrap_or(json!([]));
            if let Some(arr) = log.as_array() {
                for entry in arr {
                    if entry.get("name").and_then(|v| v.as_str()) == Some(exercise_name) {
                        let max_load = entry
                            .get("sets")
                            .and_then(|s| s.as_array())
                            .map(|sets| {
                                sets.iter()
                                    .filter_map(|set| set.get("load_kg").and_then(|v| v.as_f64()))
                                    .fold(0.0_f64, f64::max)
                            })
                            .unwrap_or(0.0);
                        let mut point = Map::new();
                        point.insert("date".to_string(), json!(date));
                        point.insert("max_load_kg".to_string(), json!(max_load));
                        progress.push(point);
                    }
                }
            }
        }
        Ok(progress)
    }

    pub fn generate_week_sessions(
        &self,
        user_id: &str,
        program_id: &str,
        cycle_id: &str,
        week_number: i64,
        week_dates: Value,
    ) -> Result<Vec<Map<String, Value>>, String> {
        let program = get_by_id(&self.conn, "workout_programs", program_id)?;
        let schedule = program
            .get("schedule")
            .cloned()
            .unwrap_or(json!([]));
        let dates = week_dates.as_array().cloned().unwrap_or_default();
        let mut created = Vec::new();
        if let Some(entries) = schedule.as_array() {
            for entry in entries {
                let day = entry.get("day").and_then(|v| v.as_i64()).unwrap_or(0) as usize;
                let template_id = entry
                    .get("template_id")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                if template_id.is_empty() || day >= dates.len() {
                    continue;
                }
                let date = dates[day].as_str().unwrap_or("").to_string();
                if date.is_empty() {
                    continue;
                }
                let existing: i32 = self
                    .conn
                    .query_row(
                        "SELECT COUNT(*) FROM workout_sessions WHERE user_id = ? AND program_id = ? AND date = ? AND template_id = ?",
                        params![user_id, program_id, date, template_id],
                        |row| row.get(0),
                    )
                    .unwrap_or(0);
                if existing > 0 {
                    continue;
                }
                let template = get_by_id(&self.conn, "workout_templates", template_id)?;
                let template_name = template.get("name").and_then(|v| v.as_str()).unwrap_or("Treino");
                let label = template.get("label").and_then(|v| v.as_str()).unwrap_or("");
                let training_type = program
                    .get("training_type")
                    .and_then(|v| v.as_str())
                    .unwrap_or("academia");
                let planned_start = entry
                    .get("planned_start_time")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());
                let planned_duration = entry
                    .get("planned_duration_minutes")
                    .and_then(|v| v.as_i64());

                let task_title = match training_type {
                    "corrida" | "natacao" | "ciclismo" => {
                        format!("{} — {}", capitalize_training(training_type), template_name)
                    }
                    _ => format!("Treino {} — {}", label, template_name),
                };

                let mut task_row = Map::new();
                task_row.insert("title".to_string(), json!(task_title));
                task_row.insert("status".to_string(), json!("a_fazer"));
                task_row.insert("priority".to_string(), json!("media"));
                task_row.insert("cycle_id".to_string(), json!(cycle_id));
                task_row.insert("week_number".to_string(), json!(week_number));
                task_row.insert("tags".to_string(), json!(["treino"]));
                let task = self.create_task(user_id, Value::Object(task_row))?;
                let task_id = task.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();

                let mut session_row = Map::new();
                session_row.insert("program_id".to_string(), json!(program_id));
                session_row.insert("template_id".to_string(), json!(template_id));
                session_row.insert("date".to_string(), json!(date));
                session_row.insert("status".to_string(), json!("a_fazer"));
                session_row.insert("cycle_id".to_string(), json!(cycle_id));
                session_row.insert("week_number".to_string(), json!(week_number));
                session_row.insert("task_id".to_string(), json!(task_id));
                if let Some(ref t) = planned_start {
                    session_row.insert("planned_start_time".to_string(), json!(t));
                }
                if let Some(d) = planned_duration {
                    session_row.insert("planned_duration_minutes".to_string(), json!(d));
                }
                let session = self.create_workout_session(user_id, Value::Object(session_row))?;
                created.push(session);
            }
        }
        Ok(created)
    }

    // ─── Media lists ──────────────────────────────────────────

    pub fn list_media_lists(&self, user_id: &str) -> Result<Vec<Map<String, Value>>, String> {
        self.seed_default_media_lists(user_id)?;
        let mut stmt = self
            .conn
            .prepare("SELECT * FROM media_lists WHERE user_id = ? ORDER BY is_system DESC, sort_order ASC, created_at ASC")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![user_id], |row| row_to_map(row))
            .map_err(|e| e.to_string())?;
        rows.map(|r| r.map(|row| parse_row("media_lists", row)))
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())
    }

    pub fn create_media_list(&self, user_id: &str, data: Value) -> Result<Map<String, Value>, String> {
        let ts = now_iso();
        let mut row = value_to_map(data);
        row.insert("user_id".to_string(), json!(user_id));
        row.entry("is_system".to_string()).or_insert(json!(false));
        row.entry("sort_order".to_string()).or_insert(json!(99));
        row.insert("created_at".to_string(), json!(ts));
        row.insert("updated_at".to_string(), json!(ts));
        let id = insert_row(&self.conn, "media_lists", row)?;
        get_by_id(&self.conn, "media_lists", &id)
    }

    pub fn update_media_list(&self, id: &str, updates: Value) -> Result<Map<String, Value>, String> {
        let mut row = value_to_map(updates);
        row.insert("updated_at".to_string(), json!(now_iso()));
        update_row(&self.conn, "media_lists", id, row)?;
        get_by_id(&self.conn, "media_lists", &id)
    }

    pub fn delete_media_list(&self, id: &str) -> Result<(), String> {
        let row = get_by_id(&self.conn, "media_lists", id)?;
        let is_system = row
            .get("is_system")
            .map(|v| v.as_bool().unwrap_or(false) || v.as_i64().unwrap_or(0) != 0)
            .unwrap_or(false);
        if is_system {
            return Err("Listas padrão não podem ser excluídas".to_string());
        }
        self.conn
            .execute("DELETE FROM media_list_items WHERE list_id = ?", params![id])
            .map_err(|e| e.to_string())?;
        self.conn
            .execute("DELETE FROM media_lists WHERE id = ?", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    // ─── Media list items ─────────────────────────────────────

    pub fn list_media_items(&self, list_id: &str) -> Result<Vec<Map<String, Value>>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT * FROM media_list_items WHERE list_id = ? ORDER BY CASE status WHEN 'top' THEN 0 WHEN 'visto' THEN 1 ELSE 2 END, rank ASC NULLS LAST, created_at DESC",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![list_id], |row| row_to_map(row))
            .map_err(|e| e.to_string())?;
        rows.map(|r| r.map(|row| parse_row("media_list_items", row)))
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())
    }

    pub fn create_media_item(&self, user_id: &str, data: Value) -> Result<Map<String, Value>, String> {
        let ts = now_iso();
        let mut row = value_to_map(data);
        if let Some(rating) = row.get("rating").and_then(|v| v.as_f64()) {
            row.insert("rating".to_string(), json!(Self::clamp_rating(Some(rating)).unwrap_or(0.0)));
        }
        row.insert("user_id".to_string(), json!(user_id));
        row.entry("tags".to_string()).or_insert(json!([]));
        row.entry("status".to_string()).or_insert(json!("a_ver"));
        row.insert("created_at".to_string(), json!(ts));
        row.insert("updated_at".to_string(), json!(ts));
        let id = insert_row(&self.conn, "media_list_items", row)?;
        get_by_id(&self.conn, "media_list_items", &id)
    }

    pub fn update_media_item(&self, id: &str, updates: Value) -> Result<Map<String, Value>, String> {
        let mut row = value_to_map(updates);
        if let Some(rating) = row.get("rating").and_then(|v| v.as_f64()) {
            row.insert("rating".to_string(), json!(Self::clamp_rating(Some(rating)).unwrap_or(0.0)));
        }
        row.insert("updated_at".to_string(), json!(now_iso()));
        update_row(&self.conn, "media_list_items", id, row)?;
        get_by_id(&self.conn, "media_list_items", &id)
    }

    pub fn delete_media_item(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM media_list_items WHERE id = ?", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn move_media_item(
        &self,
        id: &str,
        status: &str,
        rank: Option<i64>,
    ) -> Result<Map<String, Value>, String> {
        let mut updates = Map::new();
        updates.insert("status".to_string(), json!(status));
        if let Some(r) = rank {
            updates.insert("rank".to_string(), json!(r));
        }
        if status == "visto" {
            updates.insert("completed_at".to_string(), json!(chrono::Utc::now().format("%Y-%m-%d").to_string()));
        }
        self.update_media_item(id, Value::Object(updates))
    }

    // ─── Release schedules ────────────────────────────────────

    fn sync_release_calendar_task(
        &self,
        user_id: &str,
        title: &str,
        release_date: &str,
        link: bool,
        existing_task_id: Option<&str>,
    ) -> Result<Option<String>, String> {
        if link {
            let mut task_row = Map::new();
            task_row.insert("title".to_string(), json!(title));
            task_row.insert("due_date".to_string(), json!(release_date));
            task_row.insert("status".to_string(), json!("a_fazer"));
            task_row.insert("priority".to_string(), json!("media"));
            task_row.insert("tags".to_string(), json!(["lancamento"]));
            if let Some(tid) = existing_task_id.filter(|s| !s.is_empty()) {
                self.update_task(tid, Value::Object(task_row))?;
                Ok(Some(tid.to_string()))
            } else {
                let task = self.create_task(user_id, Value::Object(task_row))?;
                Ok(task.get("id").and_then(|v| v.as_str()).map(|s| s.to_string()))
            }
        } else if let Some(tid) = existing_task_id.filter(|s| !s.is_empty()) {
            let _ = self.delete_task(tid);
            Ok(None)
        } else {
            Ok(None)
        }
    }

    pub fn list_release_schedules(
        &self,
        user_id: &str,
        media_type: Option<&str>,
    ) -> Result<Vec<Map<String, Value>>, String> {
        if let Some(mt) = media_type {
            let mut stmt = self
                .conn
                .prepare(
                    "SELECT * FROM release_schedules WHERE user_id = ? AND media_type = ? ORDER BY release_date ASC, sort_order ASC, created_at ASC",
                )
                .map_err(|e| e.to_string())?;
            let rows = stmt
                .query_map(params![user_id, mt], |row| row_to_map(row))
                .map_err(|e| e.to_string())?;
            return rows
                .map(|r| r.map(|row| parse_row("release_schedules", row)))
                .collect::<rusqlite::Result<Vec<_>>>()
                .map_err(|e| e.to_string());
        }
        let mut stmt = self
            .conn
            .prepare(
                "SELECT * FROM release_schedules WHERE user_id = ? ORDER BY release_date ASC, sort_order ASC, created_at ASC",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![user_id], |row| row_to_map(row))
            .map_err(|e| e.to_string())?;
        rows.map(|r| r.map(|row| parse_row("release_schedules", row)))
            .collect::<rusqlite::Result<Vec<_>>>()
            .map_err(|e| e.to_string())
    }

    pub fn create_release_schedule(
        &self,
        user_id: &str,
        data: Value,
    ) -> Result<Map<String, Value>, String> {
        let ts = now_iso();
        let mut row = value_to_map(data);
        let title = row
            .get("title")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let release_date = row
            .get("release_date")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let link = row
            .get("link_to_calendar")
            .map(|v| v.as_bool().unwrap_or(false) || v.as_i64().unwrap_or(0) != 0)
            .unwrap_or(false);

        if link && !title.is_empty() && !release_date.is_empty() {
            let task_id = self.sync_release_calendar_task(user_id, &title, &release_date, true, None)?;
            if let Some(tid) = task_id {
                row.insert("task_id".to_string(), json!(tid));
            }
        }

        row.insert("user_id".to_string(), json!(user_id));
        row.entry("status".to_string()).or_insert(json!("upcoming"));
        row.entry("sort_order".to_string()).or_insert(json!(0));
        row.insert("created_at".to_string(), json!(ts));
        row.insert("updated_at".to_string(), json!(ts));
        let id = insert_row(&self.conn, "release_schedules", row)?;
        get_by_id(&self.conn, "release_schedules", &id)
    }

    pub fn update_release_schedule(
        &self,
        id: &str,
        user_id: &str,
        updates: Value,
    ) -> Result<Map<String, Value>, String> {
        let existing = get_by_id(&self.conn, "release_schedules", id)?;
        let mut row = value_to_map(updates);
        let title = row
            .get("title")
            .and_then(|v| v.as_str())
            .or_else(|| existing.get("title").and_then(|v| v.as_str()))
            .unwrap_or("")
            .to_string();
        let release_date = row
            .get("release_date")
            .and_then(|v| v.as_str())
            .or_else(|| existing.get("release_date").and_then(|v| v.as_str()))
            .unwrap_or("")
            .to_string();
        let link = row
            .get("link_to_calendar")
            .map(|v| v.as_bool().unwrap_or(false) || v.as_i64().unwrap_or(0) != 0)
            .or_else(|| {
                existing
                    .get("link_to_calendar")
                    .map(|v| v.as_bool().unwrap_or(false) || v.as_i64().unwrap_or(0) != 0)
            })
            .unwrap_or(false);
        let existing_task = existing
            .get("task_id")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        let task_id = self.sync_release_calendar_task(
            user_id,
            &title,
            &release_date,
            link,
            existing_task.as_deref(),
        )?;
        if let Some(tid) = task_id {
            row.insert("task_id".to_string(), json!(tid));
        } else if !link {
            row.insert("task_id".to_string(), Value::Null);
        }

        row.insert("updated_at".to_string(), json!(now_iso()));
        update_row(&self.conn, "release_schedules", id, row)?;
        get_by_id(&self.conn, "release_schedules", &id)
    }

    pub fn delete_release_schedule(&self, id: &str, delete_linked_task: bool) -> Result<(), String> {
        if delete_linked_task {
            if let Ok(row) = get_by_id(&self.conn, "release_schedules", id) {
                if let Some(tid) = row.get("task_id").and_then(|v| v.as_str()) {
                    let _ = self.delete_task(tid);
                }
            }
        }
        self.conn
            .execute("DELETE FROM release_schedules WHERE id = ?", params![id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn mark_release_released(&self, id: &str) -> Result<Map<String, Value>, String> {
        let mut updates = Map::new();
        updates.insert("status".to_string(), json!("released"));
        updates.insert("updated_at".to_string(), json!(now_iso()));
        update_row(&self.conn, "release_schedules", id, updates)?;
        get_by_id(&self.conn, "release_schedules", &id)
    }
}

fn capitalize_training(t: &str) -> String {
    match t {
        "corrida" => "Corrida".to_string(),
        "natacao" => "Natação".to_string(),
        "ciclismo" => "Ciclismo".to_string(),
        "luta" => "Luta".to_string(),
        "funcional" => "Funcional".to_string(),
        "academia" => "Academia".to_string(),
        other => {
            let mut c = other.chars();
            match c.next() {
                None => String::new(),
                Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
            }
        }
    }
}
