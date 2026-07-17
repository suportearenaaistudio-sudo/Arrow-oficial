use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use chrono::{Datelike, Duration, Utc};
use serde_json::{json, Map, Value};
use uuid::Uuid;

fn agent_debug_log(location: &str, message: &str, data: Value, hypothesis_id: &str) {
    // #region agent log
    if let Ok(mut f) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open("/Users/marcola/Projetos/Arrow/.cursor/debug-af36b1.log")
    {
        let line = json!({
            "sessionId": "af36b1",
            "location": location,
            "message": message,
            "data": data,
            "hypothesisId": hypothesis_id,
            "timestamp": Utc::now().timestamp_millis(),
        });
        let _ = std::io::Write::write_all(&mut f, format!("{}\n", line).as_bytes());
    }
    // #endregion
}

use crate::ai_context::{
    build_system_prompt, estimate_prompt_stats, estimate_tokens, stats_from_usage, ContextStats,
};
pub use crate::ai_context::MAX_CONTEXT_CHARS;
use crate::ai_personal::{
    build_personal_refresh_prompt, get_personal_context, save_personal_context,
    should_refresh_personal_context,
};
use crate::ai_tools::{execute_tool, is_destructive, tool_declarations, tool_preview, tools_affecting_queries};
use crate::db::ArrowDatabase;
use crate::notes::NotesStore;
use crate::types::LocalProfile;

pub const GEMINI_API_KEY_SETTING: &str = "gemini_api_key";
pub const GEMINI_MODEL_SETTING: &str = "gemini_model";
pub const DEFAULT_GEMINI_MODEL: &str = "gemini-2.5-flash";
pub const MAX_USER_MESSAGE_CHARS: usize = 8_000;
pub const MAX_OUTPUT_TOKENS: i64 = 4096;
pub const MAX_HISTORY_MESSAGES: i64 = 10;
pub const MAX_TOOL_ROUNDS: usize = 6;

pub struct PendingToolCall {
    pub conversation_id: String,
    pub tool_name: String,
    pub args: Value,
    pub gemini_contents: Value,
    pub model_turn: Option<Value>,
    pub total_tokens_in: i64,
    pub total_tokens_out: i64,
}

pub fn current_week_start() -> String {
    let today = Utc::now().date_naive();
    let days = today.weekday().num_days_from_monday();
    let monday = today - Duration::days(days as i64);
    monday.format("%Y-%m-%d").to_string()
}

pub fn mask_api_key(key: &str) -> String {
    if key.len() <= 4 {
        return "••••".to_string();
    }
    format!("••••{}", &key[key.len() - 4..])
}

pub struct GeminiUsage {
    pub tokens_in: i64,
    pub tokens_out: i64,
}

pub struct GeminiResponse {
    pub text: Option<String>,
    pub function_calls: Vec<(String, Value)>,
    /// Conteúdo bruto do turno do modelo (preserva thoughtSignature exigido pelo Gemini 3.x).
    pub model_turn: Option<Value>,
    pub usage: GeminiUsage,
}

pub fn resolve_gemini_model(db: &ArrowDatabase) -> String {
    db.get_setting(GEMINI_MODEL_SETTING)
        .ok()
        .flatten()
        .map(|m| m.trim().to_string())
        .filter(|m| !m.is_empty())
        .unwrap_or_else(|| DEFAULT_GEMINI_MODEL.to_string())
}

pub fn test_gemini_connection(api_key: &str, model: &str) -> Result<(), String> {
    let model = model.trim();
    if model.is_empty() {
        return Err("Modelo Gemini inválido".to_string());
    }
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
    );
    let body = json!({
        "contents": [{ "role": "user", "parts": [{ "text": "Responda apenas: ok" }] }],
        "generationConfig": { "maxOutputTokens": 10 }
    });
    let client = reqwest::blocking::Client::new();
    let res = client
        .post(&url)
        .json(&body)
        .send()
        .map_err(|_| "Falha de conexão com a API Gemini".to_string())?;
    if res.status().is_success() {
        Ok(())
    } else {
        Err("Chave API inválida ou sem permissão".to_string())
    }
}

