use serde_json::{json, Map, Value};

use crate::db::ArrowDatabase;
use crate::notes::NotesStore;

pub const DESTRUCTIVE_TOOLS: &[&str] = &[
    "delete_task",
    "delete_goal",
    "delete_habit",
    "delete_note",
];

const MAX_LIST_ITEMS: usize = 12;
const MAX_NOTE_CONTENT_CHARS: usize = 120;
const MAX_TOOL_RESULT_CHARS: usize = 2_500;

pub fn compact_tool_result(name: &str, result: Value) -> Value {
    let compacted = match name {
        "list_tasks" => compact_list(
            &result,
            &["id", "title", "status", "priority", "due_date"],
            MAX_LIST_ITEMS,
        ),
        "list_goals" => compact_list(
            &result,
            &[
                "id",
                "title",
                "category",
                "goal_type",
                "current_value",
                "target_value",
                "status",
            ],
            MAX_LIST_ITEMS,
        ),
        "list_habits" => compact_list(
            &result,
            &["id", "title", "category", "frequency_type", "streak"],
            MAX_LIST_ITEMS,
        ),
        "list_cycles" => compact_list(&result, &["id", "title", "status", "start_date", "end_date"], 5),
        "list_transactions" => compact_list(
            &result,
            &["id", "description", "amount", "type", "category", "date"],
            MAX_LIST_ITEMS,
        ),
        "list_notes" => compact_notes(&result),
        "get_vision" => compact_object_fields(&result, &["vision_text", "updated_at"]),
        "get_checkin" => compact_object_fields(
            &result,
            &["date", "mood", "productivity_score", "gratitude"],
        ),
        _ => result,
    };
    cap_json_size(compacted, MAX_TOOL_RESULT_CHARS)
}

fn compact_list(data: &Value, fields: &[&str], limit: usize) -> Value {
    let items: Vec<Value> = data
        .as_array()
        .cloned()
        .unwrap_or_default();
    let total = items.len();
    let compacted: Vec<Value> = items
        .into_iter()
        .take(limit)
        .filter_map(|item| item.as_object().map(|o| Value::Object(pick_fields(o, fields))))
        .collect();
    json!({
        "items": compacted,
        "total": total,
        "shown": compacted.len(),
        "truncated": total > limit,
    })
}

fn compact_notes(data: &Value) -> Value {
    let items: Vec<Value> = data
        .as_array()
        .cloned()
        .unwrap_or_default();
    let total = items.len();
    let compacted: Vec<Value> = items
        .into_iter()
        .take(8)
        .filter_map(|item| {
            let o = item.as_object()?;
            let mut m = pick_fields(o, &["id", "title", "tags"]);
            if let Some(c) = o.get("content").and_then(|v| v.as_str()) {
                let body = if c.len() > MAX_NOTE_CONTENT_CHARS {
                    format!("{}…", &c[..MAX_NOTE_CONTENT_CHARS])
                } else {
                    c.to_string()
                };
                m.insert("content".to_string(), json!(body));
            }
            Some(Value::Object(m))
        })
        .collect();
    json!({ "items": compacted, "total": total, "shown": compacted.len() })
}

fn compact_object_fields(data: &Value, fields: &[&str]) -> Value {
    match data {
        Value::Object(o) => Value::Object(pick_fields(o, fields)),
        Value::Null => Value::Null,
        other => other.clone(),
    }
}

fn pick_fields(obj: &Map<String, Value>, fields: &[&str]) -> Map<String, Value> {
    fields
        .iter()
        .filter_map(|f| obj.get(*f).map(|v| ((*f).to_string(), v.clone())))
        .collect()
}

fn cap_json_size(value: Value, max_chars: usize) -> Value {
    let s = serde_json::to_string(&value).unwrap_or_default();
    if s.len() <= max_chars {
        return value;
    }
    json!({
        "truncated": true,
        "preview": &s[..max_chars.saturating_sub(20)],
    })
}

