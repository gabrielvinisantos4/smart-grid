import { AnimatePresence, motion } from 'motion/react';
import { Loader2, Receipt } from 'lucide-react';
import type { QuoteLine, SiteSettings } from '@shared/types';
import { unitLabel } from '@shared/pricing';
import { AnimatedPrice } from '@/components/ui/AnimatedPrice';
import { Button } from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/ui/SocialIcons';
import { formatBRL } from '@/lib/format';
import { cn } from '@/lib/cn';
import { MOTION } from '@/config/site';

interface Props {
  texts: SiteSettings['configurator'];
  lines: QuoteLine[];
  totalCents: number;
  totalUnits: number;
  totals: { monthlyCents: number; oneOffCents: number };
  busy: boolean;
  onRequest: () => void;
  onWhatsApp: () => void;
  className?: string;
  /** Usado no bottom sheet mobile, onde o botão de fechar ocupa o canto. */
  compact?: boolean;
}

export function QuoteSummary({ texts, lines, totalCents, totalUnits, totals, busy, onRequest, onWhatsApp, className, compact }: Props) {
  const empty = lines.length === 0;

  return (
    <div className={cn('glass-strong overflow-hidden rounded-[30px]', className)}>
      {/* reflexo superior */}
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">{texts.summaryPlanLabel}</p>
            <h3 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-bone">{texts.summaryTitle}</h3>
          </div>
          <span className={cn('flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]', compact && 'hidden')}>
            <Receipt className="h-[18px] w-[18px] text-bone/70" strokeWidth={1.6} />
          </span>
        </div>

        <div className="mt-6 min-h-[92px]">
          <AnimatePresence initial={false} mode="popLayout">
            {empty ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-[13px] leading-relaxed text-fog"
              >
                {texts.emptyText}
              </motion.p>
            ) : (
              lines.map((line) => (
                <motion.div
                  key={line.serviceId}
                  layout
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.45, ease: MOTION.ease }}
                  className="flex items-start justify-between gap-4 border-b border-white/[0.07] py-4 first:pt-0"
                >
                  <div className="min-w-0">
                    {line.kind === 'plan' && <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Plano mensal</p>}
                    <p className="truncate text-[15px] text-bone">{line.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] tabular-nums text-fog">
                      {line.kind === 'plan' ? 'Valor fixo por mês' : `${String(line.quantity).padStart(2, '0')} ${unitLabel(line)} · ${formatBRL(line.unitPriceCents)}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-right">
                    <AnimatedPrice cents={line.subtotalCents} className="text-[15px] text-bone/90" />
                    {line.kind === 'plan' && <span className="block font-mono text-[10px] text-fog">/mês</span>}
                  </span>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 rounded-[22px] border border-white/[0.07] bg-black/25 p-5">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-mist">{texts.totalLabel}</p>
          <AnimatedPrice split cents={totalCents} className="mt-2 block text-[2.6rem] font-medium leading-none tracking-[-0.05em] text-bone" />
          <p className="mt-3 min-h-4 font-mono text-[11px] tabular-nums leading-relaxed text-fog">
            {totals.monthlyCents > 0 && totals.oneOffCents > 0 ? (
              <>
                {formatBRL(totals.monthlyCents)}/mês do plano
                <br />+ {formatBRL(totals.oneOffCents)} em avulsos
              </>
            ) : totals.monthlyCents > 0 ? (
              'Plano mensal, valor fixo'
            ) : totalUnits > 0 ? (
              `${totalUnits} ${totalUnits === 1 ? 'conteúdo avulso' : 'conteúdos avulsos'}`
            ) : null}
          </p>
        </div>

        <div className="mt-5 grid gap-2.5">
          <Button size="lg" arrow onClick={onRequest} disabled={empty || busy} className="w-full">
            {texts.requestCtaLabel}
          </Button>
          <Button
            size="lg"
            variant="glass"
            onClick={onWhatsApp}
            disabled={empty || busy}
            className="w-full"
            icon={busy ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <WhatsAppIcon className="h-[18px] w-[18px]" />}
          >
            {texts.whatsappCtaLabel}
          </Button>
        </div>
        {texts.disclaimer && <p className="mt-4 text-center text-[11.5px] leading-relaxed text-fog">{texts.disclaimer}</p>}
      </div>
    </div>
  );
}
