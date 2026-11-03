import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useContent } from '../lib/content';
import { usePageMeta } from '../lib/hooks';
import { fmtDate } from '../lib/format';
import { Reveal, SectionHead, SocialLinks, StreamingLinks } from '../components/ui';
import ReleaseCard from '../components/ReleaseCard';

export default function About() {
  const { content } = useContent();
  usePageMeta('About — RANO', content?.profile.bio[0]);
  if (!content) return null;
  const p = content.profile;
  const releases = [...content.releases].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const milestones = releases.filter(r => r.type !== 'feature').map(r => ({ year: (r.date || '').slice(0, 4), title: r.title, text: r.description || '', slug: r.slug }));
  const highlights = releases.filter(r => r.featured).slice(0, 3);
  const languages = ['English', 'Luganda', 'Runyakitara', 'Kiswahili', 'Urban slang'];
  return (
    <>
      <div className="page-hero" data-word="About"><div className="container"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>About</span></div><p className="eyebrow">The artist</p><h1 className="display h1">{p.name}</h1><p className="lead">{p.tagline}</p></div></div>
      <section className="section"><div className="container">
        <Reveal className="about-hero">
          <div className="about-hero__img"><img src={p.portrait} alt={`${p.name} — official artist artwork`} width={800} height={1000} /></div>
          <div className="prose">{p.bio.map((para, i) => <p key={i}>{para}</p>)}<div className="row" style={{ marginTop: 24 }}>{p.socials.length > 0 && <SocialLinks socials={p.socials} showLabel />}<StreamingLinks release={{ appleUrl: p.streaming.find(s => s.platform.includes('Apple'))?.url }} compact /></div></div>
        </Reveal>
      </div></section>
      <section className="section section--tight"><div className="container"><Reveal className="stats">
        <div className="stat"><div className="stat__n">{content.releases.length}</div><div className="stat__l">Releases & features</div></div>
        <div className="stat"><div className="stat__n">{content.videos.length}</div><div className="stat__l">Official videos</div></div>
        <div className="stat"><div className="stat__n">{languages.length}</div><div className="stat__l">Languages & slang</div></div>
        <div className="stat"><div className="stat__n">{p.location.split(',')[0]}</div><div className="stat__l">Home base</div></div>
      </Reveal></div></section>
      <section className="section"><div className="container two-col">
        <Reveal><p className="eyebrow">Milestones</p><h2 className="display h3">The road so far</h2>
          <div className="timeline" style={{ marginTop: 32 }}>{milestones.map(m => <div key={m.slug} className="timeline__item"><div className="timeline__year">{m.year}</div><h3 className="timeline__title"><Link to={`/music/${m.slug}`}>{m.title}</Link></h3><p className="muted" style={{ margin: 0 }}>{m.text}</p></div>)}</div>
        </Reveal>
        <Reveal delay={1}><p className="eyebrow">Sound & influences</p><h2 className="display h3">Many tongues, one voice</h2>
          <p className="lead">RANO moves between {languages.slice(0, -1).join(', ')} and {languages[languages.length - 1]} — the languages of Kampala's streets and the wider East African soul. His sound sits where Afro-pop, hip-hop and rap meet comedy, social commentary and everyday hustle.</p>
          <div className="row" style={{ marginTop: 20 }}>{languages.map(l => <span key={l} className="chip">{l}</span>)}</div>
          <div style={{ marginTop: 40 }} className="admin-panel"><p className="eyebrow">Recognition</p><p className="muted" style={{ margin: 0 }}>Awards, press coverage and verified achievements will be published here once confirmed. Nothing on this page is invented — milestones are drawn from released music and the artist's own channel.</p></div>
        </Reveal>
      </div></section>
      {highlights.length > 0 && <section className="section section--surface"><div className="container"><Reveal><SectionHead eyebrow="Discography highlights" title="Essential listening" right={<Link to="/music" className="link-arrow">All releases <ArrowUpRight size={14} /></Link>} /></Reveal><div className="release-grid">{highlights.map(r => <Reveal key={r.id}><ReleaseCard release={r} /></Reveal>)}</div></div></section>}
      <section className="section section--tight"><div className="container"><Reveal className="newsletter"><div><p className="eyebrow">Bookings & press</p><h2 className="display h3">Work with RANO</h2><p className="muted" style={{ marginBottom: 0 }}>Performances, features, interviews and collaborations.</p></div><div><Link to="/contact" className="btn btn--accent">Get in touch</Link></div></Reveal></div></section>
    </>
  );
}
