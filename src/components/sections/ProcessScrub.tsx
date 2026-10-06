import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { ChevronsDown, Circle } from 'lucide-react';
import { useSiteData } from '@/hooks/useSiteData';
import { useFrameSequence } from '@/hooks/useFrameSequence';
import { RichText } from '@/components/ui/RichText';
import { SECTION_IDS, MOTION } from '@/config/site';
import { pad } from '@/lib/format';
import { cn } from '@/lib/cn';

/** Desenha a imagem cobrindo o canvas inteiro (equivalente a object-fit: cover). */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, alpha = 1) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  ctx.globalAlpha = 1;
}

function Timeline({ progress, frameRef }: { progress: ReturnType<typeof useScroll>['scrollYProgress']; frameRef: React.RefObject<HTMLSpanElement | null> }) {
  const left = useTransform(progress, (p) => `${Math.min(100, Math.max(0, p * 100))}%`);
  return (
    <div className="w-full">
      <div className="relative h-7">
        {/* trilhas de clipes, como numa timeline de edição */}
        <div className="absolute inset-x-0 top-1 flex h-2 gap-[3px]">
          {[18, 9, 14, 22, 7, 12, 18].map((w, i) => (
            <span key={i} className="h-full rounded-[2px] bg-white/15" style={{ flexGrow: w }} />
          ))}
        </div>
        <div className="absolute inset-x-0 top-4 flex h-1.5 gap-[3px]">
          {[30, 12, 26, 32].map((w, i) => (
            <span key={i} className="h-full rounded-[2px] bg-white/[0.08]" style={{ flexGrow: w }} />
          ))}
        </div>
        <motion.span style={{ left }} className="absolute -top-1 bottom-0 w-px -translate-x-1/2 bg-accent">
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-accent" />
        </motion.span>
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] tabular-nums tracking-[0.18em] text-bone/55">
        <span>TIMELINE · V1</span>
        <span ref={frameRef}>FRAME 001</span>
      </div>
    </div>
  );
}

/**
 * Seção "Processo": o vídeo de bastidores avança e volta conforme a rolagem.
 * Os quadros são desenhados num canvas (em vez de controlar um <video>), o que
 * mantém a rolagem fluida também no iPhone e no Android.
 */
