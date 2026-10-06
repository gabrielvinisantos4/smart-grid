import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useSiteData } from '@/hooks/useSiteData';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SmartImage } from '@/components/ui/SmartImage';
import { Reveal } from '@/components/ui/Reveal';
import { SECTION_IDS } from '@/config/site';
import { pad } from '@/lib/format';

export function About() {
  const { data, media } = useSiteData();
  const imageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: imageRef, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  if (!data) return null;
  const { about, hero } = data.settings;

  const marquee = [...hero.tags, ...data.services.map((s) => s.name)];

  return (
    <section id={SECTION_IDS.about} className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <SectionHeading index="01" eyebrow={about.eyebrow} title={about.title} />

        <div className="mt-16 grid gap-10 md:mt-24 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <div ref={imageRef} className="group relative aspect-[4/3] overflow-hidden rounded-[28px] border border-white/[0.06]">
              <motion.div style={{ y }} className="absolute inset-[-8%]">
                <SmartImage
                  media={media(about.imageId)}
                  className="h-full w-full grayscale transition-transform duration-[1600ms] group-hover:scale-[1.03]"
                />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="glass absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl px-5 py-4 sm:left-6 sm:right-auto sm:bottom-6 sm:gap-10">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-bone/80">Bastidores</span>
                <span className="font-mono text-[10.5px] tabular-nums tracking-[0.22em] text-bone/50">SC 04 · TK 12</span>
              </div>
            </div>
          </Reveal>

          <div className="flex flex-col justify-between lg:col-span-5">
            <Reveal delay={0.1}>
              <p className="text-xl leading-[1.55] tracking-[-0.01em] text-bone/85 md:text-[1.4rem]">{about.text}</p>
            </Reveal>
            <ul className="mt-12">
              {about.pillars.map((pillar, i) => (
                <Reveal key={pillar.title + i} delay={0.15 + i * 0.08}>
                  <li className="group grid grid-cols-[3rem_1fr] gap-4 border-t border-white/[0.08] py-6 transition-colors duration-500 hover:border-white/25">
                    <span className="font-mono text-xs text-bone/35 transition-colors group-hover:text-accent">{pad(i + 1)}</span>
                    <div>
                      <h3 className="text-lg font-medium tracking-[-0.02em] text-bone">{pillar.title}</h3>
                      <p className="mt-1.5 text-[15px] leading-relaxed text-mist">{pillar.text}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Faixa editorial */}
      <div aria-hidden className="mt-28 overflow-hidden border-y border-white/[0.06] py-8 md:mt-36">
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap">
          {[...marquee, ...marquee, ...marquee, ...marquee].map((word, i) => (
            <span key={i} className="flex items-center gap-12 text-[clamp(2.5rem,6vw,5rem)] font-medium uppercase tracking-[-0.04em]">
              <span className={i % 2 ? 'font-serif normal-case italic tracking-[-0.02em] text-bone/70' : 'text-outline'}>{word}</span>
              <span className="h-2 w-2 rounded-full bg-white/25" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
