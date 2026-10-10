import { ArrowUpRight, Mail, MapPin } from 'lucide-react';
import { useSiteData } from '@/hooks/useSiteData';
import { Brand } from '@/components/ui/Brand';
import { InstagramIcon, WhatsAppIcon } from '@/components/ui/SocialIcons';
import { publicNav } from '@/data/navigation';
import { SECTION_IDS } from '@/config/site';
import { formatPhoneBR } from '@shared/pricing';

export function Footer() {
  const { data } = useSiteData();
  if (!data) return null;
  const { brand, contact, footer } = data.settings;
  const contacts = [
    ...contact.instagrams.map((handle) => ({ icon: InstagramIcon, label: `@${handle}`, href: `https://instagram.com/${handle}` })),
    ...contact.whatsapps.map((p) => ({
      icon: WhatsAppIcon,
      label: p.name ? `${p.name} · ${formatPhoneBR(p.number)}` : formatPhoneBR(p.number),
      href: `https://wa.me/${p.number}`,
    })),
    contact.email && { icon: Mail, label: contact.email, href: `mailto:${contact.email}` },
  ].filter(Boolean) as { icon: typeof Mail; label: string; href: string }[];

  return (
    <footer id={SECTION_IDS.contact} className="end-bg end-fg relative overflow-hidden pb-28 pt-20 lg:pb-10">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Brand inherit />
            <p className="end-muted mt-6 max-w-sm text-[15px] leading-relaxed">{footer.text}</p>
            {contact.city && (
              <p className="end-faint mt-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em]">
                <MapPin className="h-3.5 w-3.5" /> {contact.city}
              </p>
            )}
          </div>
          <div className="md:col-span-3">
            <p className="eyebrow end-faint">Navegação</p>
            <ul className="mt-5 space-y-3">
              {publicNav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="end-link text-[15px]">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-4">
            <p className="eyebrow end-faint">Contato</p>
            <ul className="mt-5 space-y-3">
              {contacts.map(({ icon: Icon, label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="end-link group flex items-center gap-3 text-[15px]"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p
          aria-hidden
          className="pointer-events-none mt-20 select-none whitespace-nowrap pb-[0.06em] text-center text-[min(17vw,15rem)] font-medium leading-[0.85] tracking-[-0.06em] text-transparent"
          style={{
            backgroundImage: 'linear-gradient(180deg, color-mix(in srgb, var(--end-fg) 18%, transparent), color-mix(in srgb, var(--end-fg) 2%, transparent))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}
        >
          {brand.name}
        </p>

        <div className="end-line end-faint mt-8 flex flex-col items-center justify-between gap-3 border-t pt-6 font-mono text-[11px] uppercase tracking-[0.18em] sm:flex-row">
          <span>
            © {new Date().getFullYear()} {brand.name}
          </span>
          <span>{brand.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
