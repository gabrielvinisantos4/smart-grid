import { useEffect, useMemo, useState } from 'react';
import { BadgeDollarSign } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { useAuth } from '@/hooks/useAuth';
import { DynamicIcon } from '@/config/icons';
import { Button } from '@/components/ui/Button';
import { centsToInput, formatBRL, parseBRLToCents } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useResource } from '../hooks/useResource';
import { Card, EmptyState, PageHeader, ReadOnlyBanner, Skeleton } from '../components/ui';
import { useToast } from '../components/Toast';

export function PricesPage() {
  const { isOwner } = useAuth();
  const toast = useToast();
  const { data: services, setData, loading } = useResource(adminApi.services);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (services) setValues(Object.fromEntries(services.map((s) => [s.id, centsToInput(s.priceCents)])));
  }, [services]);

  const changes = useMemo(
    () =>
      (services ?? [])
        .map((s) => ({ id: s.id, before: s.priceCents, after: parseBRLToCents(values[s.id] ?? '') }))
        .filter((c) => c.after !== c.before),
    [services, values],
  );
  const invalid = changes.some((c) => c.after === null);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await adminApi.updatePrices(changes.map((c) => ({ id: c.id, priceCents: c.after as number })));
      setData(updated);
      toast('Preços atualizados — o configurador público já mostra os novos valores.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Tabela"
        title="Preços"
        description="Valor por unidade de cada formato. Ao salvar, o configurador público passa a usar os novos preços imediatamente."
        actions={
          isOwner && (
            <Button onClick={save} disabled={!changes.length || invalid || saving}>
              {saving ? 'Salvando…' : changes.length ? `Salvar alterações (${changes.length})` : 'Salvar alterações'}
            </Button>
          )
        }
      />
      {!isOwner && <ReadOnlyBanner />}

      <Card>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : !services?.length ? (
          <EmptyState icon={<BadgeDollarSign className="h-5 w-5" />} title="Nenhum serviço" text="Cadastre serviços para definir preços." />
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {services.map((service) => {
              const parsed = parseBRLToCents(values[service.id] ?? '');
              const changed = parsed !== service.priceCents;
              return (
                <div key={service.id} className="grid items-center gap-4 py-5 first:pt-0 last:pb-0 md:grid-cols-[1fr_260px_200px]">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                      <DynamicIcon name={service.icon} className="h-[18px] w-[18px]" strokeWidth={1.6} />
                    </span>
                    <div>
                      <p className="text-[15px]">
                        {service.name} {!service.active && <span className="text-[12px] text-fog">(inativo)</span>}
                      </p>
                      <p className="font-mono text-[11px] text-fog">{service.kind === 'plan' ? 'plano mensal · por mês' : `avulso · por ${service.unitSingular}`}</p>
                    </div>
                  </div>
                  <label className={cn('flex h-14 items-center rounded-2xl border bg-white/[0.035] pl-4 transition focus-within:border-white/35', parsed === null ? 'border-red-300/40' : changed ? 'border-amber-300/40' : 'border-white/10')}>
                    <span className="font-mono text-[13px] text-fog">R$</span>
                    <input
                      inputMode="decimal"
                      aria-label={`Preço de ${service.name}`}
                      disabled={!isOwner}
                      value={values[service.id] ?? ''}
                      onChange={(e) => setValues((v) => ({ ...v, [service.id]: e.target.value }))}
                      onBlur={() => parsed !== null && setValues((v) => ({ ...v, [service.id]: centsToInput(parsed) }))}
                      className="h-full w-full bg-transparent px-3 text-xl font-medium tabular-nums tracking-[-0.02em] text-bone outline-none disabled:opacity-70"
                    />
                  </label>
                  <div className="font-mono text-[11.5px] leading-relaxed text-fog md:text-right">
                    {changed && parsed !== null ? (
                      <>
                        <span className="line-through">{formatBRL(service.priceCents)}</span> → <span className="text-amber-200">{formatBRL(parsed)}</span>
                        {service.kind !== 'plan' && (
                          <>
                            <br />
                            {service.defaultQty} un. = {formatBRL(parsed * service.defaultQty)}
                          </>
                        )}
                      </>
                    ) : (
                      <>{service.kind === 'plan' ? `${formatBRL(service.priceCents)} por mês` : `${service.defaultQty} un. = ${formatBRL(service.priceCents * service.defaultQty)}`}</>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
