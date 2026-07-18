use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use serde_json::{json, Value};
use tauri::{AppHandle, State};

use crate::ai::{AiService, PendingToolCall, GEMINI_API_KEY_SETTING, GEMINI_MODEL_SETTING, current_week_start, mask_api_key, test_gemini_connection, resolve_gemini_model, MAX_CONTEXT_CHARS, MAX_CONTEXT_TOKEN_BUDGET};
use crate::ai_personal::get_personal_context;
use crate::app_state::{load_app_state, save_app_state};
use crate::db::ArrowDatabase;
use crate::notes::NotesStore;
use crate::paths::db_path;
use crate::types::{UiProfile, VaultStatus};
use crate::vault::{LocalProfileUpdate, VaultManager};

pub struct AppData {
    pub vault: Mutex<VaultManager>,
    pub app_state_path: PathBuf,
    pub ai_pending: Arc<Mutex<HashMap<String, PendingToolCall>>>,
}

fn profile_to_ui(vault: &VaultManager, profile: &crate::types::LocalProfile) -> UiProfile {
    UiProfile {
        id: profile.id.clone(),
        email: String::new(),
        full_name: profile.name.clone(),
        role: "user".to_string(),
        avatar_url: vault.get_avatar_data_url(),
        created_at: profile.created_at.clone(),
        updated_at: profile.updated_at.clone(),
    }
}


#[tauri::command]
pub fn vault_get_status(state: State<'_, AppData>) -> Result<VaultStatus, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let app_state = load_app_state(&state.app_state_path);
    let (is_open, vault_path, profile) = vault.get_status();
    Ok(VaultStatus {
        is_open,
        vault_path,
        profile: profile.map(|p| json!(profile_to_ui(&vault, &p))),
        last_vault_path: app_state.last_vault_path,
    })
}

#[tauri::command]
pub async fn vault_pick_folder(
    app: AppHandle,
    options: Option<Value>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let create = options
        .and_then(|o| o.get("create").and_then(|v| v.as_bool()))
        .unwrap_or(false);
    let title = if create {
        "Escolha onde criar seu vault Arrow"
    } else {
        "Abrir vault Arrow existente"
    };
    let path = app
        .dialog()
        .file()
        .set_title(title)
        .blocking_pick_folder();
    Ok(path.map(|p| p.to_string()))
}

#[tauri::command]
pub fn vault_create(
    state: State<'_, AppData>,
    path: String,
    profile_name: String,
) -> Result<Value, String> {
    let mut vault = state.vault.lock().map_err(|e| e.to_string())?;
    let profile = vault.create_vault(PathBuf::from(&path).as_path(), &profile_name)?;
    let mut app_state = load_app_state(&state.app_state_path);
    app_state.last_vault_path = Some(path.clone());
    save_app_state(&state.app_state_path, &app_state)?;
    Ok(json!({
        "profile": profile_to_ui(&vault, &profile),
        "vaultPath": path,
    }))
}

#[tauri::command]
pub fn vault_open(state: State<'_, AppData>, path: String) -> Result<Value, String> {
    let mut vault = state.vault.lock().map_err(|e| e.to_string())?;
    let profile = vault.open_vault(PathBuf::from(&path).as_path())?;
    let mut app_state = load_app_state(&state.app_state_path);
    app_state.last_vault_path = Some(path.clone());
    save_app_state(&state.app_state_path, &app_state)?;
    Ok(json!({
        "profile": profile_to_ui(&vault, &profile),
        "vaultPath": path,
    }))
}

#[tauri::command]
pub fn vault_open_last(state: State<'_, AppData>) -> Result<Option<Value>, String> {
    let app_state = load_app_state(&state.app_state_path);
    let Some(path) = app_state.last_vault_path else {
        return Ok(None);
    };
    let mut vault = state.vault.lock().map_err(|e| e.to_string())?;
    match vault.open_vault(PathBuf::from(&path).as_path()) {
        Ok(profile) => Ok(Some(json!({
            "profile": profile_to_ui(&vault, &profile),
            "vaultPath": path,
        }))),
        Err(_) => Ok(None),
    }
}

#[tauri::command]
pub fn vault_close(state: State<'_, AppData>) -> Result<(), String> {
    let mut vault = state.vault.lock().map_err(|e| e.to_string())?;
    vault.close_vault();
    Ok(())
}

