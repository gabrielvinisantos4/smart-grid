import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { Smartphone } from 'lucide-react';
import { useSiteData } from '@/hooks/useSiteData';
import { useQuoteBuilder } from '@/hooks/useQuoteBuilder';
import { useQuoteSubmit } from '@/hooks/useQuoteSubmit';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Modal } from '@/components/ui/Modal';
import { Reveal } from '@/components/ui/Reveal';
import { IS_DEMO, SECTION_IDS, sectionIndex } from '@/config/site';
import { ServiceCard } from './ServiceCard';
import { PlanCard } from './PlanCard';
import { QuantityPanel } from './QuantityPanel';
import { QuoteSummary } from './QuoteSummary';
import { MobileQuoteBar } from './MobileQuoteBar';
import { RequestModal } from './RequestModal';
import { StepIndicator } from './StepIndicator';

export function Configurator() {
  const { data, media } = useSiteData();
  const services = data?.services ?? [];
  const builder = useQuoteBuilder(services);
  const { submit, busy, error } = useQuoteSubmit(data?.settings);

  const [requestOpen, setRequestOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [touched, setTouched] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { margin: '0px 0px -40% 0px' });
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!data) return null;
  const texts = data.settings.configurator;
  const plans = services.filter((s) => s.kind === 'plan');
  const units = services.filter((s) => s.kind !== 'plan');
  const selectedUnits = units.filter((s) => builder.isSelected(s.id)).length;
  const progress = builder.lines.length === 0 ? 0 : (builder.plan && selectedUnits > 0) || touched ? 3 : 2;
  const preview = { lines: builder.lines, totalCents: builder.totalCents };

  const setQuantity = (id: string, value: number) => {
    setTouched(true);
    builder.setQuantity(id, value);
  };

  const openRequest = () => {
    setSheetOpen(false);
    setRequestOpen(true);
  };
  const sendWhatsApp = () => (IS_DEMO ? openRequest() : void submit('whatsapp', builder.items, preview));

  const summaryProps = {
    texts,
    lines: builder.lines,
    totalCents: builder.totalCents,
    totalUnits: builder.totalUnits,
    totals: builder.totals,
    busy,
    onRequest: openRequest,
    onWhatsApp: sendWhatsApp,
  };

  return (
    <section id={SECTION_IDS.configurator} ref={sectionRef} className="relative scroll-mt-20 py-28 md:py-36">
      {/* luz ambiente discreta */}
      <div className="pointer-events-none absolute right-0 top-40 h-[520px] w-[520px] rounded-full bg-white/[0.035] blur-[140px]" />

      <div className="relative mx-auto max-w-[1400px] px-5 md:px-8">
        <SectionHeading index={sectionIndex(3, data.settings.process.enabled)} eyebrow={texts.eyebrow} title={texts.title} text={texts.text} />

        <Reveal delay={0.1} className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-6">
          <StepIndicator progress={progress} labels={plans.length ? ['Plano', 'Avulsos', 'Investimento'] : ['Formato', 'Quantidade', 'Investimento']} />
          <div className="flex flex-wrap items-center gap-4">
            {texts.highlight && (
              <span className="glass-pill inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[12.5px] text-bone/85">
                <Smartphone className="h-3.5 w-3.5 text-accent" />
                {texts.highlight}
              </span>
            )}
            {builder.lines.length > 0 && (
              <button type="button" onClick={builder.reset} className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-fog transition hover:text-bone">
                Limpar seleção
              </button>
            )}
          </div>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-10 2xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-12">
            {plans.length > 0 && (
              <div>
                <p className="eyebrow mb-5">
                  <span className="text-bone/40">Etapa 01 — </span>
                  {texts.stepPlanLabel}
                </p>
                <div role="radiogroup" aria-label={texts.stepPlanLabel} className="grid gap-4 md:grid-cols-3">
                  {plans.map((service, i) => (
                    <PlanCard
                      key={service.id}
                      index={i}
                      service={service}
                      selected={builder.isSelected(service.id)}
                      onSelect={() => builder.toggle(service.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {units.length > 0 && (
              <div>
                <p className="eyebrow mb-5">
                  <span className="text-bone/40">Etapa {plans.length ? '02' : '01'} — </span>
                  {texts.stepTypeLabel}
                  {plans.length > 0 && <span className="text-bone/40"> (opcional)</span>}
                </p>
                <div className="grid gap-4 xl:grid-cols-3">
                  {units.map((service, i) => (
                    <ServiceCard
                      key={service.id}
                      index={i}
                      service={service}
                      image={media(service.imageId)}
                      selected={builder.isSelected(service.id)}
                      quantity={builder.quantities[service.id] ?? service.defaultQty}
                      onToggle={() => builder.toggle(service.id)}
                      onQuantity={(v) => setQuantity(service.id, v)}
                    />
                  ))}
                </div>
              </div>
            )}

            {(selectedUnits > 0 || plans.length === 0) && (
              <Reveal delay={0.1}>
                <QuantityPanel
                  step={plans.length ? '03' : '02'}
                  question={texts.quantityQuestion}
                  services={units}
                  quantities={builder.quantities}
                  onQuantity={setQuantity}
                  onRemove={builder.remove}
                  emptyText={texts.emptyText}
                />
              </Reveal>
            )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <QuoteSummary {...summaryProps} />
            </div>
          </aside>
        </div>
      </div>

      <MobileQuoteBar
        visible={(inView || (pastHero && builder.lines.length > 0)) && !sheetOpen && !requestOpen}
        totalCents={builder.totalCents}
        count={builder.lines.length}
        label={texts.summaryTitle}
        onOpen={() => setSheetOpen(true)}
      />

      <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} variant="sheet" label={texts.summaryTitle} className="lg:hidden">
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20" />
        <QuoteSummary {...summaryProps} compact className="border-0 bg-transparent shadow-none backdrop-blur-none" />
      </Modal>

      <RequestModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        lines={builder.lines}
        totalCents={builder.totalCents}
        busy={busy}
        error={error}
        onSubmit={(client) => submit('request', builder.items, preview, client)}
      />
    </section>
  );
}
