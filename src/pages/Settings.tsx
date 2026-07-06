import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Download, Trash2, LogOut, Shield, Globe, Palette, Check, Sun, Moon, Stars, Camera, Loader2, CloudRain, Volume2, Volume1, Volume, VolumeX } from 'lucide-react';
import { useVault } from '@/contexts/VaultContext';
import { useTheme, THEMES, ThemeId } from '@/contexts/ThemeContext';
import { useNotification } from '@/hooks/useNotification';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const themeIcons: Record<ThemeId, React.ReactNode> = {
  aurora: <Sun className="w-3.5 h-3.5" />,
  crimson: <Sun className="w-3.5 h-3.5" />,
  ocean: <Sun className="w-3.5 h-3.5" />,
  rose: <Sun className="w-3.5 h-3.5" />,
  cosmos: <Stars className="w-3.5 h-3.5" />,
  midnight: <Moon className="w-3.5 h-3.5" />,
  sunset: <Moon className="w-3.5 h-3.5" />,
  lavender: <Moon className="w-3.5 h-3.5" />,
  monochrome: <Moon className="w-3.5 h-3.5" />,
  rain: <CloudRain className="w-3.5 h-3.5" />,
  tempestade: <CloudRain className="w-3.5 h-3.5" />,
  chuvisco: <CloudRain className="w-3.5 h-3.5" />,
};

import { useState, useRef } from 'react';
import AvatarCropper from '@/components/ui/AvatarCropper';
import { useRainSound, RainIntensity } from '@/contexts/RainSoundContext';
import { useVisualQuality } from '@/contexts/VisualQualityContext';
import type { VisualQuality } from '@/lib/platform';

