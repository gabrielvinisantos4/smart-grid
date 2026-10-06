import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Maximize2, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useSiteData } from '@/hooks/useSiteData';
import { useLockBody } from '@/hooks/useLockBody';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SmartImage } from '@/components/ui/SmartImage';
import { GALLERY_LAYOUTS, composeRows } from '@/data/galleryLayouts';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { SECTION_IDS, MOTION } from '@/config/site';
import { cn } from '@/lib/cn';

export function Gallery() {
  const { data, media } = useSiteData();
  const [active, setActive] = useState<number | null>(null);
  const items = data?.settings.gallery.items ?? [];
  const desktop = useMediaQuery('(min-width: 1024px)');
  const tablet = useMediaQuery('(min-width: 640px)');
  useLockBody(active !== null);

  const go = useCallback(
    (delta: number) => setActive((i) => (i === null ? i : (i + delta + items.length) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, go]);

  if (!data || items.length === 0) return null;
  const { gallery } = data.settings;
  const current = active !== null ? items[active] : null;

  return (
    <section id={SECTION_IDS.gallery} className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <SectionHeading index="04" eyebrow={gallery.eyebrow} title={gallery.title} text={gallery.text} />

        <div className="mt-16 flex flex-col gap-2.5 md:mt-24 md:gap-3">
          {composeRows(
            items.map((item, index) => ({ ...item, index })),
            desktop ? [3.3, 2.4, 3.9] : tablet ? [2.2, 2.8] : [1.5, 1.9],
          ).map((row, r) => (
            <div key={r} className="flex gap-2.5 md:gap-3">
              {row.map((item) => {
                const aspect = GALLERY_LAYOUTS[item.layout].aspect;
                return (
                  <motion.button
                    type="button"
                    key={item.id}
                    onClick={() => setActive(item.index)}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-8% 0px' }}
                    transition={{ duration: 1.1, ease: MOTION.ease, delay: (item.index % 4) * 0.07 }}
                    style={{ flexGrow: aspect, flexBasis: 0, aspectRatio: aspect }}
                    className="group relative min-w-0 overflow-hidden rounded-[18px] border border-white/[0.06] bg-ink-100 text-left md:rounded-[22px]"
                    aria-label={`Ampliar: ${item.caption || item.label}`}
                  >
                    <SmartImage
                      media={media(item.mediaId)}
                      width={item.layout === 'large' ? 1600 : 1000}
                      className={cn(
                        'absolute inset-0 h-full w-full scale-[1.01] transition-[transform,filter] duration-[1600ms] ease-[var(--ease-cine)] group-hover:scale-[1.06]',
                        item.grayscale && 'grayscale group-hover:grayscale-[35%]',
                      )}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/20 opacity-80 transition-opacity duration-700 group-hover:opacity-100" />
                    <span className="absolute left-3 top-3 font-mono text-[10px] tracking-[0.2em] text-bone/70 md:left-4 md:top-4">{item.label}</span>
                    <span className="glass-pill absolute right-3 top-3 flex h-8 w-8 scale-90 items-center justify-center rounded-full opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100 md:right-4 md:top-4">
                      <Maximize2 className="h-3.5 w-3.5" />
                    </span>
                    {item.caption && (
                      <span className="absolute bottom-3 left-3 right-3 translate-y-1 text-[13px] font-medium tracking-[-0.01em] text-bone/90 transition-transform duration-700 ease-[var(--ease-cine)] group-hover:translate-y-0 md:bottom-4 md:left-4 md:text-sm">
                        {item.caption}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {current && (
            <motion.div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl md:p-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActive(null)}
              role="dialog"
              aria-modal="true"
              aria-label={current.caption || 'Imagem do portfólio'}
            >
              <motion.figure
                key={current.id}
                initial={{ opacity: 0, scale: 0.97, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.5, ease: MOTION.ease }}
                className="relative flex max-h-full max-w-6xl flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <SmartImage
                  media={media(current.mediaId)}
                  width={2400}
                  loading="eager"
                  className={cn('max-h-[78svh] w-auto rounded-2xl object-contain', current.grayscale && 'grayscale')}
                />
                <figcaption className="mt-5 flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-bone/60">
                  <span>{current.label}</span>
                  <span className="h-px w-6 bg-white/20" />
                  <span className="text-bone/85">{current.caption}</span>
                </figcaption>
              </motion.figure>
              <button onClick={() => setActive(null)} className="glass-pill absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full" aria-label="Fechar">
                <X className="h-4 w-4" />
              </button>
              <button onClick={(e) => (e.stopPropagation(), go(-1))} className="glass-pill absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full md:left-8" aria-label="Anterior">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button onClick={(e) => (e.stopPropagation(), go(1))} className="glass-pill absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full md:right-8" aria-label="Próxima">
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </section>
  );
}
