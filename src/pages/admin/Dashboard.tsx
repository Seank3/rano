import { Link } from 'react-router-dom';
import { useAdmin } from './AdminApp';
import { fmtDate } from '../../lib/format';
export default function Dashboard() {
  const { data } = useAdmin();
  const cards = [
    { n: data.releases.length, l: 'Releases', to: '/admin/releases' }, { n: data.videos.length, l: 'Videos', to: '/admin/videos' },
    { n: data.news.length, l: 'News articles', to: '/admin/news' }, { n: data.gallery.length, l: 'Gallery images', to: '/admin/gallery' },
    { n: data.inquiries.filter(i => i.status === 'new').length, l: 'New inquiries', to: '/admin/inquiries' }, { n: data.subscribers.length, l: 'Subscribers', to: '/admin/subscribers' },
    { n: data.orders.length, l: 'Demo orders', to: '/admin/orders' }, { n: data.products.length, l: 'Products', to: '/admin/products' },
  ];
  return (<>
    <div className="admin__head"><h1>Overview</h1><span className="mono muted">Signed in as {data.profile.name}</span></div>
    <div className="admin__cards">{cards.map(c => <Link key={c.l} to={c.to} className="admin__card"><div className="n">{c.n}</div><div className="l">{c.l}</div></Link>)}</div>
    <div className="two-col">
      <div className="admin-panel"><p className="eyebrow">Recent inquiries</p>{data.inquiries.slice(0, 5).length ? data.inquiries.slice(0, 5).map(i => <div key={i.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}><div className="spread"><strong>{i.subject}</strong><span className={`badge ${i.status === 'new' ? 'badge--warn' : 'badge--ok'}`}>{i.status}</span></div><div className="muted" style={{ fontSize: 13 }}>{i.name} · {i.category} · {fmtDate(i.createdAt)}</div></div>) : <p className="muted">No inquiries yet.</p>}</div>
      <div className="admin-panel"><p className="eyebrow">Quick actions</p><div className="stack"><Link className="btn btn--ghost" to="/admin/releases">Add a release</Link><Link className="btn btn--ghost" to="/admin/news">Write an article</Link><Link className="btn btn--ghost" to="/admin/gallery">Upload photos</Link><Link className="btn btn--ghost" to="/admin/events">Add an event</Link><Link className="btn btn--ghost" to="/admin/profile">Edit artist profile</Link></div></div>
    </div>
  </>);
}
