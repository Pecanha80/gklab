import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';

export const AuthPage: React.FC = () => {
  const { t } = useTranslation();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError(t('authFillAllFields'));
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setError(t('authPasswordMin'));
        return;
      }
      if (password !== confirmPassword) {
        setError(t('authPasswordMismatch'));
        return;
      }
    }

    setLoading(true);

    if (mode === 'login') {
      const { error: authError } = await signIn(email, password);
      if (authError) {
        setError(authError);
      }
    } else {
      const { error: authError } = await signUp(email, password);
      if (authError) {
        setError(authError);
      } else {
        setSuccess(t('authCheckEmail'));
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black font-headline tracking-tight text-on-surface">GKLAB</h1>
          <p className="text-sm text-on-surface-variant font-label mt-2">{t('authSubtitle')}</p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl border border-white/[0.04] p-8 shadow-sm">
          {/* Tabs */}
          <div className="flex gap-1 bg-surface rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
              className={cn(
                "flex-1 py-2.5 text-sm font-bold font-label rounded-lg transition-all",
                mode === 'login' ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {t('authLogin')}
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
              className={cn(
                "flex-1 py-2.5 text-sm font-bold font-label rounded-lg transition-all",
                mode === 'register' ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {t('authRegister')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold font-label text-on-surface-variant uppercase tracking-wider mb-1.5">
                {t('authEmail')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="coach@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-surface border border-white/[0.04] rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-white/[0.08]"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold font-label text-on-surface-variant uppercase tracking-wider mb-1.5">
                {t('authPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-surface border border-white/[0.04] rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-white/[0.08]"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password (register only) */}
            {mode === 'register' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="block text-xs font-bold font-label text-on-surface-variant uppercase tracking-wider mb-1.5">
                  {t('authConfirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-white/[0.04] rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-white/[0.08]"
                    autoComplete="new-password"
                  />
                </div>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Success */}
            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm">
                {success}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold font-label text-sm transition-all",
                loading
                  ? "bg-primary/50 text-on-primary/50 cursor-not-allowed"
                  : "bg-primary text-on-primary hover:bg-primary/90 active:scale-[0.98]"
              )}
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
              ) : (
                <>
                  {mode === 'login' ? t('authLogin') : t('authRegister')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-on-surface-variant/50 mt-6 font-label">
          {t('authFooter')}
        </p>
      </motion.div>
    </div>
  );
};
