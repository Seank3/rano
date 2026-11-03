import { Link } from 'react-router-dom';
import { Play, Pause } from 'lucide-react';
import type { Release } from '../lib/types';
import { usePlayer } from '../lib/player';
import { fmtDate } from '../lib/format';

export default function ReleaseCard({ release }: { release: Release }) {
  const player = usePlayer();
  const isCurrent = player.queue[player.index]?.release.id === release.id;
  const isPlaying = isCurrent && player.playing;
  const typeLabel = release.type === 'feature' ? 'Feature' : release.type.toUpperCase();
  return (
    <article className="release-card">
      <Link to={`/music/${release.slug}`} className="release-card__art" aria-label={`${release.title} — release details`}>
        <img src={release.artwork || ''} alt={`${release.title} cover artwork`} loading="lazy" width={600} height={600} />
        <span className="chip release-card__type">{typeLabel}</span>
      </Link>
      {release.previewUrl && (
        <div className="release-card__play" style={{ pointerEvents: 'none' }}>
          <button className="play-circle" style={{ pointerEvents: 'auto' }} onClick={() => isPlaying ? player.toggle() : player.playRelease(release)} aria-label={isPlaying ? `Pause ${release.title}` : `Play preview of ${release.title}`}>
            {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" style={{ marginLeft: 3 }} />}
          </button>
        </div>
      )}
      <div className="release-card__body">
        <h3 className="release-card__title"><Link to={`/music/${release.slug}`}>{release.title}</Link></h3>
        <div className="release-card__sub"><span>{release.artist}</span><span>·</span><span>{fmtDate(release.date, { year: 'numeric', month: 'short' })}</span></div>
      </div>
    </article>
  );
}
