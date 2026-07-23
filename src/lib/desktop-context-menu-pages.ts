export const DESKTOP_CONTEXT_PAGE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/vision': 'Visão',
  '/planning': 'Planejamento',
  '/cycles': 'Ciclos',
  '/goals': 'Metas',
  '/tasks': 'Tarefas',
  '/pomodoro': 'Pomodoro',
  '/habits': 'Hábitos',
  '/workouts': 'Treinos',
  '/lists': 'Listas',
  '/finances': 'Finanças',
  '/notes': 'Notas',
  '/analysis': 'Análise',
  '/assistant': 'Assistente',
  '/settings': 'Configurações',
};

export function getDesktopContextPageLabel(pathname: string): string | null {
  if (DESKTOP_CONTEXT_PAGE_LABELS[pathname]) {
    return DESKTOP_CONTEXT_PAGE_LABELS[pathname];
  }
  if (pathname.startsWith('/notes/')) return 'Notas';
  if (pathname.startsWith('/goal-detail/')) return 'Meta';
  return null;
}