pub fn call_gemini(
    api_key: &str,
    model: &str,
    system_prompt: &str,
    contents: &Value,
    with_tools: bool,
) -> Result<GeminiResponse, String> {
    let model = model.trim();
    if model.is_empty() {
        return Err("Modelo Gemini não configurado".to_string());
    }
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
    );
    let mut body = json!({
        "systemInstruction": { "parts": [{ "text": system_prompt }] },
        "contents": contents,
        "generationConfig": { "maxOutputTokens": MAX_OUTPUT_TOKENS }
    });
    if with_tools {
        body["tools"] = tool_declarations();
        body["toolConfig"] = json!({
            "functionCallingConfig": { "mode": "AUTO" }
        });
    }

    let client = reqwest::blocking::Client::new();
    agent_debug_log(
        "ai.rs:call_gemini:start",
        "http request starting",
        json!({ "model": model, "withTools": with_tools, "runId": "post-fix" }),
        "C",
    );
    let res = client
        .post(&url)
        .json(&body)
        .send()
        .map_err(|e| {
            agent_debug_log(
                "ai.rs:call_gemini:network_err",
                "network error",
                json!({ "error": e.to_string() }),
                "C",
            );
            "Erro de rede ao chamar Gemini".to_string()
        })?;

    let status = res.status();
    let data: Value = res.json().map_err(|e| {
        agent_debug_log(
            "ai.rs:call_gemini:json_err",
            "json parse error",
            json!({ "error": e.to_string(), "status": status.as_u16() }),
            "C",
        );
        "Resposta inválida da API".to_string()
    })?;

    if !status.is_success() {
        let msg = data
            .get("error")
            .and_then(|e| e.get("message"))
            .and_then(|m| m.as_str())
            .unwrap_or("Erro na API Gemini");
        agent_debug_log(
            "ai.rs:call_gemini:api_err",
            "api error response",
            json!({ "status": status.as_u16(), "message": msg }),
            "C",
        );
        return Err(msg.to_string());
    }

    let usage_meta = data.get("usageMetadata");
    let tokens_in = usage_meta
        .and_then(|u| u.get("promptTokenCount"))
        .and_then(|v| v.as_i64())
        .unwrap_or(0);
    let tokens_out = usage_meta
        .and_then(|u| u.get("candidatesTokenCount"))
        .and_then(|v| v.as_i64())
        .unwrap_or(0);

    let mut text_parts: Vec<String> = Vec::new();
    let mut function_calls: Vec<(String, Value)> = Vec::new();

    let candidate_content = data
        .get("candidates")
        .and_then(|c| c.get(0))
        .and_then(|c| c.get("content"));

    if let Some(parts) = candidate_content
        .and_then(|c| c.get("parts"))
        .and_then(|p| p.as_array())
    {
        for part in parts {
            if let Some(t) = part.get("text").and_then(|v| v.as_str()) {
                text_parts.push(t.to_string());
            }
            if let Some(fc) = part.get("functionCall") {
                let name = fc
                    .get("name")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                let args = fc.get("args").cloned().unwrap_or(json!({}));
                function_calls.push((name, args));
            }
        }
    }

    let model_turn = if function_calls.is_empty() {
        None
    } else {
        candidate_content.cloned()
    };

    agent_debug_log(
        "ai.rs:call_gemini:ok",
        "http response parsed",
        json!({
            "tokensIn": tokens_in,
            "tokensOut": tokens_out,
            "functionCalls": function_calls.len(),
            "hasText": !text_parts.is_empty(),
        }),
        "C",
    );

    Ok(GeminiResponse {
        text: if text_parts.is_empty() {
            None
        } else {
            Some(text_parts.join("\n"))
        },
        function_calls,
        model_turn,
        usage: GeminiUsage {
            tokens_in,
            tokens_out,
        },
    })
}

fn build_gemini_contents(history: &[Map<String, Value>], user_message: &str) -> Value {
    let mut contents: Vec<Value> = Vec::new();
    const MAX_MSG_CHARS: usize = 400;

    for msg in history {
        let role = msg.get("role").and_then(|v| v.as_str()).unwrap_or("user");
        let content = msg.get("content").and_then(|v| v.as_str()).unwrap_or("");
        if role == "tool" {
            continue;
        }
        let gemini_role = if role == "assistant" { "model" } else { "user" };
        let text = if content.len() > MAX_MSG_CHARS {
            format!("{}…", &content[..MAX_MSG_CHARS])
        } else {
            content.to_string()
        };
        contents.push(json!({
            "role": gemini_role,
            "parts": [{ "text": text }]
        }));
    }

    contents.push(json!({
        "role": "user",
        "parts": [{ "text": user_message }]
    }));

    json!(contents)
}

fn append_tool_responses(
    contents: &mut Value,
    model_turn: &Value,
    exchanges: &[(String, Value, Value)],
) {
    if exchanges.is_empty() {
        return;
    }
    if let Some(arr) = contents.as_array_mut() {
        arr.push(model_turn.clone());
        let response_parts: Vec<Value> = exchanges
            .iter()
            .map(|(name, _, result)| {
                json!({ "functionResponse": { "name": name, "response": { "result": result } } })
            })
            .collect();
        arr.push(json!({ "role": "user", "parts": response_parts }));
    }
}

