import { useState } from 'react';
import { Trash2, Download, Eye } from 'lucide-react';
import { api } from '../../lib/api';
import { useAdmin } from './AdminApp';
import { fmtDate, money } from '../../lib/format';
import { Modal } from '../../components/ui';

function exportCsv(rows: any[], name: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]).filter(k => typeof rows[0][k] !== 'object');
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `${name}.csv`; a.click(); URL.revokeObjectURL(a.href);
}
export default function RecordsAdmin({ collection = 'inquiries' }: { collection?: 'inquiries' | 'subscribers' | 'orders' }) {
  const { data, refresh, toast } = useAdmin();
  const [view, setView] = useState<any | null>(null);
  const rows: any[] = (data as any)[collection] || [];
  const setStatus = async (row: any, status: string) => { try { await api.admin.update(collection, row.id, { status }); await refresh(); toast('Status updated'); } catch (e) { toast(e instanceof Error ? e.message : 'Update failed', true); } };
  const remove = async (row: any) => { if (!confirm('Delete this record?')) return; try { await api.admin.remove(collection, row.id); await refresh(); toast('Deleted'); } catch (e) { toast(e instanceof Error ? e.message : 'Delete failed', true); } };
  const title = collection === 'inquiries' ? 'Booking & contact inquiries' : collection === 'subscribers' ? 'Newsletter subscribers' : 'Orders (demo)';
  const statuses = collection === 'inquiries' ? ['new', 'read', 'replied', 'archived'] : collection === 'subscribers' ? ['active', 'unsubscribed'] : ['demo_pending', 'contacted', 'fulfilled', 'cancelled'];
  return (<>
    <div className="admin__head"><h1>{title} <span className="muted" style={{ fontSize: 16 }}>({rows.length})</span></h1><button className="btn btn--ghost btn--sm" onClick={() => exportCsv(rows.map(r => ({ ...r, customer: undefined, items: undefined, message: collection === 'inquiries' ? r.message : undefined })), collection)} disabled={!rows.length}><Download size={14} />Export CSV</button></div>
    {collection === 'orders' && <div className="demo-banner" style={{ marginBottom: 20 }}><span>⚠</span><div><strong>Demo orders only.</strong> No payments have been processed. Connect Stripe on the server to enable real transactions.</div></div>}
    <div className="table-wrap"><table className="admin-table"><thead><tr>
      {collection === 'inquiries' && <><th>Date</th><th>From</th><th>Category</th><th>Subject</th><th>Status</th><th></th></>}
      {collection === 'subscribers' && <><th>Email</th><th>Joined</th><th>Source</th><th>Status</th><th></th></>}
      {collection === 'orders' && <><th>Ref</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th></th></>}
    </tr></thead><tbody>
      {rows.map(r => <tr key={r.id}>
        {collection === 'inquiries' && <><td className="muted">{fmtDate(r.createdAt)}</td><td><strong>{r.name}</strong><div className="muted" style={{ fontSize: 12 }}>{r.email}</div></td><td><span className="badge">{r.category}</span></td><td>{r.subject}</td><td><select className="select" value={r.status} onChange={e => setStatus(r, e.target.value)}>{statuses.map(s => <option key={s}>{s}</option>)}</select></td><td><div className="row" style={{ justifyContent: 'flex-end' }}><button className="icon-btn" onClick={() => { setView(r); if (r.status === 'new') setStatus(r, 'read'); }} aria-label="View"><Eye size={14} /></button><button className="icon-btn" onClick={() => remove(r)} aria-label="Delete"><Trash2 size={14} /></button></div></td></>}
        {collection === 'subscribers' && <><td><strong>{r.email}</strong></td><td className="muted">{fmtDate(r.createdAt)}</td><td className="muted">{r.source}</td><td><select className="select" value={r.status} onChange={e => setStatus(r, e.target.value)}>{statuses.map(s => <option key={s}>{s}</option>)}</select></td><td style={{ textAlign: 'right' }}><button className="icon-btn" onClick={() => remove(r)} aria-label="Delete"><Trash2 size={14} /></button></td></>}
        {collection === 'orders' && <><td><strong className="mono">{r.id}</strong></td><td className="muted">{fmtDate(r.createdAt)}</td><td><strong>{r.customer?.name}</strong><div className="muted" style={{ fontSize: 12 }}>{r.customer?.email}</div></td><td className="muted">{r.items?.map((i: any) => `${i.name} ×${i.qty}`).join(', ')}</td><td>{money(r.totalCents, r.currency)}</td><td><select className="select" value={r.status} onChange={e => setStatus(r, e.target.value)}>{statuses.map(s => <option key={s}>{s}</option>)}</select></td><td><div className="row" style={{ justifyContent: 'flex-end' }}><button className="icon-btn" onClick={() => setView(r)} aria-label="View"><Eye size={14} /></button><button className="icon-btn" onClick={() => remove(r)} aria-label="Delete"><Trash2 size={14} /></button></div></td></>}
      </tr>)}
      {!rows.length && <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 32 }}>No records yet.</td></tr>}
    </tbody></table></div>
    <Modal open={!!view} onClose={() => setView(null)} label="Record details">
      {view && <div className="admin-panel" style={{ margin: 0 }}>
        {collection === 'inquiries' ? <><p className="eyebrow">{view.category} · {fmtDate(view.createdAt)}</p><h2 className="display h4">{view.subject}</h2><p><strong>{view.name}</strong> · <a href={`mailto:${view.email}`} style={{ color: 'var(--accent)' }}>{view.email}</a></p><p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{view.message}</p><a className="btn btn--accent btn--sm" href={`mailto:${view.email}?subject=Re: ${encodeURIComponent(view.subject)}`}>Reply by email</a></>
        : <><p className="eyebrow">Order {view.id}</p><p><strong>{view.customer?.name}</strong> · {view.customer?.email} · {view.customer?.phone}</p><p className="muted">{view.customer?.address}</p><ul>{view.items?.map((i: any, k: number) => <li key={k}>{i.name} × {i.qty} {i.size ? `(${i.size})` : ''} — {money(i.priceCents * i.qty, view.currency)}</li>)}</ul><p><strong>Total: {money(view.totalCents, view.currency)}</strong></p></>}
      </div>}
    </Modal>
  </>);
}
