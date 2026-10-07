import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useScroll, useTransform } from 'motion/react';
import { Circle, Pause, Play, Smartphone } from 'lucide-react';
import { useSiteData } from '@/hooks/useSiteData';
import { RichText } from '@/components/ui/RichText';
import { SECTION_IDS, MOTION } from '@/config/site';
import { pad } from '@/lib/format';
import { cn } from '@/lib/cn';

function timecode(seconds: number) {
  const s = Math.max(0, seconds);
  return `00:00:${pad(Math.floor(s))}:${pad(Math.floor((s % 1) * 24))}`;
}

/**
 * Seção "Processo": vídeo de bastidores em loop. Ao entrar na tela o vídeo
 * cresce e se endireita (animação ligada à rolagem); as etapas e a timeline
 * acompanham o tempo do vídeo.
 */
export function ProcessShowcase() {
  const { data } = useSiteData();
  const process = data?.settings.process;
  const steps = process?.steps ?? [];

  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const inView = useInView(frameRef, { margin: '-15% 0px' });

  // Entrada dinâmica: o quadro sai inclinado e menor e encaixa conforme a rolagem.
  const { scrollYProgress } = useScroll({ target: frameRef, offset: ['start end', 'center center'] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.78, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [80, 0]);
  const radius = useTransform(scrollYProgress, [0, 1], [56, 28]);
  const glow = useTransform(scrollYProgress, [0.4, 1], [0, 1]);

  // Toca só quando visível (economiza bateria) e respeita "reduzir movimento".
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (inView && !paused && !reduce) void video.play().catch(() => setPaused(true));
    else video.pause();
  }, [inView, paused]);

  // Timeline, timecode e etapa acompanham o tempo do vídeo.
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const video = videoRef.current;
      if (video && video.duration) {
        const p = video.currentTime / video.duration;
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
        if (timeRef.current) timeRef.current.textContent = timecode(video.currentTime);
        const next = Math.min(steps.length - 1, Math.floor(p * steps.length));
        setStep((s) => (s === next ? s : next));
      }
      frame = requestAnimationFrame(tick);
    };
    if (inView) frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, steps.length]);

  if (!data || !process?.enabled || !process.videoUrl) return null;
  const current = steps[step];

  return (
    <section id={SECTION_IDS.process} className="relative overflow-hidden py-28 md:py-40" aria-label={process.eyebrow}>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.03] blur-[140px]" />

      <div className="relative mx-auto grid max-w-[1400px] items-center gap-14 px-5 md:px-8 lg:grid-cols-12 lg:gap-12">
        {/* Texto + etapas */}
        <div className="lg:col-span-5">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: MOTION.ease }}
            className="eyebrow flex items-center gap-3"
          >
            <span className="text-bone/40">(02)</span>
            <span className="h-px w-8 bg-white/20" />
            {process.eyebrow}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: MOTION.ease, delay: 0.08 }}
            className="display mt-6 text-[clamp(2.4rem,5vw,4.6rem)] text-bone"
          >
            <RichText text={process.title} accentClassName="text-accent" />
          </motion.h2>
          {process.text && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: MOTION.ease, delay: 0.16 }}
              className="mt-5 max-w-md text-[15px] leading-relaxed text-mist"
            >
              {process.text}
            </motion.p>
          )}

          {/* Etapas — desktop: lista; celular: card com a etapa atual */}
          <ol className="mt-10 hidden space-y-1 lg:block">
            {steps.map((s, i) => (
              <li
                key={s.title + i}
                className={cn(
                  'grid grid-cols-[2.5rem_1fr] gap-3 border-l py-3 pl-5 transition-all duration-700 ease-[var(--ease-cine)]',
                  i === step ? 'border-bone text-bone' : 'border-white/10 text-bone/35',
                )}
              >
                <span className="pt-1 font-mono text-[11px]">{pad(i + 1)}</span>
                <div>
                  <p className="text-lg font-medium tracking-[-0.02em]">{s.title}</p>
                  <div className={cn('grid transition-all duration-700 ease-[var(--ease-cine)]', i === step ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                    <p className="overflow-hidden pt-1 text-[14px] leading-relaxed text-mist">{s.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Vídeo */}
        <div className="lg:col-span-7 [perspective:1400px]">
          <motion.div
            ref={frameRef}
            style={{ scale, rotateX, y, borderRadius: radius }}
            className="relative mx-auto aspect-[3/4] w-full max-w-[520px] overflow-hidden border border-white/[0.09] bg-ink-100 shadow-[0_60px_140px_-40px_rgb(0_0_0/0.95)] will-change-transform"
          >
            <video
              ref={videoRef}
              src={process.videoUrl}
              poster={process.posterUrl || undefined}
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
              aria-label="Bastidores de edição de vídeo"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/75" />
            <motion.div style={{ opacity: glow }} className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]" />

            {/* HUD */}
            <div className="absolute inset-x-5 top-5 flex items-center justify-between font-mono text-[10.5px] tracking-[0.2em] text-bone/75">
              <span className="flex items-center gap-2">
                <Circle className={cn('h-2.5 w-2.5 fill-red-500 text-red-500', !paused && 'animate-pulse-dot')} />
                REC
              </span>
              <span className="glass-pill flex items-center gap-1.5 rounded-full px-2.5 py-1 tracking-[0.14em]">
                <Smartphone className="h-3 w-3" /> MOBILE
              </span>
            </div>

            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="glass-pill absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full opacity-70 transition hover:opacity-100"
              aria-label={paused ? 'Reproduzir vídeo' : 'Pausar vídeo'}
            >
              {paused ? <Play className="h-4 w-4 fill-bone" /> : <Pause className="h-4 w-4 fill-bone" />}
            </button>

            {/* Etapa atual (celular) + timeline */}
            <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
              <div className="lg:hidden">
                <AnimatePresence mode="wait" initial={false}>
                  {current && (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4, ease: MOTION.ease }}
                      className="mb-4"
                    >
                      <p className="font-mono text-[10px] tracking-[0.2em] text-bone/55">
                        {pad(step + 1)} / {pad(steps.length)}
                      </p>
                      <p className="mt-1 text-xl font-medium tracking-[-0.03em] text-bone">{current.title}</p>
                      <p className="mt-0.5 text-[13.5px] leading-relaxed text-bone/70">{current.text}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="relative h-1 overflow-hidden rounded-full bg-white/15">
                <span ref={barRef} className="absolute inset-0 origin-left scale-x-0 rounded-full bg-accent" />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[10px] tabular-nums tracking-[0.18em] text-bone/55">
                <span>
                  {pad(step + 1)} · {current?.title.toUpperCase()}
                </span>
                <span ref={timeRef}>00:00:00:00</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
