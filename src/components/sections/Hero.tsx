import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react';
import { ArrowDown, Aperture, Circle } from 'lucide-react';
import { useSiteData } from '@/hooks/useSiteData';
import { LinkButton } from '@/components/ui/Button';
import { RichText } from '@/components/ui/RichText';
import { SmartImage } from '@/components/ui/SmartImage';
import { DynamicIcon } from '@/config/icons';
import { SECTION_IDS, MOTION } from '@/config/site';
import { formatBRL, pad } from '@/lib/format';

/** Posições das tags flutuantes de vidro (desktop). */
const TAG_SLOTS = [
  { className: 'right-[30%] top-[22%]', depth: 18, delay: 0 },
  { className: 'right-[7%] top-[34%]', depth: 30, delay: 1.2 },
  { className: 'right-[19%] top-[49%]', depth: 12, delay: 0.6 },
  { className: 'right-[31%] top-[63%]', depth: 24, delay: 1.8 },
  { className: 'right-[38%] top-[40%]', depth: 22, delay: 2.4 },
  { className: 'right-[14%] top-[16%]', depth: 14, delay: 3 },
];

function useTimecode() {
  const [frames, setFrames] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setFrames((f) => f + 1), 1000 / 24);
    return () => window.clearInterval(id);
  }, []);
  const s = Math.floor(frames / 24);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(frames % 24)}`;
}

function FloatingTag({ label, slot, mx, my }: { label: string; slot: (typeof TAG_SLOTS)[number]; mx: MotionValue<number>; my: MotionValue<number> }) {
  const x = useTransform(mx, (v) => v * slot.depth);
  const y = useTransform(my, (v) => v * slot.depth);
  return (
    <motion.div className={`absolute ${slot.className}`} style={{ x, y }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.2, ease: MOTION.ease, delay: 0.9 + slot.delay * 0.25 }}
      >
        <div
          className="glass flex animate-float items-center gap-2.5 rounded-full py-2 pl-2.5 pr-4"
          style={{ animationDelay: `${slot.delay}s` }}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          <span className="font-mono text-[11px] tracking-[0.22em] text-bone/90">{label}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  const { data, media } = useSiteData();
  const ref = useRef<HTMLElement>(null);
  const timecode = useTimecode();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 20 });
  const my = useSpring(rawY, { stiffness: 60, damping: 20 });

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  if (!data) return <section className="h-[100svh] min-h-[640px] bg-ink" />;
  const { hero } = data.settings;
  const services = data.services;
  // Mostra o plano mensal mais acessível; sem planos, o avulso mais barato.
  const plans = services.filter((s) => s.kind === 'plan');
  const priced = plans.length ? plans : services;
  const minPrice = priced.length ? Math.min(...priced.map((s) => s.priceCents)) : null;

  // Quebra o título em linhas após cada ponto final (ou em quebras de linha explícitas).
  const split = hero.title.includes('\n') ? hero.title.split('\n') : hero.title.split(/(?<=\.\*?)\s+/);
  const words = split.every((line) => (line.match(/\*/g)?.length ?? 0) % 2 === 0) ? split : [hero.title];

  return (
    <section
      id={SECTION_IDS.hero}
      ref={ref}
      onPointerMove={onPointerMove}
      className="relative flex h-[100svh] min-h-[680px] items-end overflow-hidden"
    >
      {/* Fotografia principal com parallax + ken burns */}
      <motion.div className="absolute inset-0" style={{ y: imageY }}>
        <div className="absolute inset-0 animate-kenburns">
          <SmartImage media={media(hero.imageId)} loading="eager" fetchPriority="high" className="h-full w-full object-[center_42%]" grayscale />
        </div>
      </motion.div>

      {/* Overlays cinematográficos */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/25 to-ink" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_35%,rgb(0_0_0/0.65)_100%)]" />

      {/* Guias de enquadramento (viewfinder) */}
      <div aria-hidden className="pointer-events-none absolute inset-4 hidden md:block md:inset-8">
        {['left-0 top-0 border-l border-t', 'right-0 top-0 border-r border-t', 'left-0 bottom-0 border-l border-b', 'right-0 bottom-0 border-r border-b'].map(
          (c) => (
            <span key={c} className={`absolute h-6 w-6 border-white/35 ${c}`} />
          ),
        )}
      </div>

      {/* HUD superior */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="pointer-events-none absolute left-0 right-0 top-24 hidden px-12 md:block"
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between font-mono text-[11px] tracking-[0.2em] text-bone/60">
          <span className="flex items-center gap-2">
            <Circle className="h-2.5 w-2.5 animate-pulse-dot fill-red-500 text-red-500" />
            REC <span className="tabular-nums text-bone/80">{timecode}</span>
          </span>
          <span>4K · 60FPS · GRAVADO NO CELULAR</span>
        </div>
      </motion.div>

      {/* Tags de vidro flutuantes */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        {hero.tags.slice(0, TAG_SLOTS.length).map((tag, i) => (
          <FloatingTag key={tag + i} label={tag} slot={TAG_SLOTS[i]} mx={mx} my={my} />
        ))}
      </div>

      {/* Conteúdo */}
      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="relative z-10 w-full pb-14 md:pb-20">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 md:px-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: MOTION.ease, delay: 0.3 }}
              className="glass-pill inline-flex max-w-full items-center gap-2.5 rounded-full px-3.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-bone/80 sm:text-[10.5px] sm:tracking-[0.22em]"
            >
              <Aperture className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{hero.eyebrow}</span>
            </motion.p>

            <h1 className="display mt-7 text-[clamp(3.1rem,10.5vw,9.5rem)] text-bone">
              {words.map((line, i) => (
                <span key={i} className="block overflow-hidden pb-[0.08em]">
                  <motion.span
                    className="block"
                    initial={{ y: '105%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 1.3, ease: MOTION.ease, delay: 0.45 + i * 0.14 }}
                  >
                    <RichText text={line} accentClassName="text-accent" />
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: MOTION.ease, delay: 0.85 }}
              className="mt-7 max-w-xl whitespace-pre-line text-[17px] leading-relaxed text-bone/70 md:text-lg"
            >
              {hero.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: MOTION.ease, delay: 1 }}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <LinkButton href={`#${SECTION_IDS.configurator}`} size="lg" arrow>
                {hero.ctaLabel}
              </LinkButton>
              {hero.secondaryCtaLabel && (
                <LinkButton href={`#${SECTION_IDS.gallery}`} size="lg" variant="glass">
                  {hero.secondaryCtaLabel}
                </LinkButton>
              )}
            </motion.div>

            {/* Tags no mobile */}
            <div className="no-scrollbar -mx-5 mt-10 flex gap-2 overflow-x-auto px-5 lg:hidden">
              {hero.tags.map((tag) => (
                <span key={tag} className="glass-pill shrink-0 rounded-full px-3.5 py-1.5 font-mono text-[10px] tracking-[0.2em] text-bone/80">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Card de vidro: investimento inicial */}
          {minPrice !== null && (
            <motion.div
              initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.2, ease: MOTION.ease, delay: 1.2 }}
              className="hidden lg:col-span-4 lg:flex lg:justify-end"
            >
              <a href={`#${SECTION_IDS.configurator}`} className="glass group block w-[300px] rounded-[26px] p-5 transition-transform duration-700 ease-[var(--ease-cine)] hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <span className="eyebrow">Plano sob medida</span>
                  <span className="flex -space-x-2">
                    {services.slice(0, 3).map((s) => (
                      <span key={s.id} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-ink/70 backdrop-blur">
                        <DynamicIcon name={s.icon} className="h-3.5 w-3.5 text-bone/80" />
                      </span>
                    ))}
                  </span>
                </div>
                <p className="mt-6 text-sm text-mist">{plans.length ? 'Planos mensais a partir de' : 'Conteúdos a partir de'}</p>
                <p className="mt-1 text-4xl font-medium tracking-[-0.04em] text-bone">
                  {formatBRL(minPrice)}
                  <span className="ml-1 text-sm font-normal tracking-normal text-mist">{plans.length ? '/mês' : '/unidade'}</span>
                </p>
                <div className="hairline my-5" />
                <p className="flex items-center justify-between text-[13px] text-bone/80">
                  Gravação profissional com celular
                  <ArrowDown className="h-4 w-4 transition-transform duration-500 group-hover:translate-y-0.5" />
                </p>
              </a>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Indicador de scroll */}
      <div aria-hidden className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex">
        <span className="font-mono text-[10px] tracking-[0.3em] text-bone/40">SCROLL</span>
        <span className="relative h-10 w-px overflow-hidden bg-white/10">
          <span className="absolute inset-0 animate-scroll-line bg-bone/70" />
        </span>
      </div>
    </section>
  );
}
