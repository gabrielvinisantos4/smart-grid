import { Link } from 'react-router-dom';
import { ArrowUpRight, BadgeDollarSign, Clapperboard, Images, Inbox, TrendingUp } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { useAuth } from '@/hooks/useAuth';
import { formatBRL, formatDate } from '@/lib/format';
import { useResource } from '../hooks/useResource';
import { Card, EmptyState, PageHeader, Skeleton } from '../components/ui';
import { QuoteStatusBadge } from '../components/QuoteStatusBadge';

function Stat({ label, value, hint, icon: Icon }: { label: string; value: string; hint?: string; icon: typeof Inbox }) {
  return (
    <div className="glass spotlight relative overflow-hidden rounded-[24px] p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-mist">{label}</p>
        <Icon className="h-4 w-4 text-bone/40" strokeWidth={1.7} />
      </div>
      <p className="mt-5 text-[2rem] font-medium leading-none tracking-[-0.045em] tabular-nums">{value}</p>
      {hint && <p className="mt-2 text-[12px] text-fog">{hint}</p>}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, loading } = useResource(adminApi.dashboard);
  const max = Math.max(1, ...(data?.daily.map((d) => d.count) ?? [1]));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Dashboard" title={`${greeting}, ${user?.name.split(' ')[0] ?? ''}.`} description="Visão geral dos orçamentos gerados pelo configurador e do conteúdo publicado." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[132px] rounded-[24px]" />)
        ) : (
          <>
            <Stat label="Orçamentos no mês" value={String(data.quotesThisMonth)} hint={`${data.quotesTotal} no total`} icon={Inbox} />
            <Stat label="Valor estimado no mês" value={formatBRL(data.valueThisMonthCents)} hint="Soma dos planos montados" icon={TrendingUp} />
            <Stat label="Ticket médio" value={formatBRL(data.averageTicketCents)} hint="Por orçamento" icon={BadgeDollarSign} />
            <Stat label="Serviços ativos" value={`${data.activeServices}/${data.totalServices}`} hint={`${data.mediaCount} imagens na biblioteca`} icon={Clapperboard} />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Orçamentos — últimos 30 dias" description="Cada barra é um dia.">
          <div className="flex h-44 items-end gap-[3px]">
            {(data?.daily ?? Array.from({ length: 30 }, (_, i) => ({ date: String(i), count: 0 }))).map((d) => (
              <div key={d.date} className="group relative flex h-full flex-1 items-end">
                <div
                  className="w-full rounded-t-[4px] bg-gradient-to-t from-white/25 to-white/70 transition-all duration-700 group-hover:to-white"
                  style={{ height: `${Math.max(3, (d.count / max) * 100)}%`, opacity: d.count ? 1 : 0.25 }}
                />
                <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-bone px-2 py-1 font-mono text-[10px] text-ink group-hover:block">
                  {d.count} · {d.date.slice(8, 10)}/{d.date.slice(5, 7)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Formatos mais pedidos">
          {data && data.topServices.length > 0 ? (
            <ul className="space-y-4">
              {data.topServices.map((s) => {
                const pct = Math.round((s.quotes / Math.max(1, data.quotesTotal)) * 100);
                return (
                  <li key={s.serviceId}>
                    <div className="flex justify-between text-[13.5px]">
                      <span className="text-bone">{s.name}</span>
                      <span className="font-mono text-[11px] text-fog">
                        {s.quotes} pedidos · {s.quantity} un.
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-bone/80" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[13px] text-fog">Ainda sem dados. Os pedidos aparecem aqui assim que clientes montarem orçamentos.</p>
          )}
        </Card>
      </div>

      <Card
        title="Orçamentos recentes"
        actions={
          <Link to="/admin/orcamentos" className="flex items-center gap-1 text-[13px] text-bone/70 transition hover:text-bone">
            Ver todos <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      >
        {data && data.recentQuotes.length === 0 ? (
          <EmptyState icon={<Inbox className="h-5 w-5" />} title="Nenhum orçamento ainda" text="Compartilhe o link do site — cada plano enviado aparece aqui." />
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {data?.recentQuotes.map((q) => (
              <div key={q.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3.5">
                <span className="w-20 font-mono text-[12px] text-bone/70">{q.code}</span>
                <span className="min-w-[140px] flex-1 truncate text-[14px] text-bone">{q.clientName || q.lines.map((l) => `${l.quantity}× ${l.name}`).join(', ')}</span>
                <span className="text-[12.5px] text-fog">{formatDate(q.createdAt)}</span>
                <QuoteStatusBadge status={q.status} />
                <span className="w-28 text-right text-[14px] tabular-nums text-bone">{formatBRL(q.totalCents)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { to: '/admin/precos', label: 'Atualizar preços', icon: BadgeDollarSign },
          { to: '/admin/servicos', label: 'Gerenciar serviços', icon: Clapperboard },
          { to: '/admin/imagens', label: 'Trocar fotos', icon: Images },
        ].map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="glass group flex items-center justify-between rounded-[20px] px-5 py-4 transition hover:-translate-y-0.5 hover:border-white/20">
            <span className="flex items-center gap-3 text-[14px]">
              <Icon className="h-4 w-4 text-bone/60" /> {label}
            </span>
            <ArrowUpRight className="h-4 w-4 text-bone/40 transition group-hover:text-bone" />
          </Link>
        ))}
      </div>
    </div>
  );
}
