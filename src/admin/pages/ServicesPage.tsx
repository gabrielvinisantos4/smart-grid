import { useState } from 'react';
import { ArrowDown, ArrowUp, Clapperboard, Pencil, Plus, Trash2 } from 'lucide-react';
import { SERVICE_KIND_LABELS, type Service } from '@shared/types';
import { adminApi } from '@/services/adminApi';
import { useAuth } from '@/hooks/useAuth';
import { DynamicIcon } from '@/config/icons';
import { Button } from '@/components/ui/Button';
import { formatBRL } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useResource } from '../hooks/useResource';
import { useMediaMap } from '../hooks/useMediaMap';
import { Badge, EmptyState, PageHeader, ReadOnlyBanner, Skeleton } from '../components/ui';
import { ServiceModal } from '../components/ServiceModal';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';

export function ServicesPage() {
  const { isOwner } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const { data: services, setData, loading } = useResource(adminApi.services);
  const mediaMap = useMediaMap();
  const [editing, setEditing] = useState<Service | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const open = (service: Service | null) => {
    void mediaMap.reload();
    setEditing(service);
    setModalOpen(true);
  };

  const move = async (index: number, delta: number) => {
    if (!services) return;
    const next = [...services];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    setData(next);
    try {
      setData(await adminApi.reorderServices(next.map((s) => s.id)));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erro ao reordenar.', 'error');
    }
  };

  const remove = async (service: Service) => {
    const ok = await confirm({
      title: `Excluir “${service.name}”?`,
      message: 'O serviço sai do configurador imediatamente. Orçamentos antigos continuam registrados. Se quiser apenas ocultar, prefira desativá-lo.',
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok) return;
    try {
      await adminApi.deleteService(service.id);
      setData((list) => list?.filter((s) => s.id !== service.id) ?? null);
      toast('Serviço excluído.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erro ao excluir.', 'error');
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      const { id, sortOrder: _s, createdAt: _c, updatedAt: _u, ...payload } = service;
      void _s; void _c; void _u;
      const saved = await adminApi.updateService(id, { ...payload, active: !service.active });
      setData((list) => list?.map((s) => (s.id === id ? saved : s)) ?? null);
      toast(saved.active ? 'Serviço ativado.' : 'Serviço ocultado do site.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erro.', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Catálogo"
        title="Serviços"
        description="Formatos que o cliente pode escolher no configurador. A ordem aqui é a ordem no site."
        actions={
          isOwner && (
            <Button arrow={false} icon={<Plus className="h-4 w-4" />} onClick={() => open(null)}>
              Adicionar serviço
            </Button>
          )
        }
      />
      {!isOwner && <ReadOnlyBanner />}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[360px] rounded-[26px]" />)}
        </div>
      ) : services && services.length === 0 ? (
        <EmptyState icon={<Clapperboard className="h-5 w-5" />} title="Nenhum serviço cadastrado" text="Crie o primeiro formato para ele aparecer no configurador." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services?.map((service, i) => {
            const image = mediaMap.get(service.imageId);
            return (
              <article key={service.id} className={cn('glass group flex flex-col overflow-hidden rounded-[26px] p-2 transition', !service.active && 'opacity-60')}>
                <div className="relative aspect-[16/9] overflow-hidden rounded-[20px] bg-ink-100">
                  {image && <img src={image.url.replace(/w=\d+/, 'w=800')} alt="" className="h-full w-full object-cover grayscale transition duration-700 group-hover:grayscale-0" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <span className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-black/30 backdrop-blur-md">
                    <DynamicIcon name={service.icon} className="h-[18px] w-[18px]" strokeWidth={1.6} />
                  </span>
                  <span className="absolute right-3 top-3 font-mono text-[10px] text-bone/60">#{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-medium tracking-[-0.02em]">{service.name}</h3>
                    <span className="flex shrink-0 gap-1.5">
                      <Badge>{SERVICE_KIND_LABELS[service.kind]}</Badge>
                      <Badge tone={service.active ? 'positive' : 'muted'}>{service.active ? 'Ativo' : 'Inativo'}</Badge>
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-mist">{service.description}</p>
                  <p className="mt-4 text-2xl font-medium tracking-[-0.04em]">
                    {formatBRL(service.priceCents)}
                    <span className="ml-1 text-[13px] font-normal tracking-normal text-fog">/{service.kind === 'plan' ? 'mês' : service.unitSingular}</span>
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-fog">
                    {service.kind === 'plan' ? 'Valor fixo mensal' : `${service.minQty}–${service.maxQty} unidades · padrão ${service.defaultQty}`}
                    {service.badge && ` · selo “${service.badge}”`}
                  </p>
                </div>
                {isOwner && (
                  <div className="flex items-center gap-1 border-t border-white/[0.06] px-2 pb-1 pt-2">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="flex h-9 w-9 items-center justify-center rounded-xl text-bone/60 transition hover:bg-white/5 hover:text-bone disabled:opacity-25" aria-label="Mover para cima">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === services.length - 1} className="flex h-9 w-9 items-center justify-center rounded-xl text-bone/60 transition hover:bg-white/5 hover:text-bone disabled:opacity-25" aria-label="Mover para baixo">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button onClick={() => toggleActive(service)} className="ml-1 rounded-xl px-3 py-2 text-[12.5px] text-bone/60 transition hover:bg-white/5 hover:text-bone">
                      {service.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button onClick={() => remove(service)} className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-bone/50 transition hover:bg-red-400/10 hover:text-red-300" aria-label="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => open(service)} className="flex h-9 items-center gap-2 rounded-xl bg-white/[0.06] px-3 text-[12.5px] transition hover:bg-white/10">
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <ServiceModal
        open={modalOpen}
        service={editing}
        media={(id) => mediaMap.get(id)}
        onClose={() => setModalOpen(false)}
        onSaved={(saved) =>
          setData((list) => {
            if (!list) return [saved];
            return list.some((s) => s.id === saved.id) ? list.map((s) => (s.id === saved.id ? saved : s)) : [...list, saved];
          })
        }
      />
    </div>
  );
}
