use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::paths::notes_dir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteFileMeta {
    pub id: String,
    pub title: String,
    pub tags: Vec<String>,
    pub folder: String,
    pub created_at: String,
    pub updated_at: String,
    pub file_path: String,
    pub content: String,
}

fn now_iso() -> String {
    chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}

fn parse_frontmatter(raw: &str) -> (serde_json::Map<String, Value>, String) {
    let trimmed = raw.trim_start();
    if trimmed.starts_with("---") {
        if let Some(end) = trimmed[3..].find("\n---") {
            let yaml_start = trimmed.find('\n').map(|i| i + 1).unwrap_or(3);
            let yaml_end = yaml_start + end;
            let yaml = &trimmed[yaml_start..yaml_end];
            let body_start = yaml_end + 4; // \n---
            let body = trimmed
                .get(body_start..)
                .map(|s| s.trim_start_matches('\n').trim_start_matches('\r'))
                .unwrap_or("")
                .to_string();
            let mut meta = serde_json::Map::new();
            for line in yaml.lines() {
                if let Some((key, value)) = line.split_once(':') {
                    let key = key.trim();
                    let val = value.trim();
                    let parsed: Value = if val.starts_with('[') && val.ends_with(']') {
                        serde_json::from_str(&val.replace('\'', "\"")).unwrap_or(json!([]))
                    } else if val == "null" {
                        Value::Null
                    } else if (val.starts_with('"') && val.ends_with('"'))
                        || (val.starts_with('\'') && val.ends_with('\''))
                    {
                        Value::String(val[1..val.len() - 1].to_string())
                    } else {
                        Value::String(val.to_string())
                    };
                    meta.insert(key.to_string(), parsed);
                }
            }
            return (meta, body);
        }
    }
    (serde_json::Map::new(), raw.to_string())
}

fn serialize_frontmatter(meta: &serde_json::Map<String, Value>, body: &str) -> String {
    let mut lines = vec!["---".to_string()];
    for (key, value) in meta {
        let line = match value {
            Value::Array(_) => format!(
                "{}: {}",
                key,
                serde_json::to_string(value).unwrap_or_default()
            ),
            Value::Null => format!("{}: null", key),
            Value::String(s) => {
                format!("{}: {}", key, serde_json::to_string(s).unwrap_or_default())
            }
            other => format!(
                "{}: {}",
                key,
                serde_json::to_string(other).unwrap_or_default()
            ),
        };
        lines.push(line);
    }
    lines.push("---".to_string());
    lines.push(String::new());
    lines.push(body.to_string());
    lines.join("\n")
}

fn slugify(title: &str) -> String {
    let mut out = String::new();
    let mut prev_dash = false;
    for c in title.to_lowercase().chars() {
        if c.is_ascii_alphanumeric() {
            out.push(c);
            prev_dash = false;
        } else if !prev_dash {
            out.push('-');
            prev_dash = true;
        }
    }
    let trimmed = out.trim_matches('-');
    if trimmed.is_empty() {
        "nota".to_string()
    } else {
        trimmed.to_string()
    }
}

fn walk_md_files(dir: &Path, files: &mut Vec<PathBuf>) {
    if !dir.exists() {
        return;
    }
    let entries = fs::read_dir(dir).ok();
    if let Some(entries) = entries {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                walk_md_files(&path, files);
            } else if path.extension().and_then(|e| e.to_str()) == Some("md") {
                files.push(path);
            }
        }
    }
}