#[tauri::command]
pub fn vault_update_profile(
    state: State<'_, AppData>,
    full_name: Option<String>,
) -> Result<UiProfile, String> {
    let mut vault = state.vault.lock().map_err(|e| e.to_string())?;
    let profile = vault.update_profile(LocalProfileUpdate {
        name: full_name,
        avatar_path: None,
    })?;
    Ok(profile_to_ui(&vault, &profile))
}

#[tauri::command]
pub fn vault_save_avatar(state: State<'_, AppData>, data: Vec<u8>) -> Result<UiProfile, String> {
    let mut vault = state.vault.lock().map_err(|e| e.to_string())?;
    vault.save_avatar(&data)?;
    let profile = vault
        .get_status()
        .2
        .ok_or_else(|| "Vault não aberto".to_string())?;
    Ok(profile_to_ui(&vault, &profile))
}

#[tauri::command]
pub fn vault_get_config(state: State<'_, AppData>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let config = vault.get_config()?;
    Ok(json!({
        "version": config.version,
        "theme": config.theme,
        "colorTheme": config.color_theme,
        "backgroundEffect": config.background_effect,
        "rainDensity": config.rain_density,
        "glassScope": config.glass_scope,
        "glassOpacity": config.glass_opacity,
        "visualQuality": config.visual_quality,
    }))
}

#[tauri::command]
pub fn vault_save_config(state: State<'_, AppData>, config: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let next = vault.save_config(config)?;
    Ok(json!({
        "version": next.version,
        "theme": next.theme,
        "colorTheme": next.color_theme,
        "backgroundEffect": next.background_effect,
        "rainDensity": next.rain_density,
        "visualQuality": next.visual_quality,
    }))
}

#[tauri::command]
pub fn db_cycles_list(state: State<'_, AppData>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.list_cycles(&user_id)?))
}

#[tauri::command]
pub fn db_cycles_create(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.create_cycle(&user_id, data)?))
}

#[tauri::command]
pub fn db_cycles_update(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let id = data
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "id é obrigatório".to_string())?;
    let mut updates = data.as_object().cloned().unwrap_or_default();
    updates.remove("id");
    Ok(json!(vault.get_database()?.update_cycle(id, Value::Object(updates))?))
}

#[tauri::command]
pub fn db_cycles_delete(state: State<'_, AppData>, id: String) -> Result<(), String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    vault.get_database()?.delete_cycle(&id)?;
    Ok(())
}

#[tauri::command]
pub fn db_cycles_activate(state: State<'_, AppData>, id: String) -> Result<(), String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    vault.get_database()?.activate_cycle(&user_id, &id)?;
    Ok(())
}

#[tauri::command]
pub fn db_goals_list(state: State<'_, AppData>, filters: Option<Value>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.list_goals(&user_id, filters)?))
}

#[tauri::command]
pub fn db_goals_create(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.create_goal(&user_id, data)?))
}

#[tauri::command]
pub fn db_goals_update(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let id = data
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "id é obrigatório".to_string())?;
    let mut updates = data.as_object().cloned().unwrap_or_default();
    updates.remove("id");
    Ok(json!(vault.get_database()?.update_goal(id, Value::Object(updates))?))
}

#[tauri::command]
pub fn db_goals_delete(state: State<'_, AppData>, id: String) -> Result<(), String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    vault.get_database()?.delete_goal(&id)?;
    Ok(())
}

#[tauri::command]
pub fn db_tasks_list(state: State<'_, AppData>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.list_tasks(&user_id)?))
}

#[tauri::command]
pub fn db_tasks_create(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.create_task(&user_id, data)?))
}

#[tauri::command]
pub fn db_tasks_update(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let id = data
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "id é obrigatório".to_string())?;
    let mut updates = data.as_object().cloned().unwrap_or_default();
    updates.remove("id");
    Ok(json!(vault.get_database()?.update_task(id, Value::Object(updates))?))
}

#[tauri::command]
pub fn db_tasks_delete(state: State<'_, AppData>, id: String) -> Result<(), String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    vault.get_database()?.delete_task(&id)?;
    Ok(())
}

#[tauri::command]
pub fn db_habits_list(state: State<'_, AppData>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.list_habits(&user_id)?))
}

#[tauri::command]
pub fn db_habits_create(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.create_habit(&user_id, data)?))
}

#[tauri::command]
pub fn db_habits_update(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let id = data
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "id é obrigatório".to_string())?;
    let mut updates = data.as_object().cloned().unwrap_or_default();
    updates.remove("id");
    vault.get_database()?.update_habit(id, Value::Object(updates))?;
    Ok(Value::Null)
}

