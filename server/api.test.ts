import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-test-'));
process.env.UPLOADS_DIR = tmp;
process.env.ADMIN_EMAIL = 'owner@test.dev';
process.env.ADMIN_PASSWORD = 'owner-password-123';

const { openDatabase } = await import('./db/database.ts');
const { createContext } = await import('./context.ts');
const { createApp } = await import('./app.ts');
const { seed } = await import('./db/seed.ts');

let server: Server;
let base = '';

async function call(method: string, url: string, options: { body?: unknown; cookie?: string; origin?: string } = {}) {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  if (options.cookie) headers.cookie = options.cookie;
  if (options.origin) headers.origin = options.origin;
  const res = await fetch(base + url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers };
}

async function login(email: string, password: string) {
  const res = await call('POST', '/api/auth/login', { body: { email, password } });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return res.headers.get('set-cookie')!.split(';')[0];
}

before(async () => {
  const ctx = createContext(openDatabase(':memory:'));
  await seed(ctx, { silent: true });
  await ctx.users.create({ name: 'Leitor', email: 'viewer@test.dev', password: 'viewer-password-123', role: 'viewer' });
  server = createApp(ctx).listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('API pública', () => {
  test('entrega serviços ativos com preços do banco', async () => {
    const res = await call('GET', '/api/public/site');
    assert.equal(res.status, 200);
    const video = res.body.services.find((s: { id: string }) => s.id === 'video-avulso');
    assert.equal(video.priceCents, 25000);
    const plan = res.body.services.find((s: { id: string }) => s.id === 'plano-8');
    assert.equal(plan.kind, 'plan');
    assert.equal(plan.priceCents, 120000);
    assert.ok(!('active' in video), 'metadados administrativos não vazam');
  });

  test('orçamento é recalculado no servidor e ignora preço enviado pelo cliente', async () => {
    const res = await call('POST', '/api/public/quotes', {
      body: {
        channel: 'whatsapp',
        items: [
          { serviceId: 'video-avulso', quantity: 8, priceCents: 1 },
          { serviceId: 'carrossel', quantity: 4 },
          { serviceId: 'video-institucional', quantity: 2 },
        ],
        totalCents: 1,
      },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.quote.totalCents, 8 * 25000 + 4 * 14000 + 2 * 40000);
    assert.match(res.body.whatsappUrl, /^https:\/\/wa\.me\/\d+\?text=/);
  });

  test('quantidade fora dos limites é ajustada ao máximo do serviço', async () => {
    const res = await call('POST', '/api/public/quotes', { body: { channel: 'request', items: [{ serviceId: 'video-institucional', quantity: 999 }] } });
    assert.equal(res.body.quote.lines[0].quantity, 20);
  });

  test('plano mensal tem preço fixo e só um plano entra no orçamento', async () => {
    const res = await call('POST', '/api/public/quotes', {
      body: {
        channel: 'whatsapp',
        items: [
          { serviceId: 'plano-8', quantity: 5 },
          { serviceId: 'plano-12', quantity: 1 },
          { serviceId: 'carrossel', quantity: 2 },
        ],
      },
    });
    assert.equal(res.status, 201);
    const { lines, totalCents } = res.body.quote;
    assert.deepEqual(lines.map((l: { serviceId: string; quantity: number }) => [l.serviceId, l.quantity]), [['plano-8', 1], ['carrossel', 2]]);
    assert.equal(totalCents, 120000 + 2 * 14000);
    const message = decodeURIComponent(res.body.whatsappUrl.split('text=')[1]);
    assert.match(message, /Plano mensal: 8 vídeos por mês \(R\$ 1\.200,00\/mês\)/);
    assert.match(message, /Carrossel: 2 carrosséis/);
  });
});

describe('Autenticação e permissões', () => {
  test('rotas admin exigem login', async () => {
    assert.equal((await call('GET', '/api/admin/services')).status, 401);
    assert.equal((await call('PUT', '/api/admin/prices', { body: { prices: [{ id: 'video-avulso', priceCents: 1 }] } })).status, 401);
  });

  test('senha incorreta é rejeitada', async () => {
    const res = await call('POST', '/api/auth/login', { body: { email: 'owner@test.dev', password: 'errada' } });
    assert.equal(res.status, 401);
  });

  test('cookie de sessão é httpOnly e SameSite=Strict', async () => {
    const res = await call('POST', '/api/auth/login', { body: { email: 'owner@test.dev', password: 'owner-password-123' } });
    const cookie = res.headers.get('set-cookie')!;
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Strict/i);
  });

  test('usuário viewer pode ler mas não alterar preços', async () => {
    const cookie = await login('viewer@test.dev', 'viewer-password-123');
    assert.equal((await call('GET', '/api/admin/services', { cookie })).status, 200);
    const res = await call('PUT', '/api/admin/prices', { cookie, body: { prices: [{ id: 'video-avulso', priceCents: 1 }] } });
    assert.equal(res.status, 403);
    assert.equal((await call('PUT', '/api/admin/settings', { cookie, body: {} })).status, 403);
  });

  test('owner altera preço e o configurador público reflete na hora', async () => {
    const cookie = await login('owner@test.dev', 'owner-password-123');
    const res = await call('PUT', '/api/admin/prices', { cookie, body: { prices: [{ id: 'video-avulso', priceCents: 27000 }] } });
    assert.equal(res.status, 200);
    const site = await call('GET', '/api/public/site');
    assert.equal(site.body.services.find((s: { id: string }) => s.id === 'video-avulso').priceCents, 27000);
  });

  test('requisições de outra origem são bloqueadas (CSRF)', async () => {
    const cookie = await login('owner@test.dev', 'owner-password-123');
    const res = await call('PUT', '/api/admin/prices', {
      cookie,
      origin: 'https://site-malicioso.com',
      body: { prices: [{ id: 'video-avulso', priceCents: 1 }] },
    });
    assert.equal(res.status, 403);
  });

  test('logout invalida a sessão no servidor', async () => {
    const cookie = await login('owner@test.dev', 'owner-password-123');
    assert.equal((await call('POST', '/api/auth/logout', { cookie })).status, 204);
    assert.equal((await call('GET', '/api/admin/services', { cookie })).status, 401);
  });
});

describe('Uploads', () => {
  test('arquivos que não são imagem são recusados pelo conteúdo', async () => {
    const cookie = await login('owner@test.dev', 'owner-password-123');
    const form = new FormData();
    form.append('file', new Blob(['<svg onload=alert(1)>'], { type: 'image/png' }), 'fake.png');
    const res = await fetch(`${base}/api/admin/media`, { method: 'POST', headers: { cookie }, body: form });
    assert.equal(res.status, 415);
  });

  test('upload de PNG válido é aceito', async () => {
    const cookie = await login('owner@test.dev', 'owner-password-123');
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    const form = new FormData();
    form.append('file', new Blob([png]), 'pixel.png');
    const res = await fetch(`${base}/api/admin/media`, { method: 'POST', headers: { cookie }, body: form });
    assert.equal(res.status, 201);
    const media = await res.json();
    assert.match(media.url, /^\/uploads\/[\w-]+\.png$/);
  });
});
