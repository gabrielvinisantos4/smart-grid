import { useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { Circle, Smartphone } from 'lucide-react';
import { useSiteData } from '@/hooks/useSiteData';
import { RichText } from '@/components/ui/RichText';
import { backdropTime } from '@/components/layout/ScrollVideoBackdrop';
import { SECTION_IDS, MOTION } from '@/config/site';
import { pad } from '@/lib/format';
import { cn } from '@/lib/cn';

function timecode(seconds: number) {
  const s = Math.max(0, seconds);
  return `00:00:${pad(Math.floor(s))}:${pad(Math.floor((s % 1) * 24))}`;
}

/**
 * Seção "Processo": fica presa na tela enquanto a pessoa rola, e as etapas avançam
 * com a rolagem. O vídeo de bastidores roda no fundo da página (ScrollVideoBackdrop)
 * e ganha foco aqui.
 */
export function ProcessShowcase() {
  const { data } = useSiteData();
  const process = data?.settings.process;
  const steps = process?.steps ?? [];
  const count = Math.max(1, steps.length);

  const trackRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const [step, setStep] = useState(0);

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const next = Math.min(count - 1, Math.floor(p * count));
    setStep((s) => (s === next ? s : next));
  });
  const titleY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%']);

  useMotionValueEvent(backdropTime, 'change', (t) => {
    if (timeRef.current) timeRef.current.textContent = timecode(t);
  });

  if (!data || !process?.enabled) return null;
  const current = steps[step];

  return (
    <section id={SECTION_IDS.process} className="relative" aria-label={process.eyebrow}>
      <div ref={trackRef} className="relative" style={{ height: `${count * 75 + 50}svh` }}>
        <div className="sticky top-0 flex h-svh items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-8 px-5 md:px-8 lg:grid-cols-12 lg:gap-12">
            {/* Título */}
            <motion.div style={{ y: titleY }} className="min-w-0 lg:col-span-5">
              <p className="eyebrow flex items-center gap-3">
                <span className="text-bone/40">(02)</span>
                <span className="h-px w-8 bg-white/20" />
                {process.eyebrow}
              </p>
              <h2 className="display mt-5 text-[clamp(2.2rem,5vw,4.6rem)] text-bone">
                <RichText text={process.title} accentClassName="text-accent" />
              </h2>
              {process.text && <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-bone/70 md:text-[15px]">{process.text}</p>}
            </motion.div>

            {/* Etapa atual */}
            <div className="min-w-0 lg:col-span-6 lg:col-start-7">
              <div className="flex items-center justify-between font-mono text-[10.5px] tracking-[0.2em] text-bone/70">
                <span className="flex items-center gap-2">
                  <Circle className="h-2.5 w-2.5 animate-pulse-dot fill-red-500 text-red-500" />
                  REC
                  <span ref={timeRef} className="ml-2 tabular-nums text-bone/50">
                    00:00:00:00
                  </span>
                </span>
                <span className="glass-pill flex items-center gap-1.5 rounded-full px-2.5 py-1 tracking-[0.14em]">
                  <Smartphone className="h-3 w-3" /> MOBILE
                </span>
              </div>

              <div className="relative mt-6 min-h-[200px] md:min-h-[260px]">
                <AnimatePresence mode="wait" initial={false}>
                  {current && (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, y: 40, filter: 'blur(12px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -40, filter: 'blur(12px)' }}
                      transition={{ duration: 0.55, ease: MOTION.ease }}
                    >
                      <p className="font-mono text-[clamp(4.5rem,11vw,9rem)] leading-none tracking-[-0.06em] text-transparent [-webkit-text-stroke:1px_rgb(255_255_255/0.35)]">
                        {pad(step + 1)}
                      </p>
                      <p className="mt-3 text-[clamp(1.8rem,3.4vw,3rem)] font-medium leading-[1.05] tracking-[-0.04em] text-bone">{current.title}</p>
                      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-bone/70">{current.text}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Linha do tempo: um segmento por etapa, preenchido conforme a rolagem */}
              <div className="mt-8 flex gap-1.5">
                {steps.map((s, i) => (
                  <StepSegment key={s.title + i} index={i} count={count} progress={scrollYProgress} />
                ))}
              </div>
              <div className="mt-3 flex gap-1.5 font-mono text-[10px] tracking-[0.16em]">
                {steps.map((s, i) => (
                  <span key={s.title + i} className={cn('flex-1 truncate transition-colors duration-500', i === step ? 'text-bone' : 'text-bone/35')}>
                    {pad(i + 1)}
                    <span className="hidden sm:inline"> · {s.title.toUpperCase()}</span>
                  </span>
                ))}
              </div>
              <p className="mt-6 font-mono text-[10px] tracking-[0.2em] text-bone/40 lg:hidden">
                ROLE PARA AVANÇAR
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepSegment({ index, count, progress }: { index: number; count: number; progress: ReturnType<typeof useScroll>['scrollYProgress'] }) {
  const fill = useTransform(progress, [index / count, (index + 1) / count], [0, 1], { clamp: true });
  return (
    <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-white/15">
      <motion.span style={{ scaleX: fill }} className="absolute inset-0 origin-left rounded-full bg-bone" />
    </span>
  );
}
