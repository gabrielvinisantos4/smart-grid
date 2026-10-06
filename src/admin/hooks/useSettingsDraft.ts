import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SiteSettings } from '@shared/types';
import { adminApi } from '@/services/adminApi';
import { useToast } from '../components/Toast';

/** Rascunho editável das configurações do site com detecção de alterações. */
export function useSettingsDraft() {
  const toast = useToast();
  const [saved, setSaved] = useState<SiteSettings | null>(null);
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi
      .settings()
      .then((s) => {
        setSaved(s);
        setDraft(structuredClone(s));
      })
      .catch((e) => toast(e.message, 'error'));
  }, [toast]);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  const update = useCallback(<K extends keyof SiteSettings>(section: K, patch: Partial<SiteSettings[K]>) => {
    setDraft((d) => (d ? { ...d, [section]: { ...d[section], ...patch } } : d));
  }, []);

  const save = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const next = await adminApi.saveSettings(draft);
      setSaved(next);
      setDraft(structuredClone(next));
      toast('Alterações publicadas no site.');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  }, [draft, toast]);

  const discard = useCallback(() => saved && setDraft(structuredClone(saved)), [saved]);

  return { draft, setDraft, update, dirty, saving, save, discard };
}