#[tauri::command]
pub fn db_habits_delete(state: State<'_, AppData>, id: String) -> Result<(), String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    vault.get_database()?.delete_habit(&id)?;
    Ok(())
}

#[tauri::command]
pub fn db_transactions_list(state: State<'_, AppData>, filters: Option<Value>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.list_transactions(&user_id, filters)?))
}

#[tauri::command]
pub fn db_transactions_create(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.create_transaction(&user_id, data)?))
}

#[tauri::command]
pub fn db_transactions_delete(state: State<'_, AppData>, id: String) -> Result<(), String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    vault.get_database()?.delete_transaction(&id)?;
    Ok(())
}

#[tauri::command]
pub fn db_checkins_list(state: State<'_, AppData>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.list_checkins(&user_id)?))
}

#[tauri::command]
pub fn db_checkins_get_by_date(state: State<'_, AppData>, date: String) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    let row = vault.get_database()?.get_checkin_by_date(&user_id, &date)?;
    Ok(row.map(Value::Object).unwrap_or(Value::Null))
}

#[tauri::command]
pub fn db_checkins_upsert(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    let row = vault.get_database()?.upsert_checkin(&user_id, data)?;
    Ok(Value::Object(row))
}

#[tauri::command]
pub fn db_vision_get(state: State<'_, AppData>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    let row = vault.get_database()?.get_vision(&user_id)?;
    Ok(row.map(Value::Object).unwrap_or(Value::Null))
}

#[tauri::command]
pub fn db_vision_save(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    let row = vault.get_database()?.save_vision(&user_id, data)?;
    Ok(row.map(Value::Object).unwrap_or(Value::Null))
}

#[tauri::command]
pub fn db_weekly_scores_list(state: State<'_, AppData>, cycle_id: Option<String>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.list_weekly_scores(
        &user_id,
        cycle_id.as_deref()
    )?))
}

#[tauri::command]
pub fn db_weekly_scores_finalize(state: State<'_, AppData>, payload: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    let tasks_planned = payload
        .get("tasks_planned")
        .and_then(|v| v.as_i64())
        .unwrap_or(0) as i32;
    let tasks_completed = payload
        .get("tasks_completed")
        .and_then(|v| v.as_i64())
        .unwrap_or(0) as i32;
    let workouts_planned = payload
        .get("workouts_planned")
        .and_then(|v| v.as_i64())
        .unwrap_or(0) as i32;
    let workouts_completed = payload
        .get("workouts_completed")
        .and_then(|v| v.as_i64())
        .unwrap_or(0) as i32;
    let total_planned = tasks_planned + workouts_planned;
    let total_completed = tasks_completed + workouts_completed;
    let score = if total_planned > 0 {
        ((total_completed as f64 / total_planned as f64) * 100.0).round()
    } else {
        0.0
    };
    let mut row = payload.as_object().cloned().unwrap_or_default();
    row.insert("score".to_string(), json!(score));
    let result = vault
        .get_database()?
        .upsert_weekly_score(&user_id, Value::Object(row))?;
    Ok(Value::Object(result))
}

// ─── Workout commands ───────────────────────────────────────

#[tauri::command]
pub fn db_workout_programs_list(state: State<'_, AppData>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.list_workout_programs(&user_id)?))
}

#[tauri::command]
pub fn db_workout_programs_create(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.create_workout_program(&user_id, data)?))
}

#[tauri::command]
pub fn db_workout_programs_update(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let id = data.get("id").and_then(|v| v.as_str()).ok_or_else(|| "id é obrigatório".to_string())?;
    let mut updates = data.as_object().cloned().unwrap_or_default();
    updates.remove("id");
    Ok(json!(vault.get_database()?.update_workout_program(id, Value::Object(updates))?))
}

#[tauri::command]
pub fn db_workout_programs_delete(state: State<'_, AppData>, id: String) -> Result<(), String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    vault.get_database()?.delete_workout_program(&id)?;
    Ok(())
}

#[tauri::command]
pub fn db_workout_templates_list(state: State<'_, AppData>, program_id: String) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    Ok(json!(vault.get_database()?.list_workout_templates(&program_id)?))
}

#[tauri::command]
pub fn db_workout_templates_create(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.create_workout_template(&user_id, data)?))
}

#[tauri::command]
pub fn db_workout_templates_update(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let id = data.get("id").and_then(|v| v.as_str()).ok_or_else(|| "id é obrigatório".to_string())?;
    let mut updates = data.as_object().cloned().unwrap_or_default();
    updates.remove("id");
    Ok(json!(vault.get_database()?.update_workout_template(id, Value::Object(updates))?))
}

