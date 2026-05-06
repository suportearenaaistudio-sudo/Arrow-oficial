import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, ArrowRight, Loader2, Mail, Lock, User, CheckCircle, AlertCircle, Sparkles, Target, BarChart3, Wallet } from 'lucide-react';
import { AuthStarfield } from '@/components/ui/AuthStarfield';

const features = [
  { Icon: Target, title: 'Ciclos de 12 Semanas', desc: 'Planeje como um CEO, execute como um atleta' },
  { Icon: BarChart3, title: 'Metas e Habitos', desc: 'Acompanhe progresso com clareza' },
  { Icon: Wallet, title: 'Financas Pessoais', desc: 'Controle total do seu dinheiro' },
];

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335"/>
    </svg>
  );
}

export default function Auth() {
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-blue-600 flex items-center justify-center">
            <Compass className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="arrow-spinner" />
        </motion.div>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (isLogin) {
        const result = await signIn(email, password);
        if (result.error) setError(result.error);
      } else {
        if (!fullName.trim()) { setError('Nome e obrigatorio.'); setSubmitting(false); return; }
        if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); setSubmitting(false); return; }
        const result = await signUp(email, password, fullName);
        if (result.error) {
          setError(result.error);
        } else if (result.needsConfirmation) {
          setSuccess('Conta criada! Verifique seu email para confirmar o cadastro.');
          setIsLogin(true);
        }
      }
    } catch {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    const result = await signInWithGoogle();
    if (result.error) setError(result.error);
  }

  function switchMode(login: boolean) {
    setIsLogin(login);
    setError('');
    setSuccess('');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex relative overflow-hidden">
      {/* Starfield */}
      <AuthStarfield />

      {/* Subtle radial glow */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-orange-500/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/[0.03] rounded-full blur-[150px]" />
      </div>

      {/* Left side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-8 shadow-2xl shadow-orange-500/10"
            style={{ background: 'linear-gradient(135deg, #f97316, #3b82f6)' }}
          >
            <Compass className="w-12 h-12 text-white" />
          </motion.div>

          <h1 className="text-5xl font-bold mb-4"
            style={{
              background: 'linear-gradient(135deg, #f97316, #60a5fa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Arrow
          </h1>
          <p className="text-lg text-zinc-400 font-light mb-12 leading-relaxed">
            Navegue em direcao aos seus sonhos<br />
            com o metodo de 12 semanas
          </p>

          <div className="space-y-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.15, duration: 0.5 }}
                className="flex items-center gap-4 text-left rounded-2xl p-4 border transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(249,115,22,0.1)' }}>
                  <f.Icon className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-zinc-200 text-sm">{f.title}</p>
                  <p className="text-xs text-zinc-500">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right side — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-lg shadow-orange-500/20"
              style={{ background: 'linear-gradient(135deg, #f97316, #3b82f6)' }}>
              <Compass className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #f97316, #60a5fa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >Arrow</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Navegue em direcao aos seus sonhos</p>
          </div>

          {/* Form Card */}
          <div className="rounded-3xl p-8 shadow-2xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-zinc-100">
                {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                {isLogin ? 'Entre para continuar sua jornada' : 'Comece a transformar seus objetivos'}
              </p>
            </div>

            {/* Google */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl
                         font-medium text-sm transition-all duration-200 active:scale-[0.98]"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e4e4e7',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              <GoogleIcon className="w-5 h-5" />
              Continuar com Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-xs text-zinc-600 font-medium">ou</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Tabs */}
            <div className="flex mb-5 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <button
                onClick={() => switchMode(true)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isLogin ? 'text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                style={isLogin ? { background: 'rgba(255,255,255,0.08)' } : {}}
              >
                Entrar
              </button>
              <button
                onClick={() => switchMode(false)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  !isLogin ? 'text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                style={!isLogin ? { background: 'rgba(255,255,255,0.08)' } : {}}
              >
                Criar Conta
              </button>
            </div>

            {/* Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex items-start gap-2 text-sm px-4 py-3 rounded-xl mb-4"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex items-start gap-2 text-sm px-4 py-3 rounded-xl mb-4"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#86efac' }}
                >
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="text-xs font-medium text-zinc-500 block mb-1.5">Nome completo</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input
                        type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                        placeholder="Seu nome completo"
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200
                                   placeholder:text-zinc-600 text-zinc-100"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.08)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com" required
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200
                               placeholder:text-zinc-600 text-zinc-100"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.08)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1.5">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required minLength={6}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200
                               placeholder:text-zinc-600 text-zinc-100"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.08)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                {!isLogin && <p className="text-[10px] text-zinc-600 mt-1.5">Minimo 6 caracteres</p>}
              </div>

              <button
                type="submit" disabled={submitting}
                className="w-full font-semibold rounded-xl px-5 py-3.5 shadow-lg
                           transition-all duration-300 active:scale-[0.98]
                           disabled:opacity-60 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 text-sm text-white"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  boxShadow: '0 8px 32px rgba(249,115,22,0.25)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(249,115,22,0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(249,115,22,0.25)'; }}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Entrar na Minha Conta' : 'Criar Minha Conta'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {isLogin && (
              <p className="text-center text-xs text-zinc-600 mt-4">
                Esqueceu a senha?{' '}
                <button className="text-orange-400 hover:text-orange-300 font-medium transition-colors">Recuperar</button>
              </p>
            )}
          </div>

          {/* Bottom */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <Sparkles className="w-3.5 h-3.5 text-orange-500/40" />
            <p className="text-xs text-zinc-600">Arrow v2.0 — Produtividade com proposito</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
