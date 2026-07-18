use crate::notes::NoteFileMeta;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LinkType {
    Wikilink,
    Embed,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RawLink {
    pub target_title: String,
    pub alias: Option<String>,
    pub link_type: LinkType,
}

pub fn normalize_title(title: &str) -> String {
    title.trim().to_lowercase()
}

pub fn slugify_title(title: &str) -> String {
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

/// Extrai wikilinks `[[Title]]`, `[[Title|alias]]` e embeds `![[Title]]`.
/// Ignora blocos de código cercados por ```.
pub fn extract_links(content: &str) -> Vec<RawLink> {
    let mut links = Vec::new();
    let mut in_code_fence = false;

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("```") {
            in_code_fence = !in_code_fence;
            continue;
        }
        if in_code_fence {
            continue;
        }
        links.extend(extract_links_from_line(line));
    }
    links
}

fn extract_links_from_line(line: &str) -> Vec<RawLink> {
    let mut links = Vec::new();
    let bytes = line.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        let embed = i + 3 <= bytes.len()
            && bytes[i] == b'!'
            && bytes[i + 1] == b'['
            && bytes[i + 2] == b'[';
        let wiki = !embed && i + 2 <= bytes.len() && bytes[i] == b'[' && bytes[i + 1] == b'[';
        if embed || wiki {
            let start = i + if embed { 3 } else { 2 };
            if let Some((inner, end)) = read_link_inner(&line[start..]) {
                let (target, alias) = parse_inner(&inner);
                if !target.trim().is_empty() {
                    links.push(RawLink {
                        target_title: target.trim().to_string(),
                        alias,
                        link_type: if embed {
                            LinkType::Embed
                        } else {
                            LinkType::Wikilink
                        },
                    });
                }
                i = start + end;
                continue;
            }
        }
        i += 1;
    }
    links
}

fn read_link_inner(rest: &str) -> Option<(String, usize)> {
    let mut depth = 2usize;
    let mut out = String::new();

    for (idx, c) in rest.char_indices() {
        if c == '[' {
            depth += 1;
            out.push(c);
        } else if c == ']' {
            depth = depth.saturating_sub(1);
            if depth == 0 {
                return Some((out, idx + c.len_utf8()));
            }
            if depth >= 2 {
                out.push(c);
            }
        } else {
            out.push(c);
        }
    }
    None
}

fn parse_inner(inner: &str) -> (String, Option<String>) {
    if let Some(idx) = inner.find('|') {
        let (left, right) = inner.split_at(idx);
        (
            left.trim().to_string(),
            Some(right[1..].trim().to_string()).filter(|s| !s.is_empty()),
        )
    } else {
        (inner.trim().to_string(), None)
    }
}

pub fn resolve_title(title: &str, notes: &[NoteFileMeta]) -> Option<String> {
    let norm = normalize_title(title);
    let slug = slugify_title(title);

    if let Some(note) = notes.iter().find(|n| normalize_title(&n.title) == norm) {
        return Some(note.id.clone());
    }
    if let Some(note) = notes
        .iter()
        .find(|n| slugify_title(&n.title) == slug)
    {
        return Some(note.id.clone());
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_wikilinks_and_embeds() {
        let content = "Veja [[Nota A]] e ![[Embed B]] e [[C|alias]]";
        let links = extract_links(content);
        assert_eq!(links.len(), 3);
        assert_eq!(links[0].target_title, "Nota A");
        assert_eq!(links[2].alias.as_deref(), Some("alias"));
    }

    #[test]
    fn ignores_code_blocks() {
        let content = "```\n[[ignored]]\n```\n[[ok]]";
        let links = extract_links(content);
        assert_eq!(links.len(), 1);
        assert_eq!(links[0].target_title, "ok");
    }
}