#[tauri::command]
pub fn db_workout_templates_delete(state: State<'_, AppData>, id: String) -> Result<(), String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    vault.get_database()?.delete_workout_template(&id)?;
    Ok(())
}

#[tauri::command]
pub fn db_workout_sessions_list(state: State<'_, AppData>, filters: Option<Value>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.list_workout_sessions(&user_id, filters)?))
}

#[tauri::command]
pub fn db_workout_sessions_create(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.create_workout_session(&user_id, data)?))
}

#[tauri::command]
pub fn db_workout_sessions_update(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let id = data.get("id").and_then(|v| v.as_str()).ok_or_else(|| "id é obrigatório".to_string())?;
    let mut updates = data.as_object().cloned().unwrap_or_default();
    updates.remove("id");
    Ok(json!(vault.get_database()?.update_workout_session(id, Value::Object(updates))?))
}

#[tauri::command]
pub fn db_workout_sessions_delete(state: State<'_, AppData>, id: String) -> Result<(), String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    vault.get_database()?.delete_workout_session(&id)?;
    Ok(())
}

#[tauri::command]
pub fn db_workout_sessions_complete(
    state: State<'_, AppData>,
    id: String,
    exercises_log: Value,
    duration_minutes: Option<i64>,
) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    Ok(json!(vault.get_database()?.complete_workout_session(&id, exercises_log, duration_minutes)?))
}

#[tauri::command]
pub fn db_workout_sessions_generate_week(
    state: State<'_, AppData>,
    program_id: String,
    cycle_id: String,
    week_number: i64,
    week_dates: Value,
) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.generate_week_sessions(
        &user_id,
        &program_id,
        &cycle_id,
        week_number,
        week_dates,
    )?))
}

#[tauri::command]
pub fn db_workout_exercise_progress(state: State<'_, AppData>, exercise_name: String) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.get_exercise_progress(&user_id, &exercise_name)?))
}

// ─── Media list commands ────────────────────────────────────

#[tauri::command]
pub fn db_media_lists_list(state: State<'_, AppData>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.list_media_lists(&user_id)?))
}

#[tauri::command]
pub fn db_media_lists_create(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.create_media_list(&user_id, data)?))
}

#[tauri::command]
pub fn db_media_lists_update(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let id = data.get("id").and_then(|v| v.as_str()).ok_or_else(|| "id é obrigatório".to_string())?;
    let mut updates = data.as_object().cloned().unwrap_or_default();
    updates.remove("id");
    Ok(json!(vault.get_database()?.update_media_list(id, Value::Object(updates))?))
}

#[tauri::command]
pub fn db_media_lists_delete(state: State<'_, AppData>, id: String) -> Result<(), String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    vault.get_database()?.delete_media_list(&id)?;
    Ok(())
}

#[tauri::command]
pub fn db_media_items_list(state: State<'_, AppData>, list_id: String) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    Ok(json!(vault.get_database()?.list_media_items(&list_id)?))
}

#[tauri::command]
pub fn db_media_items_create(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.create_media_item(&user_id, data)?))
}

#[tauri::command]
pub fn db_media_items_update(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let id = data.get("id").and_then(|v| v.as_str()).ok_or_else(|| "id é obrigatório".to_string())?;
    let mut updates = data.as_object().cloned().unwrap_or_default();
    updates.remove("id");
    Ok(json!(vault.get_database()?.update_media_item(id, Value::Object(updates))?))
}

#[tauri::command]
pub fn db_media_items_delete(state: State<'_, AppData>, id: String) -> Result<(), String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    vault.get_database()?.delete_media_item(&id)?;
    Ok(())
}

#[tauri::command]
pub fn db_media_items_move(
    state: State<'_, AppData>,
    id: String,
    status: String,
    rank: Option<i64>,
) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    Ok(json!(vault.get_database()?.move_media_item(&id, &status, rank)?))
}

#[tauri::command]
pub fn db_release_schedules_list(
    state: State<'_, AppData>,
    media_type: Option<String>,
) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.list_release_schedules(
        &user_id,
        media_type.as_deref(),
    )?))
}

#[tauri::command]
pub fn db_release_schedules_create(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    Ok(json!(vault.get_database()?.create_release_schedule(&user_id, data)?))
}

#[tauri::command]
pub fn db_release_schedules_update(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    let id = data.get("id").and_then(|v| v.as_str()).ok_or_else(|| "id é obrigatório".to_string())?;
    let mut updates = data.as_object().cloned().unwrap_or_default();
    updates.remove("id");
    Ok(json!(vault.get_database()?.update_release_schedule(id, &user_id, Value::Object(updates))?))
}

