import { useCallback, useState } from 'react';
import type { QuoteChannel, QuoteItemInput, QuoteLine, QuoteRequestResult, SiteSettings } from '@shared/types';
import { buildWhatsAppMessage, whatsappLink } from '@shared/pricing';
import { publicApi } from '@/services/publicApi';

export interface ClientInfo {
  clientName?: string;
  clientContact?: string;
  clientCompany?: string;
  notes?: string;
  website?: string;
}

/**
 * Registra o orçamento no backend (que recalcula o valor oficial) e abre o
 * WhatsApp com a mensagem preenchida. A aba é aberta de forma síncrona no
 * clique para não ser bloqueada pelo navegador (principalmente no iOS).
 */
export function useQuoteSubmit(settings: SiteSettings | undefined) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (
      channel: QuoteChannel,
      items: QuoteItemInput[],
      preview: { lines: QuoteLine[]; totalCents: number },
      client: ClientInfo = {},
    ): Promise<QuoteRequestResult | null> => {
      if (!settings || items.length === 0) return null;
      const popup = window.open('', '_blank');
      if (popup) {
        popup.opener = null;
        popup.document.title = 'Abrindo WhatsApp…';
        popup.document.body.style.cssText = 'background:#050505;color:#8a8a8f;font:14px system-ui;display:grid;place-items:center;height:100vh;margin:0';
        popup.document.body.textContent = 'Abrindo WhatsApp…';
      }
      const open = (url: string | null) => {
        if (!url) return popup?.close();
        if (popup && !popup.closed) popup.location.href = url;
        else window.location.href = url;
      };

      setBusy(true);
      setError(null);
      try {
        const result = await publicApi.requestQuote({ channel, items, ...client });
        open(result.whatsappUrl);
        return result;
      } catch (e) {
        // Se a API estiver indisponível, não perdemos o lead: abre o WhatsApp com a prévia local.
        const message = buildWhatsAppMessage({
          intro: settings.contact.whatsappIntro,
          lines: preview.lines,
          totalCents: preview.totalCents,
          clientName: client.clientName,
          clientCompany: client.clientCompany,
          notes: client.notes,
        });
        open(whatsappLink(settings.contact.whatsapp, message));
        setError(e instanceof Error ? e.message : 'Não foi possível registrar o orçamento.');
        return null;
      } finally {
        setBusy(false);
      }
    },
    [settings],
  );

  return { submit, busy, error };
}
