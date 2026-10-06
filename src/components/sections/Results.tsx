import { Eye, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { useSiteData } from '@/hooks/useSiteData';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SmartImage } from '@/components/ui/SmartImage';
import { Reveal } from '@/components/ui/Reveal';
import { SECTION_IDS, MOTION } from '@/config/site';
import { cn } from '@/lib/cn';

/** Vitrine de Reels/TikToks com visualizações — prova social editável no painel. */
export function Results() {
  const { data, media } = useSiteData();
  if (!data || data.settings.results.items.length === 0) return null;
  const { results } = data.settings;

  return (
    <section id={SECTION_IDS.results} className="relative overflow-hidden py-28 md:py-36">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-white/[0.025] blur-[120px]" />
      <div className="relative mx-auto max-w-[1400px] px-5 md:px-8">
        <SectionHeading index="02" eyebrow={results.eyebrow} title={results.title} text={results.text} />

        {results.highlightValue && (
          <Reveal delay={0.1} className="mt-12 flex flex-wrap items-end gap-x-6 gap-y-2 border-t border-white/[0.08] pt-8">
            <span className="text-[clamp(3rem,7vw,5.5rem)] font-medium leading-none tracking-[-0.05em] text-bone">
              {results.highlightValue}
            </span>
            <span className="max-w-xs pb-2 text-[15px] leading-snug text-mist">{results.highlightLabel}</span>
          </Reveal>
        )}
      </div>

      <div className="no-scrollbar relative mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 md:px-8 lg:mx-auto lg:grid lg:max-w-[1400px] lg:grid-cols-5 lg:overflow-visible">
        {results.items.map((item, i) => {
          const Wrapper = item.url ? 'a' : 'div';
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 1, ease: MOTION.ease, delay: i * 0.08 }}
              className={cn('w-[64vw] shrink-0 snap-center sm:w-[42vw] lg:w-auto', i % 2 === 1 && 'lg:mt-14')}
            >
              <Wrapper
                {...(item.url ? { href: item.url, target: '_blank', rel: 'noreferrer' } : {})}
                className="group relative block aspect-[9/16] overflow-hidden rounded-[26px] border border-white/[0.08] bg-ink-100 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)]"
              >
                <SmartImage
                  media={media(item.mediaId)}
                  width={700}
                  className="absolute inset-0 h-full w-full transition-transform duration-[1400ms] ease-[var(--ease-cine)] group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/75" />

                <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
                  {item.client ? (
                    <span className="glass-pill rounded-full px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-bone/85">
                      {item.client}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="glass-pill flex h-8 w-8 items-center justify-center rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <Play className="h-3.5 w-3.5 fill-bone text-bone" />
                  </span>
                </div>

                {item.caption && (
                  <p className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center text-[15px] font-medium leading-snug text-white [text-shadow:0_2px_12px_rgb(0_0_0/0.6)]">
                    {item.caption}
                  </p>
                )}

                <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
                  <Eye className="h-4 w-4" />
                  <span className="text-[15px] font-semibold tracking-tight">{item.views}</span>
                </div>
              </Wrapper>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
