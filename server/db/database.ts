import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config.ts';

/**
 * Migrações versionadas (PRAGMA user_version). Para evoluir o schema, adicione
 * um novo item ao final do array — nunca edite migrações já aplicadas.
 */
const migrations: string[] = [
  `
  CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('owner', 'viewer')),
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE TABLE sessions (
    token_hash  TEXT PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  INTEGER NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    user_agent  TEXT
  );
  CREATE INDEX sessions_user_idx ON sessions(user_id);

  CREATE TABLE media (
    id          TEXT PRIMARY KEY,
    url         TEXT NOT NULL,
    file_name   TEXT,
    alt         TEXT NOT NULL DEFAULT '',
    source      TEXT NOT NULL CHECK (source IN ('upload', 'remote')),
    credit      TEXT,
    credit_url  TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE TABLE services (
    id               TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    description      TEXT NOT NULL DEFAULT '',
    icon             TEXT NOT NULL DEFAULT 'Sparkles',
    image_id         TEXT REFERENCES media(id) ON DELETE SET NULL,
    price_cents      INTEGER NOT NULL CHECK (price_cents >= 0),
    min_qty          INTEGER NOT NULL DEFAULT 1 CHECK (min_qty >= 1),
    max_qty          INTEGER NOT NULL DEFAULT 30,
    default_qty      INTEGER NOT NULL DEFAULT 4,
    quick_quantities TEXT NOT NULL DEFAULT '[]',
    unit_singular    TEXT NOT NULL DEFAULT 'unidade',
    unit_plural      TEXT NOT NULL DEFAULT 'unidades',
    badge            TEXT,
    active           INTEGER NOT NULL DEFAULT 1,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    CHECK (max_qty >= min_qty)
  );

  CREATE TABLE settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE TABLE quotes (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    lines          TEXT NOT NULL,
    total_cents    INTEGER NOT NULL,
    client_name    TEXT,
    client_contact TEXT,
    client_company TEXT,
    notes          TEXT,
    channel        TEXT NOT NULL CHECK (channel IN ('whatsapp', 'request')),
    status         TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'won', 'lost')),
    ip_hash        TEXT,
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
  CREATE INDEX quotes_created_idx ON quotes(created_at);
  `,
];

function migrate(db: DatabaseSync) {
  const { user_version: current } = db.prepare('PRAGMA user_version').get() as { user_version: number };
  for (let version = current; version < migrations.length; version++) {
    db.exec('BEGIN');
    try {
      db.exec(migrations[version]);
      db.exec(`PRAGMA user_version = ${version + 1}`);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}

export function openDatabase(file = config.databasePath): DatabaseSync {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  migrate(db);
  return db;
}

export function transaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export type Database = DatabaseSync;
