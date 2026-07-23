use crate::db::ArrowDatabase;

pub const AI_PERSONAL_CONTEXT_KEY: &str = "ai_personal_context";
pub const MAX_PERSONAL_CONTEXT_CHARS: usize = 500;

pub fn get_personal_context(db: &ArrowDatabase) -> Result<String, String> {
    Ok(db.get_setting(AI_PERSONAL_CONTEXT_KEY)?.unwrap_or_default())
}

pub fn save_personal_context(db: &ArrowDatabase, context: &str) -> Result<(), String> {
    let trimmed: String = context.chars().take(MAX_PERSONAL_CONTEXT_CHARS).collect();
    db.set_setting(AI_PERSONAL_CONTEXT_KEY, trimmed.trim())
}

pub fn should_refresh_personal_context(user_message: &str) -> bool {
    let lower = user_message.to_lowercase();
    [
        "gosto",
        "prefiro",
        "não gosto",
        "nao gosto",
        "me chamo",
        "me sinto",
        "sinto ",
        "triste",
        "feliz",
        "ansios",
        "trabalho",
        "hobby",
        "adoro",
        "odeio",
        "sobre mim",
        "minha vida",
        "meu nome",
        "emoç",
        "humor",
    ]
    .iter()
    .any(|k| lower.contains(k))
}

pub fn build_personal_refresh_prompt(
    existing: &str,
    user_message: &str,
    assistant_message: &str,
) -> String {
    let assistant_snip: String = assistant_message.chars().take(280).collect();
    let user_snip: String = user_message.chars().take(280).collect();
    format!(
        "Atualize o perfil pessoal do usuário (máx 400 caracteres, bullets curtos em português).\n\
         Inclua só fatos pessoais estáveis: nome, humor, gostos, situação, preferências.\n\
         Remova redundância. Não inclua tarefas/metas.\n\n\
         Perfil atual:\n{}\n\n\
         Nova troca:\nUsuário: {}\nAssistente: {}\n\n\
         Responda APENAS o perfil atualizado.",
        if existing.is_empty() {
            "(vazio)"
        } else {
            existing
        },
        user_snip,
        assistant_snip,
    )
}
