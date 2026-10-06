import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { AppContext } from './context.ts';
import { config } from './config.ts';
import { attachUser } from './middleware/auth.ts';
import { errorHandler, notFound } from './middleware/errors.ts';
import { verifyOrigin } from './middleware/security.ts';
import { publicRoutes } from './routes/public.ts';
import { authRoutes } from './routes/auth.ts';
import { adminRoutes } from './routes/admin/index.ts';

export function createApp(ctx: AppContext) {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'connect-src': ["'self'"],
          'frame-ancestors': ["'none'"],
          'form-action': ["'self'"],
          'upgrade-insecure-requests': config.cookieSecure ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(express.json({ limit: '256kb' }));
  app.use(cookieParser());
  app.use(attachUser(ctx.db));

  app.use(
    '/uploads',
    express.static(config.uploadsDir, {
      maxAge: '30d',
      immutable: true,
      index: false,
      dotfiles: 'deny',
      setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
    }),
  );

  const api = express.Router();
  api.use(verifyOrigin);
  api.get('/health', (_req, res) => res.json({ ok: true }));
  api.use('/public', publicRoutes(ctx));
  api.use('/auth', authRoutes(ctx));
  api.use('/admin', adminRoutes(ctx));
  api.use(notFound);
  app.use('/api', api);

  // Em produção a API também entrega o frontend compilado (SPA).
  if (fs.existsSync(path.join(config.distDir, 'index.html'))) {
    app.use(express.static(config.distDir, { index: false, maxAge: '1y', immutable: true }));
    app.get('/{*splat}', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(config.distDir, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
