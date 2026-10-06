import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/cn';

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 text-[2rem] font-medium leading-tight tracking-[-0.04em] text-bone md:text-[2.5rem]">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-mist">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, title, description, actions }: { children: ReactNode; className?: string; title?: string; description?: string; actions?: ReactNode }) {
  return (
    <section className={cn('glass rounded-[24px] p-5 md:p-6', className)}>
      {(title || actions) && (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-[17px] font-medium tracking-[-0.02em] text-bone">{title}</h2>}
            {description && <p className="mt-1 text-[13px] leading-relaxed text-mist">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-2 block font-mono text-[10.5px] uppercase tracking-[0.18em] text-mist">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12px] leading-relaxed text-fog">{hint}</span>}
    </label>
  );
}

/** Permite sobrescrever largura/altura sem conflito com os padrões. */
function sized(className: string | undefined, height: string) {
  return cn(!/(^|\s)w-/.test(className ?? '') && 'w-full', !/(^|\s)h-/.test(className ?? '') && height, className);
}

const inputBase =
  'rounded-2xl border border-white/10 bg-white/[0.035] px-4 text-[14px] text-bone placeholder:text-fog outline-none transition focus:border-white/30 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60';

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, sized(className, 'h-11'))} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, 'min-h-24 resize-y py-3 leading-relaxed', sized(className, ''))} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputBase, 'appearance-none pr-10', sized(className, 'h-11'))} {...props}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-300 disabled:opacity-50',
        checked ? 'border-bone bg-bone' : 'border-white/15 bg-white/[0.06]',
      )}
    >
      <span className={cn('h-4 w-4 rounded-full transition-transform duration-300', checked ? 'translate-x-6 bg-ink' : 'translate-x-1 bg-bone/70')} />
    </button>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'positive' | 'muted' | 'warning' }) {
  const tones = {
    neutral: 'border-white/15 bg-white/[0.06] text-bone/85',
    positive: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200',
    muted: 'border-white/[0.07] text-fog',
    warning: 'border-amber-300/25 bg-amber-300/10 text-amber-200',
  };
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]', tones[tone])}>{children}</span>;
}

export function ReadOnlyBanner() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-[13px] text-amber-100/90">
      <Eye className="h-4 w-4 shrink-0" />
      Você está no modo leitura. Apenas usuários proprietários podem alterar valores e configurações.
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-bone/70">{icon}</span>
      <p className="mt-4 text-[15px] text-bone">{title}</p>
      {text && <p className="mt-1 max-w-sm text-[13px] text-mist">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-white/[0.04]', className)} />;
}
