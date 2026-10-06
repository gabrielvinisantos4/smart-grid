import type { Database } from './db/database.ts';
import { createSettingsRepo } from './services/settingsRepo.ts';
import { createMediaRepo } from './services/mediaRepo.ts';
import { createServicesRepo } from './services/servicesRepo.ts';
import { createQuotesRepo } from './services/quotesRepo.ts';
import { createUsersRepo } from './services/usersRepo.ts';

export function createContext(db: Database) {
  const settings = createSettingsRepo(db);
  return {
    db,
    settings,
    media: createMediaRepo(db, settings),
    services: createServicesRepo(db),
    quotes: createQuotesRepo(db),
    users: createUsersRepo(db),
  };
}

export type AppContext = ReturnType<typeof createContext>;
