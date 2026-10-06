import { useMemo } from 'react';
import type { AdminMediaAsset } from '@shared/types';
import { adminApi } from '@/services/adminApi';
import { useResource } from './useResource';

export function useMediaMap() {
  const resource = useResource(adminApi.media);
  const map = useMemo(() => Object.fromEntries((resource.data ?? []).map((m) => [m.id, m])) as Record<string, AdminMediaAsset>, [resource.data]);
  return { ...resource, map, get: (id: string | null | undefined) => (id ? map[id] ?? null : null) };
}
