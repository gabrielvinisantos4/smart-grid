import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.ts';
import { HttpError } from './errors.ts';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Proteção CSRF em camadas: cookie SameSite=Strict + verificação de Origin
 * em toda requisição que altera estado + exigência de JSON/multipart.
 */
export function verifyOrigin(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get('origin');
  if (origin) {
    const allowed = new Set<string>([`${req.protocol}://${req.get('host')}`]);
    if (config.publicOrigin) allowed.add(config.publicOrigin);
    if (!allowed.has(origin)) return next(new HttpError(403, 'Origem não permitida.'));
  }

  const type = req.get('content-type') ?? '';
  const hasBody = Number(req.get('content-length') ?? 0) > 0 || req.get('transfer-encoding');
  if (hasBody && !type.startsWith('application/json') && !type.startsWith('multipart/form-data')) {
    return next(new HttpError(415, 'Formato de requisição não suportado.'));
  }
  next();
}

interface Bucket {
  count: number;
  resetAt: number;
}

/** Rate limiter em memória (suficiente para uma instância; troque por Redis ao escalar). */
export function rateLimit(options: { windowMs: number; max: number; key?: (req: Request) => string; message?: string }) {
  const buckets = new Map<string, Bucket>();
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) if (bucket.resetAt < now) buckets.delete(key);
  }, options.windowMs).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = options.key?.(req) ?? req.ip ?? 'unknown';
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    }
    bucket.count++;
    if (bucket.count > options.max) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return next(new HttpError(429, options.message ?? 'Muitas requisições. Aguarde um instante.'));
    }
    next();
  };
}

export function noStore(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'no-store');
  next();
}
