import type { AppContext } from '../context.ts';
import { config } from '../config.ts';
import { generatePassword } from '../auth/password.ts';
import { defaultSettings, seedMedia, seedServices } from './defaults.ts';
import { transaction } from './database.ts';
import { serviceInputSchema } from '../services/schemas.ts';

/** Popula o banco no primeiro boot. Execuções seguintes não alteram nada. */
export async function seed(ctx: AppContext, options: { silent?: boolean } = {}) {
  const log = options.silent ? () => {} : console.log;
  const hasContent = ctx.db.prepare('SELECT 1 FROM settings LIMIT 1').get();

  if (!hasContent) {
    transaction(ctx.db, () => {
      for (const media of seedMedia) ctx.media.insertRemote(media);
      for (const { id, ...service } of seedServices) ctx.services.create(serviceInputSchema.parse({ ...service, active: true }), id);
      ctx.settings.save(defaultSettings);
    });
    log('› Conteúdo inicial criado (serviços, imagens e textos).');
  }

  if (ctx.users.count() === 0) {
    const password = config.adminPassword || generatePassword();
    await ctx.users.create({ name: 'Proprietário', email: config.adminEmail, password, role: 'owner' });
    log('');
    log('┌──────────────────────────────────────────────────────────────┐');
    log('│  Conta proprietária criada (role: owner)                     │');
    log(`│  E-mail: ${config.adminEmail.padEnd(52)}│`);
    if (!config.adminPassword) log(`│  Senha:  ${password.padEnd(52)}│`);
    else log('│  Senha:  definida em ADMIN_PASSWORD                          │');
    log('│  Troque a senha em /admin → Configurações → Conta.           │');
    log('└──────────────────────────────────────────────────────────────┘');
    log('');
  }
}
