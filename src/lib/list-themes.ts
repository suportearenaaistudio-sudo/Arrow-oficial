import type { LucideIcon } from 'lucide-react';
import {
  Clapperboard, Tv, Sword, Popcorn, Gamepad2, Trophy, BookOpen, List,
} from 'lucide-react';
import type { MediaListType } from '@/types/arrow';

export interface ListTheme {
  label: string;
  icon: LucideIcon;
  accent: string;
  accentLight: string;
  gradient: string;
  headerPattern: string;
  columnTop: string;
  columnVisto: string;
  columnAVer: string;
  subtitlePlaceholder: string;
}

export const LIST_THEMES: Record<MediaListType, ListTheme> = {
  filmes: {
    label: 'Filmes',
    icon: Clapperboard,
    accent: '#ef4444',
    accentLight: 'rgba(239,68,68,0.10)',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)',
    headerPattern: 'radial-gradient(circle at 20% 50%, rgba(239,68,68,0.15) 0%, transparent 50%)',
    columnTop: 'linear-gradient(180deg, rgba(239,68,68,0.08) 0%, transparent 100%)',
    columnVisto: 'linear-gradient(180deg, rgba(245,158,11,0.06) 0%, transparent 100%)',
    columnAVer: 'linear-gradient(180deg, rgba(239,68,68,0.04) 0%, transparent 100%)',
    subtitlePlaceholder: 'Ano, diretor, gênero…',
  },
  series: {
    label: 'Séries',
    icon: Tv,
    accent: '#8b5cf6',
    accentLight: 'rgba(139,92,246,0.10)',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
    headerPattern: 'radial-gradient(circle at 80% 20%, rgba(139,92,246,0.15) 0%, transparent 50%)',
    columnTop: 'linear-gradient(180deg, rgba(139,92,246,0.08) 0%, transparent 100%)',
    columnVisto: 'linear-gradient(180deg, rgba(59,130,246,0.06) 0%, transparent 100%)',
    columnAVer: 'linear-gradient(180deg, rgba(139,92,246,0.04) 0%, transparent 100%)',
    subtitlePlaceholder: 'Temporadas, plataforma…',
  },
  animes: {
    label: 'Animes',
    icon: Sword,
    accent: '#e11d48',
    accentLight: 'rgba(225,29,72,0.10)',
    gradient: 'linear-gradient(135deg, #e11d48 0%, #a855f7 100%)',
    headerPattern: 'radial-gradient(circle at 50% 0%, rgba(225,29,72,0.12) 0%, transparent 60%)',
    columnTop: 'linear-gradient(180deg, rgba(225,29,72,0.08) 0%, transparent 100%)',
    columnVisto: 'linear-gradient(180deg, rgba(168,85,247,0.06) 0%, transparent 100%)',
    columnAVer: 'linear-gradient(180deg, rgba(225,29,72,0.04) 0%, transparent 100%)',
    subtitlePlaceholder: 'Episódios, estúdio, gênero…',
  },
  animacao: {
    label: 'Animação',
    icon: Popcorn,
    accent: '#f97316',
    accentLight: 'rgba(249,115,22,0.10)',
    gradient: 'linear-gradient(135deg, #f97316 0%, #facc15 100%)',
    headerPattern: 'radial-gradient(circle at 30% 80%, rgba(249,115,22,0.12) 0%, transparent 50%)',
    columnTop: 'linear-gradient(180deg, rgba(249,115,22,0.08) 0%, transparent 100%)',
    columnVisto: 'linear-gradient(180deg, rgba(250,204,21,0.06) 0%, transparent 100%)',
    columnAVer: 'linear-gradient(180deg, rgba(249,115,22,0.04) 0%, transparent 100%)',
    subtitlePlaceholder: 'Estúdio, ano, dublagem…',
  },
  jogos: {
    label: 'Jogos',
    icon: Gamepad2,
    accent: '#10b981',
    accentLight: 'rgba(16,185,129,0.10)',
    gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
    headerPattern: 'radial-gradient(circle at 70% 50%, rgba(16,185,129,0.12) 0%, transparent 50%)',
    columnTop: 'linear-gradient(180deg, rgba(16,185,129,0.08) 0%, transparent 100%)',
    columnVisto: 'linear-gradient(180deg, rgba(6,182,212,0.06) 0%, transparent 100%)',
    columnAVer: 'linear-gradient(180deg, rgba(16,185,129,0.04) 0%, transparent 100%)',
    subtitlePlaceholder: 'Plataforma, gênero, horas…',
  },
  esportes: {
    label: 'Esportes',
    icon: Trophy,
    accent: '#3b82f6',
    accentLight: 'rgba(59,130,246,0.10)',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #22c55e 100%)',
    headerPattern: 'radial-gradient(circle at 60% 40%, rgba(59,130,246,0.12) 0%, transparent 50%)',
    columnTop: 'linear-gradient(180deg, rgba(59,130,246,0.08) 0%, transparent 100%)',
    columnVisto: 'linear-gradient(180deg, rgba(34,197,94,0.06) 0%, transparent 100%)',
    columnAVer: 'linear-gradient(180deg, rgba(59,130,246,0.04) 0%, transparent 100%)',
    subtitlePlaceholder: 'Competição, time, data…',
  },
  livros: {
    label: 'Livros',
    icon: BookOpen,
    accent: '#d97706',
    accentLight: 'rgba(217,119,6,0.10)',
    gradient: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
    headerPattern: 'radial-gradient(circle at 40% 60%, rgba(217,119,6,0.12) 0%, transparent 50%)',
    columnTop: 'linear-gradient(180deg, rgba(217,119,6,0.08) 0%, transparent 100%)',
    columnVisto: 'linear-gradient(180deg, rgba(146,64,14,0.06) 0%, transparent 100%)',
    columnAVer: 'linear-gradient(180deg, rgba(217,119,6,0.04) 0%, transparent 100%)',
    subtitlePlaceholder: 'Autor, páginas, editora…',
  },
  custom: {
    label: 'Personalizada',
    icon: List,
    accent: 'var(--arrow-accent)',
    accentLight: 'var(--arrow-accent-light)',
    gradient: 'linear-gradient(135deg, var(--arrow-gradient-from), var(--arrow-gradient-to))',
    headerPattern: 'none',
    columnTop: 'linear-gradient(180deg, var(--arrow-accent-light) 0%, transparent 100%)',
    columnVisto: 'linear-gradient(180deg, rgba(128,128,128,0.04) 0%, transparent 100%)',
    columnAVer: 'linear-gradient(180deg, rgba(128,128,128,0.02) 0%, transparent 100%)',
    subtitlePlaceholder: 'Detalhes, ano, autor…',
  },
};

export const SYSTEM_LIST_TYPES: MediaListType[] = [
  'filmes', 'series', 'animes', 'animacao', 'jogos', 'esportes', 'livros',
];

export const STATUS_META: Record<string, { label: string; description: string }> = {
  top: { label: 'Top', description: 'Seus favoritos — o pódio' },
  visto: { label: 'Visto', description: 'Já consumiu, mas não entra no top' },
  a_ver: { label: 'A Ver', description: 'Na sua wishlist' },
};