pub fn tool_declarations() -> Value {
    json!([{
        "functionDeclarations": [
            { "name": "list_tasks", "description": "Lista tarefas", "parameters": { "type": "object", "properties": { "status": { "type": "string" }, "due_date": { "type": "string", "description": "YYYY-MM-DD" } } } },
            { "name": "list_goals", "description": "Lista metas", "parameters": { "type": "object", "properties": { "status": { "type": "string" } } } },
            { "name": "list_habits", "description": "Lista hábitos", "parameters": { "type": "object", "properties": {} } },
            { "name": "list_cycles", "description": "Lista ciclos 12 semanas", "parameters": { "type": "object", "properties": {} } },
            { "name": "list_transactions", "description": "Lista transações", "parameters": { "type": "object", "properties": { "startDate": { "type": "string" } } } },
            { "name": "list_notes", "description": "Lista notas", "parameters": { "type": "object", "properties": {} } },
            { "name": "get_vision", "description": "Visão 5 anos", "parameters": { "type": "object", "properties": {} } },
            { "name": "get_checkin", "description": "Check-in de uma data", "parameters": { "type": "object", "properties": { "date": { "type": "string" } }, "required": ["date"] } },
            { "name": "create_task", "description": "Cria tarefa", "parameters": { "type": "object", "properties": { "title": { "type": "string" }, "description": { "type": "string" }, "status": { "type": "string" }, "priority": { "type": "string" }, "due_date": { "type": "string" }, "goal_id": { "type": "string" } }, "required": ["title"] } },
            { "name": "update_task", "description": "Atualiza tarefa", "parameters": { "type": "object", "properties": { "id": { "type": "string" }, "title": { "type": "string" }, "description": { "type": "string" }, "status": { "type": "string" }, "priority": { "type": "string" }, "due_date": { "type": "string" } }, "required": ["id"] } },
            { "name": "create_goal", "description": "Cria meta", "parameters": { "type": "object", "properties": { "title": { "type": "string" }, "category": { "type": "string" }, "goal_type": { "type": "string" }, "target_value": { "type": "number" } }, "required": ["title", "category", "goal_type"] } },
            { "name": "update_goal", "description": "Atualiza meta", "parameters": { "type": "object", "properties": { "id": { "type": "string" }, "title": { "type": "string" }, "status": { "type": "string" }, "current_value": { "type": "number" } }, "required": ["id"] } },
            { "name": "create_habit", "description": "Cria hábito", "parameters": { "type": "object", "properties": { "title": { "type": "string" }, "category": { "type": "string" }, "frequency_type": { "type": "string" } }, "required": ["title", "category", "frequency_type"] } },
            { "name": "update_habit", "description": "Atualiza hábito", "parameters": { "type": "object", "properties": { "id": { "type": "string" }, "title": { "type": "string" } }, "required": ["id"] } },
            { "name": "toggle_habit_day", "description": "Marca hábito no dia", "parameters": { "type": "object", "properties": { "id": { "type": "string" }, "date": { "type": "string" } }, "required": ["id", "date"] } },
            { "name": "create_note", "description": "Cria nota", "parameters": { "type": "object", "properties": { "title": { "type": "string" }, "content": { "type": "string" } }, "required": ["title"] } },
            { "name": "update_note", "description": "Atualiza nota", "parameters": { "type": "object", "properties": { "id": { "type": "string" }, "title": { "type": "string" }, "content": { "type": "string" } }, "required": ["id"] } },
            { "name": "upsert_checkin", "description": "Check-in diário", "parameters": { "type": "object", "properties": { "date": { "type": "string" }, "mood": { "type": "string" }, "productivity_score": { "type": "integer" }, "gratitude": { "type": "string" } }, "required": ["date", "mood", "productivity_score"] } },
            { "name": "create_transaction", "description": "Transação", "parameters": { "type": "object", "properties": { "description": { "type": "string" }, "amount": { "type": "number" }, "type": { "type": "string" }, "category": { "type": "string" }, "date": { "type": "string" } }, "required": ["description", "amount", "type", "category", "date"] } },
            { "name": "delete_task", "description": "Exclui tarefa", "parameters": { "type": "object", "properties": { "id": { "type": "string" } }, "required": ["id"] } },
            { "name": "delete_goal", "description": "Exclui meta", "parameters": { "type": "object", "properties": { "id": { "type": "string" } }, "required": ["id"] } },
            { "name": "delete_habit", "description": "Exclui hábito", "parameters": { "type": "object", "properties": { "id": { "type": "string" } }, "required": ["id"] } },
            { "name": "delete_note", "description": "Exclui nota", "parameters": { "type": "object", "properties": { "id": { "type": "string" } }, "required": ["id"] } },
        ]
    }])
}

