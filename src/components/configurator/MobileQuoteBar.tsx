import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { AnimatedPrice } from '@/components/ui/AnimatedPrice';

interface Props {
  visible: boolean;
  totalCents: number;
  count: number;
  label: string;
  onOpen: () => void;
}

/** Barra fixa inferior no mobile: total sempre visível + acesso ao resumo. */
export function MobileQuoteBar({ visible, totalCents, count, label, onOpen }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 lg:hidden"
        >
          <button
            type="button"
            onClick={onOpen}
            className="glass-strong flex w-full items-center justify-between rounded-[22px] py-2.5 pl-5 pr-2.5 text-left"
          >
            <span>
              <span className="block whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] text-mist">
                {label}
                {count > 0 && <span className="text-fog"> · {count}</span>}
              </span>
              <AnimatedPrice cents={totalCents} className="block text-xl font-medium tracking-[-0.03em] text-bone" />
            </span>
            <span className="flex h-12 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-2xl bg-bone px-4 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-ink">
              Ver orçamento
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
