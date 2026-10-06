import { createHash, randomBytes } from 'node:crypto';
import type { Database } from '../db/database.ts';
import { config } from '../config.ts';
import type { Role, User } from '../../shared/types.ts';

/**
 * Sessões opacas no servidor: o cookie carrega apenas um token aleatório;
 * no banco guardamos somente o hash SHA-256 dele. Logout e troca de senha
 * invalidam a sessão imediatamente (diferente de um JWT sem estado).
 */

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createSession(db: Database, userId: number, userAgent?: string): { token: string; expiresAt: number } {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + config.sessionTtlMs;
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, user_agent) VALUES (?, ?, ?, ?)').run(
    hashToken(token),
    userId,
    expiresAt,
    userAgent?.slice(0, 255) ?? null,
  );
  return { token, expiresAt };
}

interface SessionRow {
  id: number;
  email: string;
  name: string;
  role: Role;
  created_at: string;
  expires_at: number;
}

export function getSessionUser(db: Database, token: string | undefined): User | null {
  if (!token || token.length > 128) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.created_at, s.expires_at
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?`,
    )
    .get(hashToken(token)) as SessionRow | undefined;
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    destroySession(db, token);
    return null;
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role, createdAt: row.created_at };
}

export function destroySession(db: Database, token: string) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

export function destroyUserSessions(db: Database, userId: number, exceptToken?: string) {
  if (exceptToken) {
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(userId, hashToken(exceptToken));
  } else {
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  }
}

export function purgeExpiredSessions(db: Database) {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
}
