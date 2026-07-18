/** Pré-processa wikilinks para Markdown antes do react-markdown */
export function preprocessWikilinks(content: string): string {
  return content.replace(
    /(!?)\[\[([^\]]+)\]\]/g,
    (_match, embed: string, inner: string) => {
      const [title, alias] = inner.split('|').map((s) => s.trim());
      const display = alias || title;
      const prefix = embed === '!' ? '!' : '';
      return `${prefix}[${display}](wikilink:${encodeURIComponent(title)})`;
    },
  );
}

export function isWikilinkHref(href?: string): string | null {
  if (!href?.startsWith('wikilink:')) return null;
  return decodeURIComponent(href.slice('wikilink:'.length));
}
