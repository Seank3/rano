import { Link } from 'react-router-dom';
import { Play, Youtube, ArrowDown } from 'lucide-react';
import type { Profile, Release, Video } from '../lib/types';
import { usePlayer } from '../lib/player';
import { fmtDate } from '../lib/format';

export default function Hero({ profile, latest, featuredVideo, onWatch }: { profile: Profile; latest?: Release; featuredVideo?: Video; onWatch: (v: Video) => void }) {
  const player = usePlayer();
  const name = (profile.shortName || 'RANO').toUpperCase();
  const first = profile.name.split(' ')[0].toUpperCase();
  const showFirst = first && first !== name;
  return (
    <section className="hero" aria-label="Introduction">
      <div className="hero__bg" aria-hidden="true"><img src={profile.heroImage} alt="" /></div>
      <div className="hero__content">
        <div className="hero__tag"><span className="dot" aria-hidden /><span className="mono">{profile.location} · {profile.genre}</span></div>
        <h1 className="display hero__name" aria-label={profile.name}>
          {showFirst && <span className="line line--outline"><span>{first}</span></span>}
          <span className="line"><span>{name}</span></span>
        </h1>
        <div className="hero__sub">
          <p className="hero__tagline">{profile.tagline} <em>Bold, unfiltered, unapologetically real.</em></p>
          {latest && (
            <div className="hero__release">
              <img src={latest.artwork || ''} alt={`${latest.title} artwork`} width={72} height={72} />
              <div>
                <div className="m">Latest release · {fmtDate(latest.date)}</div>
                <div className="t">{latest.title}</div>
                <div className="muted" style={{ fontSize: 13 }}>{latest.artist}</div>
              </div>
            </div>
          )}
        </div>
        <div className="hero__cta">
          {latest && <button className="btn btn--accent" onClick={() => player.playRelease(latest)}><Play size={16} fill="currentColor" /> Listen now</button>}
          {latest && <Link to={`/music/${latest.slug}`} className="btn btn--ghost">Release details</Link>}
          {featuredVideo && <button className="btn btn--ghost" onClick={() => onWatch(featuredVideo)}><Youtube size={16} /> Watch video</button>}
        </div>
      </div>
      <div className="hero__scroll" aria-hidden="true">Scroll <ArrowDown size={12} /></div>
    </section>
  );
}
