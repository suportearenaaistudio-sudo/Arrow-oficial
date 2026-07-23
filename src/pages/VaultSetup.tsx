import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, FolderOpen, FolderPlus, Loader2, AlertCircle, HardDrive } from 'lucide-react';
import { useVault } from '@/contexts/VaultContext';
import { AuthStarfield } from '@/components/ui/AuthStarfield';
import WindowControls from '@/components/layout/WindowControls';
import { isWindowsDesktop } from '@/lib/platform';

export default function VaultSetup() {
  const { isReady, loading, isDesktopApp, pickAndCreateVault, pickAndOpenVault } = useVault();
  const [mode, setMode] = useState<'choose' | 'create'>('choose');
  const [profileName, setProfileName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isWindowsApp = isWindowsDesktop();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="arrow-spinner" />
      </div>
    );
  }

  if (isReady) return <Navigate to="/" replace />;

  if (!isDesktopApp) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <Compass className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Arrow Desktop</h1>
          <p className="text-gray-400 text-sm">
            Este app roda como aplicativo nativo. Execute <code className="text-orange-400">npm run dev:desktop</code> para abrir no Tauri.
          </p>
          <p className="text-gray-500 text-xs mt-3">
            Vaults do Arrow 1 (Electron) não são compatíveis. Crie um novo vault v2.
          </p>
        </div>
      </div>
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profileName.trim()) { setError('Digite seu nome.'); return; }
    setError('');
    setSubmitting(true);
    const result = await pickAndCreateVault(profileName.trim());
    setSubmitting(false);
    if (result.error) setError(result.error);
  }

  async function handleOpen() {
    setError('');
    setSubmitting(true);
    const result = await pickAndOpenVault();
    setSubmitting(false);
    if (result.error) setError(result.error);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden flex items-center justify-center p-6">
      {isWindowsApp && (
        <div className="fixed top-0 left-0 right-0 h-9 z-[100] flex items-center justify-end px-2 pointer-events-none">
          <div className="pointer-events-auto" data-tauri-drag-region={false}>
            <WindowControls />
          </div>
        </div>
      )}
      <AuthStarfield />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Bem-vindo ao Arrow</h1>
          <p className="text-gray-400 text-sm">
            Seus dados ficam em uma pasta no seu Mac — como no Obsidian. Copie a pasta para outro dispositivo e aponte o app para ela.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm mb-4 bg-red-500/10 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {mode === 'choose' ? (
            <div className="space-y-3">
              <button
                onClick={() => setMode('create')}
                disabled={submitting}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all text-left group"
              >
                <div className="w-11 h-11 rounded-xl bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                  <FolderPlus className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Criar novo vault</p>
                  <p className="text-xs text-gray-500 mt-0.5">Escolha uma pasta e crie seu perfil local</p>
                </div>
              </button>

              <button
                onClick={handleOpen}
                disabled={submitting}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-left group"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  {submitting ? <Loader2 className="w-5 h-5 text-blue-400 animate-spin" /> : <FolderOpen className="w-5 h-5 text-blue-400" />}
                </div>
                <div>
                  <p className="font-semibold text-white">Abrir vault existente</p>
                  <p className="text-xs text-gray-500 mt-0.5">Aponte para uma pasta Arrow que você já tem</p>
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Seu nome</label>
                <input
                  type="text"
                  autoFocus
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Como você quer ser chamado?"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>

              <div className="flex items-start gap-2 text-xs text-gray-500 bg-white/5 rounded-xl p-3">
                <HardDrive className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>Na próxima etapa você escolhe onde salvar o vault. Recomendamos <strong className="text-gray-400">Documentos/Arrow</strong> ou uma pasta sincronizada (iCloud, Dropbox).</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('choose')}
                  className="flex-1 py-3 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-blue-600 text-white flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Escolher pasta'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-gray-600 mt-6">
          Estrutura do vault: <code className="text-gray-500">.arrow/</code> · <code className="text-gray-500">notes/</code> · <code className="text-gray-500">attachments/</code>
        </p>
      </motion.div>
    </div>
  );
}
