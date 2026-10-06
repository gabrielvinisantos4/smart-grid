import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { KeyRound, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import { ROLE_LABELS, type Pillar, type Role, type SiteSettings, type User } from '@shared/types';
import { buildWhatsAppMessage } from '@shared/pricing';
import { adminApi } from '@/services/adminApi';
import { authApi } from '@/services/authApi';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { RichText } from '@/components/ui/RichText';
import { cn } from '@/lib/cn';
import { useSettingsDraft } from '../hooks/useSettingsDraft';
import { useMediaMap } from '../hooks/useMediaMap';
import { Badge, Card, Field, PageHeader, ReadOnlyBanner, Select, Skeleton, TextArea, TextInput, Toggle } from '../components/ui';
import { MediaSlot } from '../components/MediaPicker';
import { SaveBar } from '../components/SaveBar';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

type Tab = 'brand' | 'texts' | 'contact' | 'account';
const TABS: { id: Tab; label: string }[] = [
  { id: 'brand', label: 'Marca' },
  { id: 'texts', label: 'Textos da página' },
  { id: 'contact', label: 'Contato & WhatsApp' },
  { id: 'account', label: 'Conta & equipe' },
];

const ACCENTS = ['#e8e2d6', '#ffffff', '#d4d4d8', '#c9b99a', '#b8c4c2', '#d9c2b6'];

type Update = <K extends keyof SiteSettings>(section: K, patch: Partial<SiteSettings[K]>) => void;

function Group({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card title={title} description={description}>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </Card>
  );
}

const HINT_ACCENT = 'Use *asteriscos* para destacar palavras em itálico serifado.';

function TextsTab({ draft, update, ro }: { draft: SiteSettings; update: Update; ro: boolean }) {
  const { hero, about, process, configurator: cfg, results, gallery, finalCta, footer, seo } = draft;
  const setPillar = (i: number, p: Partial<Pillar>) => update('about', { pillars: about.pillars.map((x, j) => (i === j ? { ...x, ...p } : x)) });
  const setStep = (i: number, p: Partial<Pillar>) => update('process', { steps: process.steps.map((x, j) => (i === j ? { ...x, ...p } : x)) });

  return (
    <div className="space-y-5">
      <Group title="Hero" description="Abertura da página.">
        <Field label="Título" hint={HINT_ACCENT} className="md:col-span-2">
          <TextInput disabled={ro} value={hero.title} onChange={(e) => update('hero', { title: e.target.value })} />
        </Field>
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3 md:col-span-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog">Prévia</p>
          <p className="mt-1 text-2xl font-medium tracking-[-0.04em]">
            <RichText text={hero.title} accentClassName="text-accent" />
          </p>
        </div>
        <Field label="Subtítulo" className="md:col-span-2">
          <TextArea disabled={ro} value={hero.subtitle} onChange={(e) => update('hero', { subtitle: e.target.value })} />
        </Field>
        <Field label="Texto do botão principal (CTA)">
          <TextInput disabled={ro} value={hero.ctaLabel} onChange={(e) => update('hero', { ctaLabel: e.target.value })} />
        </Field>
        <Field label="Botão secundário" hint="Deixe vazio para ocultar.">
          <TextInput disabled={ro} value={hero.secondaryCtaLabel} onChange={(e) => update('hero', { secondaryCtaLabel: e.target.value })} />
        </Field>
        <Field label="Linha acima do título">
          <TextInput disabled={ro} value={hero.eyebrow} onChange={(e) => update('hero', { eyebrow: e.target.value })} />
        </Field>
        <Field label="Tags flutuantes" hint="Separadas por vírgula (até 6). Ex.: VIDEO, CONTENT">
          <TextInput
            disabled={ro}
            value={hero.tags.join(', ')}
            onChange={(e) => update('hero', { tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 8) })}
          />
        </Field>
      </Group>

      <Group title="O estúdio">
        <Field label="Rótulo">
          <TextInput disabled={ro} value={about.eyebrow} onChange={(e) => update('about', { eyebrow: e.target.value })} />
        </Field>
        <Field label="Título" hint={HINT_ACCENT}>
          <TextInput disabled={ro} value={about.title} onChange={(e) => update('about', { title: e.target.value })} />
        </Field>
        <Field label="Texto" className="md:col-span-2">
          <TextArea disabled={ro} value={about.text} onChange={(e) => update('about', { text: e.target.value })} />
        </Field>
        <div className="space-y-3 md:col-span-2">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-mist">Pilares</p>
          {about.pillars.map((p, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-[200px_1fr_auto]">
              <TextInput disabled={ro} value={p.title} onChange={(e) => setPillar(i, { title: e.target.value })} placeholder="Título" />
              <TextInput disabled={ro} value={p.text} onChange={(e) => setPillar(i, { text: e.target.value })} placeholder="Descrição" />
              {!ro && (
                <button onClick={() => update('about', { pillars: about.pillars.filter((_, j) => j !== i) })} className="flex h-11 w-11 items-center justify-center rounded-2xl text-bone/50 hover:bg-red-400/10 hover:text-red-300" aria-label="Remover pilar">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {!ro && about.pillars.length < 6 && (
            <Button size="sm" variant="glass" icon={<Plus className="h-4 w-4" />} onClick={() => update('about', { pillars: [...about.pillars, { title: '', text: '' }] })}>
              Adicionar pilar
            </Button>
          )}
        </div>
      </Group>

      <Group title="Processo — vídeo na rolagem" description="O vídeo avança e volta conforme a pessoa rola a página. As etapas acompanham o progresso do vídeo.">
        <div className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3 md:col-span-2">
          <div>
            <p className="text-[14px]">{process.enabled ? 'Seção visível' : 'Seção oculta'}</p>
            <p className="text-[12px] text-fog">Aparece logo depois de “O estúdio”.</p>
          </div>
          <Toggle checked={process.enabled} disabled={ro} onChange={(v) => update('process', { enabled: v })} label="Mostrar seção de processo" />
        </div>
        <Field label="Rótulo">
          <TextInput disabled={ro} value={process.eyebrow} onChange={(e) => update('process', { eyebrow: e.target.value })} />
        </Field>
        <Field label="Título" hint={HINT_ACCENT}>
          <TextInput disabled={ro} value={process.title} onChange={(e) => update('process', { title: e.target.value })} />
        </Field>
        <Field label="Texto" className="md:col-span-2">
          <TextInput disabled={ro} value={process.text} onChange={(e) => update('process', { text: e.target.value })} />
        </Field>
        <div className="space-y-3 md:col-span-2">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-mist">Etapas (dividem o vídeo em partes iguais)</p>
          {process.steps.map((p, i) => (
            <div key={i} className="grid gap-2 md:grid-cols-[200px_1fr_auto]">
              <TextInput disabled={ro} value={p.title} onChange={(e) => setStep(i, { title: e.target.value })} placeholder="Etapa" />
              <TextInput disabled={ro} value={p.text} onChange={(e) => setStep(i, { text: e.target.value })} placeholder="Descrição" />
              {!ro && process.steps.length > 1 && (
                <button onClick={() => update('process', { steps: process.steps.filter((_, j) => j !== i) })} className="flex h-11 w-11 items-center justify-center rounded-2xl text-bone/50 hover:bg-red-400/10 hover:text-red-300" aria-label="Remover etapa">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {!ro && process.steps.length < 6 && (
            <Button size="sm" variant="glass" icon={<Plus className="h-4 w-4" />} onClick={() => update('process', { steps: [...process.steps, { title: '', text: '' }] })}>
              Adicionar etapa
            </Button>
          )}
        </div>
        <Field label="Quadros do vídeo" hint="Gerados com: npm run frames -- video.mp4 nome → use scrub/nome/manifest.json" className="md:col-span-2">
          <TextInput disabled={ro} value={process.framesPath} onChange={(e) => update('process', { framesPath: e.target.value })} className="font-mono text-[13px]" />
        </Field>
      </Group>

      <Group title="Resultados">
        <Field label="Rótulo">
          <TextInput disabled={ro} value={results.eyebrow} onChange={(e) => update('results', { eyebrow: e.target.value })} />
        </Field>
        <Field label="Título" hint={HINT_ACCENT}>
          <TextInput disabled={ro} value={results.title} onChange={(e) => update('results', { title: e.target.value })} />
        </Field>
        <Field label="Texto" className="md:col-span-2">
          <TextArea disabled={ro} value={results.text} onChange={(e) => update('results', { text: e.target.value })} />
        </Field>
      </Group>

      <Group title="Configurador de orçamento">
        <Field label="Título" hint={HINT_ACCENT}>
          <TextInput disabled={ro} value={cfg.title} onChange={(e) => update('configurator', { title: e.target.value })} />
        </Field>
        <Field label="Rótulo">
          <TextInput disabled={ro} value={cfg.eyebrow} onChange={(e) => update('configurator', { eyebrow: e.target.value })} />
        </Field>
        <Field label="Texto" className="md:col-span-2">
          <TextInput disabled={ro} value={cfg.text} onChange={(e) => update('configurator', { text: e.target.value })} />
        </Field>
        <Field label="Etapa 01">
          <TextInput disabled={ro} value={cfg.stepTypeLabel} onChange={(e) => update('configurator', { stepTypeLabel: e.target.value })} />
        </Field>
        <Field label="Etapa 02 (pergunta)">
          <TextInput disabled={ro} value={cfg.quantityQuestion} onChange={(e) => update('configurator', { quantityQuestion: e.target.value })} />
        </Field>
        <Field label="Título do resumo">
          <TextInput disabled={ro} value={cfg.summaryTitle} onChange={(e) => update('configurator', { summaryTitle: e.target.value })} />
        </Field>
        <Field label="Rótulo do plano">
          <TextInput disabled={ro} value={cfg.summaryPlanLabel} onChange={(e) => update('configurator', { summaryPlanLabel: e.target.value })} />
        </Field>
        <Field label="Rótulo do total">
          <TextInput disabled={ro} value={cfg.totalLabel} onChange={(e) => update('configurator', { totalLabel: e.target.value })} />
        </Field>
        <Field label="Texto quando vazio">
          <TextInput disabled={ro} value={cfg.emptyText} onChange={(e) => update('configurator', { emptyText: e.target.value })} />
        </Field>
        <Field label="Botão “Solicitar”">
          <TextInput disabled={ro} value={cfg.requestCtaLabel} onChange={(e) => update('configurator', { requestCtaLabel: e.target.value })} />
        </Field>
        <Field label="Botão WhatsApp">
          <TextInput disabled={ro} value={cfg.whatsappCtaLabel} onChange={(e) => update('configurator', { whatsappCtaLabel: e.target.value })} />
        </Field>
        <Field label="Observação abaixo dos botões" className="md:col-span-2">
          <TextInput disabled={ro} value={cfg.disclaimer} onChange={(e) => update('configurator', { disclaimer: e.target.value })} />
        </Field>
      </Group>

      <Group title="Galeria">
        <Field label="Rótulo">
          <TextInput disabled={ro} value={gallery.eyebrow} onChange={(e) => update('gallery', { eyebrow: e.target.value })} />
        </Field>
        <Field label="Título" hint={HINT_ACCENT}>
          <TextInput disabled={ro} value={gallery.title} onChange={(e) => update('gallery', { title: e.target.value })} />
        </Field>
        <Field label="Texto" className="md:col-span-2">
          <TextArea disabled={ro} value={gallery.text} onChange={(e) => update('gallery', { text: e.target.value })} />
        </Field>
      </Group>

      <Group title="Chamada final e rodapé">
        <Field label="Título" hint={HINT_ACCENT}>
          <TextInput disabled={ro} value={finalCta.title} onChange={(e) => update('finalCta', { title: e.target.value })} />
        </Field>
        <Field label="Botão">
          <TextInput disabled={ro} value={finalCta.ctaLabel} onChange={(e) => update('finalCta', { ctaLabel: e.target.value })} />
        </Field>
        <Field label="Texto" className="md:col-span-2">
          <TextInput disabled={ro} value={finalCta.text} onChange={(e) => update('finalCta', { text: e.target.value })} />
        </Field>
        <Field label="Texto do rodapé" className="md:col-span-2">
          <TextArea disabled={ro} value={footer.text} onChange={(e) => update('footer', { text: e.target.value })} />
        </Field>
      </Group>

      <Group title="SEO" description="Como a página aparece no Google e ao compartilhar o link.">
        <Field label="Título da página (aba do navegador)" className="md:col-span-2">
          <TextInput disabled={ro} value={seo.pageTitle} onChange={(e) => update('seo', { pageTitle: e.target.value })} />
        </Field>
        <Field label="Descrição" className="md:col-span-2">
          <TextArea disabled={ro} value={seo.description} onChange={(e) => update('seo', { description: e.target.value })} />
        </Field>
      </Group>
    </div>
  );
}

function AccountTab() {
  const { user, isOwner } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [users, setUsers] = useState<User[] | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' as Role });

  useEffect(() => {
    if (isOwner) adminApi.users().then(setUsers).catch(() => setUsers([]));
  }, [isOwner]);

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) return toast('As senhas não conferem.', 'error');
    try {
      await authApi.changePassword(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      toast('Senha alterada. Outras sessões foram encerradas.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro.', 'error');
    }
  };

  const createUser = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const created = await adminApi.createUser(form);
      setUsers((u) => [...(u ?? []), created]);
      setForm({ name: '', email: '', password: '', role: 'viewer' });
      toast('Usuário criado.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro.', 'error');
    }
  };

  const removeUser = async (u: User) => {
    if (!(await confirm({ title: `Remover ${u.name}?`, message: 'O acesso ao painel é revogado imediatamente.', confirmLabel: 'Remover', danger: true }))) return;
    try {
      await adminApi.deleteUser(u.id);
      setUsers((list) => list?.filter((x) => x.id !== u.id) ?? null);
      toast('Usuário removido.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro.', 'error');
    }
  };

  const changeRole = async (u: User, role: Role) => {
    try {
      const updated = await adminApi.updateUserRole(u.id, role);
      setUsers((list) => list?.map((x) => (x.id === u.id ? updated : x)) ?? null);
      toast('Permissão atualizada.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro.', 'error');
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.3fr]">
      <Card title="Minha senha" description={`Conectado como ${user?.email}.`}>
        <form onSubmit={changePassword} className="space-y-4">
          <Field label="Senha atual">
            <TextInput type="password" autoComplete="current-password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </Field>
          <Field label="Nova senha" hint="Mínimo de 10 caracteres.">
            <TextInput type="password" autoComplete="new-password" minLength={10} required value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </Field>
          <Field label="Confirmar nova senha">
            <TextInput type="password" autoComplete="new-password" minLength={10} required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </Field>
          <Button type="submit" icon={<KeyRound className="h-4 w-4" />}>
            Alterar senha
          </Button>
        </form>
      </Card>

      {isOwner ? (
        <Card title="Equipe e permissões" description="Proprietários alteram tudo. Usuários de leitura apenas consultam orçamentos e configurações.">
          <ul className="divide-y divide-white/[0.06]">
            {users === null && <Skeleton className="h-16" />}
            {users?.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[13px] uppercase">{u.name.slice(0, 1)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px]">
                    {u.name} {u.id === user?.id && <span className="text-fog">(você)</span>}
                  </p>
                  <p className="truncate text-[12px] text-fog">{u.email}</p>
                </div>
                {u.id === user?.id ? (
                  <Badge>{ROLE_LABELS[u.role]}</Badge>
                ) : (
                  <>
                    <Select aria-label="Permissão" value={u.role} onChange={(e) => changeRole(u, e.target.value as Role)} className="h-9 w-40 text-[13px]">
                      <option value="owner">{ROLE_LABELS.owner}</option>
                      <option value="viewer">{ROLE_LABELS.viewer}</option>
                    </Select>
                    <button onClick={() => removeUser(u)} className="flex h-9 w-9 items-center justify-center rounded-xl text-bone/50 hover:bg-red-400/10 hover:text-red-300" aria-label="Remover usuário">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
          <form onSubmit={createUser} className="mt-5 grid gap-3 rounded-2xl border border-white/[0.07] bg-black/20 p-4 md:grid-cols-2">
            <p className="flex items-center gap-2 text-[14px] md:col-span-2">
              <UserPlus className="h-4 w-4" /> Novo usuário
            </p>
            <TextInput required placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextInput required type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextInput required type="password" minLength={10} autoComplete="new-password" placeholder="Senha inicial (mín. 10)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="viewer">{ROLE_LABELS.viewer}</option>
              <option value="owner">{ROLE_LABELS.owner}</option>
            </Select>
            <Button type="submit" size="sm" className="md:col-span-2 md:justify-self-end">
              Criar usuário
            </Button>
          </form>
        </Card>
      ) : (
        <Card title="Equipe e permissões">
          <p className="flex items-center gap-2 text-[13px] text-mist">
            <Users className="h-4 w-4" /> Apenas proprietários gerenciam a equipe.
          </p>
        </Card>
      )}
    </div>
  );
}

export function SettingsPage() {
  const { isOwner } = useAuth();
  const [tab, setTab] = useState<Tab>('brand');
  const { draft, update, dirty, saving, save, discard } = useSettingsDraft();
  const media = useMediaMap();
  const ro = !isOwner;

  const previewMessage = draft
    ? buildWhatsAppMessage({
        intro: draft.contact.whatsappIntro,
        lines: [
          { serviceId: 'a', name: 'Vídeos', quantity: 8, unitPriceCents: 0, subtotalCents: 0, unitSingular: 'unidade', unitPlural: 'unidades' },
          { serviceId: 'b', name: 'Carrosséis', quantity: 4, unitPriceCents: 0, subtotalCents: 0, unitSingular: 'unidade', unitPlural: 'unidades' },
        ],
        totalCents: 160000,
        code: 'ORC-0042',
      })
    : '';

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Site" title="Configurações" description="Marca, textos, contatos e acesso. Tudo que você salvar aqui aparece no site imediatamente." />
      {ro && <ReadOnlyBanner />}

      <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn('shrink-0 rounded-full px-4 py-2 text-[13px] transition', tab === t.id ? 'bg-bone text-ink' : 'text-bone/60 hover:bg-white/5 hover:text-bone')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab !== 'account' && !draft && <Skeleton className="h-96" />}

      {tab === 'brand' && draft && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Identidade">
            <div className="space-y-4">
              <Field label="Nome da empresa">
                <TextInput disabled={ro} value={draft.brand.name} onChange={(e) => update('brand', { name: e.target.value })} />
              </Field>
              <Field label="Descrição curta (rodapé)">
                <TextInput disabled={ro} value={draft.brand.tagline} onChange={(e) => update('brand', { tagline: e.target.value })} />
              </Field>
              <div>
                <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-mist">Cor de destaque</p>
                <div className="flex flex-wrap items-center gap-2">
                  {ACCENTS.map((c) => (
                    <button
                      key={c}
                      disabled={ro}
                      onClick={() => update('brand', { accentColor: c })}
                      className={cn('h-9 w-9 rounded-full border-2 transition', draft.brand.accentColor === c ? 'border-bone scale-110' : 'border-transparent')}
                      style={{ background: c }}
                      aria-label={`Cor ${c}`}
                    />
                  ))}
                  <label className="flex h-9 items-center gap-2 rounded-full border border-white/10 pl-1 pr-3 text-[12px] text-mist">
                    <input type="color" disabled={ro} value={draft.brand.accentColor} onChange={(e) => update('brand', { accentColor: e.target.value })} className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent" />
                    {draft.brand.accentColor}
                  </label>
                </div>
                <p className="mt-2 text-[12px] text-fog">Usada com parcimônia: palavras em itálico, indicadores e detalhes.</p>
              </div>
            </div>
          </Card>
          <Card title="Logo" description="PNG ou WEBP com fundo transparente. Sem logo, o nome é exibido como wordmark.">
            <MediaSlot label="Logo" aspect="aspect-[3/1]" media={media.get(draft.brand.logoId)} disabled={ro} onChange={(id) => update('brand', { logoId: id })} />
            <div className="mt-5 rounded-2xl border border-white/[0.06] bg-black/30 p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fog">Prévia do destaque</p>
              <p className="mt-2 text-3xl font-medium tracking-[-0.04em]">
                Seu conteúdo. <em className="font-serif font-normal italic" style={{ color: draft.brand.accentColor }}>Nossa criação.</em>
              </p>
            </div>
          </Card>
        </div>
      )}

      {tab === 'texts' && draft && <TextsTab draft={draft} update={update} ro={ro} />}

      {tab === 'contact' && draft && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Canais">
            <div className="space-y-4">
              <Field label="WhatsApp" hint="Com DDI e DDD, só números. Ex.: 5511999999999">
                <TextInput disabled={ro} inputMode="tel" value={draft.contact.whatsapp} onChange={(e) => update('contact', { whatsapp: e.target.value })} />
              </Field>
              <div>
                <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-mist">Instagram</p>
                <div className="space-y-2">
                  {draft.contact.instagrams.map((handle, i) => (
                    <div key={i} className="flex gap-2">
                      <TextInput
                        disabled={ro}
                        aria-label={`Instagram ${i + 1}`}
                        value={handle}
                        placeholder="usuario"
                        onChange={(e) => update('contact', { instagrams: draft.contact.instagrams.map((h, j) => (j === i ? e.target.value : h)) })}
                      />
                      {!ro && (
                        <button
                          type="button"
                          onClick={() => update('contact', { instagrams: draft.contact.instagrams.filter((_, j) => j !== i) })}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-bone/50 hover:bg-red-400/10 hover:text-red-300"
                          aria-label="Remover perfil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {!ro && draft.contact.instagrams.length < 6 && (
                    <Button size="sm" variant="glass" icon={<Plus className="h-4 w-4" />} onClick={() => update('contact', { instagrams: [...draft.contact.instagrams, ''] })}>
                      Adicionar perfil
                    </Button>
                  )}
                </div>
                <p className="mt-1.5 text-[12px] text-fog">Apenas o @usuário, sem o link. Aparecem no menu e no rodapé.</p>
              </div>
              <Field label="E-mail">
                <TextInput disabled={ro} type="email" value={draft.contact.email} onChange={(e) => update('contact', { email: e.target.value })} />
              </Field>
              <Field label="Cidade">
                <TextInput disabled={ro} value={draft.contact.city} onChange={(e) => update('contact', { city: e.target.value })} />
              </Field>
            </div>
          </Card>
          <Card title="Mensagem automática do WhatsApp" description="Primeira linha da mensagem enviada pelo cliente. Os itens e o total são adicionados automaticamente.">
            <Field label="Abertura da mensagem">
              <TextArea disabled={ro} value={draft.contact.whatsappIntro} onChange={(e) => update('contact', { whatsappIntro: e.target.value })} />
            </Field>
            <div className="mt-5 rounded-2xl rounded-tr-sm border border-emerald-300/10 bg-emerald-950/40 p-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-200/60">Prévia</p>
              <pre className="whitespace-pre-wrap font-sans text-[13.5px] leading-relaxed text-bone/90">{previewMessage}</pre>
            </div>
          </Card>
        </div>
      )}

      {tab === 'account' && <AccountTab />}

      {!ro && tab !== 'account' && <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={discard} />}
    </div>
  );
}
