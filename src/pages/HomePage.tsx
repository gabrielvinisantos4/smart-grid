import { AnimatePresence, motion } from 'motion/react';
import { useSiteData } from '@/hooks/useSiteData';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/sections/Hero';
import { About } from '@/components/sections/About';
import { Results } from '@/components/sections/Results';
import { ProcessScrub } from '@/components/sections/ProcessScrub';
import { Configurator } from '@/components/configurator/Configurator';
import { Gallery } from '@/components/sections/Gallery';
import { FinalCta } from '@/components/sections/FinalCta';
import { Button } from '@/components/ui/Button';

function Splash() {
  return (
    <motion.div
      key="splash"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink"
      exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
    >
      <div className="flex flex-col items-center gap-5">
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/30">
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-bone" />
        </span>
        <span className="font-mono text-[10px] tracking-[0.35em] text-bone/40">LOADING</span>
      </div>
    </motion.div>
  );
}

export function HomePage() {
  const { data, loading, error, reload } = useSiteData();

  if (error && !data) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="eyebrow">Sem conexão</p>
        <p className="max-w-sm text-mist">Não conseguimos carregar a página agora. Verifique sua conexão e tente novamente.</p>
        <Button onClick={() => void reload()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>{loading && <Splash />}</AnimatePresence>
      {data && (
        <>
          <Navbar />
          <main>
            <Hero />
            <About />
            <ProcessScrub />
            <Results />
            <Configurator />
            <Gallery />
            <FinalCta />
          </main>
          <Footer />
        </>
      )}
      <div aria-hidden className="grain" />
    </>
  );
}
