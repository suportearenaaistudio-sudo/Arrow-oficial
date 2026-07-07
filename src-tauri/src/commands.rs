use std::path::PathBuf;
use std::sync::Mutex;

use serde_json::{json, Value};
use tauri::{AppHandle, State};

use crate::app_state::{load_app_state, save_app_state};
use crate::notes::NotesStore;
use crate::types::{UiProfile, VaultStatus};
use crate::vault::{LocalProfileUpdate, VaultManager};

pub struct AppData {
    pub vault: Mutex<VaultManager>,
    pub app_state_path: PathBuf,
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
    let score = if tasks_planned > 0 {
        ((tasks_completed as f64 / tasks_planned as f64) * 100.0).round()
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
