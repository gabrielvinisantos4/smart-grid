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

export function buildQuoteLines(services: PublicService[], items: QuoteItemInput[]): QuoteLine[] {
  const byId = new Map(services.map((s) => [s.id, s]));
  const seen = new Set<string>();
  const lines: QuoteLine[] = [];

  for (const item of items) {
    const service = byId.get(item.serviceId);
    if (!service || seen.has(service.id) || item.quantity <= 0) continue;
    seen.add(service.id);
    const quantity = clampQuantity(service, item.quantity);
    lines.push({
      serviceId: service.id,
      name: service.name,
      unitPriceCents: service.priceCents,
      quantity,
      subtotalCents: service.priceCents * quantity,
      unitSingular: service.unitSingular,
      unitPlural: service.unitPlural,
    });
  }
  return lines;
}

export function sumLines(lines: QuoteLine[]): number {
  return lines.reduce((total, line) => total + line.subtotalCents, 0);
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

  for (const line of options.lines) {
    parts.push(`${line.name}: ${line.quantity} ${unitLabel(line)}`);
  }
  parts.push('');
  parts.push(`Investimento estimado: ${formatBRL(options.totalCents)}`);
  if (options.notes) parts.push('', `Observações: ${options.notes}`);
  if (options.code) parts.push('', `Ref.: ${options.code}`);
  return parts.join('\n');
}

export function whatsappLink(phone: string, message: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
