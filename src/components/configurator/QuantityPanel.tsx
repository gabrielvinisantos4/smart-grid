import { AnimatePresence, motion } from 'motion/react';
import { MousePointerClick, X } from 'lucide-react';
import type { PublicService } from '@shared/types';
import { DynamicIcon } from '@/config/icons';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { AnimatedPrice } from '@/components/ui/AnimatedPrice';
import { formatBRL } from '@/lib/format';
import { cn } from '@/lib/cn';
import { MOTION } from '@/config/site';

interface Props {
  question: string;
  services: PublicService[];
  quantities: Record<string, number>;
  onQuantity: (id: string, value: number) => void;
  onRemove: (id: string) => void;
  emptyText: string;
}

/** Etapa 02: quantidade por formato, com atalhos e digitação manual. */
export function QuantityPanel({ question, services, quantities, onQuantity, onRemove, emptyText }: Props) {
  const selected = services.filter((s) => quantities[s.id]);

  return (
    <div className="glass rounded-[28px] p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">
          <span className="text-bone/40">Etapa 02 — </span>
          {question}
        </p>
        {selected.length > 0 && (
          <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-fog">Toque no número para digitar</span>
        )}
      </div>

      <div className="mt-5">
        <AnimatePresence initial={false}>
          {selected.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: MOTION.ease }}
            >
              <div className="flex items-center gap-4 rounded-2xl border border-dashed border-white/10 px-5 py-6 text-[14px] text-mist">
                <MousePointerClick className="h-5 w-5 shrink-0 text-bone/40" />
                {emptyText}
              </div>
            </motion.div>
          )}
          {selected.map((service) => {
            const qty = quantities[service.id];
            return (
              <motion.div
                key={service.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.55, ease: MOTION.ease }}
                className="overflow-hidden"
              >
                <div className="grid gap-5 border-t border-white/[0.07] py-6 first:border-t-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                        <DynamicIcon name={service.icon} className="h-[18px] w-[18px] text-bone" strokeWidth={1.6} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[17px] font-medium tracking-[-0.02em] text-bone">{service.name}</p>
                        <p className="font-mono text-[11px] tabular-nums text-fog">
                          {qty} × {formatBRL(service.priceCents)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(service.id)}
                        className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-bone/40 transition hover:bg-white/5 hover:text-bone md:hidden"
                        aria-label={`Remover ${service.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="no-scrollbar -mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1">
                      {service.quickQuantities.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => onQuantity(service.id, q)}
                          className={cn(
                            'h-9 min-w-10 shrink-0 rounded-full border px-3 font-mono text-[12px] tabular-nums transition-all duration-300',
                            q === qty
                              ? 'border-bone bg-bone text-ink'
                              : 'border-white/10 text-bone/60 hover:border-white/30 hover:text-bone',
                          )}
                        >
                          {String(q).padStart(2, '0')}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-6 md:justify-end">
                    <QuantityStepper value={qty} min={service.minQty} max={service.maxQty} onChange={(v) => onQuantity(service.id, v)} label={service.name} />
                    <div className="min-w-[8.5rem] text-right">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog">Subtotal</p>
                      <AnimatedPrice cents={service.priceCents * qty} className="text-xl font-medium tracking-[-0.03em] text-bone" />
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(service.id)}
                      className="hidden h-9 w-9 items-center justify-center rounded-full text-bone/40 transition hover:bg-white/5 hover:text-bone md:flex"
                      aria-label={`Remover ${service.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
