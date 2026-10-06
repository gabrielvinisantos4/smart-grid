import { openDatabase } from './db/database.ts';
import { createContext } from './context.ts';
import { createApp } from './app.ts';
import { seed } from './db/seed.ts';
import { config } from './config.ts';
import { purgeExpiredSessions } from './auth/sessions.ts';

const db = openDatabase();
const ctx = createContext(db);
await seed(ctx);

purgeExpiredSessions(db);
setInterval(() => purgeExpiredSessions(db), 60 * 60_000).unref();

createApp(ctx).listen(config.port, () => {
  console.log(`› API rodando em http://localhost:${config.port}`);
});
