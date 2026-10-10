import { motion, AnimatePresence } from 'motion/react';
import { Check, Plus } from 'lucide-react';
import type { MediaAsset, PublicService } from '@shared/types';
import { DynamicIcon } from '@/config/icons';
import { SmartImage } from '@/components/ui/SmartImage';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { useSpotlight } from '@/hooks/useSpotlight';
import { formatBRL } from '@/lib/format';
import { cn } from '@/lib/cn';
import { MOTION } from '@/config/site';

interface Props {
  service: PublicService;
  image: MediaAsset | null;
  index: number;
  quantity: number;
  selected: boolean;
  onToggle: () => void;
  onQuantity: (value: number) => void;
}

export function ServiceCard({ service, image, index, quantity, selected, onToggle, onQuantity }: Props) {
  const spotlight = useSpotlight<HTMLDivElement>();

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 1, ease: MOTION.ease, delay: index * 0.08 }}
      className="h-full"
    >
      <div
        {...spotlight}
        className={cn(
          'spotlight glass group relative flex h-full flex-col rounded-[26px] p-2 transition-[transform,border-color,box-shadow,background] duration-700 ease-[var(--ease-cine)] hover:-translate-y-1.5',
          selected
            ? 'border-white/30 bg-white/[0.07] shadow-[0_0_0_1px_rgb(255_255_255/0.12),0_40px_100px_-30px_rgb(255_255_255/0.14)]'
            : 'hover:border-white/20',
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={selected}
          className="flex flex-1 flex-col text-left sm:flex-row xl:flex-col"
        >
          {/* Imagem */}
          <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-[20px] sm:aspect-auto sm:w-[40%] xl:aspect-[16/10] xl:w-full">
            <SmartImage
              media={image}
              width={900}
              className={cn(
                'absolute inset-0 h-full w-full transition-[transform,filter] duration-[1400ms] ease-[var(--ease-cine)] group-hover:scale-[1.05]',
                !selected && 'grayscale',
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/10" />
            {service.badge && (
              <span className="glass-pill absolute left-3 top-3 rounded-full px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-bone/90">
                {service.badge}
              </span>
            )}
            <span
              className={cn(
                'absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-500',
                selected ? 'border-bone bg-bone text-ink' : 'border-white/40 bg-black/20 text-transparent backdrop-blur',
              )}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-black/30 backdrop-blur-md">
              <DynamicIcon name={service.icon} className="h-[18px] w-[18px] text-bone" strokeWidth={1.6} />
            </span>
          </div>

          {/* Texto */}
          <div className="flex flex-1 flex-col px-3 pb-3 pt-4 sm:px-5 sm:pt-5 xl:px-3 xl:pt-4">
            <h3 className="text-xl font-medium tracking-[-0.03em] text-bone">{service.name}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-mist">{service.description}</p>
            {service.features.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {service.features.map((f) => (
                  <li key={f} className="rounded-full border border-white/10 px-2.5 py-1 text-[11.5px] text-bone/75">
                    {f}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-auto flex items-baseline gap-1.5 pt-5">
              <span className="text-2xl font-medium tracking-[-0.04em] text-bone">{formatBRL(service.priceCents)}</span>
              <span className="text-[13px] text-fog">/ {service.unitSingular}</span>
            </div>
          </div>
        </button>

        {/* Rodapé: adicionar ou controlar quantidade */}
        <div className="mx-1 mb-1 mt-1 flex h-14 items-center justify-between rounded-[18px] border border-white/[0.06] bg-black/20 pl-4 pr-1.5">
          <AnimatePresence mode="wait" initial={false}>
            {selected ? (
              <motion.div
                key="qty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="flex w-full items-center justify-between"
              >
                <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-bone/60">Quantidade</span>
                <QuantityStepper size="sm" value={quantity} min={service.minQty} max={service.maxQty} onChange={onQuantity} label={service.name} />
              </motion.div>
            ) : (
              <motion.button
                key="add"
                type="button"
                onClick={onToggle}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="flex w-full items-center justify-between text-[13px] text-bone/70 transition hover:text-bone"
              >
                Incluir no projeto
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] transition group-hover:bg-bone group-hover:text-ink">
                  <Plus className="h-4 w-4" />
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
