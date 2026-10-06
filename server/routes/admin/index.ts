import { Router } from 'express';
import multer from 'multer';
import type { AppContext } from '../../context.ts';
import { config } from '../../config.ts';
import { requireAuth, requireRole } from '../../middleware/auth.ts';
import { noStore } from '../../middleware/security.ts';
import { HttpError } from '../../middleware/errors.ts';
import { destroyUserSessions } from '../../auth/sessions.ts';
import {
  createUserSchema,
  mediaUpdateSchema,
  pricesSchema,
  quoteStatusSchema,
  remoteMediaSchema,
  reorderSchema,
  serviceInputSchema,
  updateUserSchema,
} from '../../services/schemas.ts';
import { settingsMediaRefs } from '../../services/settingsRepo.ts';
import type { DashboardStats, QuoteStatus, SiteSettings } from '../../../shared/types.ts';
import { siteSettingsSchema } from '../../services/schemas.ts';

/**
 * Rotas administrativas.
 * - Leitura: qualquer usuário autenticado (owner ou viewer).
 * - Escrita: SOMENTE role "owner" — verificado aqui no servidor.
 */
export function adminRoutes(ctx: AppContext) {
  const router = Router();
  const ownerOnly = requireRole('owner');
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxUploadBytes, files: 1 } });

  router.use(noStore, requireAuth);

  /* ------------------------------ Dashboard ------------------------------ */

  router.get('/dashboard', (_req, res) => {
    const services = ctx.services.list();
    const stats: DashboardStats = {
      ...ctx.quotes.stats(),
      activeServices: services.filter((s) => s.active).length,
      totalServices: services.length,
      mediaCount: (ctx.db.prepare('SELECT COUNT(*) AS n FROM media').get() as { n: number }).n,
    };
    res.json(stats);
  });

  /* ------------------------------- Serviços ------------------------------ */

  router.get('/services', (_req, res) => res.json(ctx.services.list()));

  router.post('/services', ownerOnly, (req, res) => {
    res.status(201).json(ctx.services.create(serviceInputSchema.parse(req.body)));
  });

  router.put('/services/:id', ownerOnly, (req, res) => {
    res.json(ctx.services.update(String(req.params.id), serviceInputSchema.parse(req.body)));
  });

  router.delete('/services/:id', ownerOnly, (req, res) => {
    ctx.services.remove(String(req.params.id));
    res.status(204).end();
  });

  router.put('/services-order', ownerOnly, (req, res) => {
    res.json(ctx.services.reorder(reorderSchema.parse(req.body).ids));
  });

  router.put('/prices', ownerOnly, (req, res) => {
    res.json(ctx.services.updatePrices(pricesSchema.parse(req.body).prices));
  });

  /* -------------------------------- Mídia -------------------------------- */

  router.get('/media', (_req, res) => res.json(ctx.media.list()));

  router.post('/media', ownerOnly, upload.single('file'), async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Selecione um arquivo.');
    const alt = typeof req.body?.alt === 'string' ? req.body.alt.slice(0, 200) : '';
    res.status(201).json(await ctx.media.upload(req.file.buffer, alt));
  });

  router.post('/media/remote', ownerOnly, (req, res) => {
    const input = remoteMediaSchema.parse(req.body);
    res.status(201).json(ctx.media.insertRemote(input));
  });

  router.put('/media/:id/file', ownerOnly, upload.single('file'), async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Selecione um arquivo.');
    res.json(await ctx.media.replace(String(req.params.id), req.file.buffer));
  });

  router.patch('/media/:id', ownerOnly, (req, res) => {
    res.json(ctx.media.updateAlt(String(req.params.id), mediaUpdateSchema.parse(req.body).alt));
  });

  router.delete('/media/:id', ownerOnly, async (req, res) => {
    await ctx.media.remove(String(req.params.id), req.query.force === '1');
    res.status(204).end();
  });

  /* ---------------------------- Configurações ---------------------------- */

  router.get('/settings', (_req, res) => res.json(ctx.settings.get()));

  router.put('/settings', ownerOnly, (req, res) => {
    const settings = siteSettingsSchema.parse(req.body) as SiteSettings;
    const referenced = [
      ...settingsMediaRefs(settings).map((r) => r.id),
      ...settings.gallery.items.map((i) => i.mediaId),
      ...settings.results.items.map((i) => i.mediaId),
    ];
    const missing = referenced.filter((id) => !ctx.media.exists(id));
    if (missing.length) throw new HttpError(400, 'Algumas imagens selecionadas não existem mais.', { missing });
    res.json(ctx.settings.save(settings));
  });

  /* ------------------------------ Orçamentos ----------------------------- */

  router.get('/quotes', (req, res) => {
    const status = ['new', 'contacted', 'won', 'lost'].includes(String(req.query.status))
      ? (req.query.status as QuoteStatus)
      : undefined;
    res.json(ctx.quotes.list({ status, limit: Number(req.query.limit) || 50, offset: Number(req.query.offset) || 0 }));
  });

  router.patch('/quotes/:id', ownerOnly, (req, res) => {
    res.json(ctx.quotes.updateStatus(Number(req.params.id), quoteStatusSchema.parse(req.body).status));
  });

  router.delete('/quotes/:id', ownerOnly, (req, res) => {
    ctx.quotes.remove(Number(req.params.id));
    res.status(204).end();
  });

  /* ------------------------------- Usuários ------------------------------ */

  router.get('/users', ownerOnly, (_req, res) => res.json(ctx.users.list()));

  router.post('/users', ownerOnly, async (req, res) => {
    res.status(201).json(await ctx.users.create(createUserSchema.parse(req.body)));
  });

  router.patch('/users/:id', ownerOnly, (req, res) => {
    const id = Number(req.params.id);
    const user = ctx.users.setRole(id, updateUserSchema.parse(req.body).role);
    destroyUserSessions(ctx.db, id);
    res.json(user);
  });

  router.delete('/users/:id', ownerOnly, (req, res) => {
    const id = Number(req.params.id);
    if (id === req.user!.id) throw new HttpError(400, 'Você não pode remover a própria conta.');
    ctx.users.remove(id);
    res.status(204).end();
  });

  return router;
}
