import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import type { PublicService } from '@shared/types';
import { DynamicIcon } from '@/config/icons';
import { useSpotlight } from '@/hooks/useSpotlight';
import { formatBRL } from '@/lib/format';
import { cn } from '@/lib/cn';
import { MOTION } from '@/config/site';

interface Props {
  service: PublicService;
  index: number;
  selected: boolean;
  onSelect: () => void;
}

/** Plano mensal de preço fixo (seleção única, como um botão de opção). */
export function PlanCard({ service, index, selected, onSelect }: Props) {
  const spotlight = useSpotlight<HTMLButtonElement>();
  // "8 vídeos por mês" → R$ 150 por vídeo (só quando o nome traz a quantidade).
  const count = Number(service.name.match(/\d+/)?.[0] ?? 0);
  const perUnit = count > 1 ? Math.round(service.priceCents / count) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 1, ease: MOTION.ease, delay: index * 0.08 }}
      className="h-full"
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        {...spotlight}
        className={cn(
          'spotlight glass group relative flex h-full w-full flex-col rounded-[26px] p-6 text-left transition-[transform,border-color,box-shadow,background] duration-700 ease-[var(--ease-cine)] hover:-translate-y-1.5',
          selected
            ? 'border-white/35 bg-white/[0.08] shadow-[0_0_0_1px_rgb(255_255_255/0.14),0_40px_100px_-30px_rgb(255_255_255/0.16)]'
            : 'hover:border-white/20',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <DynamicIcon name={service.icon} className="h-5 w-5 text-bone" strokeWidth={1.6} />
          </span>
          <span
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-500',
              selected ? 'border-bone bg-bone text-ink' : 'border-white/30 text-transparent',
            )}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        </div>

        {service.badge && (
          <span className="mt-5 self-start rounded-full border border-accent/40 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-accent">
            {service.badge}
          </span>
        )}

        <h3 className={cn('text-[1.35rem] font-medium leading-tight tracking-[-0.03em] text-bone', service.badge ? 'mt-3' : 'mt-5')}>{service.name}</h3>
        {service.description && <p className="mt-2 text-[14px] leading-relaxed text-mist">{service.description}</p>}

        <div className="mt-6 flex items-baseline gap-1.5">
          <span className="text-[2.2rem] font-medium leading-none tracking-[-0.05em] text-bone">{formatBRL(service.priceCents)}</span>
          <span className="text-[13px] text-fog">/mês</span>
        </div>
        {perUnit && <p className="mt-1.5 font-mono text-[11px] tabular-nums text-fog">≈ {formatBRL(perUnit)} por vídeo</p>}

        {service.features.length > 0 && (
          <ul className="mt-6 space-y-2.5 border-t border-white/[0.07] pt-5">
            {service.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-bone/80">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2.5} />
                {f}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-7">
          <span
            className={cn(
              'flex h-12 items-center justify-center rounded-full text-[13.5px] font-medium transition-all duration-500',
              selected ? 'bg-bone text-ink' : 'border border-white/12 text-bone/80 group-hover:border-white/30 group-hover:text-bone',
            )}
          >
            {selected ? 'Plano escolhido' : 'Escolher plano'}
          </span>
        </div>
      </button>
    </motion.div>
  );
}
