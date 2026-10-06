import { ArrowUpRight, Eye, Play } from 'lucide-react';
import { motion } from 'motion/react';
import type { ResultItem } from '@shared/types';
import { useSiteData } from '@/hooks/useSiteData';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SmartImage } from '@/components/ui/SmartImage';
import { Reveal } from '@/components/ui/Reveal';
import { SECTION_IDS, MOTION } from '@/config/site';
import { cn } from '@/lib/cn';

function profileUrl(item: ResultItem): string | null {
  if (item.url) return item.url;
  return item.handle ? `https://instagram.com/${item.handle}` : null;
}

/**
 * Vitrine de Reels/TikToks: o print do vídeo como foi publicado e, abaixo,
 * quem é a pessoa/marca e quantas visualizações o vídeo alcançou.
 */
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
            <span className="text-[clamp(3rem,7vw,5.5rem)] font-medium leading-none tracking-[-0.05em] text-bone">{results.highlightValue}</span>
            <span className="max-w-xs pb-2 text-[15px] leading-snug text-mist">{results.highlightLabel}</span>
          </Reveal>
        )}
      </div>

      <div className="no-scrollbar relative mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 md:px-8 lg:mx-auto lg:grid lg:max-w-[1400px] lg:grid-cols-5 lg:overflow-visible">
        {results.items.map((item, i) => {
          const link = profileUrl(item);
          const name = item.client || item.niche;
          const Wrapper = link ? 'a' : 'div';
          return (
            <motion.figure
              key={item.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 1, ease: MOTION.ease, delay: i * 0.08 }}
              className={cn('w-[64vw] shrink-0 snap-center sm:w-[42vw] lg:w-auto', i % 2 === 1 && 'lg:mt-14')}
            >
              <Wrapper
                {...(link ? { href: link, target: '_blank', rel: 'noreferrer', 'aria-label': `Ver ${name} no Instagram` } : {})}
                className="group relative block aspect-[9/16] overflow-hidden rounded-[22px] border border-white/[0.08] bg-ink-100 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)]"
              >
                {/* O print aparece como foi publicado, sem filtro P&B. */}
                <SmartImage
                  media={media(item.mediaId)}
                  alt={name ? `Vídeo de ${name} com ${item.views} visualizações` : undefined}
                  width={700}
                  className="absolute inset-0 h-full w-full transition-transform duration-[1400ms] ease-[var(--ease-cine)] group-hover:scale-[1.04]"
                />
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                {item.caption && (
                  <p className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center text-[15px] font-medium leading-snug text-white [text-shadow:0_2px_12px_rgb(0_0_0/0.6)]">
                    {item.caption}
                  </p>
                )}
                {link && (
                  <span className="glass-pill absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    <Play className="h-3.5 w-3.5 fill-bone text-bone" />
                  </span>
                )}
              </Wrapper>

              {/* Quem é a pessoa */}
              <figcaption className="mt-4 flex items-start gap-3 px-1">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[13px] font-medium uppercase text-bone">
                  {(item.client || item.handle || item.niche || '•').slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  {name && <span className="block truncate text-[14.5px] font-medium tracking-[-0.01em] text-bone">{name}</span>}
                  {item.handle ? (
                    link ? (
                      <a href={link} target="_blank" rel="noreferrer" className="group/handle inline-flex items-center gap-1 truncate text-[12.5px] text-mist transition hover:text-bone">
                        @{item.handle}
                        <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover/handle:opacity-100" />
                      </a>
                    ) : (
                      <span className="block truncate text-[12.5px] text-mist">@{item.handle}</span>
                    )
                  ) : (
                    item.client && item.niche && <span className="block truncate text-[12.5px] text-mist">{item.niche}</span>
                  )}
                  <span className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] tabular-nums tracking-[0.04em] text-bone/70">
                    <Eye className="h-3.5 w-3.5" />
                    {item.views} visualizações
                  </span>
                </span>
              </figcaption>
            </motion.figure>
          );
        })}
      </div>
    </section>
  );
}
