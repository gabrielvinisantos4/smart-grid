import type { Database } from '../db/database.ts';
import type { DashboardStats, Quote, QuoteChannel, QuoteLine, QuoteStatus } from '../../shared/types.ts';
import { HttpError } from '../middleware/errors.ts';

interface QuoteRow {
  id: number;
  lines: string;
  total_cents: number;
  client_name: string | null;
  client_contact: string | null;
  client_company: string | null;
  notes: string | null;
  channel: QuoteChannel;
  status: QuoteStatus;
  created_at: string;
}

export const quoteCode = (id: number) => `ORC-${String(id).padStart(4, '0')}`;

function toQuote(row: QuoteRow): Quote {
  return {
    id: row.id,
    code: quoteCode(row.id),
    lines: JSON.parse(row.lines) as QuoteLine[],
    totalCents: row.total_cents,
    clientName: row.client_name,
    clientContact: row.client_contact,
    clientCompany: row.client_company,
    notes: row.notes,
    channel: row.channel,
    status: row.status,
    createdAt: row.created_at,
  };
}

export interface NewQuote {
  lines: QuoteLine[];
  totalCents: number;
  channel: QuoteChannel;
  clientName?: string | null;
  clientContact?: string | null;
  clientCompany?: string | null;
  notes?: string | null;
  ipHash?: string | null;
}

export function createQuotesRepo(db: Database) {
  return {
    create(input: NewQuote): Quote {
      const result = db
        .prepare(
          `INSERT INTO quotes (lines, total_cents, client_name, client_contact, client_company, notes, channel, ip_hash)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          JSON.stringify(input.lines),
          input.totalCents,
          input.clientName || null,
          input.clientContact || null,
          input.clientCompany || null,
          input.notes || null,
          input.channel,
          input.ipHash ?? null,
        );
      return this.get(Number(result.lastInsertRowid))!;
    },

    get(id: number): Quote | null {
      const row = db.prepare('SELECT * FROM quotes WHERE id = ?').get(id) as QuoteRow | undefined;
      return row ? toQuote(row) : null;
    },

    list(options: { status?: QuoteStatus; limit?: number; offset?: number } = {}): { items: Quote[]; total: number } {
      const where = options.status ? 'WHERE status = ?' : '';
      const params = options.status ? [options.status] : [];
      const limit = Math.min(options.limit ?? 50, 200);
      const offset = Math.max(options.offset ?? 0, 0);
      const rows = db
        .prepare(`SELECT * FROM quotes ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
        .all(...params, limit, offset) as unknown as QuoteRow[];
      const { total } = db.prepare(`SELECT COUNT(*) AS total FROM quotes ${where}`).get(...params) as { total: number };
      return { items: rows.map(toQuote), total };
    },

    updateStatus(id: number, status: QuoteStatus): Quote {
      const result = db.prepare('UPDATE quotes SET status = ? WHERE id = ?').run(status, id);
      if (result.changes === 0) throw new HttpError(404, 'Orçamento não encontrado.');
      return this.get(id)!;
    },

    remove(id: number) {
      const result = db.prepare('DELETE FROM quotes WHERE id = ?').run(id);
      if (result.changes === 0) throw new HttpError(404, 'Orçamento não encontrado.');
    },

    stats(): Pick<DashboardStats, 'quotesThisMonth' | 'quotesTotal' | 'valueThisMonthCents' | 'averageTicketCents' | 'topServices' | 'daily' | 'recentQuotes'> {
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      const month = db
        .prepare('SELECT COUNT(*) AS count, COALESCE(SUM(total_cents), 0) AS value FROM quotes WHERE created_at >= ?')
        .get(monthStart) as { count: number; value: number };
      const all = db.prepare('SELECT COUNT(*) AS count, COALESCE(AVG(total_cents), 0) AS avg FROM quotes').get() as {
        count: number;
        avg: number;
      };

      const since = new Date(now.getTime() - 29 * 86_400_000);
      since.setUTCHours(0, 0, 0, 0);
      const dailyRows = db
        .prepare(`SELECT substr(created_at, 1, 10) AS date, COUNT(*) AS count FROM quotes WHERE created_at >= ? GROUP BY date`)
        .all(since.toISOString()) as { date: string; count: number }[];
      const dailyMap = new Map(dailyRows.map((r) => [r.date, r.count]));
      const daily = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(since.getTime() + i * 86_400_000).toISOString().slice(0, 10);
        return { date, count: dailyMap.get(date) ?? 0 };
      });

      const top = new Map<string, { serviceId: string; name: string; quantity: number; quotes: number }>();
      const recentLines = db.prepare('SELECT lines FROM quotes ORDER BY id DESC LIMIT 500').all() as { lines: string }[];
      for (const { lines } of recentLines) {
        for (const line of JSON.parse(lines) as QuoteLine[]) {
          const entry = top.get(line.serviceId) ?? { serviceId: line.serviceId, name: line.name, quantity: 0, quotes: 0 };
          entry.quantity += line.quantity;
          entry.quotes += 1;
          top.set(line.serviceId, entry);
        }
      }

      return {
        quotesThisMonth: month.count,
        valueThisMonthCents: month.value,
        quotesTotal: all.count,
        averageTicketCents: Math.round(all.avg),
        topServices: [...top.values()].sort((a, b) => b.quotes - a.quotes).slice(0, 5),
        daily,
        recentQuotes: this.list({ limit: 6 }).items,
      };
    },
  };
}

export type QuotesRepo = ReturnType<typeof createQuotesRepo>;
