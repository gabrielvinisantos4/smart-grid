import { useRef, useState, type DragEvent } from 'react';
import { ArrowDown, ArrowUp, Eye, ImagePlus, Link2, Loader2, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import type { AdminMediaAsset, GalleryItem, GalleryLayout, ResultItem } from '@shared/types';
import { adminApi } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import { useAuth } from '@/hooks/useAuth';
import { Button, LinkButton } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { GALLERY_LAYOUTS } from '@/data/galleryLayouts';
import { useMediaMap } from '../hooks/useMediaMap';
import { useSettingsDraft } from '../hooks/useSettingsDraft';
import { Badge, Card, EmptyState, Field, PageHeader, ReadOnlyBanner, Select, Skeleton, TextInput, Toggle } from '../components/ui';
import { MediaPicker, MediaSlot } from '../components/MediaPicker';
import { SaveBar } from '../components/SaveBar';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

type Tab = 'library' | 'sections' | 'gallery' | 'results';
const TABS: { id: Tab; label: string }[] = [
  { id: 'library', label: 'Biblioteca' },
  { id: 'sections', label: 'Imagens das seções' },
  { id: 'gallery', label: 'Galeria' },
  { id: 'results', label: 'Resultados' },
];

const uid = () => Math.random().toString(36).slice(2, 10);
const thumb = (url: string, w = 500) => url.replace(/w=\d+/, `w=${w}`);

function move<T>(list: T[], index: number, delta: number): T[] {
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(index + delta, 0, item);
  return next;
}

/* ------------------------------------------------------------------------ */

function Library({ media, reload, readOnly }: { media: ReturnType<typeof useMediaMap>; reload: () => Promise<void>; readOnly: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<string | null>(null);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');

  const uploadFiles = async (files: FileList | File[]) => {
    const list = [...files].filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    setUploading(list.length);
    let ok = 0;
    for (const file of list) {
      try {
        await adminApi.uploadMedia(file, file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
        ok++;
      } catch (e) {
        toast(`${file.name}: ${e instanceof Error ? e.message : 'falha'}`, 'error');
      }
      setUploading((n) => n - 1);
    }
    if (ok) toast(ok === 1 ? 'Imagem enviada.' : `${ok} imagens enviadas.`);
    await reload();
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!readOnly) void uploadFiles(e.dataTransfer.files);
  };

  const replace = async (file?: File) => {
    const id = replaceTarget.current;
    if (!file || !id) return;
    try {
      await adminApi.replaceMedia(id, file);
      toast('Imagem substituída em todas as seções que a utilizam.');
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Falha ao substituir.', 'error');
    }
  };

  const remove = async (item: AdminMediaAsset) => {
    const inUse = item.usage.length > 0;
    const ok = await confirm({
      title: 'Excluir imagem?',
      message: inUse ? (
        <>
          Ela está em uso em: <strong className="text-bone">{item.usage.map((u) => u.label).join(', ')}</strong>. Essas seções ficarão sem imagem.
        </>
      ) : (
        'Essa ação não pode ser desfeita.'
      ),
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok) return;
    try {
      await adminApi.deleteMedia(item.id, inUse);
      toast('Imagem excluída.');
      await reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Falha ao excluir.', 'error');
    }
  };

  const saveAlt = async (item: AdminMediaAsset, alt: string) => {
    if (alt === item.alt) return;
    try {
      await adminApi.updateMedia(item.id, alt);
      toast('Descrição atualizada.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erro.', 'error');
    }
  };

  const addRemote = async () => {
    try {
      await adminApi.addRemoteMedia(remoteUrl, '');
      setRemoteUrl('');
      toast('Imagem adicionada pela URL.');
      await reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'URL inválida.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {!readOnly && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed px-6 py-10 text-center transition',
              dragging ? 'border-bone/60 bg-white/[0.06]' : 'border-white/15 hover:border-white/30 hover:bg-white/[0.02]',
            )}
          >
            {uploading ? <Loader2 className="h-6 w-6 animate-spin text-bone/70" /> : <Upload className="h-6 w-6 text-bone/70" strokeWidth={1.6} />}
            <p className="mt-4 text-[15px]">{uploading ? `Enviando ${uploading}…` : 'Arraste fotos aqui ou clique para enviar'}</p>
            <p className="mt-1 text-[12.5px] text-fog">JPG, PNG, WEBP, AVIF ou GIF · até 12 MB cada · várias de uma vez</p>
            <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
          </div>
          <Card title="Adicionar por URL" description="Use um link https:// de imagem hospedada (ex.: CDN).">
            <div className="flex gap-2">
              <TextInput value={remoteUrl} onChange={(e) => setRemoteUrl(e.target.value)} placeholder="https://…" />
              <Button variant="glass" onClick={addRemote} disabled={!remoteUrl.startsWith('https://')} icon={<Link2 className="h-4 w-4" />}>
                Adicionar
              </Button>
            </div>
          </Card>
        </div>
      )}
      <input ref={replaceRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="hidden" onChange={(e) => replace(e.target.files?.[0])} />

      {media.loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {media.data?.map((item) => (
            <div key={item.id} className="glass group flex flex-col overflow-hidden rounded-[22px] p-1.5">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[17px] bg-ink-100">
                <img src={thumb(item.url)} alt={item.alt} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute left-2 top-2 flex gap-1">
                  {item.usage.length > 0 ? <Badge tone="positive">Em uso · {item.usage.length}</Badge> : <Badge tone="muted">Livre</Badge>}
                </div>
                {!readOnly && (
                  <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1.5 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                    <button
                      onClick={() => {
                        replaceTarget.current = item.id;
                        replaceRef.current?.click();
                      }}
                      className="glass-pill flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px]"
                      title="Substituir arquivo (mantém onde é usada)"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Substituir
                    </button>
                    <button onClick={() => remove(item)} className="glass-pill flex h-8 w-8 items-center justify-center rounded-full hover:text-red-300" aria-label="Excluir imagem">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <input
                  defaultValue={item.alt}
                  disabled={readOnly}
                  onBlur={(e) => saveAlt(item, e.target.value)}
                  placeholder="Descrição (texto alternativo)"
                  className="w-full truncate rounded-lg bg-transparent px-1 py-1 text-[13px] text-bone outline-none transition placeholder:text-fog focus:bg-white/[0.05]"
                />
                <p className="mt-1 truncate px-1 text-[11px] text-fog" title={item.usage.map((u) => u.label).join(', ')}>
                  {item.usage.length ? item.usage.map((u) => u.label).join(' · ') : item.credit ?? (item.source === 'upload' ? 'Upload' : 'URL externa')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function GalleryEditor({ items, onChange, media, readOnly }: { items: GalleryItem[]; onChange: (items: GalleryItem[]) => void; media: ReturnType<typeof useMediaMap>; readOnly: boolean }) {
  const [picking, setPicking] = useState(false);
  const patch = (id: string, p: Partial<GalleryItem>) => onChange(items.map((i) => (i.id === id ? { ...i, ...p } : i)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-[13px] text-mist">
          Misture formatos verticais, horizontais e quadrados. As fotos são organizadas automaticamente em linhas editoriais sem espaços vazios.
        </p>
        {!readOnly && (
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setPicking(true)}>
            Adicionar foto
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<ImagePlus className="h-5 w-5" />} title="Galeria vazia" text="Adicione fotos da biblioteca para montar o portfólio." />
      ) : (
        <div className="space-y-2.5">
          {items.map((item, i) => {
            const m = media.get(item.mediaId);
            return (
              <div key={item.id} className="glass grid items-center gap-3 rounded-[20px] p-2.5 md:grid-cols-[96px_80px_1fr_150px_auto_auto]">
                <div className="aspect-[4/3] w-24 overflow-hidden rounded-[14px] bg-ink-100">
                  {m && <img src={thumb(m.url, 300)} alt="" className={cn('h-full w-full object-cover', item.grayscale && 'grayscale')} />}
                </div>
                <TextInput aria-label="Rótulo" disabled={readOnly} value={item.label} maxLength={24} onChange={(e) => patch(item.id, { label: e.target.value })} className="h-10 font-mono text-[12px]" />
                <TextInput aria-label="Legenda" disabled={readOnly} value={item.caption} maxLength={80} placeholder="Legenda" onChange={(e) => patch(item.id, { caption: e.target.value })} className="h-10" />
                <Select aria-label="Formato" disabled={readOnly} value={item.layout} onChange={(e) => patch(item.id, { layout: e.target.value as GalleryLayout })} className="h-10">
                  {Object.entries(GALLERY_LAYOUTS).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </Select>
                <label className="flex items-center gap-2 px-2 text-[12.5px] text-mist">
                  <Toggle checked={item.grayscale} disabled={readOnly} onChange={(v) => patch(item.id, { grayscale: v })} label="Preto e branco" /> P&B
                </label>
                {!readOnly && (
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => onChange(move(items, i, -1))} disabled={i === 0} className="flex h-9 w-9 items-center justify-center rounded-xl text-bone/60 hover:bg-white/5 disabled:opacity-25" aria-label="Subir">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => onChange(move(items, i, 1))} disabled={i === items.length - 1} className="flex h-9 w-9 items-center justify-center rounded-xl text-bone/60 hover:bg-white/5 disabled:opacity-25" aria-label="Descer">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button onClick={() => onChange(items.filter((x) => x.id !== item.id))} className="flex h-9 w-9 items-center justify-center rounded-xl text-bone/50 hover:bg-red-400/10 hover:text-red-300" aria-label="Remover da galeria">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <MediaPicker
        open={picking}
        onClose={() => setPicking(false)}
        title="Adicionar à galeria"
        onPick={(m) => {
          void media.reload();
          onChange([...items, { id: uid(), mediaId: m.id, label: String(items.length + 1).padStart(3, '0'), caption: '', layout: 'square', grayscale: true }]);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function ResultsEditor({
  settings,
  onChange,
  media,
  readOnly,
}: {
  settings: { highlightValue: string; highlightLabel: string; items: ResultItem[] };
  onChange: (patch: Partial<{ highlightValue: string; highlightLabel: string; items: ResultItem[] }>) => void;
  media: ReturnType<typeof useMediaMap>;
  readOnly: boolean;
}) {
  const { items } = settings;
  const patch = (id: string, p: Partial<ResultItem>) => onChange({ items: items.map((i) => (i.id === id ? { ...i, ...p } : i)) });

  return (
    <div className="space-y-5">
      <Card title="Destaque numérico" description="Número grande exibido acima dos vídeos.">
        <div className="grid gap-4 md:grid-cols-[200px_1fr]">
          <Field label="Valor">
            <TextInput disabled={readOnly} value={settings.highlightValue} maxLength={24} onChange={(e) => onChange({ highlightValue: e.target.value })} placeholder="+349 mil" />
          </Field>
          <Field label="Legenda">
            <TextInput disabled={readOnly} value={settings.highlightLabel} maxLength={120} onChange={(e) => onChange({ highlightLabel: e.target.value })} />
          </Field>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-[13px] text-mist">
          Envie o print de cada Reel/TikTok exatamente como aparece no app e diga quem é a pessoa ou marca. O nome e o @ aparecem embaixo do vídeo no site.
        </p>
        {!readOnly && (
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => onChange({ items: [...items, { id: uid(), mediaId: '', views: '', caption: '', client: '', handle: '', niche: '', url: '' }] })}>
            Adicionar vídeo
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item, i) => (
          <div key={item.id} className="glass rounded-[22px] p-3">
            <div className="grid grid-cols-[110px_1fr] gap-3">
              <MediaSlot label="Print do vídeo" aspect="aspect-[9/16]" allowClear={false} disabled={readOnly} media={media.get(item.mediaId)} onChange={(id) => id && patch(item.id, { mediaId: id })} />
              <div className="space-y-3">
                <Field label="Nome da pessoa / marca">
                  <TextInput disabled={readOnly} value={item.client} maxLength={60} placeholder="Dra. Ana Souza" onChange={(e) => patch(item.id, { client: e.target.value })} className="h-10" />
                </Field>
                <Field label="@ do perfil">
                  <TextInput disabled={readOnly} value={item.handle ?? ''} maxLength={60} placeholder="draanasouza" onChange={(e) => patch(item.id, { handle: e.target.value })} className="h-10" />
                </Field>
                <Field label="Visualizações">
                  <TextInput disabled={readOnly} value={item.views} maxLength={24} placeholder="120 mil" onChange={(e) => patch(item.id, { views: e.target.value })} className="h-10" />
                </Field>
              </div>
            </div>
            <div className="mt-3 space-y-3">
              <Field label="Nicho (opcional)">
                <TextInput disabled={readOnly} value={item.niche ?? ''} maxLength={60} placeholder="Saúde feminina" onChange={(e) => patch(item.id, { niche: e.target.value })} className="h-10" />
              </Field>
              <Field label="Link do post (opcional)" hint="Sem link, o card leva ao perfil do @.">
                <TextInput disabled={readOnly} value={item.url} maxLength={500} placeholder="https://instagram.com/reel/…" onChange={(e) => patch(item.id, { url: e.target.value })} className="h-10" />
              </Field>
              <Field label="Texto sobre o vídeo (opcional)" hint="Deixe vazio ao usar prints, que já trazem a legenda.">
                <TextInput disabled={readOnly} value={item.caption} maxLength={120} onChange={(e) => patch(item.id, { caption: e.target.value })} className="h-10" />
              </Field>
            </div>
            {!readOnly && (
              <div className="mt-3 flex items-center gap-0.5 border-t border-white/[0.06] pt-2">
                <button onClick={() => onChange({ items: move(items, i, -1) })} disabled={i === 0} className="flex h-9 w-9 items-center justify-center rounded-xl text-bone/60 hover:bg-white/5 disabled:opacity-25" aria-label="Mover para a esquerda">
                  <ArrowUp className="h-4 w-4 -rotate-90" />
                </button>
                <button onClick={() => onChange({ items: move(items, i, 1) })} disabled={i === items.length - 1} className="flex h-9 w-9 items-center justify-center rounded-xl text-bone/60 hover:bg-white/5 disabled:opacity-25" aria-label="Mover para a direita">
                  <ArrowDown className="h-4 w-4 -rotate-90" />
                </button>
                <button onClick={() => onChange({ items: items.filter((x) => x.id !== item.id) })} className="ml-auto flex h-9 items-center gap-2 rounded-xl px-3 text-[12.5px] text-bone/50 hover:bg-red-400/10 hover:text-red-300">
                  <Trash2 className="h-4 w-4" /> Remover
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

export function ImagesPage() {
  const { isOwner } = useAuth();
  const [tab, setTab] = useState<Tab>('library');
  const media = useMediaMap();
  const { draft, update, dirty, saving, save, discard } = useSettingsDraft();
  const readOnly = !isOwner;
  const resultsIncomplete = draft?.results.items.some((i) => !i.mediaId) ?? false;

  const saveAndRefresh = async () => {
    await save();
    await media.reload();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Mídia"
        title="Imagens"
        description="Envie, substitua e organize as fotos do site. Nenhuma imagem fica fixa no código."
        actions={
          <LinkButton href="/" target="_blank" rel="noreferrer" variant="glass" size="sm" icon={<Eye className="h-4 w-4" />}>
            Ver no site
          </LinkButton>
        }
      />
      {readOnly && <ReadOnlyBanner />}

      <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn('shrink-0 rounded-full px-4 py-2 text-[13px] transition', tab === t.id ? 'bg-bone text-ink' : 'text-bone/60 hover:bg-white/5 hover:text-bone')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'library' && <Library media={media} reload={media.reload} readOnly={readOnly} />}

      {tab !== 'library' && !draft && <Skeleton className="h-80" />}

      {tab === 'sections' && draft && (
        <div className="grid gap-5 md:grid-cols-2">
          <Card title="Imagem principal (Hero)" description="Ocupa a tela inteira na abertura. Prefira fotos horizontais escuras.">
            <MediaSlot label="Hero" media={media.get(draft.hero.imageId)} disabled={readOnly} onChange={(id) => update('hero', { imageId: id })} />
          </Card>
          <Card title="Seção “O estúdio”" description="Foto de bastidores ao lado do texto institucional.">
            <MediaSlot label="Sobre" media={media.get(draft.about.imageId)} disabled={readOnly} onChange={(id) => update('about', { imageId: id })} />
          </Card>
          <Card title="Chamada final" description="Fundo do bloco antes do rodapé.">
            <MediaSlot label="Chamada final" media={media.get(draft.finalCta.imageId)} disabled={readOnly} onChange={(id) => update('finalCta', { imageId: id })} />
          </Card>
          <Card title="Tela de login" description="Imagem exibida em /admin/login.">
            <MediaSlot label="Login" media={media.get(draft.login.imageId)} disabled={readOnly} onChange={(id) => update('login', { imageId: id })} />
          </Card>
          <Card title="Logo" description="PNG ou WEBP com fundo transparente. Sem logo, o nome da empresa é exibido.">
            <MediaSlot label="Logo" aspect="aspect-[3/1]" media={media.get(draft.brand.logoId)} disabled={readOnly} onChange={(id) => update('brand', { logoId: id })} />
          </Card>
          <Card title="Imagens dos serviços" description="Cada serviço tem sua própria imagem, editada em Serviços → Editar.">
            <a href="/admin/servicos" className="text-[13px] text-bone/80 underline-offset-4 hover:underline">
              Ir para Serviços →
            </a>
          </Card>
        </div>
      )}

      {tab === 'gallery' && draft && <GalleryEditor items={draft.gallery.items} onChange={(items) => update('gallery', { items })} media={media} readOnly={readOnly} />}

      {tab === 'results' && draft && <ResultsEditor settings={draft.results} onChange={(p) => update('results', p)} media={media} readOnly={readOnly} />}

      {!readOnly && <SaveBar dirty={dirty} saving={saving} onSave={saveAndRefresh} onDiscard={discard} disabled={resultsIncomplete} />}
    </div>
  );
}
