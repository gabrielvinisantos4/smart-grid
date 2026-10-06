import type { PublicSitePayload, QuoteRequestInput, QuoteRequestResult } from '@shared/types';
import { buildQuoteLines, buildWhatsAppMessage, sumLines, whatsappLink } from '@shared/pricing';
import { IS_DEMO } from '@/config/site';
import { http } from './http';

let demoSite: Promise<PublicSitePayload> | null = null;
const loadDemoSite = () => (demoSite ??= fetch('./demo/site.json').then((r) => r.json() as Promise<PublicSitePayload>));

/** No modo demonstração o orçamento é montado localmente e nada é gravado. */
async function demoQuote(input: QuoteRequestInput): Promise<QuoteRequestResult> {
  const site = await loadDemoSite();
  const lines = buildQuoteLines(site.services, input.items);
  const totalCents = sumLines(lines);
  const message = buildWhatsAppMessage({
    intro: site.settings.contact.whatsappIntro,
    lines,
    totalCents,
    clientName: input.clientName,
    clientCompany: input.clientCompany,
    notes: input.notes,
  });
  return {
    quote: {
      id: 0,
      code: 'DEMONSTRAÇÃO',
      lines,
      totalCents,
      clientName: input.clientName ?? null,
      clientContact: input.clientContact ?? null,
      clientCompany: input.clientCompany ?? null,
      notes: input.notes ?? null,
      channel: input.channel,
      status: 'new',
      createdAt: new Date().toISOString(),
    },
    whatsappUrl: whatsappLink(site.settings.contact.whatsapp, message),
  };
}

export const publicApi = {
  getSite: () => (IS_DEMO ? loadDemoSite() : http.get<PublicSitePayload>('/api/public/site')),
  requestQuote: (input: QuoteRequestInput & { website?: string }) =>
    IS_DEMO ? demoQuote(input) : http.post<QuoteRequestResult>('/api/public/quotes', input as unknown as Record<string, unknown>),
};