pub fn is_destructive(name: &str) -> bool {
    DESTRUCTIVE_TOOLS.contains(&name)
}

pub fn tool_preview(name: &str, args: &Value) -> String {
    match name {
        "delete_task" => format!("Excluir tarefa {}", args.get("id").and_then(|v| v.as_str()).unwrap_or("?")),
        "delete_goal" => format!("Excluir meta {}", args.get("id").and_then(|v| v.as_str()).unwrap_or("?")),
        "delete_habit" => format!("Excluir hábito {}", args.get("id").and_then(|v| v.as_str()).unwrap_or("?")),
        "delete_note" => format!("Excluir nota {}", args.get("id").and_then(|v| v.as_str()).unwrap_or("?")),
        _ => format!("{}: {}", name, args),
    }
}

fn args_to_map(args: &Value) -> Map<String, Value> {
    args.as_object().cloned().unwrap_or_default()
}

pub fn execute_tool(
    db: &ArrowDatabase,
    notes: &NotesStore,
    user_id: &str,
    name: &str,
    args: &Value,
) -> Result<Value, String> {
    let map = args_to_map(args);
    match name {
        "list_tasks" => {
            let rows = db.list_tasks(user_id)?;
            let filtered: Vec<Value> = rows
                .into_iter()
                .filter(|t| {
                    if let Some(due) = map.get("due_date").and_then(|v| v.as_str()) {
                        return t.get("due_date").and_then(|v| v.as_str()) == Some(due);
                    }
                    if let Some(status) = map.get("status").and_then(|v| v.as_str()) {
                        return t.get("status").and_then(|v| v.as_str()) == Some(status);
                    }
                    t.get("status").and_then(|v| v.as_str()) != Some("concluida")
                })
                .map(Value::Object)
                .collect();
            Ok(compact_tool_result(name, json!(filtered)))
        }
        "list_goals" => {
            let rows = db.list_goals(user_id, None)?;
            let filtered: Vec<Value> = rows
                .into_iter()
                .filter(|g| {
                    if let Some(status) = map.get("status").and_then(|v| v.as_str()) {
                        return g.get("status").and_then(|v| v.as_str()) == Some(status);
                    }
                    true
                })
                .map(Value::Object)
                .collect();
            Ok(compact_tool_result(name, json!(filtered)))
        }
        "list_habits" => {
            let rows = db.list_habits(user_id)?;
            Ok(compact_tool_result(name, json!(rows)))
        }
        "list_cycles" => {
            let rows = db.list_cycles(user_id)?;
            Ok(compact_tool_result(name, json!(rows)))
        }
        "list_transactions" => {
            let start = map.get("startDate").cloned();
            let filters = start.map(|s| json!({ "startDate": s }));
            let rows = db.list_transactions(user_id, filters)?;
            Ok(compact_tool_result(name, json!(rows)))
        }
        "list_notes" => {
            let notes_list: Vec<Value> = notes.list()?.iter().map(|n| notes.to_note(n)).collect();
            Ok(compact_tool_result(name, json!(notes_list)))
        }
        "get_vision" => Ok(compact_tool_result(name, json!(db.get_vision(user_id)?))),
        "get_checkin" => {
            let date = map
                .get("date")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "date é obrigatório".to_string())?;
            Ok(compact_tool_result(
                name,
                json!(db.get_checkin_by_date(user_id, date)?),
            ))
        }
        "create_task" => {
            let row = db.create_task(user_id, Value::Object(map))?;
            Ok(json!({ "success": true, "task": row }))
        }
        "update_task" => {
            let id = map
                .get("id")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "id é obrigatório".to_string())?
                .to_string();
            let row = db.update_task(&id, Value::Object(map))?;
            Ok(json!({ "success": true, "task": row }))
        }
        "create_goal" => {
            let row = db.create_goal(user_id, Value::Object(map))?;
            Ok(json!({ "success": true, "goal": row }))
        }
        "update_goal" => {
            let id = map
                .get("id")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "id é obrigatório".to_string())?
                .to_string();
            let row = db.update_goal(&id, Value::Object(map))?;
            Ok(json!({ "success": true, "goal": row }))
        }
        "create_habit" => {
            let row = db.create_habit(user_id, Value::Object(map))?;
            Ok(json!({ "success": true, "habit": row }))
        }
        "update_habit" => {
            let id = map
                .get("id")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "id é obrigatório".to_string())?
                .to_string();
            db.update_habit(&id, Value::Object(map))?;
            Ok(json!({ "success": true, "id": id }))
        }
        "toggle_habit_day" => {
            let id = map
                .get("id")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "id é obrigatório".to_string())?;
            let date = map
                .get("date")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "date é obrigatório".to_string())?;
            let habits = db.list_habits(user_id)?;
            let habit = habits
                .into_iter()
                .find(|h| h.get("id").and_then(|v| v.as_str()) == Some(id))
                .ok_or_else(|| "Hábito não encontrado".to_string())?;
            let mut history: Vec<Value> = habit
                .get("completion_history")
                .and_then(|v| serde_json::from_value(v.clone()).ok())
                .unwrap_or_default();
            if let Some(pos) = history.iter().position(|e| e.get("date").and_then(|v| v.as_str()) == Some(date)) {
                history.remove(pos);
            } else {
                history.push(json!({ "date": date, "completed": true }));
            }
            let mut upd = Map::new();
            upd.insert("completion_history".to_string(), json!(history));
            db.update_habit(id, Value::Object(upd))?;
            Ok(json!({ "success": true, "id": id, "date": date }))
        }
        "create_note" => {
            let note = notes.create(Value::Object(map))?;
            Ok(json!({ "success": true, "note": notes.to_note(&note) }))
        }
        "update_note" => {
            let id = map
                .get("id")
                .and_then(|v| v.as_str())
                .ok_or_else(|| "id é obrigatório".to_string())?
                .to_string();
            let note = notes.update(&id, Value::Object(map))?;
            Ok(json!({ "success": true, "note": notes.to_note(&note) }))
        }
        "upsert_checkin" => {
            let row = db.upsert_checkin(user_id, Value::Object(map))?;
            Ok(json!({ "success": true, "checkin": row }))
        }
        "create_transaction" => {
            let row = db.create_transaction(user_id, Value::Object(map))?;
            Ok(json!({ "success": true, "transaction": row }))
        }
        "delete_task" => {
            let id = map.get("id").and_then(|v| v.as_str()).ok_or_else(|| "id é obrigatório".to_string())?;
            db.delete_task(id)?;
            Ok(json!({ "success": true, "deleted": id }))
        }
        "delete_goal" => {
            let id = map.get("id").and_then(|v| v.as_str()).ok_or_else(|| "id é obrigatório".to_string())?;
            db.delete_goal(id)?;
            Ok(json!({ "success": true, "deleted": id }))
        }
        "delete_habit" => {
            let id = map.get("id").and_then(|v| v.as_str()).ok_or_else(|| "id é obrigatório".to_string())?;
            db.delete_habit(id)?;
            Ok(json!({ "success": true, "deleted": id }))
        }
        "delete_note" => {
            let id = map.get("id").and_then(|v| v.as_str()).ok_or_else(|| "id é obrigatório".to_string())?;
            notes.delete(id)?;
            Ok(json!({ "success": true, "deleted": id }))
        }
        _ => Err(format!("Ferramenta desconhecida: {}", name)),
    }
}

pub fn tools_affecting_queries(name: &str) -> Vec<&'static str> {
    match name {
        n if n.contains("task") => vec!["tasks"],
        n if n.contains("goal") => vec!["goals"],
        n if n.contains("habit") => vec!["habits"],
        n if n.contains("note") => vec!["notes"],
        n if n.contains("transaction") => vec!["transactions"],
        n if n.contains("checkin") => vec!["checkins"],
        n if n.contains("vision") => vec!["vision"],
        n if n.contains("cycle") => vec!["cycles"],
        _ => vec![],
    }
}
