import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, ListMusic } from 'lucide-react';
import { useContent } from '../lib/content';
import { usePlayer } from '../lib/player';
import { usePageMeta } from '../lib/hooks';
import { year } from '../lib/format';
import { Reveal, SectionHead } from '../components/ui';
import ReleaseCard from '../components/ReleaseCard';

const TYPES = [{ v: 'all', l: 'All' }, { v: 'single', l: 'Singles' }, { v: 'feature', l: 'Features' }, { v: 'ep', l: 'EPs' }, { v: 'album', l: 'Albums' }];
export default function Music() {
  const { content } = useContent();
  const player = usePlayer();
  const [type, setType] = useState('all');
  const [yr, setYr] = useState('all');
  usePageMeta('Music — RANO', 'Singles, features and collaborations by Ugakid RANO. Stream previews and find official links.');
  const releases = useMemo(() => [...(content?.releases || [])].sort((a, b) => (b.date || '').localeCompare(a.date || '')), [content]);
  const years = useMemo(() => Array.from(new Set(releases.map(r => year(r.date)).filter(Boolean))).sort().reverse(), [releases]);
  const filtered = releases.filter(r => (type === 'all' || r.type === type) && (yr === 'all' || year(r.date) === yr));
  const counts = TYPES.map(t => ({ ...t, n: t.v === 'all' ? releases.length : releases.filter(r => r.type === t.v).length }));
  const playAll = () => player.playQueue(filtered.filter(r => r.previewUrl).map(r => ({ release: r, track: { n: 1, title: r.title, durationMs: r.durationMs, previewUrl: r.previewUrl } })));
  if (!content) return null;
  return (
    <>
      <div className="page-hero" data-word="Music"><div className="container"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>Music</span></div><p className="eyebrow">Discography</p><h1 className="display h1">Music</h1><p className="lead">Every official single and feature. Tap play for a 30-second Apple Music preview, or open the full track on your platform.</p></div></div>
      <section className="section"><div className="container">
        <Reveal className="spread" >
          <div className="filters" role="group" aria-label="Filter by release type">{counts.filter(t => t.n > 0 || t.v === 'all').map(t => <button key={t.v} className={`filter ${type === t.v ? 'is-active' : ''}`} onClick={() => setType(t.v)} aria-pressed={type === t.v}>{t.l} <span className="muted">({t.n})</span></button>)}</div>
          <div className="row"><label className="sr-only" htmlFor="year">Filter by year</label><select id="year" className="select" value={yr} onChange={e => setYr(e.target.value)}><option value="all">All years</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select><button className="btn btn--ghost btn--sm" onClick={playAll} disabled={!filtered.some(r => r.previewUrl)}><ListMusic size={14} /> Play previews</button></div>
        </Reveal>
        <div style={{ marginTop: 40 }}>
          {filtered.length ? <div className="release-grid">{filtered.map((r, i) => <Reveal key={r.id} delay={(i % 3) as 0 | 1 | 2}><ReleaseCard release={r} /></Reveal>)}</div> : <div className="empty-state"><p className="display h3">No releases match</p><p className="muted">Try a different filter.</p></div>}
        </div>
        <p className="mono muted" style={{ marginTop: 40 }}>Showing {filtered.length} of {releases.length} releases · previews courtesy of Apple Music</p>
      </div></section>
    </>
  );
}
