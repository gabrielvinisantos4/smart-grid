import { useCallback, useMemo, useState } from 'react';
import type { PublicService, QuoteItemInput } from '@shared/types';
import { buildQuoteLines, clampQuantity, sumLines } from '@shared/pricing';

/**
 * Estado do configurador: quais serviços estão selecionados e em que
 * quantidade. O cálculo usa as mesmas regras do servidor (shared/pricing).
 */
export function useQuoteBuilder(services: PublicService[]) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const byId = useMemo(() => new Map(services.map((s) => [s.id, s])), [services]);

  const toggle = useCallback(
    (id: string) => {
      setQuantities((current) => {
        const next = { ...current };
        if (next[id]) delete next[id];
        else {
          const service = byId.get(id);
          if (service) next[id] = service.defaultQty;
        }
        return next;
      });
    },
    [byId],
  );

  const setQuantity = useCallback(
    (id: string, quantity: number) => {
      const service = byId.get(id);
      if (!service) return;
      setQuantities((current) => ({ ...current, [id]: clampQuantity(service, quantity) }));
    },
    [byId],
  );

  const remove = useCallback((id: string) => {
    setQuantities((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const reset = useCallback(() => setQuantities({}), []);

  const items: QuoteItemInput[] = useMemo(
    () => services.filter((s) => quantities[s.id]).map((s) => ({ serviceId: s.id, quantity: quantities[s.id] })),
    [services, quantities],
  );
  const lines = useMemo(() => buildQuoteLines(services, items), [services, items]);
  const totalCents = useMemo(() => sumLines(lines), [lines]);
  const totalUnits = useMemo(() => lines.reduce((n, l) => n + l.quantity, 0), [lines]);

  return {
    quantities,
    isSelected: (id: string) => Boolean(quantities[id]),
    toggle,
    setQuantity,
    remove,
    reset,
    items,
    lines,
    totalCents,
    totalUnits,
  };
}

export type QuoteBuilder = ReturnType<typeof useQuoteBuilder>;
