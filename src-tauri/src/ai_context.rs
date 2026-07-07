use serde_json::{Map, Value};

use crate::types::LocalProfile;

pub const MAX_CONTEXT_CHARS: usize = 120_000;
/// Overhead estimado das declarações de ferramentas no prompt (chars).
const TOOLS_DECLARATION_CHARS: usize = 2_200;

pub struct ContextStats {
    pub snapshot: String,
    pub estimated_tokens: usize,
    pub char_count: usize,
    pub truncated: bool,
}

pub fn estimate_tokens(text: &str) -> usize {
    (text.len() + 3) / 4
}

pub fn build_system_prompt(profile: &LocalProfile, personal_context: &str) -> String {
    let personal_block = if personal_context.trim().is_empty() {
        String::new()
    } else {
        format!(
            "\n\nContexto pessoal (use em perguntas pessoais/emocionais, não invente além disso):\n{}",
            personal_context.trim()
        )
    };
    format!(
        r#"Você é o Assistente Arrow, coach de produtividade (método 12 Semanas). Responda em português brasileiro.
Usuário: {name}.{personal_block}

Dados do app NÃO estão no prompt — use ferramentas só quando o usuário pedir tarefas/metas/finanças.
- Saudações ou conversa pessoal/emocional: resposta empática e curta, SEM ferramentas.
- Pedidos de dados: chame list_tasks, list_goals, etc. (uma ferramenta por vez quando possível).

Formatação:
- Use ### com emoji: ### ✅ Tarefas, ### 🎯 Metas, ### 💰 Finanças, ### 📋 Resumo
- Listas com marcadores e **negrito** nos rótulos
- Máximo 2 parágrafos introdutórios"#,
        name = profile.name,
        personal_block = personal_block,
    )
}

pub fn estimate_prompt_stats(
    profile: &LocalProfile,
    personal_context: &str,
    history: &[Map<String, Value>],
) -> ContextStats {
    let system = build_system_prompt(profile, personal_context);
    let mut history_chars = 0usize;
    for msg in history {
        let role = msg.get("role").and_then(|v| v.as_str()).unwrap_or("");
        if role == "tool" {
            continue;
        }
        if let Some(c) = msg.get("content").and_then(|v| v.as_str()) {
            history_chars += c.len();
        }
    }
    let char_count = system.len() + history_chars + TOOLS_DECLARATION_CHARS;
    let estimated_tokens = estimate_tokens(&" ".repeat(char_count));
    ContextStats {
        snapshot: String::new(),
        estimated_tokens,
        char_count,
        truncated: false,
    }
}

pub fn stats_from_usage(tokens_in: i64) -> ContextStats {
    let t = tokens_in.max(0) as usize;
    ContextStats {
        snapshot: String::new(),
        estimated_tokens: t,
        char_count: t * 4,
        truncated: false,
    }
}
