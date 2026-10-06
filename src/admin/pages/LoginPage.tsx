import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, Loader2 } from 'lucide-react';
import type { MediaAsset } from '@shared/types';
import { useAuth } from '@/hooks/useAuth';
import { publicApi } from '@/services/publicApi';
import { Button } from '@/components/ui/Button';
import { SmartImage } from '@/components/ui/SmartImage';
import { Field, TextInput } from '../components/ui';

export function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState<MediaAsset | null>(null);
  const [brand, setBrand] = useState('');

  useEffect(() => {
    document.title = 'Entrar — Painel';
    publicApi
      .getSite()
      .then((site) => {
        setImage(site.media[site.settings.login.imageId ?? ''] ?? site.media[site.settings.hero.imageId ?? ''] ?? null);
        setBrand(site.settings.brand.name);
      })
      .catch(() => undefined);
  }, []);

  if (!loading && user) return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/admin'} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
        <SmartImage media={image} loading="eager" className="absolute inset-0 h-full w-full animate-kenburns" grayscale />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-ink" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="eyebrow">Área restrita</p>
          <p className="display mt-4 text-6xl text-bone">
            {brand || 'Studio'}
            <em className="block font-serif font-normal italic text-accent">painel.</em>
          </p>
        </div>
      </div>

      <div className="relative flex items-center justify-center px-5 py-16">
        <div className="pointer-events-none absolute right-0 top-0 h-[480px] w-[480px] rounded-full bg-white/[0.04] blur-[120px]" />
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong relative w-full max-w-[420px] rounded-[30px] p-8"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <Lock className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </span>
          <h1 className="mt-6 text-[1.9rem] font-medium tracking-[-0.04em]">Entrar no painel</h1>
          <p className="mt-1.5 text-[14px] text-mist">Acesso exclusivo para a equipe do estúdio.</p>

          <div className="mt-8 space-y-4">
            <Field label="E-mail">
              <TextInput type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@estudio.com" />
            </Field>
            <Field label="Senha">
              <TextInput type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••••" />
            </Field>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-red-300/20 bg-red-300/[0.06] px-3 py-2 text-[13px] text-red-200">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" arrow={!submitting} disabled={submitting} className="mt-7 w-full" icon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
          <a href="/" className="mt-5 block text-center text-[13px] text-fog transition hover:text-bone">
            ← Voltar ao site
          </a>
        </motion.form>
      </div>
    </div>
  );
}