fn append_tools_batch(contents: &mut Value, exchanges: &[(String, Value, Value)]) {
    if exchanges.is_empty() {
        return;
    }
    if let Some(arr) = contents.as_array_mut() {
        let call_parts: Vec<Value> = exchanges
            .iter()
            .map(|(name, args, _)| json!({ "functionCall": { "name": name, "args": args } }))
            .collect();
        let response_parts: Vec<Value> = exchanges
            .iter()
            .map(|(name, _, result)| {
                json!({ "functionResponse": { "name": name, "response": { "result": result } } })
            })
            .collect();
        arr.push(json!({ "role": "model", "parts": call_parts }));
        arr.push(json!({ "role": "user", "parts": response_parts }));
    }
}

fn append_tool_exchange(contents: &mut Value, name: &str, args: &Value, result: &Value) {
    append_tools_batch(contents, &[(name.to_string(), args.clone(), result.clone())]);
}

fn try_refresh_personal_context(
    db: &ArrowDatabase,
    api_key: &str,
    model: &str,
    user_message: &str,
    assistant_message: &str,
) -> Result<(), String> {
    if !should_refresh_personal_context(user_message) {
        return Ok(());
    }
    let existing = get_personal_context(db)?;
    let prompt = build_personal_refresh_prompt(&existing, user_message, assistant_message);
    let contents = json!([{
        "role": "user",
        "parts": [{ "text": prompt }]
    }]);
    let response = call_gemini(
        api_key,
        model,
        "Você resume perfil pessoal de forma ultra-concisa.",
        &contents,
        false,
    )?;
    if let Some(text) = response.text {
        let trimmed = text.trim();
        if !trimmed.is_empty() {
            save_personal_context(db, trimmed)?;
        }
    }
    Ok(())
}

pub struct SendMessageResult {
    pub status: String,
    pub text: Option<String>,
    pub tokens_in: i64,
    pub tokens_out: i64,
    pub weekly_usage: Map<String, Value>,
    pub context_stats: ContextStats,
    pub pending_id: Option<String>,
    pub pending_tool: Option<String>,
    pub pending_preview: Option<String>,
    pub affected_queries: Vec<String>,
    pub user_message_id: String,
    pub assistant_message_id: Option<String>,
}

pub struct AiService;

impl AiService {
    pub fn get_context_stats(
        profile: &LocalProfile,
        personal_context: &str,
        history: &[Map<String, Value>],
    ) -> ContextStats {
        estimate_prompt_stats(profile, personal_context, history)
    }

