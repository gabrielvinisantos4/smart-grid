import { useSiteData } from '@/hooks/useSiteData';
import { cn } from '@/lib/cn';

/** Logo enviado no painel ou, na ausência dele, wordmark tipográfico. */
/** `inherit`: usa a cor do texto do pai (ex.: rodapé que muda de cor). */
export function Brand({ className, inherit }: { className?: string; inherit?: boolean }) {
  const { data, media } = useSiteData();
  const brand = data?.settings.brand;
  const logo = media(brand?.logoId);
  if (logo) return <img src={logo.url} alt={brand?.name ?? ''} className={cn('h-7 w-auto object-contain', className)} />;

  return (
    <span className={cn('flex items-center gap-2.5 text-[15px] font-medium tracking-[-0.02em]', !inherit && 'text-bone', className)}>
      <span
        className="relative flex h-6 w-6 items-center justify-center rounded-full border"
        style={{ borderColor: 'color-mix(in srgb, currentColor 40%, transparent)' }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      </span>
      {brand?.name ?? ''}
    </span>
  );
}
