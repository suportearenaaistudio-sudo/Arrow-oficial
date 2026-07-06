use std::path::{Path, PathBuf};

pub const ARROW_DIR: &str = ".arrow";
pub const PROFILE_FILE: &str = "profile.json";
pub const CONFIG_FILE: &str = "config.json";
pub const DB_FILE: &str = "arrow.db";
pub const NOTES_DIR: &str = "notes";
pub const ATTACHMENTS_DIR: &str = "attachments";

pub fn arrow_dir(vault_path: &Path) -> PathBuf {
    vault_path.join(ARROW_DIR)
}

pub fn db_path(vault_path: &Path) -> PathBuf {
    arrow_dir(vault_path).join(DB_FILE)
}

pub fn profile_path(vault_path: &Path) -> PathBuf {
    arrow_dir(vault_path).join(PROFILE_FILE)
}

pub fn config_path(vault_path: &Path) -> PathBuf {
    arrow_dir(vault_path).join(CONFIG_FILE)
}

pub fn notes_dir(vault_path: &Path) -> PathBuf {
    vault_path.join(NOTES_DIR)
}

pub fn attachments_dir(vault_path: &Path) -> PathBuf {
    vault_path.join(ATTACHMENTS_DIR)
}
