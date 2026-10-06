import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { pad } from '@/lib/format';

interface Props {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'lg';
  label: string;
}

/** Contador elegante "− 04 +" com digitação manual e animação do número. */
export function QuantityStepper({ value, min, max, onChange, size = 'lg', label }: Props) {
  const [draft, setDraft] = useState(pad(value));
  const [focused, setFocused] = useState(false);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (!focused) setDraft(pad(value));
  }, [value, focused]);

  const step = (delta: number) => {
    setDirection(delta);
    onChange(Math.min(max, Math.max(min, value + delta)));
  };

  const commit = () => {
    const parsed = parseInt(draft, 10);
    if (Number.isFinite(parsed)) {
      setDirection(parsed >= value ? 1 : -1);
      onChange(parsed);
    }
    setFocused(false);
  };

  const large = size === 'lg';
  const btn = cn(
    'flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-bone/80 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-bone active:scale-90 disabled:opacity-25 disabled:hover:border-white/10 disabled:hover:bg-white/[0.04]',
    large ? 'h-11 w-11' : 'h-8 w-8',
  );

  return (
    <div className={cn('flex items-center', large ? 'gap-3' : 'gap-1.5')} role="group" aria-label={label}>
      <button type="button" className={btn} onClick={() => step(-1)} disabled={value <= min} aria-label="Diminuir">
        <Minus className={large ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      </button>
      <div className={cn('relative overflow-hidden text-center', large ? 'h-12 w-[4.5rem]' : 'h-8 w-10')}>
        {focused ? (
          <input
            autoFocus
            inputMode="numeric"
            aria-label={`${label} — quantidade`}
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 3))}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') {
                setDraft(pad(value));
                setFocused(false);
              }
            }}
            className={cn(
              'h-full w-full rounded-xl bg-white/[0.06] text-center font-mono tabular-nums text-bone outline-none ring-1 ring-white/20',
              large ? 'text-3xl' : 'text-base',
            )}
          />
        ) : (
          <button
            type="button"
            onClick={() => setFocused(true)}
            className="h-full w-full cursor-text"
            aria-label={`${label}: ${value}. Clique para digitar`}
          >
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              <motion.span
                key={value}
                custom={direction}
                variants={{
                  enter: (d: number) => ({ y: d > 0 ? '70%' : '-70%', opacity: 0, filter: 'blur(4px)' }),
                  center: { y: 0, opacity: 1, filter: 'blur(0px)' },
                  exit: (d: number) => ({ y: d > 0 ? '-70%' : '70%', opacity: 0, filter: 'blur(4px)' }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'absolute inset-0 flex items-center justify-center font-mono font-light tabular-nums tracking-tight text-bone',
                  large ? 'text-[2rem]' : 'text-base',
                )}
              >
                {pad(value)}
              </motion.span>
            </AnimatePresence>
          </button>
        )}
      </div>
      <button type="button" className={btn} onClick={() => step(1)} disabled={value >= max} aria-label="Aumentar">
        <Plus className={large ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      </button>
    </div>
  );
}
