import { Link } from 'react-router-dom';
import { useContent } from '../lib/content';
import { SocialLinks } from './ui';
import NewsletterForm from './NewsletterForm';

export default function Footer() {
  const { content } = useContent();
  const p = content?.profile;
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Link to="/" className="wordmark">{p?.shortName || 'RANO'}<span>⚡</span></Link>
            <p>{p?.tagline || 'Street grit. Raw emotion. The pulse of African-city life.'}</p>
            {p?.socials && <div style={{ marginTop: 20 }}><SocialLinks socials={p.socials} /></div>}
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link to="/about">About</Link></li><li><Link to="/music">Music</Link></li><li><Link to="/videos">Videos</Link></li><li><Link to="/events">Events</Link></li>
            </ul>
          </div>
          <div>
            <h4>More</h4>
            <ul>
              <li><Link to="/gallery">Gallery</Link></li><li><Link to="/news">News</Link></li><li><Link to="/contact">Contact & Bookings</Link></li><li><Link to="/store">Store</Link></li>
            </ul>
          </div>
          <div>
            <h4>Stay in the loop</h4>
            <p className="muted" style={{ fontSize: 14, marginTop: 0 }}>New releases, videos and show announcements. No spam.</p>
            <NewsletterForm compact />
            {p?.location && <p className="mono muted" style={{ marginTop: 18 }}>{p.location}</p>}
          </div>
        </div>
        <div className="footer__bottom">
          <span>© {year} {p?.name || 'Ugakid RANO'}. All rights reserved.</span>
          <div className="row" style={{ gap: 20 }}>
            <Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/admin">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
