import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { useSiteData } from '@/hooks/useSiteData';
import { useQuoteBuilder } from '@/hooks/useQuoteBuilder';
import { useQuoteSubmit } from '@/hooks/useQuoteSubmit';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Modal } from '@/components/ui/Modal';
import { Reveal } from '@/components/ui/Reveal';
import { SECTION_IDS } from '@/config/site';
import { ServiceCard } from './ServiceCard';
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
  const progress = builder.lines.length === 0 ? 0 : touched ? 3 : 2;
  const preview = { lines: builder.lines, totalCents: builder.totalCents };

  const setQuantity = (id: string, value: number) => {
    setTouched(true);
    builder.setQuantity(id, value);
  };

  const openRequest = () => {
    setSheetOpen(false);
    setRequestOpen(true);
  };
  const sendWhatsApp = () => void submit('whatsapp', builder.items, preview);

  const summaryProps = {
    texts,
    lines: builder.lines,
    totalCents: builder.totalCents,
    totalUnits: builder.totalUnits,
    busy,
    onRequest: openRequest,
    onWhatsApp: sendWhatsApp,
  };

  return (
    <section id={SECTION_IDS.configurator} ref={sectionRef} className="relative scroll-mt-20 py-28 md:py-36">
      {/* luz ambiente discreta */}
      <div className="pointer-events-none absolute right-0 top-40 h-[520px] w-[520px] rounded-full bg-white/[0.035] blur-[140px]" />

      <div className="relative mx-auto max-w-[1400px] px-5 md:px-8">
        <SectionHeading index="03" eyebrow={texts.eyebrow} title={texts.title} text={texts.text} />

        <Reveal delay={0.1} className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-6">
          <StepIndicator progress={progress} />
          {builder.lines.length > 0 && (
            <button type="button" onClick={builder.reset} className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-fog transition hover:text-bone">
              Limpar seleção
            </button>
          )}
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-10 2xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0 space-y-8">
            <div>
              <p className="eyebrow mb-5">
                <span className="text-bone/40">Etapa 01 — </span>
                {texts.stepTypeLabel}
              </p>
              <div className="grid gap-4 xl:grid-cols-3">
                {services.map((service, i) => (
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

            <Reveal delay={0.1}>
              <QuantityPanel
                question={texts.quantityQuestion}
                services={services}
                quantities={builder.quantities}
                onQuantity={setQuantity}
                onRemove={builder.remove}
                emptyText={texts.emptyText}
              />
            </Reveal>
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