export function ProcessScrub() {
  const { data } = useSiteData();
  const process = data?.settings.process;
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timecodeRef = useRef<HTMLSpanElement>(null);
  const frameRefDesktop = useRef<HTMLSpanElement>(null);
  const frameRefMobile = useRef<HTMLSpanElement>(null);
  const near = useInView(sectionRef, { margin: '150% 0px 150% 0px', once: true });
  const { manifest, loaded, nearest } = useFrameSequence(process?.enabled ? process.framesPath : '', near);
  const steps = process?.steps ?? [];
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  const draw = useCallback(
    (p: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx || !manifest) return;
      const exact = Math.min(1, Math.max(0, p)) * (manifest.frames - 1);
      const i = Math.floor(exact);
      const t = exact - i;
      const a = nearest(i);
      if (!a) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCover(ctx, a, canvas.width, canvas.height);
      // Mistura com o próximo quadro: a rolagem parece contínua mesmo com poucos quadros.
      const b = t > 0.02 ? nearest(i + 1) : null;
      if (b && b !== a) drawCover(ctx, b, canvas.width, canvas.height, t);

      const seconds = exact / manifest.fps;
      const frameNo = `FRAME ${pad(i + 1, 3)} / ${pad(manifest.frames, 3)}`;
      if (timecodeRef.current) {
        timecodeRef.current.textContent = `00:00:${pad(Math.floor(seconds))}:${pad(Math.floor((seconds % 1) * 24))}`;
      }
      for (const ref of [frameRefDesktop, frameRefMobile]) if (ref.current) ref.current.textContent = frameNo;
    },
    [manifest, nearest],
  );

  // Mantém a resolução do canvas igual ao tamanho exibido (nítido em telas retina).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      draw(scrollYProgress.get());
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    return () => observer.disconnect();
  }, [draw, scrollYProgress]);

  // Redesenha quando novos quadros chegam.
  useEffect(() => {
    draw(scrollYProgress.get());
  }, [loaded, draw, scrollYProgress]);

  const frame = useRef(0);
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => draw(p));
    const next = Math.min(steps.length - 1, Math.floor(p * steps.length));
    setStep((s) => (s === next ? s : Math.max(0, next)));
    setStarted(p > 0.03);
  });

  if (!data || !process?.enabled) return null;
  const current = steps[step];
  const ready = loaded > 0;

  return (
    <section id={SECTION_IDS.process} ref={sectionRef} className="relative h-[300vh] lg:h-[340vh]" aria-label={process.eyebrow}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="relative mx-auto grid h-full max-w-[1400px] items-center gap-12 px-5 md:px-8 lg:grid-cols-12">
          {/* Texto — desktop */}
          <div className="hidden lg:col-span-5 lg:block">
            <p className="eyebrow flex items-center gap-3">
              <span className="text-bone/40">(02)</span>
              <span className="h-px w-8 bg-white/20" />
              {process.eyebrow}
            </p>
            <h2 className="display mt-6 text-[clamp(2.4rem,4.6vw,4.6rem)] text-bone">
              <RichText text={process.title} accentClassName="text-accent" />
            </h2>
            {process.text && <p className="mt-5 max-w-md text-[15px] leading-relaxed text-mist">{process.text}</p>}

            <ol className="mt-10 space-y-1">
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

          {/* Vídeo: tela cheia no celular, “monitor” no desktop */}
          <div className="absolute inset-0 lg:relative lg:inset-auto lg:col-span-7 lg:flex lg:justify-center">
            <div className="relative h-full w-full overflow-hidden lg:aspect-[3/4] lg:h-[min(78svh,760px)] lg:w-auto lg:rounded-[30px] lg:border lg:border-white/[0.09] lg:shadow-[0_60px_140px_-40px_rgb(0_0_0/0.95)]">
              <canvas ref={canvasRef} className={cn('h-full w-full bg-ink-100 transition-opacity duration-700', ready ? 'opacity-100' : 'opacity-0')} />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="h-2 w-2 animate-pulse-dot rounded-full bg-bone/70" />
                </div>
              )}

              {/* Gradientes de leitura */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85 lg:from-black/40 lg:to-black/70" />

              {/* HUD superior */}
              <div className="absolute inset-x-5 top-24 flex items-center justify-between font-mono text-[10.5px] tracking-[0.2em] text-bone/70 lg:top-5">
                <span className="flex items-center gap-2">
                  <Circle className="h-2.5 w-2.5 animate-pulse-dot fill-red-500 text-red-500" />
                  EDIT
                </span>
                <span ref={timecodeRef} className="tabular-nums">
                  00:00:00:00
                </span>
              </div>

              {/* Timeline — desktop */}
              <div className="absolute inset-x-6 bottom-6 hidden lg:block">
                <Timeline progress={scrollYProgress} frameRef={frameRefDesktop} />
              </div>
            </div>
          </div>

          {/* Texto — mobile, sobre o vídeo */}
          <div className="pointer-events-none absolute inset-x-0 top-0 px-5 pt-32 lg:hidden">
            <p className="eyebrow flex items-center gap-3">
              <span className="text-bone/50">(02)</span>
              <span className="h-px w-6 bg-white/30" />
              {process.eyebrow}
            </p>
            <h2 className="display mt-4 max-w-[14ch] text-[2.6rem] text-bone [text-shadow:0_2px_30px_rgb(0_0_0/0.5)]">
              <RichText text={process.title} accentClassName="text-accent" />
            </h2>
          </div>
          <div className="absolute inset-x-0 bottom-0 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:hidden">
            <div className="glass rounded-[24px] p-5">
              <AnimatePresence mode="wait" initial={false}>
                {current && (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.4, ease: MOTION.ease }}
                  >
                    <p className="font-mono text-[10.5px] tracking-[0.2em] text-bone/50">
                      {pad(step + 1)} / {pad(steps.length)}
                    </p>
                    <p className="mt-1.5 text-xl font-medium tracking-[-0.03em] text-bone">{current.title}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-mist">{current.text}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-4">
                <Timeline progress={scrollYProgress} frameRef={frameRefMobile} />
              </div>
            </div>
          </div>

          {/* Dica de rolagem */}
          <AnimatePresence>
            {!started && ready && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-bone/45 lg:flex"
              >
                <ChevronsDown className="h-3.5 w-3.5 animate-float" /> ROLE PARA EDITAR
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
