import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { Brand } from '@/components/ui/Brand';
import { LinkButton } from '@/components/ui/Button';
import { InstagramIcon } from '@/components/ui/SocialIcons';
import { publicNav } from '@/data/navigation';
import { SECTION_IDS } from '@/config/site';
import { useSiteData } from '@/hooks/useSiteData';
import { cn } from '@/lib/cn';

export function Navbar() {
  const { data } = useSiteData();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const instagram = data?.settings.contact.instagram;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-5">
      <motion.nav
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className={cn(
          'mx-auto flex h-14 max-w-[1400px] items-center justify-between rounded-full pl-5 pr-2 transition-all duration-700 ease-[var(--ease-cine)]',
          scrolled ? 'glass' : 'border border-transparent',
        )}
      >
        <a href={`#${SECTION_IDS.hero}`} aria-label="Início">
          <Brand />
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {publicNav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="rounded-full px-4 py-2 text-[13px] text-bone/65 transition-colors duration-300 hover:text-bone"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {instagram && (
            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noreferrer"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-bone/70 transition hover:bg-white/5 hover:text-bone sm:flex"
              aria-label="Instagram"
            >
              <InstagramIcon className="h-[18px] w-[18px]" />
            </a>
          )}
          <LinkButton href={`#${SECTION_IDS.configurator}`} size="sm" arrow className="h-10">
            Orçamento
          </LinkButton>
          <button
            onClick={() => setOpen((v) => !v)}
            className="glass-pill flex h-10 w-10 items-center justify-center rounded-full lg:hidden"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong mx-auto mt-2 max-w-[1400px] rounded-[28px] p-3 lg:hidden"
          >
            {publicNav.map((item, i) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg tracking-tight text-bone/85 transition hover:bg-white/5"
              >
                {item.label}
                <span className="font-mono text-[11px] text-bone/30">0{i + 1}</span>
              </a>
            ))}
            <LinkButton href={`#${SECTION_IDS.configurator}`} onClick={() => setOpen(false)} arrow className="mt-2 w-full">
              Montar orçamento
            </LinkButton>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