#[tauri::command]
pub fn db_release_schedules_delete(
    state: State<'_, AppData>,
    id: String,
    delete_linked_task: Option<bool>,
) -> Result<(), String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    vault
        .get_database()?
        .delete_release_schedule(&id, delete_linked_task.unwrap_or(true))?;
    Ok(())
}

#[tauri::command]
pub fn db_release_schedules_mark_released(state: State<'_, AppData>, id: String) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    Ok(json!(vault.get_database()?.mark_release_released(&id)?))
}

// ─── Notes commands ─────────────────────────────────────────

#[tauri::command]
pub fn notes_list(state: State<'_, AppData>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let (user_id, path) = {
        let profile = vault.get_status().2.ok_or_else(|| "Nenhum vault aberto".to_string())?;
        (profile.id, vault.get_vault_path()?)
    };
    let store = NotesStore::new(&path, &user_id);
    let notes: Vec<Value> = store.list()?.iter().map(|n| store.to_note(n)).collect();
    Ok(json!(notes))
}

#[tauri::command]
pub fn notes_create(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let (user_id, path) = {
        let profile = vault.get_status().2.ok_or_else(|| "Nenhum vault aberto".to_string())?;
        (profile.id, vault.get_vault_path()?)
    };
    let store = NotesStore::new(&path, &user_id);
    Ok(store.to_note(&store.create(data)?))
}

#[tauri::command]
pub fn notes_update(state: State<'_, AppData>, data: Value) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let id = data
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "id é obrigatório".to_string())?
        .to_string();
    let (user_id, path) = {
        let profile = vault.get_status().2.ok_or_else(|| "Nenhum vault aberto".to_string())?;
        (profile.id, vault.get_vault_path()?)
    };
    let store = NotesStore::new(&path, &user_id);
    Ok(store.to_note(&store.update(&id, data)?))
}

#[tauri::command]
pub fn notes_delete(state: State<'_, AppData>, id: String) -> Result<(), String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    let path = vault.get_vault_path()?;
    let store = NotesStore::new(&path, &user_id);
    store.delete(&id)
}

// ─── AI commands ────────────────────────────────────────────

fn weekly_usage_json(db: &crate::db::ArrowDatabase, user_id: &str) -> Result<Value, String> {
    let week = current_week_start();
    let usage = db.get_token_usage(user_id, &week)?;
    Ok(json!({
        "weekStart": usage.get("week_start").cloned().unwrap_or(json!(week)),
        "tokensIn": usage.get("tokens_in").cloned().unwrap_or(json!(0)),
        "tokensOut": usage.get("tokens_out").cloned().unwrap_or(json!(0)),
        "tokensTotal": usage.get("tokens_total").cloned().unwrap_or(json!(0)),
        "requestCount": usage.get("request_count").cloned().unwrap_or(json!(0)),
    }))
}

#[tauri::command]
pub fn ai_get_settings(state: State<'_, AppData>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let db = vault.get_database()?;
    let configured = db.get_setting(GEMINI_API_KEY_SETTING)?.is_some();
    let masked = db
        .get_setting(GEMINI_API_KEY_SETTING)?
        .map(|k| mask_api_key(&k));
    let user_id = vault.get_profile_id()?;
    let model = resolve_gemini_model(db);
    let personal_context = get_personal_context(db)?;
    Ok(json!({
        "configured": configured,
        "maskedKey": masked,
        "model": model,
        "personalContext": personal_context,
        "weeklyUsage": weekly_usage_json(db, &user_id)?,
    }))
}

#[tauri::command]
pub fn ai_save_model(state: State<'_, AppData>, model: String) -> Result<Value, String> {
    let trimmed = model.trim().to_string();
    if trimmed.is_empty() {
        return Err("Informe o ID do modelo Gemini".to_string());
    }
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let db = vault.get_database()?;
    db.set_setting(GEMINI_MODEL_SETTING, &trimmed)?;
    let saved = db.get_setting(GEMINI_MODEL_SETTING)?;
    if saved.as_deref() != Some(trimmed.as_str()) {
        return Err("Falha ao persistir modelo no vault".to_string());
    }
    let user_id = vault.get_profile_id()?;
    let configured = db.get_setting(GEMINI_API_KEY_SETTING)?.is_some();
    let masked = db
        .get_setting(GEMINI_API_KEY_SETTING)?
        .map(|k| mask_api_key(&k));
    Ok(json!({
        "configured": configured,
        "maskedKey": masked,
        "model": trimmed,
        "weeklyUsage": weekly_usage_json(db, &user_id)?,
    }))
}

