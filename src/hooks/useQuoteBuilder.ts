import { useCallback, useMemo, useState } from 'react';
import type { PublicService, QuoteItemInput } from '@shared/types';
import { buildQuoteLines, clampQuantity, splitTotals, sumLines } from '@shared/pricing';

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
        const service = byId.get(id);
        if (next[id]) delete next[id];
        else if (service) {
          // Só um plano mensal por orçamento: escolher outro substitui o anterior.
          if (service.kind === 'plan') for (const s of byId.values()) if (s.kind === 'plan') delete next[s.id];
          next[id] = service.kind === 'plan' ? 1 : service.defaultQty;
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
  const totalUnits = useMemo(() => lines.filter((l) => l.kind !== 'plan').reduce((n, l) => n + l.quantity, 0), [lines]);
  const totals = useMemo(() => splitTotals(lines), [lines]);
  const plan = useMemo(() => lines.find((l) => l.kind === 'plan') ?? null, [lines]);

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
    totals,
    plan,
  };
}

export type QuoteBuilder = ReturnType<typeof useQuoteBuilder>;
