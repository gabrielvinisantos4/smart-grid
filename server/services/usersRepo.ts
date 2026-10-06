import type { Database } from '../db/database.ts';
import type { Role, User } from '../../shared/types.ts';
import { HttpError } from '../middleware/errors.ts';
import { hashPassword } from '../auth/password.ts';

interface UserRow {
  id: number;
  email: string;
  name: string;
  role: Role;
  password_hash: string;
  created_at: string;
}

const toUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role,
  createdAt: row.created_at,
});

export function createUsersRepo(db: Database) {
  const ownerCount = () => (db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'owner'`).get() as { n: number }).n;

  return {
    count(): number {
      return (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
    },

    findByEmailWithHash(email: string): (User & { passwordHash: string }) | null {
      const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
      return row ? { ...toUser(row), passwordHash: row.password_hash } : null;
    },

    getHash(id: number): string | null {
      const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(id) as { password_hash: string } | undefined;
      return row?.password_hash ?? null;
    },

    list(): User[] {
      return (db.prepare('SELECT * FROM users ORDER BY created_at').all() as unknown as UserRow[]).map(toUser);
    },

    async create(input: { name: string; email: string; password: string; role: Role }): Promise<User> {
      if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(input.email)) {
        throw new HttpError(409, 'Já existe um usuário com este e-mail.');
      }
      const hash = await hashPassword(input.password);
      const result = db
        .prepare('INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)')
        .run(input.email, input.name, hash, input.role);
      return toUser(db.prepare('SELECT * FROM users WHERE id = ?').get(Number(result.lastInsertRowid)) as unknown as UserRow);
    },

    async setPassword(id: number, password: string) {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await hashPassword(password), id);
    },

    setRole(id: number, role: Role): User {
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
      if (!row) throw new HttpError(404, 'Usuário não encontrado.');
      if (row.role === 'owner' && role !== 'owner' && ownerCount() <= 1) {
        throw new HttpError(400, 'É necessário manter ao menos um proprietário.');
      }
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
      return toUser({ ...row, role });
    },

    remove(id: number) {
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
      if (!row) throw new HttpError(404, 'Usuário não encontrado.');
      if (row.role === 'owner' && ownerCount() <= 1) {
        throw new HttpError(400, 'É necessário manter ao menos um proprietário.');
      }
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    },
  };
}

export type UsersRepo = ReturnType<typeof createUsersRepo>;
