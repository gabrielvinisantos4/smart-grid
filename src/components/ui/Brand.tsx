import { useSiteData } from '@/hooks/useSiteData';
import { cn } from '@/lib/cn';

/** Logo enviado no painel ou, na ausência dele, wordmark tipográfico. */
export function Brand({ className }: { className?: string }) {
  const { data, media } = useSiteData();
  const brand = data?.settings.brand;
  const logo = media(brand?.logoId);
  if (logo) return <img src={logo.url} alt={brand?.name ?? ''} className={cn('h-7 w-auto object-contain', className)} />;

  return (
    <span className={cn('flex items-center gap-2.5 text-[15px] font-medium tracking-[-0.02em] text-bone', className)}>
      <span className="relative flex h-6 w-6 items-center justify-center rounded-full border border-white/40">
        <span className="h-1.5 w-1.5 rounded-full bg-bone" />
      </span>
      {brand?.name ?? ''}
    </span>
  );
}
