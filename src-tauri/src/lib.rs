mod ai;
mod ai_context;
mod ai_personal;
mod ai_tools;
mod app_state;
mod commands;
mod db;
mod note_links;
mod notes;
mod paths;
mod types;
mod vault;

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use tauri::Manager;

use commands::AppData;
use vault::VaultManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            #[cfg(target_os = "windows")]
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_decorations(false);
                let _ = commands::apply_windows_window_shape(&window);
            }

            let app_state_path = app
                .path()
                .app_data_dir()
                .map_err(|e| e.to_string())?
                .join("app-state.json");

            let data = AppData {
                vault: Mutex::new(VaultManager::default()),
                app_state_path,
                ai_pending: Arc::new(Mutex::new(HashMap::new())),
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
            commands::db_daily_plans_get,
            commands::db_daily_plans_upsert,
            commands::db_weekly_plans_get,
            commands::db_weekly_plans_upsert,
            commands::db_weekly_subgoals_list,
            commands::db_weekly_subgoals_create,
            commands::db_weekly_subgoals_update,
            commands::db_weekly_subgoals_delete,
            commands::db_pomodoro_sessions_list,
            commands::db_pomodoro_sessions_create,
            commands::db_pomodoro_sessions_update,
            commands::db_time_blocks_list,
            commands::db_time_blocks_create,
            commands::db_time_blocks_update,
            commands::db_time_blocks_delete,
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
            commands::db_workout_programs_list,
            commands::db_workout_programs_create,
            commands::db_workout_programs_update,
            commands::db_workout_programs_delete,
            commands::db_workout_templates_list,
            commands::db_workout_templates_create,
            commands::db_workout_templates_update,
            commands::db_workout_templates_delete,
            commands::db_workout_sessions_list,
            commands::db_workout_sessions_create,
            commands::db_workout_sessions_update,
            commands::db_workout_sessions_delete,
            commands::db_workout_sessions_complete,
            commands::db_workout_sessions_generate_week,
            commands::db_workout_exercise_progress,
            commands::db_workout_checkins_create,
            commands::db_workout_goals_list,
            commands::db_workout_goals_create,
            commands::db_workout_goals_update,
            commands::db_workout_goals_delete,
            commands::db_health_documents_list,
            commands::health_pick_document,
            commands::db_health_documents_import,
            commands::db_health_documents_delete,
            commands::db_media_lists_list,
            commands::db_media_lists_create,
            commands::db_media_lists_update,
            commands::db_media_lists_delete,
            commands::db_media_items_list,
            commands::db_media_items_create,
            commands::db_media_items_update,
            commands::db_media_items_delete,
            commands::db_media_items_move,
            commands::db_release_schedules_list,
            commands::db_release_schedules_create,
            commands::db_release_schedules_update,
            commands::db_release_schedules_delete,
            commands::db_release_schedules_mark_released,
            commands::notes_list,
            commands::notes_get,
            commands::notes_search,
            commands::notes_resolve_or_create,
            commands::notes_backlinks,
            commands::notes_graph,
            commands::notes_rebuild_index,
            commands::notes_list_folders,
            commands::notes_create_folder,
            commands::notes_create,
            commands::notes_update,
            commands::notes_delete,
            commands::sync_window_vibrancy,
            commands::clear_window_vibrancy,
            commands::ai_get_settings,
            commands::ai_save_api_key,
            commands::ai_save_model,
            commands::ai_remove_api_key,
            commands::ai_test_api_key,
            commands::ai_get_weekly_usage,
            commands::ai_list_conversations,
            commands::ai_create_conversation,
            commands::ai_delete_conversation,
            commands::ai_rename_conversation,
            commands::ai_list_messages,
            commands::ai_get_context_stats,
            commands::ai_send_message,
            commands::ai_confirm_tool,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Ready = event {
                #[cfg(target_os = "windows")]
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.set_decorations(false);
                    let _ = commands::apply_windows_window_shape(&window);
                }

                let _ = commands::sync_window_vibrancy(app_handle.clone(), false);
            }
        });
}
