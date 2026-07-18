import { LIST_THEMES } from '@/lib/list-themes';
import type { MediaListType } from '@/types/arrow';

export function accentForMediaType(mediaType: MediaListType): string {
  if (mediaType === 'custom') return LIST_THEMES.custom.accent;
  return LIST_THEMES[mediaType]?.accent ?? LIST_THEMES.custom.accent;
}

export const RELEASE_STATUS_META = {
  upcoming: { label: 'Em breve', color: '#3b82f6' },
  released: { label: 'Lançado', color: '#22c55e' },
  cancelled: { label: 'Cancelado', color: '#94a3b8' },
} as const;
