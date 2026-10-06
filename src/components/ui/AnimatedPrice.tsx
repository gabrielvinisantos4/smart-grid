import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { formatBRL } from '@/lib/format';
import { cn } from '@/lib/cn';

/** Valor em reais que "rola" suavemente até o novo total. */
export function AnimatedPrice({ cents, className, split = false }: { cents: number; className?: string; split?: boolean }) {
  const animated = useAnimatedNumber(cents);
  const formatted = formatBRL(animated);
  if (!split) return <span className={cn('tabular-nums', className)}>{formatted}</span>;

  const [integer, decimals] = formatted.split(',');
  return (
    <span className={cn('tabular-nums', className)} aria-label={formatBRL(cents)}>
      {integer}
      <span className="text-[0.5em] align-top text-bone/50">,{decimals}</span>
    </span>
  );
}