fn read_note_file(vault_path: &Path, abs_path: &Path) -> Result<NoteFileMeta, String> {
    let raw = fs::read_to_string(abs_path).map_err(|e| e.to_string())?;
    let (meta, body) = parse_frontmatter(&raw);
    let rel = abs_path
        .strip_prefix(vault_path)
        .map_err(|e| e.to_string())?
        .to_string_lossy()
        .to_string();
    let notes_base = notes_dir(vault_path);
    let parent = abs_path.parent().unwrap_or(abs_path);
    let folder_rel = parent
        .strip_prefix(&notes_base)
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();
    let folder = if folder_rel == "." {
        String::new()
    } else {
        folder_rel
    };

    Ok(NoteFileMeta {
        id: meta
            .get("id")
            .and_then(|v| v.as_str())
            .map(String::from)
            .unwrap_or_else(|| Uuid::new_v4().to_string()),
        title: meta
            .get("title")
            .and_then(|v| v.as_str())
            .unwrap_or("Sem título")
            .to_string(),
        tags: meta
            .get("tags")
            .and_then(|v| v.as_array())
            .map(|a| {
                a.iter()
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_default(),
        folder,
        created_at: meta
            .get("created_at")
            .and_then(|v| v.as_str())
            .unwrap_or(&now_iso())
            .to_string(),
        updated_at: meta
            .get("updated_at")
            .and_then(|v| v.as_str())
            .unwrap_or(&now_iso())
            .to_string(),
        file_path: rel,
        content: body.trim().to_string(),
    })
}

pub struct NotesStore<'a> {
    vault_path: &'a Path,
    user_id: String,
}

impl<'a> NotesStore<'a> {
    pub fn new(vault_path: &'a Path, user_id: &str) -> Self {
        Self {
            vault_path,
            user_id: user_id.to_string(),
        }
    }

    pub fn list(&self) -> Result<Vec<NoteFileMeta>, String> {
        let mut files = Vec::new();
        walk_md_files(&notes_dir(self.vault_path), &mut files);
        let mut notes: Vec<NoteFileMeta> = files
            .iter()
            .filter_map(|f| read_note_file(self.vault_path, f).ok())
            .collect();
        notes.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        Ok(notes)
    }

    pub fn create(&self, input: Value) -> Result<NoteFileMeta, String> {
        let title = input
            .get("title")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "title é obrigatório".to_string())?;
        let content = input.get("content").and_then(|v| v.as_str()).unwrap_or("");
        let tags: Vec<String> = input
            .get("tags")
            .and_then(|v| v.as_array())
            .map(|a| {
                a.iter()
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_default();
        let folder = input
            .get("folder")
            .and_then(|v| v.as_str())
            .map(|s| s.trim().to_string())
            .unwrap_or_default();

        let id = Uuid::new_v4().to_string();
        let ts = now_iso();
        let dir = if folder.is_empty() {
            notes_dir(self.vault_path)
        } else {
            notes_dir(self.vault_path).join(&folder)
        };
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

        let mut filename = format!("{}.md", slugify(title));
        let mut abs = dir.join(&filename);
        let mut i = 1;
        while abs.exists() {
            filename = format!("{}-{}.md", slugify(title), i);
            abs = dir.join(&filename);
            i += 1;
        }

        let mut meta = serde_json::Map::new();
        meta.insert("id".to_string(), json!(id));
        meta.insert("title".to_string(), json!(title));
        meta.insert("tags".to_string(), json!(tags));
        meta.insert("created_at".to_string(), json!(ts));
        meta.insert("updated_at".to_string(), json!(ts));
        fs::write(&abs, serialize_frontmatter(&meta, content)).map_err(|e| e.to_string())?;
        read_note_file(self.vault_path, &abs)
    }

    pub fn update(&self, id: &str, updates: Value) -> Result<NoteFileMeta, String> {
        let existing = self
            .list()?
            .into_iter()
            .find(|n| n.id == id)
            .ok_or_else(|| "Nota não encontrada".to_string())?;

        let title = updates
            .get("title")
            .and_then(|v| v.as_str())
            .unwrap_or(&existing.title);
        let content = updates
            .get("content")
            .and_then(|v| v.as_str())
            .unwrap_or(&existing.content);
        let tags: Vec<String> = updates
            .get("tags")
            .and_then(|v| v.as_array())
            .map(|a| {
                a.iter()
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_else(|| existing.tags.clone());
        let folder = updates
            .get("folder")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| existing.folder.clone());
        let ts = now_iso();

        let dir = if folder.is_empty() {
            notes_dir(self.vault_path)
        } else {
            notes_dir(self.vault_path).join(&folder)
        };
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

        let abs_old = self.vault_path.join(&existing.file_path);
        let mut filename = format!("{}.md", slugify(title));
        let mut abs_new = dir.join(&filename);
        if abs_new != abs_old {
            let mut i = 1;
            while abs_new.exists() {
                filename = format!("{}-{}.md", slugify(title), i);
                abs_new = dir.join(&filename);
                i += 1;
            }
        }

        let mut meta = serde_json::Map::new();
        meta.insert("id".to_string(), json!(id));
        meta.insert("title".to_string(), json!(title));
        meta.insert("tags".to_string(), json!(tags));
        meta.insert("created_at".to_string(), json!(existing.created_at));
        meta.insert("updated_at".to_string(), json!(ts));
        fs::write(&abs_new, serialize_frontmatter(&meta, content)).map_err(|e| e.to_string())?;
        if abs_new != abs_old && abs_old.exists() {
            fs::remove_file(&abs_old).map_err(|e| e.to_string())?;
        }
        read_note_file(self.vault_path, &abs_new)
    }

    pub fn delete(&self, id: &str) -> Result<(), String> {
        let existing = self
            .list()?
            .into_iter()
            .find(|n| n.id == id)
            .ok_or_else(|| "Nota não encontrada".to_string())?;
        fs::remove_file(self.vault_path.join(&existing.file_path)).map_err(|e| e.to_string())
    }

    pub fn get(&self, id: &str) -> Result<NoteFileMeta, String> {
        self.list()?
            .into_iter()
            .find(|n| n.id == id)
            .ok_or_else(|| "Nota não encontrada".to_string())
    }

    pub fn search(&self, query: &str, limit: usize) -> Result<Vec<NoteFileMeta>, String> {
        let q = query.trim().to_lowercase();
        if q.is_empty() {
            return Ok(self.list()?.into_iter().take(limit).collect());
        }
        let mut matches: Vec<NoteFileMeta> = self
            .list()?
            .into_iter()
            .filter(|n| {
                n.title.to_lowercase().contains(&q)
                    || n.content.to_lowercase().contains(&q)
                    || n.tags.iter().any(|t| t.to_lowercase().contains(&q))
            })
            .collect();
        matches.truncate(limit);
        Ok(matches)
    }

    fn validate_folder_path(path: &str) -> Result<String, String> {
        let trimmed = path.trim().trim_matches('/');
        if trimmed.is_empty() {
            return Err("Nome da pasta é obrigatório".to_string());
        }
        if trimmed.contains("..") {
            return Err("Caminho de pasta inválido".to_string());
        }
        for part in trimmed.split('/') {
            if part.is_empty() || part == "." {
                return Err("Caminho de pasta inválido".to_string());
            }
            if part.chars().any(|c| c == '\\' || c == ':' || c == '*' || c == '?' || c == '"') {
                return Err("Caracteres inválidos no nome da pasta".to_string());
            }
        }
        Ok(trimmed.to_string())
    }

    fn walk_dirs(dir: &Path, base: &Path, out: &mut Vec<String>) {
        if !dir.exists() {
            return;
        }
        let entries = fs::read_dir(dir).ok();
        if let Some(entries) = entries {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Ok(rel) = path.strip_prefix(base) {
                        let rel_str = rel.to_string_lossy().replace('\\', "/");
                        if !rel_str.is_empty() {
                            out.push(rel_str);
                        }
                    }
                    Self::walk_dirs(&path, base, out);
                }
            }
        }
    }

    pub fn list_folders(&self) -> Result<Vec<String>, String> {
        let base = notes_dir(self.vault_path);
        let mut folders = Vec::new();
        Self::walk_dirs(&base, &base, &mut folders);
        folders.sort();
        folders.dedup();
        Ok(folders)
    }

    pub fn create_folder(&self, path: &str) -> Result<String, String> {
        let rel = Self::validate_folder_path(path)?;
        let dir = notes_dir(self.vault_path).join(&rel);
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
        Ok(rel)
    }

    pub fn create_stub(&self, title: &str, folder: Option<&str>) -> Result<NoteFileMeta, String> {
        let trimmed = title.trim();
        if trimmed.is_empty() {
            return Err("Título é obrigatório".to_string());
        }
        if let Some(existing) = self
            .list()?
            .into_iter()
            .find(|n| n.title.eq_ignore_ascii_case(trimmed))
        {
            return Ok(existing);
        }
        let mut input = serde_json::Map::new();
        input.insert("title".to_string(), json!(trimmed));
        input.insert("content".to_string(), json!(""));
        input.insert("tags".to_string(), json!([]));
        if let Some(f) = folder {
            input.insert("folder".to_string(), json!(f));
        }
        self.create(Value::Object(input))
    }

    pub fn to_note(&self, meta: &NoteFileMeta) -> Value {
        json!({
            "id": meta.id,
            "user_id": self.user_id,
            "title": meta.title,
            "content": meta.content,
            "tags": meta.tags,
            "folder": meta.folder,
            "file_path": meta.file_path,
            "created_at": meta.created_at,
            "updated_at": meta.updated_at,
        })
    }
}
