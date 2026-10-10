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
        <span className="h-2 w-2 animate-rec rounded-full bg-red-500 shadow-[0_0_8px_rgb(239_68_68/0.8)] motion-reduce:animate-none" />
      </span>
      {brand?.name ?? ''}
    </span>
  );
}
