import path from 'node:path';

const root = process.cwd();

function bool(value: string | undefined, fallback = false): boolean {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export const config = {
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 3001),
  databasePath: path.resolve(root, process.env.DATABASE_PATH ?? './data/studio.db'),
  uploadsDir: path.resolve(root, process.env.UPLOADS_DIR ?? './data/uploads'),
  distDir: path.resolve(root, 'dist'),
  adminEmail: (process.env.ADMIN_EMAIL ?? 'owner@studio.com').trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
  publicOrigin: (process.env.PUBLIC_ORIGIN ?? '').replace(/\/$/, ''),
  cookieSecure: bool(process.env.COOKIE_SECURE),
  trustProxy: bool(process.env.TRUST_PROXY),
  sessionTtlMs: 1000 * 60 * 60 * 24 * 7,
  maxUploadBytes: 12 * 1024 * 1024,
} as const;

export const SESSION_COOKIE = 'studio_sid';
