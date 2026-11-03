import { Link } from 'react-router-dom';
import { Mic2, Briefcase, Newspaper, Users, Mail } from 'lucide-react';
import { useContent } from '../lib/content';
import { usePageMeta } from '../lib/hooks';
import { Reveal, SocialLinks } from '../components/ui';
import ContactForm from '../components/ContactForm';

const OPTIONS = [
  { Icon: Mic2, k: 'Booking & performances', d: 'Shows, festivals, campus events and private performances. Include date, city, venue and audience size.' },
  { Icon: Briefcase, k: 'Business inquiries', d: 'Brand partnerships, sponsorships and licensing.' },
  { Icon: Newspaper, k: 'Press & media', d: 'Interviews, features, radio and TV requests.' },
  { Icon: Users, k: 'Collaborations', d: 'Features, production and songwriting with other artists.' },
  { Icon: Mail, k: 'General messages', d: 'Fan mail and everything else.' },
];
export default function Contact() {
  const { content } = useContent();
  usePageMeta('Contact & Bookings — RANO', 'Bookings, press, business and collaborations with Ugakid RANO.');
  const p = content?.profile;
  const emails = [p?.bookingEmail && { k: 'Bookings', v: p.bookingEmail }, p?.pressEmail && { k: 'Press', v: p.pressEmail }, p?.contactEmail && { k: 'General', v: p.contactEmail }].filter(Boolean) as { k: string; v: string }[];
  return (
    <>
      <div className="page-hero" data-word="Contact"><div className="container"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>Contact</span></div><p className="eyebrow">Contact & bookings</p><h1 className="display h1">Let's work</h1><p className="lead">Bookings, press, business and collaborations. Messages go straight to the team's inbox dashboard.</p></div></div>
      <section className="section"><div className="container contact-grid">
        <Reveal>
          <div className="contact-list">{OPTIONS.map(o => <div key={o.k} className="contact-item"><span className="k" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><o.Icon size={14} />{o.k}</span><span className="d">{o.d}</span></div>)}</div>
          {emails.length > 0 ? <div style={{ marginTop: 28 }}>{emails.map(e => <p key={e.k} style={{ margin: '0 0 8px' }}><span className="mono muted">{e.k}: </span><a href={`mailto:${e.v}`} style={{ color: 'var(--accent)' }}>{e.v}</a></p>)}</div> : <p className="muted" style={{ fontSize: 14, marginTop: 24 }}>Direct email addresses and phone numbers will be published here once confirmed. For now, please use the form — every message is delivered to the team.</p>}
          {p?.location && <p className="mono muted" style={{ marginTop: 16 }}>{p.location}</p>}
          {p?.socials && <div style={{ marginTop: 20 }}><SocialLinks socials={p.socials} showLabel /></div>}
        </Reveal>
        <Reveal delay={1}><ContactForm /></Reveal>
      </div></section>
    </>
  );
}
