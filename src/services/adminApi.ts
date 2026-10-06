import type { AdminMediaAsset, DashboardStats, MediaAsset, Quote, QuoteStatus, Role, Service, SiteSettings, User } from '@shared/types';
import { http } from './http';

export type ServicePayload = Omit<Service, 'id' | 'sortOrder' | 'createdAt' | 'updatedAt'>;

export const adminApi = {
  dashboard: () => http.get<DashboardStats>('/api/admin/dashboard'),

  services: () => http.get<Service[]>('/api/admin/services'),
  createService: (data: ServicePayload) => http.post<Service>('/api/admin/services', data),
  updateService: (id: string, data: ServicePayload) => http.put<Service>(`/api/admin/services/${encodeURIComponent(id)}`, data),
  deleteService: (id: string) => http.delete(`/api/admin/services/${encodeURIComponent(id)}`),
  reorderServices: (ids: string[]) => http.put<Service[]>('/api/admin/services-order', { ids }),
  updatePrices: (prices: { id: string; priceCents: number }[]) => http.put<Service[]>('/api/admin/prices', { prices }),

  media: () => http.get<AdminMediaAsset[]>('/api/admin/media'),
  uploadMedia: (file: File, alt = '') => {
    const form = new FormData();
    form.append('alt', alt);
    form.append('file', file);
    return http.post<MediaAsset>('/api/admin/media', form);
  },
  addRemoteMedia: (url: string, alt: string) => http.post<MediaAsset>('/api/admin/media/remote', { url, alt }),
  replaceMedia: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return http.put<MediaAsset>(`/api/admin/media/${encodeURIComponent(id)}/file`, form);
  },
  updateMedia: (id: string, alt: string) => http.patch<MediaAsset>(`/api/admin/media/${encodeURIComponent(id)}`, { alt }),
  deleteMedia: (id: string, force = false) => http.delete(`/api/admin/media/${encodeURIComponent(id)}${force ? '?force=1' : ''}`),

  settings: () => http.get<SiteSettings>('/api/admin/settings'),
  saveSettings: (settings: SiteSettings) => http.put<SiteSettings>('/api/admin/settings', settings as unknown as Record<string, unknown>),

  quotes: (status?: QuoteStatus) => http.get<{ items: Quote[]; total: number }>(`/api/admin/quotes?limit=200${status ? `&status=${status}` : ''}`),
  updateQuoteStatus: (id: number, status: QuoteStatus) => http.patch<Quote>(`/api/admin/quotes/${id}`, { status }),
  deleteQuote: (id: number) => http.delete(`/api/admin/quotes/${id}`),

  users: () => http.get<User[]>('/api/admin/users'),
  createUser: (data: { name: string; email: string; password: string; role: Role }) => http.post<User>('/api/admin/users', data),
  updateUserRole: (id: number, role: Role) => http.patch<User>(`/api/admin/users/${id}`, { role }),
  deleteUser: (id: number) => http.delete(`/api/admin/users/${id}`),
};
