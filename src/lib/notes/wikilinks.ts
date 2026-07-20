/** Pré-processa wikilinks para Markdown antes do react-markdown */
export function preprocessWikilinks(content: string): string {
  let out = content.replace(
    /(!?)\[\[([^\]]+)\]\]/g,
    (_match, embed: string, inner: string) => {
      const [title, alias] = inner.split('|').map((s) => s.trim());
      const display = alias || title;
      const prefix = embed === '!' ? '!' : '';
      return `${prefix}[${display}](wikilink:${encodeURIComponent(title)})`;
    },
  );

  // Fallback visual: /Título com espaços → wikilink no preview
  out = out.replace(
    /(^|[\s(])\/([^\s\[\]/][^\n]*?)(?=[\s.,;:!?)\]]|$)/g,
    (_match, prefix: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed || trimmed.startsWith('http')) return _match;
      return `${prefix}[${trimmed}](wikilink:${encodeURIComponent(trimmed)})`;
    },
  );

  return out;
}

export function isWikilinkHref(href?: string): string | null {
  if (!href?.startsWith('wikilink:')) return null;
  return decodeURIComponent(href.slice('wikilink:'.length));
}