#[tauri::command]
pub async fn ai_save_api_key(state: State<'_, AppData>, api_key: String) -> Result<Value, String> {
    let key = api_key.trim().to_string();
    if key.is_empty() {
        return Err("Chave API não pode ser vazia".to_string());
    }
    let model = {
        let vault = state.vault.lock().map_err(|e| e.to_string())?;
        let db = vault.get_database()?;
        resolve_gemini_model(db)
    };
    let key_for_test = key.clone();
    let model_for_test = model.clone();
    tauri::async_runtime::spawn_blocking(move || test_gemini_connection(&key_for_test, &model_for_test))
        .await
        .map_err(|e| format!("Falha interna ao testar API: {}", e))??;
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let db = vault.get_database()?;
    db.set_setting(GEMINI_API_KEY_SETTING, &key)?;
    let user_id = vault.get_profile_id()?;
    Ok(json!({
        "configured": true,
        "maskedKey": mask_api_key(&key),
        "model": model,
        "weeklyUsage": weekly_usage_json(db, &user_id)?,
    }))
}

#[tauri::command]
pub fn ai_remove_api_key(state: State<'_, AppData>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let db = vault.get_database()?;
    db.delete_setting(GEMINI_API_KEY_SETTING)?;
    let user_id = vault.get_profile_id()?;
    let model = resolve_gemini_model(db);
    Ok(json!({
        "configured": false,
        "model": model,
        "weeklyUsage": weekly_usage_json(db, &user_id)?,
    }))
}

#[tauri::command]
pub async fn ai_test_api_key(state: State<'_, AppData>, api_key: Option<String>, model: Option<String>) -> Result<(), String> {
    // #region agent log
    if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open("/Users/marcola/Projetos/Arrow/.cursor/debug-af36b1.log") {
        let line = serde_json::json!({"sessionId":"af36b1","location":"commands.rs:ai_test_api_key","message":"api test started","data":{"hasInlineKey":api_key.is_some(),"hasInlineModel":model.is_some()},"hypothesisId":"D","timestamp":chrono::Utc::now().timestamp_millis()});
        let _ = std::io::Write::write_all(&mut f, format!("{}\n", line).as_bytes());
    }
    // #endregion
    let (key, model) = {
        let vault = state.vault.lock().map_err(|e| e.to_string())?;
        let db = vault.get_database()?;
        let key = if let Some(k) = api_key {
            k.trim().to_string()
        } else {
            db.get_setting(GEMINI_API_KEY_SETTING)?
                .ok_or_else(|| "Nenhuma chave configurada".to_string())?
        };
        let model = if let Some(m) = model {
            m.trim().to_string()
        } else {
            resolve_gemini_model(db)
        };
        (key, model)
    };
    tauri::async_runtime::spawn_blocking(move || test_gemini_connection(&key, &model))
        .await
        .map_err(|e| format!("Falha interna ao testar API: {}", e))?
}

#[tauri::command]
pub fn ai_get_weekly_usage(state: State<'_, AppData>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    weekly_usage_json(vault.get_database()?, &user_id)
}

#[tauri::command]
pub fn ai_list_conversations(state: State<'_, AppData>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    let rows = vault.get_database()?.list_ai_conversations(&user_id)?;
    Ok(json!(rows))
}

#[tauri::command]
pub fn ai_create_conversation(state: State<'_, AppData>, title: Option<String>) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let user_id = vault.get_profile_id()?;
    let row = vault
        .get_database()?
        .create_ai_conversation(&user_id, title.as_deref())?;
    Ok(Value::Object(row))
}

#[tauri::command]
pub fn ai_delete_conversation(state: State<'_, AppData>, id: String) -> Result<(), String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    vault.get_database()?.delete_ai_conversation(&id)
}

#[tauri::command]
pub fn ai_rename_conversation(state: State<'_, AppData>, id: String, title: String) -> Result<(), String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    vault.get_database()?.update_ai_conversation_title(&id, title.trim())
}

#[tauri::command]
pub fn ai_list_messages(state: State<'_, AppData>, conversation_id: String) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let rows = vault
        .get_database()?
        .list_ai_messages(&conversation_id, None)?;
    Ok(json!(rows))
}

