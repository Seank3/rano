import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Play, Pause } from 'lucide-react';
import { useContent } from '../lib/content';
import { usePlayer } from '../lib/player';
import { usePageMeta } from '../lib/hooks';
import { fmtDate, isUpcoming } from '../lib/format';
import type { Video } from '../lib/types';
import Hero from '../components/Hero';
import { Reveal, SectionHead, StreamingLinks } from '../components/ui';
import ReleaseCard from '../components/ReleaseCard';
import { VideoCard, VideoFeature, VideoModal } from '../components/VideoCards';
import { EventRow, EmptyEvents } from '../components/EventList';
import NewsCard from '../components/NewsCard';
import NewsletterForm from '../components/NewsletterForm';

export default function Home() {
  const { content } = useContent();
  const player = usePlayer();
  const [video, setVideo] = useState<Video | null>(null);
  usePageMeta(content?.profile.seo.title || 'RANO — Official Website', content?.profile.seo.description);
  const releases = useMemo(() => [...(content?.releases || [])].sort((a, b) => (b.date || '').localeCompare(a.date || '')), [content]);
  if (!content) return null;
  const p = content.profile;
  const latest = releases.find(r => r.featured && r.type !== 'feature') || releases[0];
  const featuredVideo = content.videos.find(v => v.featured) || content.videos[0];
  const videos = content.videos.filter(v => v.featured).slice(0, 3);
  const upcoming = content.events.filter(isUpcoming);
  const past = content.events.filter(e => !isUpcoming(e));
  const news = [...content.news].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 3);
  const more = releases.filter(r => r.id !== latest?.id).slice(0, 4);
  const isLatestPlaying = player.queue[player.index]?.release.id === latest?.id && player.playing;
  const onRecap = (id: string) => setVideo({ id, title: 'Event recap', youtubeId: id, category: 'Event Recap' });
  return (
    <>
      <Hero profile={p} latest={latest} featuredVideo={featuredVideo} onWatch={setVideo} />
      <div className="marquee" aria-hidden="true"><div className="marquee__track">{[...releases.slice(0, 6), ...releases.slice(0, 6)].map((r, i) => <span key={i}>{r.title.replace(/ \(feat\..*\)/, '')}</span>)}</div></div>

      {latest && (
        <section className="section" aria-labelledby="latest-title">
          <div className="container">
            <Reveal><SectionHead eyebrow="01 — Latest release" title={<span id="latest-title">Out now</span>} right={<Link to="/music" className="link-arrow">Full discography <ArrowUpRight size={14} /></Link>} /></Reveal>
            <Reveal className="release-feature">
              <div className="release-feature__art">
                <img src={latest.artwork || ''} alt={`${latest.title} cover artwork`} width={600} height={600} />
                <span className="chip chip--accent badge">{latest.type === 'feature' ? 'Feature' : 'Single'}</span>
              </div>
              <div>
                <p className="mono muted">{fmtDate(latest.date)} · {latest.genre}</p>
                <h3 className="display h2" style={{ margin: '10px 0 0' }}>{latest.title}</h3>
                <div className="release-feature__meta"><span className="chip">{latest.artist}</span>{latest.durationMs && <span className="chip">{Math.round(latest.durationMs / 60000)}:{String(Math.round(latest.durationMs / 1000) % 60).padStart(2, '0')}</span>}</div>
                <p className="release-feature__desc">{latest.description}</p>
                <div className="row">
                  <button className="btn btn--accent" onClick={() => isLatestPlaying ? player.toggle() : player.playRelease(latest)}>{isLatestPlaying ? <><Pause size={16} fill="currentColor" /> Pause preview</> : <><Play size={16} fill="currentColor" /> Play 30s preview</>}</button>
                  <Link to={`/music/${latest.slug}`} className="btn btn--ghost">Release details</Link>
                </div>
                <StreamingLinks release={latest} />
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {more.length > 0 && (
        <section className="section section--surface section--tight">
          <div className="container">
            <Reveal><SectionHead eyebrow="02 — Discography" title="More music" /></Reveal>
            <div className="release-grid">{more.map((r, i) => <Reveal key={r.id} delay={(i % 3) as 0 | 1 | 2}><ReleaseCard release={r} /></Reveal>)}</div>
          </div>
        </section>
      )}

      {featuredVideo && (
        <section className="section">
          <div className="container">
            <Reveal><SectionHead eyebrow="03 — Visuals" title="Watch" right={<Link to="/videos" className="link-arrow">All videos <ArrowUpRight size={14} /></Link>} /></Reveal>
            <Reveal><VideoFeature video={featuredVideo} onPlay={setVideo} /></Reveal>
            {videos.length > 1 && <div className="video-grid" style={{ marginTop: 48 }}>{videos.filter(v => v.id !== featuredVideo.id).map(v => <Reveal key={v.id}><VideoCard video={v} onPlay={setVideo} /></Reveal>)}</div>}
          </div>
        </section>
      )}

      <section className="section section--surface">
        <div className="container">
          <Reveal><SectionHead eyebrow="04 — Live" title="Events" right={<Link to="/events" className="link-arrow">Events page <ArrowUpRight size={14} /></Link>} /></Reveal>
          <Reveal>{upcoming.length ? <div className="event-list">{upcoming.map(e => <EventRow key={e.id} event={e} />)}</div> : <EmptyEvents />}</Reveal>
          {upcoming.length === 0 && past.length > 0 && <p className="mono muted" style={{ marginTop: 20 }}>Previously: {past.map(e => e.title).join(' · ')} — <Link to="/events" style={{ color: 'var(--accent)' }}>see the recap</Link></p>}
        </div>
      </section>

      {news.length > 0 && (
        <section className="section">
          <div className="container">
            <Reveal><SectionHead eyebrow="05 — News" title="Latest" right={<Link to="/news" className="link-arrow">All news <ArrowUpRight size={14} /></Link>} /></Reveal>
            <div className="news-grid">{news.map((n, i) => <Reveal key={n.id} delay={(i % 3) as 0 | 1 | 2}><NewsCard article={n} /></Reveal>)}</div>
          </div>
        </section>
      )}

      <section className="section section--tight" id="newsletter">
        <div className="container">
          <Reveal className="newsletter">
            <div><p className="eyebrow">Newsletter</p><h2 className="display h3">Join the movement</h2><p className="muted" style={{ marginBottom: 0 }}>New music, videos and show dates — straight to your inbox. No spam, unsubscribe anytime.</p></div>
            <NewsletterForm source="home" />
          </Reveal>
        </div>
      </section>
      <VideoModal video={video} onClose={() => setVideo(null)} />
    </>
  );
}
