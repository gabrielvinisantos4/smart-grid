import type { User } from '@shared/types';
import { http } from './http';

export const authApi = {
  me: () => http.get<{ user: User | null }>('/api/auth/me'),
  login: (email: string, password: string) => http.post<{ user: User }>('/api/auth/login', { email, password }),
  logout: () => http.post<void>('/api/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) =>
    http.post<void>('/api/auth/password', { currentPassword, newPassword }),
};