#[tauri::command]
pub fn ai_get_context_stats(
    state: State<'_, AppData>,
    conversation_id: Option<String>,
) -> Result<Value, String> {
    let vault = state.vault.lock().map_err(|e| e.to_string())?;
    let profile = vault.get_status().2.ok_or_else(|| "Vault não aberto".to_string())?;
    let history = if let Some(ref cid) = conversation_id {
        vault.get_database()?.list_ai_messages(cid, Some(20))?
    } else {
        vec![]
    };
    let db = vault.get_database()?;
    let personal_context = crate::ai_personal::get_personal_context(db)?;
    let stats = AiService::get_context_stats(&profile, &personal_context, &history);
    Ok(json!({
        "estimatedTokens": stats.estimated_tokens,
        "charCount": stats.char_count,
        "maxTokens": MAX_CONTEXT_TOKEN_BUDGET,
        "maxChars": MAX_CONTEXT_CHARS,
        "truncated": stats.truncated,
    }))
}

fn send_result_to_json(result: crate::ai::SendMessageResult) -> Value {
    json!({
        "status": result.status,
        "text": result.text,
        "tokensIn": result.tokens_in,
        "tokensOut": result.tokens_out,
        "weeklyUsage": {
            "weekStart": result.weekly_usage.get("week_start").cloned().unwrap_or(Value::Null),
            "tokensIn": result.weekly_usage.get("tokens_in").cloned().unwrap_or(json!(0)),
            "tokensOut": result.weekly_usage.get("tokens_out").cloned().unwrap_or(json!(0)),
            "tokensTotal": result.weekly_usage.get("tokens_total").cloned().unwrap_or(json!(0)),
            "requestCount": result.weekly_usage.get("request_count").cloned().unwrap_or(json!(0)),
        },
        "contextStats": {
            "estimatedTokens": result.context_stats.estimated_tokens,
            "charCount": result.context_stats.char_count,
            "truncated": result.context_stats.truncated,
        },
        "pendingId": result.pending_id,
        "pendingTool": result.pending_tool,
        "pendingPreview": result.pending_preview,
        "affectedQueries": result.affected_queries,
        "userMessageId": result.user_message_id,
        "assistantMessageId": result.assistant_message_id,
    })
}

#[tauri::command]
pub async fn ai_send_message(
    state: State<'_, AppData>,
    conversation_id: String,
    message: String,
) -> Result<Value, String> {
    // #region agent log
    if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open("/Users/marcola/Projetos/Arrow/.cursor/debug-af36b1.log") {
        let line = serde_json::json!({"sessionId":"af36b1","location":"commands.rs:ai_send_message:entry","message":"command invoked","data":{"conversationId":&conversation_id,"messageLen":message.len(),"runId":"post-fix"},"hypothesisId":"A","timestamp":chrono::Utc::now().timestamp_millis()});
        let _ = std::io::Write::write_all(&mut f, format!("{}\n", line).as_bytes());
    }
    // #endregion
    let (user_id, profile, path, db_file, conversation_id, message, pending) = {
        let vault = state.vault.lock().map_err(|e| e.to_string())?;
        // #region agent log
        if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open("/Users/marcola/Projetos/Arrow/.cursor/debug-af36b1.log") {
            let line = serde_json::json!({"sessionId":"af36b1","location":"commands.rs:ai_send_message:vault_locked","message":"vault mutex acquired briefly","data":{"runId":"post-fix"},"hypothesisId":"A","timestamp":chrono::Utc::now().timestamp_millis()});
            let _ = std::io::Write::write_all(&mut f, format!("{}\n", line).as_bytes());
        }
        // #endregion
        let user_id = vault.get_profile_id()?;
        let profile = vault.get_status().2.ok_or_else(|| "Vault não aberto".to_string())?;
        let path = vault.get_vault_path()?;
        let db_file = db_path(&path);
        (
            user_id,
            profile,
            path,
            db_file,
            conversation_id,
            message.trim().to_string(),
            state.ai_pending.clone(),
        )
    };
    let db_file_str = db_file
        .to_str()
        .ok_or_else(|| "Caminho do banco inválido".to_string())?
        .to_string();
    let result = tauri::async_runtime::spawn_blocking(move || {
        let db = ArrowDatabase::open(&db_file_str)?;
        let notes = NotesStore::new(&path, &user_id);
        AiService::send_message(
            &db,
            &notes,
            &user_id,
            &profile,
            &conversation_id,
            &message,
            &pending,
        )
    })
    .await
    .map_err(|e| format!("Falha interna ao enviar mensagem: {}", e))?;
    // #region agent log
    match &result {
        Ok(r) => {
            if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open("/Users/marcola/Projetos/Arrow/.cursor/debug-af36b1.log") {
                let line = serde_json::json!({"sessionId":"af36b1","location":"commands.rs:ai_send_message:ok","message":"send returned ok","data":{"status":&r.status},"hypothesisId":"A","timestamp":chrono::Utc::now().timestamp_millis()});
                let _ = std::io::Write::write_all(&mut f, format!("{}\n", line).as_bytes());
            }
        }
        Err(e) => {
            if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open("/Users/marcola/Projetos/Arrow/.cursor/debug-af36b1.log") {
                let line = serde_json::json!({"sessionId":"af36b1","location":"commands.rs:ai_send_message:err","message":"send returned err","data":{"error":e},"hypothesisId":"C","timestamp":chrono::Utc::now().timestamp_millis()});
                let _ = std::io::Write::write_all(&mut f, format!("{}\n", line).as_bytes());
            }
        }
    }
    // #endregion
    let result = result?;
    Ok(send_result_to_json(result))
}

