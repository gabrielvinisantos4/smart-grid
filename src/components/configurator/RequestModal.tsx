import { useState, type FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { QuoteLine, QuoteRequestResult } from '@shared/types';
import { unitLabel } from '@shared/pricing';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { WhatsAppIcon } from '@/components/ui/SocialIcons';
import { formatBRL } from '@/lib/format';
import type { ClientInfo } from '@/hooks/useQuoteSubmit';
import { IS_DEMO } from '@/config/site';

interface Props {
  open: boolean;
  onClose: () => void;
  lines: QuoteLine[];
  totalCents: number;
  busy: boolean;
  error: string | null;
  onSubmit: (client: ClientInfo) => Promise<QuoteRequestResult | null>;
}

const field =
  'h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-[15px] text-bone placeholder:text-fog outline-none transition focus:border-white/30 focus:bg-white/[0.06]';

export function RequestModal({ open, onClose, lines, totalCents, busy, error, onSubmit }: Props) {
  const [form, setForm] = useState<ClientInfo>({});
  const [done, setDone] = useState<QuoteRequestResult | null>(null);

  const set = (key: keyof ClientInfo) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await onSubmit(form);
    if (result) setDone(result);
  };

  const close = () => {
    onClose();
    window.setTimeout(() => setDone(null), 400);
  };

  return (
    <Modal open={open} onClose={close} label="Solicitar orçamento">
      {done ? (
        <div className="p-8 text-center sm:p-10">
          <CheckCircle2 className="mx-auto h-10 w-10 text-bone" strokeWidth={1.4} />
          <p className="eyebrow mt-6">{done.quote.code}</p>
          <h3 className="mt-3 text-3xl font-medium tracking-[-0.04em]">Orçamento enviado.</h3>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-mist">
            {IS_DEMO
              ? 'Toque no botão abaixo para abrir o WhatsApp com o seu plano preenchido.'
              : 'Abrimos o WhatsApp com o seu plano preenchido. Se a janela não abriu, use o botão abaixo.'}
          </p>
          <div className="mt-8 grid gap-2.5">
            {done.whatsappUrl && (
              <a
                href={done.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="glass-pill inline-flex h-12 items-center justify-center gap-2 rounded-full text-sm"
              >
                <WhatsAppIcon className="h-4 w-4" /> Abrir WhatsApp
              </a>
            )}
            <Button variant="ghost" onClick={close}>
              Fechar
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          <p className="eyebrow">Último passo</p>
          <h3 className="mt-3 pr-10 text-[1.75rem] font-medium leading-tight tracking-[-0.04em]">Para quem é o plano?</h3>
          <p className="mt-2 text-[14px] text-mist">Opcional — ajuda a gente a preparar a proposta certa.</p>

          <div className="mt-6 rounded-2xl border border-white/[0.07] bg-black/25 p-4">
            {lines.map((l) => (
              <div key={l.serviceId} className="flex justify-between py-1 text-[13px]">
                <span className="text-bone/80">
                  {l.name} <span className="text-fog">· {l.kind === 'plan' ? 'plano mensal' : `${l.quantity} ${unitLabel(l)}`}</span>
                </span>
                <span className="tabular-nums text-bone/80">
                  {formatBRL(l.subtotalCents)}
                  {l.kind === 'plan' && '/mês'}
                </span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-white/[0.07] pt-3 text-[15px] font-medium">
              <span>Total</span>
              <span className="tabular-nums">{formatBRL(totalCents)}</span>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <input className={field} placeholder="Seu nome" autoComplete="name" maxLength={80} value={form.clientName ?? ''} onChange={set('clientName')} />
            <input className={field} placeholder="WhatsApp ou e-mail" autoComplete="tel" maxLength={120} value={form.clientContact ?? ''} onChange={set('clientContact')} />
            <input className={field} placeholder="Empresa / marca" autoComplete="organization" maxLength={80} value={form.clientCompany ?? ''} onChange={set('clientCompany')} />
            <textarea
              className={`${field} h-24 resize-none py-3`}
              placeholder="Algo que devemos saber? (objetivo, prazo, referência…)"
              maxLength={600}
              value={form.notes ?? ''}
              onChange={set('notes')}
            />
            {/* honeypot anti-spam */}
            <input tabIndex={-1} autoComplete="off" className="hidden" aria-hidden value={form.website ?? ''} onChange={set('website')} />
          </div>

          {error && <p className="mt-4 text-[13px] text-red-300/90">{error}</p>}

          <Button type="submit" size="lg" arrow disabled={busy} className="mt-6 w-full">
            {busy ? 'Enviando…' : 'Enviar e abrir WhatsApp'}
          </Button>
        </form>
      )}
    </Modal>
  );
}
