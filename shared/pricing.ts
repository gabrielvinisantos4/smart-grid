import type { PublicService, QuoteItemInput, QuoteLine } from './types.ts';

/**
 * Regras de cálculo do orçamento — fonte única usada pelo frontend (prévia em
 * tempo real) e pelo backend (valor oficial gravado, sempre recalculado a
 * partir dos preços do banco; o navegador nunca envia preços).
 */

export function clampQuantity(service: Pick<PublicService, 'minQty' | 'maxQty'>, quantity: number): number {
  if (!Number.isFinite(quantity)) return service.minQty;
  const rounded = Math.round(quantity);
  return Math.min(service.maxQty, Math.max(service.minQty, rounded));
}

/**
 * Monta as linhas do orçamento.
 * - Planos mensais têm preço fixo (quantidade sempre 1) e só um pode ser escolhido.
 * - Avulsos são cobrados por unidade, dentro dos limites mín./máx. do serviço.
 */
export function buildQuoteLines(services: PublicService[], items: QuoteItemInput[]): QuoteLine[] {
  const byId = new Map(services.map((s) => [s.id, s]));
  const seen = new Set<string>();
  let hasPlan = false;
  const plans: QuoteLine[] = [];
  const units: QuoteLine[] = [];

  for (const item of items) {
    const service = byId.get(item.serviceId);
    if (!service || seen.has(service.id) || item.quantity <= 0) continue;
    seen.add(service.id);
    const isPlan = service.kind === 'plan';
    if (isPlan && hasPlan) continue;
    hasPlan ||= isPlan;
    const quantity = isPlan ? 1 : clampQuantity(service, item.quantity);
    (isPlan ? plans : units).push({
      serviceId: service.id,
      kind: service.kind,
      name: service.name,
      unitPriceCents: service.priceCents,
      quantity,
      subtotalCents: service.priceCents * quantity,
      unitSingular: service.unitSingular,
      unitPlural: service.unitPlural,
    });
  }
  return [...plans, ...units];
}

export function sumLines(lines: QuoteLine[]): number {
  return lines.reduce((total, line) => total + line.subtotalCents, 0);
}

/** Separa o valor recorrente (plano mensal) do valor dos avulsos. */
export function splitTotals(lines: QuoteLine[]): { monthlyCents: number; oneOffCents: number } {
  let monthlyCents = 0;
  let oneOffCents = 0;
  for (const line of lines) {
    if (line.kind === 'plan') monthlyCents += line.subtotalCents;
    else oneOffCents += line.subtotalCents;
  }
  return { monthlyCents, oneOffCents };
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatBRL(cents: number): string {
  return brl.format(cents / 100).replace(/ /g, ' ');
}

export function unitLabel(line: Pick<QuoteLine, 'quantity' | 'unitSingular' | 'unitPlural'>): string {
  return line.quantity === 1 ? line.unitSingular : line.unitPlural;
}

export interface WhatsAppMessageOptions {
  intro: string;
  lines: QuoteLine[];
  totalCents: number;
  code?: string;
  clientName?: string | null;
  clientCompany?: string | null;
  notes?: string | null;
}

export function buildWhatsAppMessage(options: WhatsAppMessageOptions): string {
  const parts: string[] = [options.intro.trim(), ''];
  if (options.clientName) parts.push(`Nome: ${options.clientName}`);
  if (options.clientCompany) parts.push(`Empresa: ${options.clientCompany}`);
  if (options.clientName || options.clientCompany) parts.push('');

  const plan = options.lines.find((l) => l.kind === 'plan');
  const units = options.lines.filter((l) => l.kind !== 'plan');
  if (plan) parts.push(`Plano mensal: ${plan.name} (${formatBRL(plan.subtotalCents)}/mês)`);
  if (plan && units.length) parts.push('');
  if (units.length) {
    if (plan) parts.push('Avulsos:');
    for (const line of units) parts.push(`${line.name}: ${line.quantity} ${unitLabel(line)}`);
  }
  parts.push('');
  const { monthlyCents, oneOffCents } = splitTotals(options.lines);
  if (monthlyCents && oneOffCents) {
    parts.push(`Plano: ${formatBRL(monthlyCents)}/mês`);
    parts.push(`Avulsos: ${formatBRL(oneOffCents)}`);
  }
  parts.push(`Investimento estimado: ${formatBRL(options.totalCents)}`);
  if (options.notes) parts.push('', `Observações: ${options.notes}`);
  if (options.code) parts.push('', `Ref.: ${options.code}`);
  return parts.join('\n');
}

/** Número que recebe os orçamentos: o primeiro da lista de contatos. */
export function quoteWhatsApp(contact: { whatsapps: { number: string }[] }): string {
  return contact.whatsapps[0]?.number ?? '';
}

/** 5544997317970 → (44) 99731-7970 */
export function formatPhoneBR(number: string): string {
  const d = number.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return number;
}

export function whatsappLink(phone: string, message: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
