import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

const STEPS = ['Formato', 'Quantidade', 'Investimento'];

/** Progresso do fluxo: 0 = nada escolhido, 3 = pronto para enviar. */
export function StepIndicator({ progress }: { progress: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Etapas do orçamento">
      {STEPS.map((label, i) => {
        const done = progress > i + 1 || (progress === 3 && i === 2);
        const active = progress === i + 1 || (progress === 0 && i === 0);
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            <span
              className={cn(
                'flex items-center gap-2 rounded-full border px-2.5 py-1.5 transition-all duration-700 ease-[var(--ease-cine)] sm:px-3',
                done && 'border-white/20 bg-white/[0.08] text-bone',
                active && !done && 'border-white/35 bg-white/[0.04] text-bone',
                !done && !active && 'border-white/[0.07] text-bone/35',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] transition-colors duration-500',
                  done ? 'bg-bone text-ink' : 'bg-white/10',
                )}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : `0${i + 1}`}
              </span>
              <span className="hidden font-mono text-[10.5px] uppercase tracking-[0.18em] sm:inline">{label}</span>
            </span>
            {i < STEPS.length - 1 && (
              <span className="relative h-px w-5 overflow-hidden bg-white/10 sm:w-10">
                <span
                  className="absolute inset-0 origin-left bg-bone/60 transition-transform duration-700 ease-[var(--ease-cine)]"
                  style={{ transform: `scaleX(${progress > i + 1 ? 1 : 0})` }}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
