import type { Database } from '../db/database.ts';
import { defaultSettings } from '../db/defaults.ts';
import type { SiteSettings } from '../../shared/types.ts';
import { siteSettingsSchema } from './schemas.ts';

const KEY = 'site';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Mescla o que está salvo com os padrões — novos campos ganham valor default automaticamente. */
function mergeDefaults<T>(defaults: T, stored: unknown): T {
  if (!isPlainObject(defaults) || !isPlainObject(stored)) return (stored ?? defaults) as T;
  const result: Record<string, unknown> = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (key in stored) result[key] = mergeDefaults((defaults as Record<string, unknown>)[key], stored[key]);
  }
  return result as T;
}

export function createSettingsRepo(db: Database) {
  return {
    get(): SiteSettings {
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(KEY) as { value: string } | undefined;
      if (!row) return structuredClone(defaultSettings);
      return mergeDefaults(defaultSettings, JSON.parse(row.value));
    },

    save(input: unknown): SiteSettings {
      const settings = siteSettingsSchema.parse(input) as SiteSettings;
      db.prepare(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
      ).run(KEY, JSON.stringify(settings));
      return settings;
    },
  };
}

export type SettingsRepo = ReturnType<typeof createSettingsRepo>;

/** IDs de mídia referenciados pelas configurações, com rótulos legíveis. */
export function settingsMediaRefs(settings: SiteSettings): { id: string; label: string }[] {
  const refs: { id: string | null; label: string }[] = [
    { id: settings.brand.logoId, label: 'Logo' },
    { id: settings.hero.imageId, label: 'Imagem do Hero' },
    { id: settings.about.imageId, label: 'Seção Sobre' },
    { id: settings.finalCta.imageId, label: 'Chamada final' },
    { id: settings.login.imageId, label: 'Tela de login' },
  ];
  return refs.filter((r): r is { id: string; label: string } => Boolean(r.id));
}
