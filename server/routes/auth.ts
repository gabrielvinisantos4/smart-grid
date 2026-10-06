import { Router, type Response } from 'express';
import type { AppContext } from '../context.ts';
import { config, SESSION_COOKIE } from '../config.ts';
import { getDummyHash, verifyPassword } from '../auth/password.ts';
import { createSession, destroySession, destroyUserSessions } from '../auth/sessions.ts';
import { loginSchema, passwordSchema } from '../services/schemas.ts';
import { HttpError } from '../middleware/errors.ts';
import { requireAuth } from '../middleware/auth.ts';
import { rateLimit } from '../middleware/security.ts';

function setSessionCookie(res: Response, token: string, expiresAt: number) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export function authRoutes(ctx: AppContext) {
  const router = Router();

  const loginLimiter = rateLimit({
    windowMs: 15 * 60_000,
    max: 8,
    key: (req) => `${req.ip}:${String(req.body?.email ?? '').toLowerCase()}`,
    message: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
  });

  router.post('/login', loginLimiter, async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = ctx.users.findByEmailWithHash(email);
    // Verifica um hash fictício quando o e-mail não existe para não vazar quais contas existem pelo tempo de resposta.
    const valid = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
    if (!user || !valid) throw new HttpError(401, 'E-mail ou senha incorretos.');

    const { token, expiresAt } = createSession(ctx.db, user.id, req.get('user-agent'));
    setSessionCookie(res, token, expiresAt);
    const { passwordHash: _omit, ...publicUser } = user;
    void _omit;
    res.json({ user: publicUser });
  });

  router.post('/logout', (req, res) => {
    if (req.sessionToken) destroySession(ctx.db, req.sessionToken);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.status(204).end();
  });

  router.get('/me', (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
    res.json({ user: req.user });
  });

  router.post('/password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = passwordSchema.parse(req.body);
    const hash = ctx.users.getHash(req.user!.id);
    if (!hash || !(await verifyPassword(currentPassword, hash))) throw new HttpError(400, 'Senha atual incorreta.');
    await ctx.users.setPassword(req.user!.id, newPassword);
    destroyUserSessions(ctx.db, req.user!.id, req.sessionToken);
    res.status(204).end();
  });

  return router;
}
