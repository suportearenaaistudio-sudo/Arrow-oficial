import { getVersion } from '@tauri-apps/api/app';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { toast } from 'sonner';
import { isDesktop } from '@/lib/platform';

export interface UpdateCheckResult {
  status: 'disabled' | 'up-to-date' | 'available' | 'error';
  currentVersion?: string;
  update?: Update;
  error?: string;
}

export async function getAppVersion(): Promise<string> {
  if (!isDesktop()) return import.meta.env.VITE_APP_VERSION ?? '0.0.0';
  try {
    return await getVersion();
  } catch {
    return import.meta.env.VITE_APP_VERSION ?? '0.0.0';
  }
}

export async function checkForAppUpdates(options?: {
  silent?: boolean;
}): Promise<UpdateCheckResult> {
  if (!isDesktop() || import.meta.env.DEV) {
    return { status: 'disabled' };
  }

  const currentVersion = await getAppVersion();

  try {
    const update = await check();

    if (!update?.available) {
      if (!options?.silent) {
        toast.info('Você já está na versão mais recente.', {
          description: `Arrow v${currentVersion}`,
        });
      }
      return { status: 'up-to-date', currentVersion };
    }

    if (options?.silent) {
      promptInstallUpdate(update, currentVersion);
    } else {
      promptInstallUpdate(update, currentVersion);
    }

    return { status: 'available', currentVersion, update };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    if (!options?.silent) {
      toast.error('Não foi possível verificar atualizações.', { description: message });
    }
    return { status: 'error', currentVersion, error: message };
  }
}

function promptInstallUpdate(update: Update, currentVersion: string) {
  const notes = update.body?.trim();
  toast('Atualização disponível', {
    description: notes
      ? `v${currentVersion} → v${update.version}\n${notes}`
      : `v${currentVersion} → v${update.version}`,
    duration: 120_000,
    action: {
      label: 'Atualizar',
      onClick: () => {
        void installUpdate(update);
      },
    },
    cancel: {
      label: 'Depois',
      onClick: () => undefined,
    },
  });
}

export async function installUpdate(update: Update) {
  const progress = toast.loading('Baixando atualização...');
  let downloaded = 0;
  let total = 0;

  try {
    await update.downloadAndInstall((event) => {
      if (event.event === 'Started') {
        downloaded = 0;
        total = event.data.contentLength ?? 0;
      }
      if (event.event === 'Progress') {
        downloaded += event.data.chunkLength;
        if (total > 0) {
          const pct = Math.min(100, Math.round((downloaded / total) * 100));
          toast.loading(`Baixando atualização... ${pct}%`, { id: progress });
        }
      }
    });

    toast.success('Atualização instalada. Reiniciando...', { id: progress });
    await relaunch();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    toast.error('Falha ao instalar atualização.', { id: progress, description: message });
    throw error;
  }
}
