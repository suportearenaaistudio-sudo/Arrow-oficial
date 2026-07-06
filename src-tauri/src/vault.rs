use std::fs;
use std::path::{Path, PathBuf};

use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use serde_json::Value;
use uuid::Uuid;

use crate::db::ArrowDatabase;
use crate::paths::{
    arrow_dir, attachments_dir, config_path, db_path, notes_dir, profile_path,
};
use crate::types::{LocalProfile, VaultConfig, VAULT_VERSION};

const VAULT_V1_ERROR: &str =
    "Vault incompatível (v1/Electron). Crie um novo vault no Arrow 2.";

fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}

fn read_json<T: serde::de::DeserializeOwned>(path: &Path) -> Result<T, String> {
    let raw = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

fn write_json(path: &Path, data: &impl serde::Serialize) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

fn validate_vault_version(vault_path: &Path) -> Result<(), String> {
    let cfg_path = config_path(vault_path);
    if !cfg_path.exists() {
        return Err(VAULT_V1_ERROR.to_string());
    }
    let config: VaultConfig = read_json(&cfg_path)?;
    if config.version != VAULT_VERSION {
        return Err(VAULT_V1_ERROR.to_string());
    }
    Ok(())
}

pub struct VaultManager {
    vault_path: Option<PathBuf>,
    profile: Option<LocalProfile>,
    db: Option<ArrowDatabase>,
}

impl Default for VaultManager {
    fn default() -> Self {
        Self {
            vault_path: None,
            profile: None,
            db: None,
        }
    }
}

impl VaultManager {
    pub fn get_status(&self) -> (bool, Option<String>, Option<LocalProfile>) {
        (
            self.vault_path.is_some(),
            self.vault_path.as_ref().map(|p| p.to_string_lossy().to_string()),
            self.profile.clone(),
        )
    }

    pub fn get_profile_id(&self) -> Result<String, String> {
        self.profile
            .as_ref()
            .map(|p| p.id.clone())
            .ok_or_else(|| "Vault não aberto".to_string())
    }

    pub fn get_database(&self) -> Result<&ArrowDatabase, String> {
        self.db.as_ref().ok_or_else(|| "Vault não aberto".to_string())
    }

    pub fn get_vault_path(&self) -> Result<PathBuf, String> {
        self.vault_path
            .clone()
            .ok_or_else(|| "Vault não aberto".to_string())
    }

    pub fn is_valid_vault(path: &Path) -> bool {
        profile_path(path).exists() && db_path(path).exists()
    }

    pub fn create_vault(&mut self, path: &Path, profile_name: &str) -> Result<LocalProfile, String> {
        let name = profile_name.trim();
        if name.is_empty() {
            return Err("Nome do perfil é obrigatório".to_string());
        }

        fs::create_dir_all(path).map_err(|e| e.to_string())?;
        fs::create_dir_all(arrow_dir(path)).map_err(|e| e.to_string())?;
        fs::create_dir_all(notes_dir(path)).map_err(|e| e.to_string())?;
        fs::create_dir_all(attachments_dir(path)).map_err(|e| e.to_string())?;

        let ts = now_iso();
        let profile = LocalProfile {
            id: Uuid::new_v4().to_string(),
            name: name.to_string(),
            avatar_path: None,
            created_at: ts.clone(),
            updated_at: ts,
        };

        let config = VaultConfig {
            version: VAULT_VERSION,
            theme: None,
            visual_quality: None,
        };

        write_json(&profile_path(path), &profile)?;
        write_json(&config_path(path), &config)?;

        let db_file = db_path(path);
        let db = ArrowDatabase::open(db_file.to_str().unwrap())?;
        db.init()?;

        self.vault_path = Some(path.to_path_buf());
        self.profile = Some(profile.clone());
        self.db = Some(db);
        Ok(profile)
    }

    pub fn open_vault(&mut self, path: &Path) -> Result<LocalProfile, String> {
        if !Self::is_valid_vault(path) {
            return Err(
                "Pasta inválida. Escolha um vault Arrow existente (deve conter .arrow/profile.json)."
                    .to_string(),
            );
        }
        validate_vault_version(path)?;

        self.close_vault();
        let profile: LocalProfile = read_json(&profile_path(path))?;
        let db = ArrowDatabase::open(db_path(path).to_str().unwrap())?;
        db.init()?;

        self.vault_path = Some(path.to_path_buf());
        self.profile = Some(profile.clone());
        self.db = Some(db);
        Ok(profile)
    }

    pub fn close_vault(&mut self) {
        self.db = None;
        self.vault_path = None;
        self.profile = None;
    }

    pub fn update_profile(&mut self, updates: LocalProfileUpdate) -> Result<LocalProfile, String> {
        let vault_path = self.get_vault_path()?;
        let profile = self
            .profile
            .as_mut()
            .ok_or_else(|| "Vault não aberto".to_string())?;

        if let Some(name) = updates.name {
            profile.name = name;
        }
        if let Some(avatar_path) = updates.avatar_path {
            profile.avatar_path = Some(avatar_path);
        }
        profile.updated_at = now_iso();
        write_json(&profile_path(&vault_path), &profile)?;
        Ok(profile.clone())
    }

    pub fn get_config(&self) -> Result<VaultConfig, String> {
        let vault_path = self.get_vault_path()?;
        if !config_path(&vault_path).exists() {
            return Err(VAULT_V1_ERROR.to_string());
        }
        read_json(&config_path(&vault_path))
    }

    pub fn save_config(&self, partial: Value) -> Result<VaultConfig, String> {
        let vault_path = self.get_vault_path()?;
        let mut current = self.get_config()?;
        if let Some(theme) = partial.get("theme").and_then(|v| v.as_str()) {
            current.theme = Some(theme.to_string());
        }
        if let Some(vq) = partial
            .get("visualQuality")
            .or_else(|| partial.get("visual_quality"))
            .and_then(|v| v.as_str())
        {
            current.visual_quality = Some(vq.to_string());
        }
        current.version = VAULT_VERSION;
        write_json(&config_path(&vault_path), &current)?;
        Ok(current)
    }

    pub fn save_avatar(&mut self, data: &[u8]) -> Result<String, String> {
        let vault_path = self.get_vault_path()?;
        let rel = "attachments/avatar.webp";
        let abs = vault_path.join(rel);
        if let Some(parent) = abs.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        fs::write(&abs, data).map_err(|e| e.to_string())?;
        self.update_profile(LocalProfileUpdate {
            name: None,
            avatar_path: Some(rel.to_string()),
        })?;
        Ok(rel.to_string())
    }

    pub fn get_avatar_data_url(&self) -> Option<String> {
        let vault_path = self.vault_path.as_ref()?;
        let avatar_rel = self.profile.as_ref()?.avatar_path.as_ref()?;
        let abs = vault_path.join(avatar_rel);
        let data = fs::read(abs).ok()?;
        Some(format!("data:image/webp;base64,{}", BASE64.encode(data)))
    }
}

pub struct LocalProfileUpdate {
    pub name: Option<String>,
    pub avatar_path: Option<String>,
}
