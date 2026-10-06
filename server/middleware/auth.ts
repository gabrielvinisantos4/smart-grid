import type { NextFunction, Request, Response } from 'express';
import type { Database } from '../db/database.ts';
import { getSessionUser } from '../auth/sessions.ts';
import { SESSION_COOKIE } from '../config.ts';
import type { Role, User } from '../../shared/types.ts';
import { HttpError } from './errors.ts';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
      sessionToken?: string;
    }
  }
}

/** Resolve o usuário da sessão (se houver) em toda requisição. */
export function attachUser(db: Database) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    const user = getSessionUser(db, token);
    if (user) {
      req.user = user;
      req.sessionToken = token;
    }
    next();
  };
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new HttpError(401, 'Sessão expirada. Faça login novamente.'));
  next();
}

/**
 * Autorização no servidor. Esconder botões no frontend é apenas UX —
 * esta verificação é o que realmente impede alterações não autorizadas.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'Sessão expirada. Faça login novamente.'));
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'Você não tem permissão para realizar esta ação.'));
    }
    next();
  };
}
