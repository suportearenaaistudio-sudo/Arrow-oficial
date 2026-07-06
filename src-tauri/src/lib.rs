mod app_state;
mod commands;
mod db;
mod notes;
mod paths;
mod types;
mod vault;

use std::sync::Mutex;

use tauri::Manager;

use commands::AppData;
use vault::VaultManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let app_state_path = app
                .path()
                .app_data_dir()
                .map_err(|e| e.to_string())?
                .join("app-state.json");

            let data = AppData {
                vault: Mutex::new(VaultManager::default()),
                app_state_path,
            };
            commands::try_open_last_vault(&data);
            app.manage(data);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::vault_get_status,
            commands::vault_pick_folder,
            commands::vault_create,
            commands::vault_open,
            commands::vault_open_last,
            commands::vault_close,
            commands::vault_update_profile,
            commands::vault_save_avatar,
            commands::vault_get_config,
            commands::vault_save_config,
            commands::db_cycles_list,
            commands::db_cycles_create,
            commands::db_cycles_update,
            commands::db_cycles_delete,
            commands::db_cycles_activate,
            commands::db_goals_list,
            commands::db_goals_create,
            commands::db_goals_update,
            commands::db_goals_delete,
            commands::db_tasks_list,
            commands::db_tasks_create,
            commands::db_tasks_update,
            commands::db_tasks_delete,
            commands::db_habits_list,
            commands::db_habits_create,
            commands::db_habits_update,
            commands::db_habits_delete,
            commands::db_transactions_list,
            commands::db_transactions_create,
            commands::db_transactions_delete,
            commands::db_checkins_list,
            commands::db_checkins_get_by_date,
            commands::db_checkins_upsert,
            commands::db_vision_get,
            commands::db_vision_save,
            commands::db_weekly_scores_list,
            commands::db_weekly_scores_finalize,
            commands::notes_list,
            commands::notes_create,
            commands::notes_update,
            commands::notes_delete,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
