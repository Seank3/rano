import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, Disc3, Video, Calendar, Image, Newspaper, ShoppingBag, Inbox, Mail, Receipt, Settings, LogOut, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api';
import type { AdminData } from '../../lib/types';
import { Loader } from '../../components/ui';
import AdminLogin from './AdminLogin';

interface AdminCtx { data: AdminData; refresh: () => Promise<void>; user: { id: number; email: string }; toast: (msg: string, err?: boolean) => void; }
const Ctx = createContext<AdminCtx | null>(null);
export function useAdmin() { const c = useContext(Ctx); if (!c) throw new Error('useAdmin outside provider'); return c; }

export default function AdminApp() {
  const [user, setUser] = useState<{ id: number; email: string } | null | undefined>(undefined);
  const [data, setData] = useState<AdminData | null>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string; err: boolean }[]>([]);
  const nav = useNavigate();
  const toast = useCallback((msg: string, err = false) => { const id = Date.now() + Math.random(); setToasts(t => [...t, { id, msg, err }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500); }, []);
  const refresh = useCallback(async () => { const d = await api.admin.data(); setData(d); }, []);
  useEffect(() => { api.admin.me().then(r => setUser(r.user)).catch(() => setUser(null)); }, []);
  useEffect(() => { if (user) refresh().catch(() => toast('Failed to load admin data', true)); }, [user, refresh, toast]);
  const logout = async () => { try { await api.admin.logout(); } catch {} setUser(null); setData(null); nav('/admin'); };
  if (user === undefined) return <div className="admin"><Loader label="Checking session" /></div>;
  if (!user) return <AdminLogin onSuccess={u => setUser(u)} />;
  if (!data) return <div className="admin"><Loader label="Loading dashboard" /></div>;
  const links = [
    { to: '/admin', end: true, Icon: LayoutDashboard, label: 'Overview' }, { to: '/admin/profile', Icon: User, label: 'Artist profile' },
    { to: '/admin/releases', Icon: Disc3, label: 'Music releases' }, { to: '/admin/videos', Icon: Video, label: 'Videos' },
    { to: '/admin/events', Icon: Calendar, label: 'Events' }, { to: '/admin/gallery', Icon: Image, label: 'Gallery' },
    { to: '/admin/news', Icon: Newspaper, label: 'News' }, { to: '/admin/products', Icon: ShoppingBag, label: 'Merch' },
    { to: '/admin/inquiries', Icon: Inbox, label: `Inquiries${data.inquiries.filter(i => i.status === 'new').length ? ` (${data.inquiries.filter(i => i.status === 'new').length})` : ''}` },
    { to: '/admin/subscribers', Icon: Mail, label: 'Subscribers' }, { to: '/admin/orders', Icon: Receipt, label: 'Orders' }, { to: '/admin/settings', Icon: Settings, label: 'Settings' },
  ];
  return (
    <Ctx.Provider value={{ data, refresh, user, toast }}>
      <div className="admin"><div className="admin__layout">
        <aside className="admin__side">
          <NavLink to="/" className="wordmark">RANO<span>⚡</span></NavLink>
          {links.map(l => <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => isActive ? 'active' : ''}><l.Icon size={16} />{l.label}</NavLink>)}
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <a href="/" target="_blank" rel="noreferrer"><ExternalLink size={16} />View site</a>
            <button className="navlike" onClick={logout}><LogOut size={16} />Sign out ({user.email})</button>
          </div>
        </aside>
        <main className="admin__main"><Outlet /></main>
      </div></div>
      {toasts.map(t => <div key={t.id} className={`toast ${t.err ? 'toast--err' : ''}`} role="status">{t.msg}</div>)}
    </Ctx.Provider>
  );
}