export default function Settings() {
  const { profile, updateProfile, closeVault, vaultPath, saveAvatar } = useVault();
  const { theme, themeId, setTheme, isDark } = useTheme();
  const { showSuccess, showInfo, showError } = useNotification();
  const { intensity: rainIntensity, setIntensity: setRainIntensity, isPlaying: rainIsPlaying } = useRainSound();
  const { quality: visualQuality, setQuality: setVisualQuality } = useVisualQuality();

  const visualQualityOptions: { id: VisualQuality; label: string; desc: string }[] = [
    { id: 'alta', label: 'Alta', desc: 'Efeitos completos otimizados' },
    { id: 'balanceada', label: 'Balanceada', desc: 'Mesmos efeitos, menor taxa de atualização' },
    { id: 'economia', label: 'Economia', desc: 'Sem starfield/chuva (bateria)' },
  ];

  const [editName, setEditName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const themeList = Object.values(THEMES);

  async function handleSaveProfile() {
    if (!editName.trim()) return;
    setSaving(true);
    const result = await updateProfile({ full_name: editName.trim() });
    setSaving(false);
    if (result.error) {
      showError('Erro ao salvar perfil');
    } else {
      showSuccess('Perfil atualizado!');
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      showError('Selecione uma imagem');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showError('Imagem muito grande (max 10MB)');
      return;
    }
    // Open cropper
    setCropFile(file);
  }

  async function handleCropped(blob: Blob) {
    setCropFile(null);
    setUploading(true);
    const result = await saveAvatar(blob);
    setUploading(false);
    if (result.error) {
      showError(result.error);
    } else {
      showSuccess('Foto atualizada!');
    }
  }

  const initials = (profile?.full_name || 'U').slice(0, 2).toUpperCase();

  return (
    <>
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-3xl">
      <h1 className="text-2xl font-bold arrow-gradient-text mb-1">Configuracoes</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--arrow-text-secondary)' }}>Personalize sua experiencia no Arrow</p>

      {/* Profile */}
      <div className="arrow-card p-6 mb-4">
        <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--arrow-text-primary)' }}>
          <User className="w-5 h-5" style={{ color: 'var(--arrow-accent)' }} /> Perfil
        </h3>

        <div className="flex items-start gap-5">
          {/* Avatar with upload */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="group relative w-20 h-20 rounded-2xl overflow-hidden cursor-pointer"
              disabled={uploading}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`, color: isDark ? '#0B0B0B' : 'white' }}>
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <p className="text-[10px] text-center mt-1.5" style={{ color: 'var(--arrow-text-muted)' }}>Clique para alterar</p>
          </div>

          {/* Name + Email */}
          <div className="flex-1 space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--arrow-text-muted)' }}>Nome</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'var(--arrow-bg-card)',
                  border: '1px solid var(--arrow-border)',
                  color: 'var(--arrow-text-primary)',
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--arrow-text-muted)' }}>Vault</label>
              <p className="text-sm px-3 py-2 break-all" style={{ color: 'var(--arrow-text-secondary)' }}>{vaultPath || '—'}</p>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving || editName.trim() === (profile?.full_name || '')}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{
                background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                color: isDark ? '#0B0B0B' : 'white',
              }}
            >
              {saving ? 'Salvando...' : 'Salvar Perfil'}
            </button>
          </div>
        </div>
      </div>

      {/* Themes */}
      <div className="arrow-card p-6 mb-4">
        <h3 className="font-semibold flex items-center gap-2 mb-2" style={{ color: 'var(--arrow-text-primary)' }}>
          <Palette className="w-5 h-5" style={{ color: 'var(--arrow-accent)' }} /> Tema Visual
        </h3>
        <p className="text-xs mb-4" style={{ color: 'var(--arrow-text-muted)' }}>4 temas claros, 5 escuros e 3 especiais com efeito de chuva.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {themeList.map((t) => {
            const isActive = t.id === themeId;
            return (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setTheme(t.id); showSuccess(`Tema "${t.name}" aplicado`); }}
                className="relative p-3 rounded-xl transition-all duration-300 text-left"
                style={{
                  border: isActive ? `2px solid ${t.accent}` : `2px solid var(--arrow-border)`,
                  background: isActive ? t.accentLight : 'transparent',
                  boxShadow: isActive ? `0 0 20px ${t.accentLight}` : 'none',
                }}
              >
                {/* Preview */}
                <div className="h-16 rounded-lg mb-2 overflow-hidden relative" style={{ background: t.bg }}>
                  {t.hasStarfield && (
                    <div className="absolute inset-0">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="absolute w-0.5 h-0.5 rounded-full" style={{
                          background: 'rgba(215,230,255,0.5)',
                          top: `${(i * 31 + 7) % 90}%`,
                          left: `${(i * 47 + 13) % 90}%`,
                        }} />
                      ))}
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 right-2 h-1.5 rounded-full" style={{
                    background: `linear-gradient(90deg, ${t.gradientFrom}, ${t.gradientTo})`
                  }} />
                  <div className="absolute top-2 left-2 w-3 h-12 rounded" style={{ background: t.bgSidebar }} />
                  <div className="absolute top-2 left-7 right-2 h-4 rounded" style={{ background: t.bgCard }} />
                  <div className="absolute top-7 left-7 right-4 h-3 rounded" style={{ background: t.bgCard }} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--arrow-text-primary)' }}>
                      {themeIcons[t.id]}
                      {t.name}
                    </p>
                    <p className="text-[9px] mt-0.5" style={{ color: 'var(--arrow-text-muted)' }}>
                      {t.isDark ? 'Escuro' : 'Claro'}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: t.accent }}>
                      <Check className="w-3 h-3" style={{ color: t.isDark ? '#0B0B0B' : 'white' }} />
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Visual quality */}
      <div className="arrow-card p-6 mb-4">
        <h3 className="font-semibold flex items-center gap-2 mb-2" style={{ color: 'var(--arrow-text-primary)' }}>
          <Stars className="w-5 h-5" style={{ color: 'var(--arrow-accent)' }} /> Qualidade Visual
        </h3>
        <p className="text-xs mb-4" style={{ color: 'var(--arrow-text-muted)' }}>
          Ajuste o nível de efeitos animados. Alta é o padrão recomendado.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {visualQualityOptions.map((opt) => {
            const isActive = visualQuality === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setVisualQuality(opt.id);
                  showSuccess(`Qualidade "${opt.label}" aplicada`);
                }}
                className="relative p-4 rounded-2xl text-left transition-all duration-200"
                style={{
                  background: isActive ? 'var(--arrow-accent-light)' : 'var(--arrow-bg-card)',
                  border: `2px solid ${isActive ? 'var(--arrow-accent)' : 'var(--arrow-border)'}`,
                }}
              >
                <p className="text-xs font-semibold" style={{ color: 'var(--arrow-text-primary)' }}>{opt.label}</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--arrow-text-muted)' }}>{opt.desc}</p>
                {isActive && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'var(--arrow-accent)' }}>
                    <Check className="w-2.5 h-2.5" style={{ color: '#0B0B0B' }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rain Sound — only visible when rain theme is active */}
      {theme.hasRain && (
        <div className="arrow-card p-6 mb-4">
          <h3 className="font-semibold flex items-center gap-2 mb-2" style={{ color: 'var(--arrow-text-primary)' }}>
            <Volume2 className="w-5 h-5" style={{ color: 'var(--arrow-accent)' }} /> Som de Chuva
          </h3>
          <p className="text-xs mb-4" style={{ color: 'var(--arrow-text-muted)' }}>
            Escolha a intensidade do som ambiente de chuva.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'off' as RainIntensity, label: 'Desligado', desc: 'Sem som', Icon: VolumeX },
              { id: 'sutil' as RainIntensity, label: 'Sutil', desc: 'Chuva leve', Icon: Volume },
              { id: 'moderada' as RainIntensity, label: 'Moderada', desc: 'Chuva constante', Icon: Volume1 },
              { id: 'intensa' as RainIntensity, label: 'Intensa', desc: 'Tempestade', Icon: Volume2 },
            ].map((opt) => {
              const isActive = rainIntensity === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setRainIntensity(opt.id)}
                  className="relative p-4 rounded-2xl text-left transition-all duration-200"
                  style={{
                    background: isActive ? 'var(--arrow-accent-light)' : 'var(--arrow-bg-card)',
                    border: `2px solid ${isActive ? 'var(--arrow-accent)' : 'var(--arrow-border)'}`,
                  }}
                >
                  <opt.Icon className="w-5 h-5 mb-1.5" style={{ color: isActive ? 'var(--arrow-accent)' : 'var(--arrow-text-muted)' }} />
                  <p className="text-xs font-semibold" style={{ color: 'var(--arrow-text-primary)' }}>{opt.label}</p>
                  <p className="text-[10px]" style={{ color: 'var(--arrow-text-muted)' }}>{opt.desc}</p>
                  {isActive && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'var(--arrow-accent)' }}>
                      <Check className="w-2.5 h-2.5" style={{ color: '#0B0B0B' }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {rainIsPlaying && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(116,185,255,0.08)' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
              </span>
              <span className="text-[11px]" style={{ color: 'var(--arrow-accent)' }}>Reproduzindo som de chuva...</span>
            </div>
          )}
        </div>
      )}

      {/* Language */}
      <div className="arrow-card p-6 mb-4">
        <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--arrow-text-primary)' }}>
          <Globe className="w-5 h-5" style={{ color: 'var(--arrow-accent)' }} /> Idioma
        </h3>
        <select className="px-4 py-2.5 rounded-xl text-sm" style={{ background: 'var(--arrow-bg-card)', border: `1px solid var(--arrow-border)`, color: 'var(--arrow-text-primary)' }}>
          <option value="pt-BR">Portugues (BR)</option>
          <option value="en">English</option>
          <option value="es">Espanol</option>
        </select>
      </div>

      {/* Export */}
      <div className="arrow-card p-6 mb-4">
        <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--arrow-text-primary)' }}>
          <Download className="w-5 h-5" style={{ color: 'var(--arrow-accent)' }} /> Exportar Dados
        </h3>
        <p className="text-sm mb-3" style={{ color: 'var(--arrow-text-secondary)' }}>Exporte seus dados em diferentes formatos</p>
        <div className="flex gap-3">
          <button onClick={() => showInfo('Exportacao JSON iniciada...')} className="arrow-btn-secondary text-sm">Exportar JSON</button>
          <button onClick={() => showInfo('Exportacao CSV iniciada...')} className="arrow-btn-secondary text-sm">Exportar CSV</button>
        </div>
      </div>

      {/* Security */}
      <div className="arrow-card p-6 mb-4">
        <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--arrow-text-primary)' }}>
          <Shield className="w-5 h-5 text-red-500" /> Seguranca e Conta
        </h3>
        <div className="space-y-3">
          <button onClick={() => closeVault()} className="flex items-center gap-2 text-sm transition-colors" style={{ color: 'var(--arrow-text-secondary)' }}>
            <LogOut className="w-4 h-4" /> Fechar vault
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors">
                <Trash2 className="w-4 h-4" /> Sobre exclusão de dados
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Fechar vault?</AlertDialogTitle>
                <AlertDialogDescription>Isso fecha o vault atual. Seus dados permanecem na pasta. Para remover tudo, apague a pasta do vault no Finder.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction className="bg-red-500 hover:bg-red-600">Entendi</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <p className="text-center text-xs mt-6 mb-4" style={{ color: 'var(--arrow-text-muted)' }}>Arrow v2.0 — Produtividade com proposito</p>
    </motion.div>

    {/* Avatar Cropper Modal */}
    {cropFile && (
      <AvatarCropper
        imageFile={cropFile}
        onCrop={handleCropped}
        onCancel={() => setCropFile(null)}
      />
    )}
    </>
  );
}
