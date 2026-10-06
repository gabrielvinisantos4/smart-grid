import { Router } from 'express';
import { createHash } from 'node:crypto';
import type { AppContext } from '../context.ts';
import { toPublicService } from '../services/servicesRepo.ts';
import { quoteRequestSchema } from '../services/schemas.ts';
import { buildQuoteLines, buildWhatsAppMessage, sumLines, whatsappLink } from '../../shared/pricing.ts';
import type { PublicSitePayload, QuoteRequestResult } from '../../shared/types.ts';
import { HttpError } from '../middleware/errors.ts';
import { rateLimit } from '../middleware/security.ts';
import { settingsMediaRefs } from '../services/settingsRepo.ts';

export function publicRoutes(ctx: AppContext) {
  const router = Router();

  /** Tudo que a página pública precisa: textos, serviços ativos e imagens referenciadas. */
  router.get('/site', (_req, res) => {
    const settings = ctx.settings.get();
    const services = ctx.services.listActive().map(toPublicService);
    const mediaIds = [
      ...settingsMediaRefs(settings).map((r) => r.id),
      ...settings.gallery.items.map((i) => i.mediaId),
      ...settings.results.items.map((i) => i.mediaId),
      ...services.map((s) => s.imageId).filter((id): id is string => Boolean(id)),
    ];
    const media = ctx.media.getMany(mediaIds);
    settings.gallery.items = settings.gallery.items.filter((item) => media[item.mediaId]);
    settings.results.items = settings.results.items.filter((item) => media[item.mediaId]);

    const payload: PublicSitePayload = { settings, services, media };
    res.setHeader('Cache-Control', 'no-cache');
    res.json(payload);
  });

  /**
   * Registra um orçamento. O total é SEMPRE recalculado aqui com os preços do
   * banco — qualquer valor vindo do navegador é ignorado.
   */
  router.post(
    '/quotes',
    rateLimit({ windowMs: 60_000, max: 8, message: 'Muitas solicitações seguidas. Aguarde um minuto.' }),
    (req, res) => {
      const input = quoteRequestSchema.parse(req.body);
      if (input.website) throw new HttpError(400, 'Requisição inválida.');

      const services = ctx.services.listActive().map(toPublicService);
      const lines = buildQuoteLines(services, input.items);
      if (lines.length === 0) throw new HttpError(400, 'Nenhum serviço válido selecionado.');
      const totalCents = sumLines(lines);

      const quote = ctx.quotes.create({
        lines,
        totalCents,
        channel: input.channel,
        clientName: input.clientName,
        clientContact: input.clientContact,
        clientCompany: input.clientCompany,
        notes: input.notes,
        ipHash: createHash('sha256').update(String(req.ip)).digest('hex').slice(0, 16),
      });

      const settings = ctx.settings.get();
      const message = buildWhatsAppMessage({
        intro: settings.contact.whatsappIntro,
        lines,
        totalCents,
        code: quote.code,
        clientName: quote.clientName,
        clientCompany: quote.clientCompany,
        notes: quote.notes,
      });
      const result: QuoteRequestResult = { quote, whatsappUrl: whatsappLink(settings.contact.whatsapp, message) };
      res.status(201).json(result);
    },
  );

  return router;
}
