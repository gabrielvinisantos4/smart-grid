import { useEffect, useRef, useState } from 'react';
import { Check, ImageOff, ImagePlus, Loader2, Upload } from 'lucide-react';
import type { AdminMediaAsset, MediaAsset } from '@shared/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { adminApi } from '@/services/adminApi';
import { cn } from '@/lib/cn';
import { useToast } from './Toast';

interface PickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (media: MediaAsset) => void;
  selectedId?: string | null;
  title?: string;
}

/** Biblioteca de imagens em modal: escolher existente ou enviar nova. */
export function MediaPicker({ open, onClose, onPick, selectedId, title = 'Escolher imagem' }: PickerProps) {
  const toast = useToast();
  const [items, setItems] = useState<AdminMediaAsset[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    adminApi.media().then(setItems).catch((e) => toast(e.message, 'error'));
  }, [open, toast]);

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const media = await adminApi.uploadMedia(file, file.name.replace(/\.[^.]+$/, ''));
      toast('Imagem enviada.');
      onPick(media);
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Falha no upload.', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} label={title} className="max-w-4xl">
      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 pr-12">
          <h3 className="text-xl font-medium tracking-[-0.03em]">{title}</h3>
          <Button size="sm" variant="glass" onClick={() => fileRef.current?.click()} disabled={uploading} icon={uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}>
            Enviar nova
          </Button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {!items && Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-white/[0.04]" />)}
          {items?.map((media) => (
            <button
              key={media.id}
              type="button"
              onClick={() => {
                onPick(media);
                onClose();
              }}
              className={cn(
                'group relative aspect-[4/3] overflow-hidden rounded-2xl border transition',
                media.id === selectedId ? 'border-bone ring-2 ring-bone/40' : 'border-white/[0.07] hover:border-white/30',
              )}
            >
              <img src={media.url.replace(/w=\d+/, 'w=500')} alt={media.alt} loading="lazy" className="h-full w-full bg-ink-100 object-cover transition-transform duration-700 group-hover:scale-105" />
              {media.id === selectedId && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-bone text-ink">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6 text-left text-[11.5px] text-bone/80">{media.alt || 'Sem descrição'}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

interface SlotProps {
  label: string;
  hint?: string;
  media: MediaAsset | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  allowClear?: boolean;
  aspect?: string;
}

/** Campo de imagem: miniatura + trocar/remover. */
export function MediaSlot({ label, hint, media, onChange, disabled, allowClear = true, aspect = 'aspect-[16/10]' }: SlotProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<MediaAsset | null>(media);
  useEffect(() => setPreview(media), [media]);

  return (
    <div>
      <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-mist">{label}</p>
      <div className={cn('group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]', aspect)}>
        {preview ? (
          <img src={preview.url.replace(/w=\d+/, 'w=900')} alt={preview.alt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-fog">
            <ImageOff className="h-5 w-5" />
            <span className="text-[12px]">Nenhuma imagem</span>
          </div>
        )}
        {!disabled && (
          <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/70 via-transparent to-transparent p-3 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
            {allowClear && preview && (
              <Button size="sm" variant="glass" onClick={() => onChange(null)}>
                Remover
              </Button>
            )}
            <Button size="sm" onClick={() => setOpen(true)} icon={<ImagePlus className="h-4 w-4" />}>
              {preview ? 'Trocar' : 'Escolher'}
            </Button>
          </div>
        )}
      </div>
      {hint && <p className="mt-1.5 text-[12px] text-fog">{hint}</p>}
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        selectedId={preview?.id}
        onPick={(m) => {
          setPreview(m);
          onChange(m.id);
        }}
      />
    </div>
  );
}
