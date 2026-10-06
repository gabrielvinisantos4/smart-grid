import { useState, type ImgHTMLAttributes } from 'react';
import type { MediaAsset } from '@shared/types';
import { cn } from '@/lib/cn';

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  media: MediaAsset | null;
  alt?: string;
  grayscale?: boolean;
  /** Largura sugerida para imagens remotas otimizáveis (Unsplash). */
  width?: number;
}

function sizedUrl(url: string, width?: number) {
  if (!width || !url.includes('images.unsplash.com')) return url;
  return url.replace(/([?&])w=\d+/, `$1w=${width}`);
}

/** Imagem com fade-in ao carregar e fundo neutro enquanto carrega/falha. */
export function SmartImage({ media, alt, grayscale, className, width, loading = 'lazy', ...props }: Props) {
  const [loaded, setLoaded] = useState(false);
  if (!media) return <div className={cn('bg-gradient-to-br from-ink-200 to-ink-50', className)} aria-hidden />;
  return (
    <img
      src={sizedUrl(media.url, width)}
      alt={alt ?? media.alt}
      loading={loading}
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={cn(
        'bg-ink-100 object-cover transition-[opacity,filter,transform] duration-[1200ms] ease-[var(--ease-cine)]',
        loaded ? 'opacity-100' : 'opacity-0',
        grayscale && 'grayscale',
        className,
      )}
      {...props}
    />
  );
}
