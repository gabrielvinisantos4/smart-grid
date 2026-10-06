import { ArrowUpRight, Mail, MapPin } from 'lucide-react';
import { useSiteData } from '@/hooks/useSiteData';
import { Brand } from '@/components/ui/Brand';
import { InstagramIcon, WhatsAppIcon } from '@/components/ui/SocialIcons';
import { publicNav } from '@/data/navigation';
import { SECTION_IDS } from '@/config/site';

export function Footer() {
  const { data } = useSiteData();
  if (!data) return null;
  const { brand, contact, footer } = data.settings;
  const whatsappDigits = contact.whatsapp.replace(/\D/g, '');

  const contacts = [
    ...contact.instagrams.map((handle) => ({ icon: InstagramIcon, label: `@${handle}`, href: `https://instagram.com/${handle}` })),
    whatsappDigits && { icon: WhatsAppIcon, label: 'WhatsApp', href: `https://wa.me/${whatsappDigits}` },
    contact.email && { icon: Mail, label: contact.email, href: `mailto:${contact.email}` },
  ].filter(Boolean) as { icon: typeof Mail; label: string; href: string }[];

  return (
    <footer id={SECTION_IDS.contact} className="relative overflow-hidden border-t border-white/[0.06] pb-28 pt-20 lg:pb-10">
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Brand />
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-mist">{footer.text}</p>
            {contact.city && (
              <p className="mt-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-fog">
                <MapPin className="h-3.5 w-3.5" /> {contact.city}
              </p>
            )}
          </div>
          <div className="md:col-span-3">
            <p className="eyebrow">Navegação</p>
            <ul className="mt-5 space-y-3">
              {publicNav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-[15px] text-bone/70 transition hover:text-bone">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-4">
            <p className="eyebrow">Contato</p>
            <ul className="mt-5 space-y-3">
              {contacts.map(({ icon: Icon, label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 text-[15px] text-bone/70 transition hover:text-bone"
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
          className="pointer-events-none mt-20 select-none whitespace-nowrap text-center text-[17vw] font-medium leading-[0.8] tracking-[-0.06em] text-transparent [background:linear-gradient(180deg,rgb(255_255_255/0.14),rgb(255_255_255/0))] [-webkit-background-clip:text] [background-clip:text]"
        >
          {brand.name}
        </p>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-fog sm:flex-row">
          <span>
            © {new Date().getFullYear()} {brand.name}
          </span>
          <span>{brand.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
