import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Inbox, MessageCircle, Trash2 } from 'lucide-react';
import { QUOTE_STATUS_LABELS, type Quote, type QuoteStatus } from '@shared/types';
import { unitLabel } from '@shared/pricing';
import { adminApi } from '@/services/adminApi';
import { useAuth } from '@/hooks/useAuth';
import { formatBRL, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useResource } from '../hooks/useResource';
import { Card, EmptyState, PageHeader, Select, Skeleton } from '../components/ui';
import { QuoteStatusBadge } from '../components/QuoteStatusBadge';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

const FILTERS: (QuoteStatus | 'all')[] = ['all', 'new', 'contacted', 'won', 'lost'];

function contactLink(contact: string | null): string | null {
  if (!contact) return null;
  if (contact.includes('@')) return `mailto:${contact}`;
  const digits = contact.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`;
}

export function QuotesPage() {
  const { isOwner } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, setData, loading } = useResource(() => adminApi.quotes());
  const [filter, setFilter] = useState<QuoteStatus | 'all'>('all');
  const [openId, setOpenId] = useState<number | null>(null);

  const quotes = (data?.items ?? []).filter((q) => filter === 'all' || q.status === filter);
  const count = (s: QuoteStatus | 'all') => (data?.items ?? []).filter((q) => s === 'all' || q.status === s).length;

  const setStatus = async (quote: Quote, status: QuoteStatus) => {
    try {
      const updated = await adminApi.updateQuoteStatus(quote.id, status);
      setData((d) => (d ? { ...d, items: d.items.map((q) => (q.id === quote.id ? updated : q)) } : d));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erro.', 'error');
    }
  };

  const remove = async (quote: Quote) => {
    if (!(await confirm({ title: `Excluir ${quote.code}?`, confirmLabel: 'Excluir', danger: true }))) return;
    try {
      await adminApi.deleteQuote(quote.id);
      setData((d) => (d ? { total: d.total - 1, items: d.items.filter((q) => q.id !== quote.id) } : d));
      toast('Orçamento excluído.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erro.', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Leads" title="Orçamentos" description="Todos os planos montados no site. O valor é sempre recalculado no servidor com os preços vigentes no momento do pedido." />

      <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn('flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] transition', filter === f ? 'bg-bone text-ink' : 'text-bone/60 hover:bg-white/5 hover:text-bone')}>
            {f === 'all' ? 'Todos' : QUOTE_STATUS_LABELS[f]}
            <span className={cn('font-mono text-[11px]', filter === f ? 'text-ink/60' : 'text-fog')}>{count(f)}</span>
          </button>
        ))}
      </div>

      <Card className="p-2 md:p-2">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : quotes.length === 0 ? (
          <EmptyState icon={<Inbox className="h-5 w-5" />} title="Nenhum orçamento aqui" text="Quando um cliente enviar um plano pelo site, ele aparece nesta lista." />
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {quotes.map((q) => {
              const open = openId === q.id;
              const link = contactLink(q.clientContact);
              return (
                <li key={q.id}>
                  <button onClick={() => setOpenId(open ? null : q.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-[18px] px-4 py-4 text-left transition hover:bg-white/[0.03] md:grid-cols-[90px_1fr_150px_110px_130px_20px]">
                    <span className="font-mono text-[12px] text-bone/70">{q.code}</span>
                    <span className="col-span-2 min-w-0 truncate text-[14px] text-bone md:col-span-1">
                      {q.clientName || <span className="text-mist">Sem nome</span>}
                      {q.clientCompany && <span className="text-fog"> · {q.clientCompany}</span>}
                      <span className="block truncate text-[12px] text-fog">{q.lines.map((l) => `${l.quantity}× ${l.name}`).join(' · ')}</span>
                    </span>
                    <span className="text-[12.5px] text-fog">{formatDate(q.createdAt)}</span>
                    <span>
                      <QuoteStatusBadge status={q.status} />
                    </span>
                    <span className="text-right text-[15px] font-medium tabular-nums">{formatBRL(q.totalCents)}</span>
                    <ChevronDown className={cn('hidden h-4 w-4 text-fog transition md:block', open && 'rotate-180')} />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden">
                        <div className="grid gap-4 px-4 pb-5 md:grid-cols-[1.4fr_1fr]">
                          <div className="rounded-2xl border border-white/[0.07] bg-black/25 p-4">
                            {q.lines.map((l) => (
                              <div key={l.serviceId} className="flex justify-between py-1.5 text-[13.5px]">
                                <span>
                                  {l.name}{' '}
                                  <span className="text-fog">· {l.kind === 'plan' ? 'plano mensal' : `${l.quantity} ${unitLabel(l)} × ${formatBRL(l.unitPriceCents)}`}</span>
                                </span>
                                <span className="tabular-nums">{formatBRL(l.subtotalCents)}</span>
                              </div>
                            ))}
                            <div className="mt-2 flex justify-between border-t border-white/[0.07] pt-3 text-[15px] font-medium">
                              <span>Total</span>
                              <span className="tabular-nums">{formatBRL(q.totalCents)}</span>
                            </div>
                          </div>
                          <div className="space-y-3 text-[13.5px]">
                            <p>
                              <span className="text-fog">Contato: </span>
                              {q.clientContact ?? '—'}
                            </p>
                            <p>
                              <span className="text-fog">Canal: </span>
                              {q.channel === 'whatsapp' ? 'WhatsApp direto' : 'Formulário + WhatsApp'}
                            </p>
                            {q.notes && <p className="rounded-xl bg-white/[0.04] p-3 text-bone/85">“{q.notes}”</p>}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {isOwner && (
                                <Select aria-label="Status" value={q.status} onChange={(e) => setStatus(q, e.target.value as QuoteStatus)} className="h-9 w-40 text-[13px]">
                                  {(Object.keys(QUOTE_STATUS_LABELS) as QuoteStatus[]).map((s) => (
                                    <option key={s} value={s}>
                                      {QUOTE_STATUS_LABELS[s]}
                                    </option>
                                  ))}
                                </Select>
                              )}
                              {link && (
                                <a href={link} target="_blank" rel="noreferrer" className="glass-pill flex h-9 items-center gap-2 rounded-full px-3.5 text-[12.5px]">
                                  <MessageCircle className="h-3.5 w-3.5" /> Responder
                                </a>
                              )}
                              {isOwner && (
                                <button onClick={() => remove(q)} className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-bone/50 hover:bg-red-400/10 hover:text-red-300" aria-label="Excluir orçamento">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