    pub fn send_message(
        db: &ArrowDatabase,
        notes: &NotesStore<'_>,
        user_id: &str,
        profile: &LocalProfile,
        conversation_id: &str,
        message: &str,
        pending_store: &Arc<Mutex<HashMap<String, PendingToolCall>>>,
    ) -> Result<SendMessageResult, String> {
        if message.len() > MAX_USER_MESSAGE_CHARS {
            return Err(format!(
                "Mensagem muito longa (máx {} caracteres)",
                MAX_USER_MESSAGE_CHARS
            ));
        }

        let api_key = db
            .get_setting(GEMINI_API_KEY_SETTING)?
            .ok_or_else(|| "Configure sua chave API Gemini em Configurações".to_string())?;
        let model = resolve_gemini_model(db);
        agent_debug_log(
            "ai.rs:send_message:start",
            "send started",
            json!({
                "model": &model,
                "messageLen": message.len(),
                "keyLen": api_key.len(),
                "conversationId": conversation_id,
            }),
            "A",
        );
        let personal_context = get_personal_context(db)?;
        let system_prompt = build_system_prompt(profile, &personal_context);

        let history = db.list_ai_messages(conversation_id, Some(MAX_HISTORY_MESSAGES))?;
        let history_maps: Vec<Map<String, Value>> = history;

        let user_msg = db.insert_ai_message(conversation_id, "user", message, None, 0, 0)?;
        let user_message_id = user_msg
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let mut contents = build_gemini_contents(&history_maps, message);
        let mut total_in = 0i64;
        let mut total_out = 0i64;
        let mut affected: Vec<String> = Vec::new();
        let mut final_text: Option<String> = None;
        let mut pending_id: Option<String> = None;
        let mut pending_tool: Option<String> = None;
        let mut pending_preview: Option<String> = None;
        let mut last_round_in = 0i64;
        let mut last_round_out = 0i64;

        for round in 0..MAX_TOOL_ROUNDS {
            agent_debug_log(
                "ai.rs:send_message:round_start",
                "gemini round",
                json!({ "round": round }),
                "A",
            );
            let response = match call_gemini(&api_key, &model, &system_prompt, &contents, true) {
                Ok(r) => r,
                Err(e) => {
                    agent_debug_log(
                        "ai.rs:send_message:gemini_err",
                        "gemini call failed",
                        json!({ "round": round, "error": &e }),
                        "C",
                    );
                    return Err(e);
                }
            };
            total_in += response.usage.tokens_in;
            total_out += response.usage.tokens_out;
            last_round_in = response.usage.tokens_in;
            last_round_out = response.usage.tokens_out;

            if !response.function_calls.is_empty() {
                let mut batch: Vec<(String, Value, Value)> = Vec::new();
                let mut seen_tools: std::collections::HashSet<String> = std::collections::HashSet::new();
                for (name, args) in response.function_calls {
                    if is_destructive(&name) {
                        let pid = Uuid::new_v4().to_string();
                        let preview = tool_preview(&name, &args);
                        {
                            let mut store = pending_store.lock().map_err(|e| e.to_string())?;
                            store.insert(
                                pid.clone(),
                                PendingToolCall {
                                    conversation_id: conversation_id.to_string(),
                                    tool_name: name.clone(),
                                    args: args.clone(),
                                    gemini_contents: contents.clone(),
                                    model_turn: response.model_turn.clone(),
                                    total_tokens_in: total_in,
                                    total_tokens_out: total_out,
                                },
                            );
                        }
                        pending_id = Some(pid);
                        pending_tool = Some(name);
                        pending_preview = Some(preview);
                        break;
                    }

                    let dedupe_key = format!("{}:{}", name, args);
                    if !seen_tools.insert(dedupe_key) {
                        continue;
                    }

                    let result = execute_tool(db, notes, user_id, &name, &args)?;
                    agent_debug_log(
                        "ai.rs:send_message:tool_done",
                        "tool executed",
                        json!({ "tool": &name, "round": round }),
                        "B",
                    );
                    for q in tools_affecting_queries(&name) {
                        if !affected.contains(&q.to_string()) {
                            affected.push(q.to_string());
                        }
                    }
                    batch.push((name, args, result));
                }

                if pending_id.is_some() {
                    break;
                }
                if let Some(ref model_turn) = response.model_turn {
                    append_tool_responses(&mut contents, model_turn, &batch);
                } else {
                    append_tools_batch(&mut contents, &batch);
                }
                continue;
            }

            final_text = response.text;
            break;
        }

        if final_text.is_none() && pending_id.is_none() {
            return Err(
                "A IA não conseguiu concluir a resposta. Tente reformular ou enviar novamente."
                    .to_string(),
            );
        }

        let week = current_week_start();
        let weekly = db.increment_token_usage(user_id, &week, total_in, total_out)?;
        let context_stats = stats_from_usage(last_round_in);

        let assistant_message_id = if let Some(ref text) = final_text {
            db.touch_ai_conversation(conversation_id)?;
            let title = if message.len() > 40 {
                format!("{}...", &message[..40])
            } else {
                message.to_string()
            };
            let convs = db.list_ai_conversations(user_id)?;
            if let Some(conv) = convs.iter().find(|c| c.get("id").and_then(|v| v.as_str()) == Some(conversation_id)) {
                if conv.get("title").and_then(|v| v.as_str()) == Some("Nova conversa") {
                    let _ = db.update_ai_conversation_title(conversation_id, &title);
                }
            }
            let msg = db.insert_ai_message(
                conversation_id,
                "assistant",
                text,
                None,
                last_round_in,
                last_round_out,
            )?;
            Some(
                msg.get("id")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string(),
            )
        } else {
            None
        };

        if let Some(ref text) = final_text {
            let _ = try_refresh_personal_context(db, &api_key, &model, message, text);
        }

        agent_debug_log(
            "ai.rs:send_message:done",
            "send completed",
            json!({
                "status": if pending_id.is_some() { "pending" } else { "completed" },
                "totalIn": total_in,
                "totalOut": total_out,
            }),
            "A",
        );

        Ok(SendMessageResult {
            status: if pending_id.is_some() {
                "pending_confirmation".to_string()
            } else {
                "completed".to_string()
            },
            text: final_text,
            tokens_in: total_in,
            tokens_out: total_out,
            weekly_usage: weekly,
            context_stats,
            pending_id,
            pending_tool,
            pending_preview,
            affected_queries: affected,
            user_message_id,
            assistant_message_id,
        })
    }

