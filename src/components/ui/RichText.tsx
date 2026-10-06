import { Fragment } from 'react';
import { cn } from '@/lib/cn';

/**
 * Renderiza textos editáveis no painel: trechos entre *asteriscos* viram
 * itálico serifado (assinatura tipográfica da marca).
 */
export function RichText({ text, accentClassName }: { text: string; accentClassName?: string }) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('*') && part.endsWith('*') ? (
          <em key={i} className={cn('font-serif font-normal italic tracking-[-0.02em]', accentClassName)}>
            {part.slice(1, -1)}
          </em>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

export function plainText(text: string): string {
  return text.replace(/\*/g, '');
}
