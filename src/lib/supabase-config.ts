export function getSupabaseProjectRef(): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const match = url?.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? "";
}

export function getSupabaseAuthStorageKey(): string {
  return `sb-${getSupabaseProjectRef()}-auth-token`;
}
