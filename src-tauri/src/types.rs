use serde::{Deserialize, Serialize};
use serde_json::Value;

pub const VAULT_VERSION: u32 = 2;
pub const SCHEMA_VERSION: i32 = 3;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalProfile {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_path: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultConfig {
    pub version: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub theme: Option<String>,
    #[serde(rename = "colorTheme", skip_serializing_if = "Option::is_none")]
    pub color_theme: Option<String>,
    #[serde(rename = "backgroundEffect", skip_serializing_if = "Option::is_none")]
    pub background_effect: Option<String>,
    #[serde(rename = "rainDensity", skip_serializing_if = "Option::is_none")]
    pub rain_density: Option<f64>,
    #[serde(rename = "glassScope", skip_serializing_if = "Option::is_none")]
    pub glass_scope: Option<String>,
    #[serde(rename = "glassOpacity", skip_serializing_if = "Option::is_none")]
    pub glass_opacity: Option<f64>,
    #[serde(rename = "visualQuality", skip_serializing_if = "Option::is_none")]
    pub visual_quality: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultStatus {
    pub is_open: bool,
    pub vault_path: Option<String>,
    pub profile: Option<Value>,
    pub last_vault_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppStateFile {
    #[serde(rename = "lastVaultPath")]
    pub last_vault_path: Option<String>,
}

impl Default for AppStateFile {
    fn default() -> Self {
        Self {
            last_vault_path: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UiProfile {
    pub id: String,
    pub email: String,
    pub full_name: String,
    pub role: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_url: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
