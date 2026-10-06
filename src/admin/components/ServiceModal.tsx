import { useEffect, useState, type FormEvent } from 'react';
import type { MediaAsset, Service } from '@shared/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { adminApi, type ServicePayload } from '@/services/adminApi';
import { ApiError } from '@/services/http';
import { centsToInput, parseBRLToCents } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Field, TextArea, TextInput, Toggle } from './ui';
import { IconPicker } from './IconPicker';
import { MediaSlot } from './MediaPicker';
import { useToast } from './Toast';

const empty: ServicePayload = {
  kind: 'unit',
  features: [],
  name: '',
  description: '',
  icon: 'Sparkles',
  imageId: null,
  priceCents: 0,
  minQty: 1,
  maxQty: 30,
  defaultQty: 4,
  quickQuantities: [1, 2, 3, 4, 5, 6, 8, 10, 12],
  unitSingular: 'unidade',
  unitPlural: 'unidades',
  badge: null,
  active: true,
};

interface Props {
  open: boolean;
  service: Service | null;
  media: (id: string | null) => MediaAsset | null;
  onClose: () => void;
  onSaved: (service: Service) => void;
}

export function ServiceModal({ open, service, media, onClose, onSaved }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<ServicePayload>(empty);
  const [price, setPrice] = useState('');
  const [quick, setQuick] = useState('');
  const [features, setFeatures] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const base = service ? { ...service } : empty;
    setForm(base);
    setPrice(centsToInput(base.priceCents));
    setQuick(base.quickQuantities.join(', '));
    setFeatures(base.features.join('\n'));
    setError(null);
  }, [open, service]);

  const set = <K extends keyof ServicePayload>(key: K, value: ServicePayload[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const priceCents = parseBRLToCents(price);
    if (priceCents === null) return setError('Preço inválido.');
    const payload: ServicePayload = {
      ...form,
      priceCents,
      quickQuantities: quick
        .split(/[,\s]+/)
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0),
      badge: form.badge?.trim() || null,
      features: features
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
    };
    setSaving(true);
    setError(null);
    try {
      const saved = service ? await adminApi.updateService(service.id, payload) : await adminApi.createService(payload);
      toast(service ? 'Serviço atualizado.' : 'Serviço criado e publicado.');
      onSaved(saved);
      onClose();
    } catch (err) {
      const details = err instanceof ApiError && Array.isArray(err.details) ? ` (${(err.details as { message: string }[]).map((d) => d.message).join('; ')})` : '';
      setError((err instanceof Error ? err.message : 'Erro ao salvar.') + details);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} label={service ? 'Editar serviço' : 'Novo serviço'} className="max-w-3xl">
      <form onSubmit={submit} className="p-6 md:p-8">
        <p className="eyebrow">{service ? 'Editar' : 'Novo'}</p>
        <h3 className="mt-2 text-2xl font-medium tracking-[-0.03em]">{service ? service.name : 'Adicionar serviço'}</h3>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/[0.07] bg-black/20 p-1.5" role="radiogroup" aria-label="Tipo de serviço">
          {(
            [
              ['plan', 'Plano mensal', 'Preço fixo por mês; o cliente escolhe um plano.'],
              ['unit', 'Avulso', 'Cobrado por unidade; o cliente escolhe a quantidade.'],
            ] as const
          ).map(([kind, label, hint]) => (
            <button
              key={kind}
              type="button"
              role="radio"
              aria-checked={form.kind === kind}
              onClick={() => set('kind', kind)}
              className={cn('rounded-xl px-4 py-3 text-left transition', form.kind === kind ? 'bg-bone text-ink' : 'text-bone/70 hover:bg-white/[0.05]')}
            >
              <span className="block text-[14px] font-medium">{label}</span>
              <span className={cn('block text-[12px]', form.kind === kind ? 'text-ink/60' : 'text-fog')}>{hint}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Nome">
            <TextInput required maxLength={80} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex.: Fotografia de produto" />
          </Field>
          <Field label={form.kind === 'plan' ? 'Preço mensal (R$)' : 'Preço por unidade (R$)'}>
            <TextInput required inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="150,00" />
          </Field>
          <Field label="Descrição" className="md:col-span-2">
            <TextArea maxLength={400} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Uma frase curta sobre o formato." />
          </Field>
          <Field label="Itens inclusos (um por linha)" hint='Ex.: "8 vídeos por mês", "3 ajustes inclusos"' className="md:col-span-2">
            <TextArea value={features} onChange={(e) => setFeatures(e.target.value)} placeholder={'8 vídeos por mês\nGravação com celular, de forma profissional'} />
          </Field>

          <div className="md:col-span-2">
            <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-mist">Ícone</p>
            <IconPicker value={form.icon} onChange={(icon) => set('icon', icon)} />
          </div>

          <MediaSlot label="Imagem do card" media={media(form.imageId)} onChange={(id) => set('imageId', id)} />

          <div className="space-y-5">
            {form.kind === 'unit' && (
            <>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Mínimo">
                <TextInput type="number" min={1} max={999} value={form.minQty} onChange={(e) => set('minQty', Number(e.target.value))} />
              </Field>
              <Field label="Máximo">
                <TextInput type="number" min={1} max={999} value={form.maxQty} onChange={(e) => set('maxQty', Number(e.target.value))} />
              </Field>
              <Field label="Padrão">
                <TextInput type="number" min={1} max={999} value={form.defaultQty} onChange={(e) => set('defaultQty', Number(e.target.value))} />
              </Field>
            </div>
            <Field label="Atalhos de quantidade" hint="Separados por vírgula. Ex.: 1, 2, 4, 8, 12">
              <TextInput value={quick} onChange={(e) => setQuick(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Unid. singular" hint="Ex.: vídeo, carrossel">
                <TextInput maxLength={30} value={form.unitSingular} onChange={(e) => set('unitSingular', e.target.value)} />
              </Field>
              <Field label="Unid. plural">
                <TextInput maxLength={30} value={form.unitPlural} onChange={(e) => set('unitPlural', e.target.value)} />
              </Field>
            </div>
            </>
            )}
            {form.kind === 'plan' && (
              <p className="rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3 text-[13px] leading-relaxed text-mist">
                Planos têm valor fixo por mês. Coloque a quantidade de vídeos no nome (ex.: “8 vídeos por mês”) para o site calcular o valor por vídeo.
              </p>
            )}
            <Field label="Selo (opcional)" hint='Ex.: "Mais pedido", "Premium"'>
              <TextInput maxLength={30} value={form.badge ?? ''} onChange={(e) => set('badge', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-black/20 px-4 py-3">
          <div>
            <p className="text-[14px]">{form.active ? 'Ativo' : 'Inativo'}</p>
            <p className="text-[12px] text-fog">{form.active ? 'Visível no configurador público.' : 'Oculto para clientes.'}</p>
          </div>
          <Toggle checked={form.active} onChange={(v) => set('active', v)} label="Serviço ativo" />
        </div>

        {error && <p className="mt-4 rounded-xl border border-red-300/20 bg-red-300/[0.06] px-3 py-2 text-[13px] text-red-200">{error}</p>}

        <div className="mt-7 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando…' : service ? 'Salvar serviço' : 'Criar serviço'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
