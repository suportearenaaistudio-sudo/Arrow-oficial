/** Tipos compartilhados entre Tauri e renderer */

export interface VaultStatus {
  isOpen: boolean;
  vaultPath: string | null;
  profile: unknown | null;
  lastVaultPath: string | null;
}
