import { Link } from 'react-router-dom';
import { usePageMeta } from '../lib/hooks';
export default function NotFound() {
  usePageMeta('Page not found — RANO');
  return <section className="section" style={{ paddingTop: 'calc(var(--header-h) + 120px)', minHeight: '70vh' }}><div className="container"><div className="empty-state"><p className="eyebrow">404</p><h1 className="display h1">Lost the beat</h1><p className="muted">That page doesn't exist. Head back home or explore the music.</p><div className="row"><Link to="/" className="btn btn--accent">Home</Link><Link to="/music" className="btn btn--ghost">Music</Link></div></div></div></section>;
}
