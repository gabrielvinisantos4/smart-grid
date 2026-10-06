import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { MediaAsset, PublicSitePayload } from '@shared/types';
import { publicApi } from '@/services/publicApi';

interface SiteDataContextValue {
  data: PublicSitePayload | null;
  error: string | null;
  loading: boolean;
  media: (id: string | null | undefined) => MediaAsset | null;
  reload: () => Promise<void>;
}

const SiteDataContext = createContext<SiteDataContextValue | null>(null);

/** Carrega textos, serviços, preços e imagens do backend (nada fixo no frontend). */
export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PublicSitePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setData(await publicApi.getSite());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Aplica cor de destaque, título e descrição configurados no painel.
  useEffect(() => {
    if (!data) return;
    const { brand, seo } = data.settings;
    document.documentElement.style.setProperty('--accent', brand.accentColor);
    if (seo.pageTitle) document.title = seo.pageTitle;
    document.querySelector('meta[name="description"]')?.setAttribute('content', seo.description);
  }, [data]);

  const value = useMemo<SiteDataContextValue>(
    () => ({
      data,
      error,
      loading,
      reload,
      media: (id) => (id && data?.media[id]) || null,
    }),
    [data, error, loading, reload],
  );

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error('useSiteData precisa estar dentro de <SiteDataProvider>.');
  return ctx;
}
