import { Link, useParams } from 'react-router-dom';
import { Play, Pause, ArrowLeft, Music2 } from 'lucide-react';
import { useContent } from '../lib/content';
import { usePlayer } from '../lib/player';
import { usePageMeta } from '../lib/hooks';
import { fmtDate, fmtDuration } from '../lib/format';
import { Reveal, StreamingLinks } from '../components/ui';
import ReleaseCard from '../components/ReleaseCard';
import NotFound from './NotFound';

export default function ReleaseDetail() {
  const { slug } = useParams();
  const { content } = useContent();
  const player = usePlayer();
  const release = content?.releases.find(r => r.slug === slug);
  usePageMeta(release ? `${release.title} — RANO` : 'Release — RANO', release?.description || undefined);
  if (!content) return null;
  if (!release) return <NotFound />;
  const tracks = release.tracks?.length ? release.tracks : [{ n: 1, title: release.title, durationMs: release.durationMs, previewUrl: release.previewUrl }];
  const current = player.queue[player.index];
  const isCurrent = current?.release.id === release.id;
  const related = content.releases.filter(r => r.id !== release.id && (r.type === release.type || r.artist === release.artist)).slice(0, 4);
  const playTrack = (i: number) => { if (isCurrent && current.track.n === tracks[i].n) player.toggle(); else player.playRelease(release, i); };
  return (
    <>
      <div className="page-hero" data-word={release.type}><div className="container"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/music">Music</Link><span>/</span><span>{release.title}</span></div><Link to="/music" className="link-arrow" style={{ marginBottom: 24 }}><ArrowLeft size={14} /> All releases</Link><p className="eyebrow">{release.type === 'feature' ? 'Featured collaboration' : release.type}</p><h1 className="display h2">{release.title}</h1><p className="lead">{release.artist}</p></div></div>
      <section className="section"><div className="container">
        <Reveal className="release-feature">
          <div className="release-feature__art"><img src={release.artwork || ''} alt={`${release.title} cover artwork`} width={600} height={600} /></div>
          <div>
            <div className="release-feature__meta"><span className="chip chip--accent">{fmtDate(release.date)}</span>{release.genre && <span className="chip">{release.genre}</span>}{release.durationMs && <span className="chip">{fmtDuration(release.durationMs)}</span>}</div>
            <p className="release-feature__desc">{release.description}</p>
            <div className="row">
              {release.previewUrl ? <button className="btn btn--accent" onClick={() => isCurrent && player.playing ? player.toggle() : player.playRelease(release)}>{isCurrent && player.playing ? <><Pause size={16} fill="currentColor" /> Pause preview</> : <><Play size={16} fill="currentColor" /> Play 30s preview</>}</button> : <span className="chip"><Music2 size={12} /> Preview not available</span>}
            </div>
            <StreamingLinks release={release} />
            {release.credits && release.credits.length > 0 && <div style={{ marginTop: 32 }}><p className="eyebrow">Credits</p><ul className="muted" style={{ margin: 0, paddingLeft: 18, fontSize: 15, lineHeight: 1.9 }}>{release.credits.map(c => <li key={c}>{c}</li>)}</ul></div>}
          </div>
        </Reveal>
        <div style={{ marginTop: 64 }}>
          <p className="eyebrow">Tracklist</p>
          <div className="tracklist">{tracks.map((t, i) => { const playing = isCurrent && current.track.n === t.n && player.playing; return (
            <div key={t.n} className={`track ${isCurrent && current.track.n === t.n ? 'is-playing' : ''}`}>
              <span className="track__n">{playing ? <span className="eq"><i /><i /><i /></span> : String(t.n).padStart(2, '0')}</span>
              <div className="track__title">{t.title}<small>{release.artist}</small></div>
              <span className="track__dur">{fmtDuration(t.durationMs)}</span>
              {t.previewUrl ? <button className="play-circle play-circle--sm" onClick={() => playTrack(i)} aria-label={playing ? `Pause ${t.title}` : `Play preview of ${t.title}`}>{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />}</button> : <span className="mono muted" style={{ fontSize: 10 }}>No preview</span>}
            </div>
          ); })}</div>
        </div>
        {related.length > 0 && <div style={{ marginTop: 80 }}><p className="eyebrow">More like this</p><div className="release-grid" style={{ marginTop: 24 }}>{related.map(r => <ReleaseCard key={r.id} release={r} />)}</div></div>}
      </div></section>
    </>
  );
}
