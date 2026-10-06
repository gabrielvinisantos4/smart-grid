import { randomUUID } from 'node:crypto';
import type { Database } from '../db/database.ts';
import { transaction } from '../db/database.ts';
import type { PublicService, Service } from '../../shared/types.ts';
import type { ServiceInput } from './schemas.ts';
import { HttpError } from '../middleware/errors.ts';

interface ServiceRow {
  id: string;
  kind: 'plan' | 'unit';
  features: string;
  name: string;
  description: string;
  icon: string;
  image_id: string | null;
  price_cents: number;
  min_qty: number;
  max_qty: number;
  default_qty: number;
  quick_quantities: string;
  unit_singular: string;
  unit_plural: string;
  badge: string | null;
  active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function toService(row: ServiceRow): Service {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    description: row.description,
    icon: row.icon,
    imageId: row.image_id,
    priceCents: row.price_cents,
    minQty: row.min_qty,
    maxQty: row.max_qty,
    defaultQty: row.default_qty,
    quickQuantities: JSON.parse(row.quick_quantities) as number[],
    unitSingular: row.unit_singular,
    unitPlural: row.unit_plural,
    badge: row.badge,
    features: JSON.parse(row.features) as string[],
    active: row.active === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toPublicService(s: Service): PublicService {
  return {
    id: s.id,
    kind: s.kind,
    name: s.name,
    description: s.description,
    icon: s.icon,
    imageId: s.imageId,
    priceCents: s.priceCents,
    minQty: s.minQty,
    maxQty: s.maxQty,
    defaultQty: s.defaultQty,
    quickQuantities: s.quickQuantities,
    unitSingular: s.unitSingular,
    unitPlural: s.unitPlural,
    badge: s.badge,
    features: s.features,
  };
}

export function createServicesRepo(db: Database) {
  const assertMedia = (imageId: string | null) => {
    if (imageId && !db.prepare('SELECT 1 FROM media WHERE id = ?').get(imageId)) {
      throw new HttpError(400, 'Imagem selecionada não existe.');
    }
  };

  return {
    list(): Service[] {
      return (db.prepare('SELECT * FROM services ORDER BY sort_order, created_at').all() as unknown as ServiceRow[]).map(toService);
    },

    listActive(): Service[] {
      return (
        db.prepare('SELECT * FROM services WHERE active = 1 ORDER BY sort_order, created_at').all() as unknown as ServiceRow[]
      ).map(toService);
    },

    get(id: string): Service | null {
      const row = db.prepare('SELECT * FROM services WHERE id = ?').get(id) as ServiceRow | undefined;
      return row ? toService(row) : null;
    },

    create(input: ServiceInput, id: string = randomUUID()): Service {
      assertMedia(input.imageId);
      const { next } = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM services').get() as { next: number };
      db.prepare(
        `INSERT INTO services (id, name, description, icon, image_id, price_cents, min_qty, max_qty, default_qty,
                               quick_quantities, unit_singular, unit_plural, badge, active, sort_order, kind, features)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        input.name,
        input.description,
        input.icon,
        input.imageId,
        input.priceCents,
        input.minQty,
        input.maxQty,
        input.defaultQty,
        JSON.stringify(input.quickQuantities),
        input.unitSingular,
        input.unitPlural,
        input.badge,
        input.active ? 1 : 0,
        next,
        input.kind,
        JSON.stringify(input.features),
      );
      return this.get(id)!;
    },

    update(id: string, input: ServiceInput): Service {
      if (!this.get(id)) throw new HttpError(404, 'Serviço não encontrado.');
      assertMedia(input.imageId);
      db.prepare(
        `UPDATE services SET name = ?, description = ?, icon = ?, image_id = ?, price_cents = ?, min_qty = ?, max_qty = ?,
                default_qty = ?, quick_quantities = ?, unit_singular = ?, unit_plural = ?, badge = ?, active = ?,
                kind = ?, features = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE id = ?`,
      ).run(
        input.name,
        input.description,
        input.icon,
        input.imageId,
        input.priceCents,
        input.minQty,
        input.maxQty,
        input.defaultQty,
        JSON.stringify(input.quickQuantities),
        input.unitSingular,
        input.unitPlural,
        input.badge,
        input.active ? 1 : 0,
        input.kind,
        JSON.stringify(input.features),
        id,
      );
      return this.get(id)!;
    },

    remove(id: string) {
      const result = db.prepare('DELETE FROM services WHERE id = ?').run(id);
      if (result.changes === 0) throw new HttpError(404, 'Serviço não encontrado.');
    },

    updatePrices(prices: { id: string; priceCents: number }[]): Service[] {
      transaction(db, () => {
        const stmt = db.prepare(
          `UPDATE services SET price_cents = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
        );
        for (const { id, priceCents } of prices) {
          if (stmt.run(priceCents, id).changes === 0) throw new HttpError(404, `Serviço ${id} não encontrado.`);
        }
      });
      return this.list();
    },

    reorder(ids: string[]): Service[] {
      transaction(db, () => {
        const stmt = db.prepare('UPDATE services SET sort_order = ? WHERE id = ?');
        ids.forEach((id, index) => stmt.run(index, id));
      });
      return this.list();
    },
  };
}

export type ServicesRepo = ReturnType<typeof createServicesRepo>;
