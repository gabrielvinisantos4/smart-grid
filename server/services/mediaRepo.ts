import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Database } from '../db/database.ts';
import { transaction } from '../db/database.ts';
import type { AdminMediaAsset, MediaAsset, MediaUsage, SiteSettings } from '../../shared/types.ts';
import { HttpError } from '../middleware/errors.ts';
import { config } from '../config.ts';
import type { SettingsRepo } from './settingsRepo.ts';
import { settingsMediaRefs } from './settingsRepo.ts';

interface MediaRow {
  id: string;
  url: string;
  file_name: string | null;
  alt: string;
  source: 'upload' | 'remote';
  credit: string | null;
  credit_url: string | null;
  created_at: string;
  updated_at: string;
}

function toMedia(row: MediaRow): MediaAsset {
  return {
    id: row.id,
    url: row.url,
    alt: row.alt,
    source: row.source,
    credit: row.credit,
    creditUrl: row.credit_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Detecta o formato pelos bytes do arquivo — nunca confiamos no mimetype enviado pelo navegador. */
export function sniffImage(buffer: Buffer): { ext: string; mime: string } | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { ext: 'png', mime: 'image/png' };
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP')
    return { ext: 'webp', mime: 'image/webp' };
  if (buffer.toString('ascii', 0, 4) === 'GIF8') return { ext: 'gif', mime: 'image/gif' };
  if (buffer.toString('ascii', 4, 8) === 'ftyp' && /^avi[fs]$/.test(buffer.toString('ascii', 8, 12)))
    return { ext: 'avif', mime: 'image/avif' };
  return null;
}

async function writeUpload(buffer: Buffer): Promise<{ fileName: string; url: string }> {
  const type = sniffImage(buffer);
  if (!type) throw new HttpError(415, 'Formato não suportado. Envie JPG, PNG, WEBP, AVIF ou GIF.');
  const fileName = `${randomUUID()}.${type.ext}`;
  await fs.mkdir(config.uploadsDir, { recursive: true });
  await fs.writeFile(path.join(config.uploadsDir, fileName), buffer, { flag: 'wx' });
  return { fileName, url: `/uploads/${fileName}` };
}

async function removeFile(fileName: string | null) {
  if (!fileName) return;
  const safe = path.basename(fileName);
  await fs.rm(path.join(config.uploadsDir, safe), { force: true });
}

export function createMediaRepo(db: Database, settingsRepo: SettingsRepo) {
  const getRow = (id: string) => db.prepare('SELECT * FROM media WHERE id = ?').get(id) as MediaRow | undefined;

  function usageMap(): Map<string, MediaUsage[]> {
    const map = new Map<string, MediaUsage[]>();
    const push = (id: string, usage: MediaUsage) => map.set(id, [...(map.get(id) ?? []), usage]);
    const settings = settingsRepo.get();
    for (const ref of settingsMediaRefs(settings)) push(ref.id, { kind: 'setting', label: ref.label });
    for (const item of settings.gallery.items) push(item.mediaId, { kind: 'gallery', label: `Galeria · ${item.caption || item.label}` });
    for (const item of settings.results.items) push(item.mediaId, { kind: 'result', label: `Resultados · ${item.client || item.views}` });
    const services = db.prepare('SELECT name, image_id FROM services WHERE image_id IS NOT NULL').all() as {
      name: string;
      image_id: string;
    }[];
    for (const s of services) push(s.image_id, { kind: 'service', label: `Serviço · ${s.name}` });
    return map;
  }

  return {
    list(): AdminMediaAsset[] {
      const usage = usageMap();
      return (db.prepare('SELECT * FROM media ORDER BY created_at DESC').all() as unknown as MediaRow[]).map((row) => ({
        ...toMedia(row),
        usage: usage.get(row.id) ?? [],
      }));
    },

    getMany(ids: Iterable<string>): Record<string, MediaAsset> {
      const unique = [...new Set(ids)].filter(Boolean);
      if (unique.length === 0) return {};
      const rows = db
        .prepare(`SELECT * FROM media WHERE id IN (${unique.map(() => '?').join(',')})`)
        .all(...unique) as unknown as MediaRow[];
      return Object.fromEntries(rows.map((row) => [row.id, toMedia(row)]));
    },

    get(id: string): MediaAsset | null {
      const row = getRow(id);
      return row ? toMedia(row) : null;
    },

    insertRemote(input: { id?: string; url: string; alt: string; credit?: string | null; creditUrl?: string | null }): MediaAsset {
      const id = input.id ?? randomUUID();
      db.prepare('INSERT INTO media (id, url, alt, source, credit, credit_url) VALUES (?, ?, ?, ?, ?, ?)').run(
        id,
        input.url,
        input.alt,
        'remote',
        input.credit ?? null,
        input.creditUrl ?? null,
      );
      return this.get(id)!;
    },

    async upload(buffer: Buffer, alt: string, id: string = randomUUID()): Promise<MediaAsset> {
      const { fileName, url } = await writeUpload(buffer);
      db.prepare('INSERT INTO media (id, url, file_name, alt, source) VALUES (?, ?, ?, ?, ?)').run(id, url, fileName, alt, 'upload');
      return this.get(id)!;
    },

    /** Substitui o arquivo mantendo o mesmo ID — todas as seções que usam a imagem são atualizadas. */
    async replace(id: string, buffer: Buffer): Promise<MediaAsset> {
      const row = getRow(id);
      if (!row) throw new HttpError(404, 'Imagem não encontrada.');
      const { fileName, url } = await writeUpload(buffer);
      db.prepare(
        `UPDATE media SET url = ?, file_name = ?, source = 'upload', credit = NULL, credit_url = NULL,
                updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
      ).run(url, fileName, id);
      await removeFile(row.file_name);
      return this.get(id)!;
    },

    updateAlt(id: string, alt: string): MediaAsset {
      const result = db
        .prepare(`UPDATE media SET alt = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`)
        .run(alt, id);
      if (result.changes === 0) throw new HttpError(404, 'Imagem não encontrada.');
      return this.get(id)!;
    },

    /** Exclui a imagem e limpa todas as referências (configurações, galeria e serviços). */
    async remove(id: string, force: boolean): Promise<void> {
      const row = getRow(id);
      if (!row) throw new HttpError(404, 'Imagem não encontrada.');
      const usage = usageMap().get(id) ?? [];
      if (usage.length > 0 && !force) {
        throw new HttpError(409, 'Esta imagem está em uso.', { usage });
      }
      transaction(db, () => {
        const settings = settingsRepo.get();
        const next: SiteSettings = structuredClone(settings);
        if (next.brand.logoId === id) next.brand.logoId = null;
        if (next.hero.imageId === id) next.hero.imageId = null;
        if (next.about.imageId === id) next.about.imageId = null;
        if (next.finalCta.imageId === id) next.finalCta.imageId = null;
        if (next.login.imageId === id) next.login.imageId = null;
        next.gallery.items = next.gallery.items.filter((item) => item.mediaId !== id);
        next.results.items = next.results.items.filter((item) => item.mediaId !== id);
        settingsRepo.save(next);
        db.prepare('UPDATE services SET image_id = NULL WHERE image_id = ?').run(id);
        db.prepare('DELETE FROM media WHERE id = ?').run(id);
      });
      await removeFile(row.file_name);
    },

    exists(id: string): boolean {
      return Boolean(getRow(id));
    },
  };
}

export type MediaRepo = ReturnType<typeof createMediaRepo>;
