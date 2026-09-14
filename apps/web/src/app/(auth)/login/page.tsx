'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Shield, Zap, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', mfaCode: '' });
  const [showPass, setShowPass] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.message?.includes('MFA')) {
          setShowMfa(true);
          toast.info('Digite o código do seu autenticador');
        } else {
          toast.error(data.message?.error || 'Credenciais inválidas');
        }
        return;
      }

      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      toast.success('Bem-vindo ao RESGATE AI!');
      router.push('/');
    } catch {
      toast.error('Erro ao conectar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden flex-col justify-between p-12">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #3B82F6 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        {/* Glows */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-cyan-500/20 rounded-full blur-3xl" />

        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-display font-bold text-2xl">RESGATE AI</span>
            </div>
            <h1 className="text-5xl font-display font-bold text-white leading-tight mb-6">
              Gestão inteligente<br />de auto socorro
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed">
              Central de despacho com IA, rastreamento em tempo real e automação financeira para empresas de guincho 24h.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}
          className="relative z-10 grid grid-cols-3 gap-4"
        >
          {[
            { icon: MapPin, label: 'Despacho por IA', value: '40% mais rápido' },
            { icon: Shield, label: 'Segurança', value: 'LGPD Compliant' },
            { icon: Zap, label: 'GPS Tempo Real', value: 'Atualização 5s' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <Icon className="w-5 h-5 text-blue-400 mb-2" />
              <div className="text-white font-semibold text-sm">{value}</div>
              <div className="text-blue-300 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-slate-900">
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-gray-900 dark:text-white">RESGATE AI</span>
          </div>

          <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
            Bem-vindo de volta
          </h2>
          <p className="text-gray-500 dark:text-slate-400 mb-8">Acesse sua central de operações</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">E-mail</label>
              <input
                type="email"
                placeholder="operador@resgate.com.br"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input pr-11"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {showMfa && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Código MFA (6 dígitos)
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  className="input text-center tracking-widest font-mono text-lg"
                  value={form.mfaCode}
                  onChange={(e) => setForm({ ...form, mfaCode: e.target.value.replace(/\D/g, '') })}
                  autoFocus
                />
              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300" />
                Lembrar por 7 dias
              </label>
              <a href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Esqueceu a senha?
              </a>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-slate-700" /></div>
              <div className="relative flex justify-center text-xs text-gray-400 uppercase bg-gray-50 dark:bg-slate-900 px-2">ou continue com</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`}
                className="btn-ghost border border-gray-200 dark:border-slate-700 w-full justify-center py-2.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button type="button" onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/microsoft`}
                className="btn-ghost border border-gray-200 dark:border-slate-700 w-full justify-center py-2.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0078D4"><path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/></svg>
                Microsoft
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-8">
            Ao entrar você concorda com os{' '}
            <a href="/terms" className="underline hover:text-gray-600">Termos de Uso</a> e{' '}
            <a href="/privacy" className="underline hover:text-gray-600">Política de Privacidade</a>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
