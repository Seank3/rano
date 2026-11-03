import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag } from 'lucide-react';
import { useContent } from '../lib/content';
import { useCart } from '../lib/cart';
import { useScrolled, useLockBody } from '../lib/hooks';
import { SocialLinks } from './ui';
import { cx } from '../lib/format';

const LINKS = [
  { to: '/', label: 'Home' }, { to: '/about', label: 'About' }, { to: '/music', label: 'Music' },
  { to: '/videos', label: 'Videos' }, { to: '/events', label: 'Events' }, { to: '/gallery', label: 'Gallery' },
  { to: '/news', label: 'News' }, { to: '/contact', label: 'Contact' },
];
export default function Header() {
  const { content } = useContent();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled(30);
  const loc = useLocation();
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  useLockBody(open);
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);
  const name = content?.profile.shortName || 'RANO';
  const hasStore = (content?.products.length || 0) > 0;
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <header className={cx('header', (scrolled || open) && 'is-scrolled', open && 'is-open')}>
        <div className="header__inner">
          <Link to="/" className="wordmark" aria-label={`${name} — home`}>{name}<span>⚡</span></Link>
          <nav className="nav" aria-label="Primary">
            {LINKS.map(l => <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => isActive ? 'active' : ''}>{l.label}</NavLink>)}
          </nav>
          <div className="header__actions">
            {content?.profile.socials?.length ? <div className="header__social"><SocialLinks socials={content.profile.socials.slice(0, 2)} size={16} /></div> : null}
            {hasStore && <Link to="/cart" className="icon-btn" aria-label={`Cart, ${count} items`} style={{ position: 'relative' }}><ShoppingBag size={18} />{count > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: 'var(--accent)', color: '#000', fontSize: 10, fontFamily: 'var(--font-mono)', width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{count}</span>}</Link>}
            
            <button className="icon-btn menu-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'}>{open ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
      </header>
      <div id="mobile-menu" className={cx('mobile-menu', open && 'is-open')} aria-hidden={!open}>
        <nav aria-label="Mobile">
          {LINKS.map((l, i) => <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => cx('m-link', isActive && 'active')} style={{ transitionDelay: open ? `${0.08 + i * 0.05}s` : '0s' }} tabIndex={open ? 0 : -1}>{l.label}<small>0{i + 1}</small></NavLink>)}
          {hasStore && <NavLink to="/store" className="m-link" tabIndex={open ? 0 : -1} style={{ transitionDelay: open ? '0.5s' : '0s' }}>Store<small>09</small></NavLink>}
        </nav>
        <div className="mobile-menu__foot">
          {content?.profile.socials && <SocialLinks socials={content.profile.socials} showLabel />}
          <Link to="/contact" className="btn btn--accent btn--sm" tabIndex={open ? 0 : -1}>Bookings</Link>
        </div>
      </div>
    </>
  );
}