#[tauri::command]
pub async fn ai_confirm_tool(
    state: State<'_, AppData>,
    pending_id: String,
    confirmed: bool,
) -> Result<Value, String> {
    let (user_id, profile, path, db_file, pending_id, pending) = {
        let vault = state.vault.lock().map_err(|e| e.to_string())?;
        let user_id = vault.get_profile_id()?;
        let profile = vault.get_status().2.ok_or_else(|| "Vault não aberto".to_string())?;
        let path = vault.get_vault_path()?;
        let db_file = db_path(&path);
        (
            user_id,
            profile,
            path,
            db_file,
            pending_id,
            state.ai_pending.clone(),
        )
    };
    let db_file_str = db_file
        .to_str()
        .ok_or_else(|| "Caminho do banco inválido".to_string())?
        .to_string();
    let result = tauri::async_runtime::spawn_blocking(move || {
        let db = ArrowDatabase::open(&db_file_str)?;
        let notes = NotesStore::new(&path, &user_id);
        AiService::confirm_tool(
            &db,
            &notes,
            &user_id,
            &profile,
            &pending_id,
            confirmed,
            &pending,
        )
    })
    .await
    .map_err(|e| format!("Falha interna ao confirmar ação: {}", e))??;
    Ok(send_result_to_json(result))
}

#[derive(Default)]
struct VibrancyState {
    enabled: bool,
    is_dark: bool,
}

static VIBRANCY_STATE: Mutex<VibrancyState> = Mutex::new(VibrancyState {
    enabled: false,
    is_dark: false,
});

#[cfg(target_os = "macos")]
fn apply_macos_vibrancy(window: &tauri::WebviewWindow, is_dark: bool) -> Result<(), String> {
    use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};

    let material = if is_dark {
        NSVisualEffectMaterial::HudWindow
    } else {
        NSVisualEffectMaterial::Sidebar
    };
    apply_vibrancy(
        window,
        material,
        Some(NSVisualEffectState::FollowsWindowActiveState),
        None,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn sync_window_vibrancy(app: AppHandle, is_dark: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use tauri::Manager;
        use window_vibrancy::clear_vibrancy;

        let window = app
            .get_webview_window("main")
            .ok_or_else(|| "Janela principal não encontrada".to_string())?;

        let mut state = VIBRANCY_STATE.lock().map_err(|e| e.to_string())?;
        if state.enabled && state.is_dark == is_dark {
            return Ok(());
        }

        if state.enabled {
            let _ = clear_vibrancy(&window);
        }

        apply_macos_vibrancy(&window, is_dark)?;
        state.enabled = true;
        state.is_dark = is_dark;
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = (app, is_dark);
    }
    Ok(())
}

#[tauri::command]
pub fn clear_window_vibrancy(app: AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use tauri::Manager;
        use window_vibrancy::clear_vibrancy;

        let window = app
            .get_webview_window("main")
            .ok_or_else(|| "Janela principal não encontrada".to_string())?;

        let _ = clear_vibrancy(&window);

        let mut state = VIBRANCY_STATE.lock().map_err(|e| e.to_string())?;
        state.enabled = false;
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
    }
    Ok(())
}

pub fn try_open_last_vault(state: &AppData) {
    let app_state = load_app_state(&state.app_state_path);
    if let Some(path) = app_state.last_vault_path {
        if let Ok(mut vault) = state.vault.lock() {
            let _ = vault.open_vault(std::path::Path::new(&path));
        }
    }
}
