import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useSiteData } from '@/hooks/useSiteData';
import { LinkButton } from '@/components/ui/Button';
import { RichText } from '@/components/ui/RichText';
import { SmartImage } from '@/components/ui/SmartImage';
import { Reveal } from '@/components/ui/Reveal';
import { InstagramIcon, WhatsAppIcon } from '@/components/ui/SocialIcons';
import { SECTION_IDS } from '@/config/site';

export function FinalCta() {
  const { data, media } = useSiteData();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.15, 1]);
  if (!data) return null;
  const { finalCta, contact } = data.settings;
  const whatsapp = contact.whatsapp.replace(/\D/g, '');

  return (
    <section className="px-3 pb-24 md:px-6">
      <div ref={ref} className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[32px] border border-white/[0.07] md:rounded-[44px]">
        <motion.div style={{ scale }} className="absolute inset-0">
          <SmartImage media={media(finalCta.imageId)} className="h-full w-full grayscale" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
        <div className="relative flex min-h-[560px] flex-col items-center justify-center px-6 py-24 text-center md:min-h-[640px]">
          <Reveal>
            <h2 className="display max-w-4xl text-[clamp(2.6rem,7vw,6.5rem)] text-bone">
              <RichText text={finalCta.title} accentClassName="text-accent" />
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-lg text-[17px] leading-relaxed text-bone/70">{finalCta.text}</p>
          </Reveal>
          <Reveal delay={0.2} className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href={`#${SECTION_IDS.configurator}`} size="lg" arrow>
              {finalCta.ctaLabel}
            </LinkButton>
            {whatsapp && (
              <LinkButton
                href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(contact.whatsappIntro)}`}
                target="_blank"
                rel="noreferrer"
                size="lg"
                variant="glass"
                icon={<WhatsAppIcon className="h-[18px] w-[18px]" />}
              >
                Falar no WhatsApp
              </LinkButton>
            )}
          </Reveal>
          {contact.instagrams.length > 0 && (
            <Reveal delay={0.3} className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-bone/45">Siga no Instagram</span>
              {contact.instagrams.map((handle) => (
                <a
                  key={handle}
                  href={`https://instagram.com/${handle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-[15px] text-bone/80 transition hover:text-bone"
                >
                  <InstagramIcon className="h-4 w-4" />@{handle}
                </a>
              ))}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
