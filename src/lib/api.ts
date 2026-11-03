import type { AdminData, Content } from './types';

async function request<T>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || `Request failed (${res.status})`);
  return data as T;
}
export const api = {
  content: () => request<Content>('/api/content'),
  newsletter: (email: string, source = 'website', website = '') => request<{ ok: boolean; message: string }>('/api/newsletter', { method: 'POST', body: JSON.stringify({ email, source, website }) }),
  contact: (payload: Record<string, string>) => request<{ ok: boolean; message: string }>('/api/contact', { method: 'POST', body: JSON.stringify(payload) }),
  order: (payload: unknown) => request<{ ok: boolean; orderId: string; demo: boolean; totalCents: number; currency: string; message: string }>('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
  admin: {
    me: () => request<{ user: { id: number; email: string } }>('/api/admin/me'),
    login: (email: string, password: string) => request<{ ok: boolean; user: { id: number; email: string } }>('/api/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    logout: () => request<{ ok: boolean }>('/api/admin/logout', { method: 'POST' }),
    data: () => request<AdminData>('/api/admin/data'),
    saveProfile: (profile: unknown) => request<{ ok: boolean }>('/api/admin/profile', { method: 'PUT', body: JSON.stringify(profile) }),
    create: (collection: string, item: unknown) => request<{ ok: boolean; item: any }>(`/api/admin/${collection}`, { method: 'POST', body: JSON.stringify(item) }),
    update: (collection: string, id: string, item: unknown) => request<{ ok: boolean; item: any }>(`/api/admin/${collection}/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
    remove: (collection: string, id: string) => request<{ ok: boolean }>(`/api/admin/${collection}/${id}`, { method: 'DELETE' }),
    changePassword: (currentPassword: string, newPassword: string) => request<{ ok: boolean }>('/api/admin/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
    upload: async (file: File) => {
      const fd = new FormData(); fd.append('image', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd, credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data as { ok: boolean; url: string };
    },
  },
};
