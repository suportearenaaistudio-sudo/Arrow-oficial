export const MAX_USER_MESSAGE_CHARS = 8000;
export const MAX_CONTEXT_TOKEN_BUDGET = 30000;
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export const GEMINI_MODEL_PRESETS = [
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
] as const;

/** Nome curto para exibição na barra (estilo Cursor: "2.5 Flash"). */
export function formatModelLabel(modelId: string): string {
  const short = modelId.replace(/^gemini-/, '');
  return short
    .split('-')
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ');
}

export function formatTokenCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
