/**
 * Gera public/demo/site.json a partir do conteúdo inicial, para a versão
 * estática de demonstração da página pública (npm run build:demo).
 */
import fs from 'node:fs';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { openDatabase } from '../server/db/database.ts';
import { createContext } from '../server/context.ts';
import { createApp } from '../server/app.ts';
import { seed } from '../server/db/seed.ts';

process.env.ADMIN_PASSWORD ||= 'demo-only-password';
const ctx = createContext(openDatabase(':memory:'));
await seed(ctx, { silent: true });
const server = createApp(ctx).listen(0);
const { port } = server.address() as AddressInfo;
const payload = await (await fetch(`http://127.0.0.1:${port}/api/public/site`)).json();
server.close();

const out = path.resolve('public/demo/site.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(payload, null, 2));
console.log(`› ${out}`);