    pub fn confirm_tool(
        db: &ArrowDatabase,
        notes: &NotesStore<'_>,
        user_id: &str,
        profile: &LocalProfile,
        pending_id: &str,
        confirmed: bool,
        pending_store: &Arc<Mutex<HashMap<String, PendingToolCall>>>,
    ) -> Result<SendMessageResult, String> {
        let pending = {
            let mut store = pending_store.lock().map_err(|e| e.to_string())?;
            store.remove(pending_id).ok_or_else(|| "Ação expirada ou inválida".to_string())?
        };

        if !confirmed {
            let msg = db.insert_ai_message(
                &pending.conversation_id,
                "assistant",
                "Ação cancelada pelo usuário.",
                None,
                0,
                0,
            )?;
            let week = current_week_start();
            let weekly = db.get_token_usage(user_id, &week)?;
            return Ok(SendMessageResult {
                status: "cancelled".to_string(),
                text: Some("Ação cancelada.".to_string()),
                tokens_in: pending.total_tokens_in,
                tokens_out: pending.total_tokens_out,
                weekly_usage: weekly,
                context_stats: ContextStats {
                    snapshot: String::new(),
                    estimated_tokens: 0,
                    char_count: 0,
                    truncated: false,
                },
                pending_id: None,
                pending_tool: None,
                pending_preview: None,
                affected_queries: vec![],
                user_message_id: String::new(),
                assistant_message_id: msg.get("id").and_then(|v| v.as_str()).map(String::from),
            });
        }

        let api_key = db
            .get_setting(GEMINI_API_KEY_SETTING)?
            .ok_or_else(|| "Chave API não configurada".to_string())?;
        let model = resolve_gemini_model(db);
        let personal_context = get_personal_context(db)?;
        let system_prompt = build_system_prompt(profile, &personal_context);

        let result = execute_tool(db, notes, user_id, &pending.tool_name, &pending.args)?;
        let mut affected: Vec<String> = tools_affecting_queries(&pending.tool_name)
            .into_iter()
            .map(String::from)
            .collect();

        let mut contents = pending.gemini_contents;
        if let Some(ref model_turn) = pending.model_turn {
            append_tool_responses(
                &mut contents,
                model_turn,
                &[(
                    pending.tool_name.clone(),
                    pending.args.clone(),
                    result.clone(),
                )],
            );
        } else {
            append_tool_exchange(&mut contents, &pending.tool_name, &pending.args, &result);
        }

        let mut total_in = pending.total_tokens_in;
        let mut total_out = pending.total_tokens_out;
        let mut final_text: Option<String> = None;

        for _round in 0..MAX_TOOL_ROUNDS {
            let response = call_gemini(&api_key, &model, &system_prompt, &contents, true)?;
            total_in += response.usage.tokens_in;
            total_out += response.usage.tokens_out;

            if !response.function_calls.is_empty() {
                let mut batch: Vec<(String, Value, Value)> = Vec::new();
                for (name, args) in response.function_calls {
                    if is_destructive(&name) {
                        return Err("Ação destrutiva adicional requer nova confirmação".to_string());
                    }
                    let r = execute_tool(db, notes, user_id, &name, &args)?;
                    for q in tools_affecting_queries(&name) {
                        if !affected.contains(&q.to_string()) {
                            affected.push(q.to_string());
                        }
                    }
                    batch.push((name, args, r));
                }
                if let Some(ref model_turn) = response.model_turn {
                    append_tool_responses(&mut contents, model_turn, &batch);
                } else {
                    append_tools_batch(&mut contents, &batch);
                }
                continue;
            }
            final_text = response.text;
            break;
        }

        let week = current_week_start();
        let weekly = db.increment_token_usage(user_id, &week, total_in, total_out)?;

        let text = final_text.unwrap_or_else(|| "Ação concluída.".to_string());
        let msg = db.insert_ai_message(
            &pending.conversation_id,
            "assistant",
            &text,
            None,
            total_in,
            total_out,
        )?;
        db.touch_ai_conversation(&pending.conversation_id)?;

        Ok(SendMessageResult {
            status: "completed".to_string(),
            text: Some(text),
            tokens_in: total_in,
            tokens_out: total_out,
            weekly_usage: weekly,
            context_stats: stats_from_usage(total_in),
            pending_id: None,
            pending_tool: None,
            pending_preview: None,
            affected_queries: affected,
            user_message_id: String::new(),
            assistant_message_id: msg.get("id").and_then(|v| v.as_str()).map(String::from),
        })
    }
}

pub fn estimate_message_tokens(message: &str) -> usize {
    estimate_tokens(message)
}

pub const MAX_CONTEXT_TOKEN_BUDGET: usize = 30_000;
