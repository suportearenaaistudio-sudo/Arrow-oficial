use std::fs;
use std::path::Path;

use crate::types::AppStateFile;

pub fn load_app_state(path: &Path) -> AppStateFile {
    if !path.exists() {
        return AppStateFile::default();
    }
    let raw = fs::read_to_string(path).unwrap_or_default();
    serde_json::from_str(&raw).unwrap_or_default()
}

pub fn save_app_state(path: &Path, state: &AppStateFile) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(state).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}
