import { useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, X, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { usePlayer } from '../lib/player';
import { fmtTime, cx } from '../lib/format';

export default function AudioPlayer() {
  const p = usePlayer();
  const current = p.queue[p.index];
  const active = !!current;
  useEffect(() => { document.body.classList.toggle('has-player', active); return () => document.body.classList.remove('has-player'); }, [active]);
  if (!active) return null;
  const dur = p.duration || (current.track.durationMs ? Math.min(30, current.track.durationMs / 1000) : 30);
  return (
    <div className={cx('player', active && 'is-active')} role="region" aria-label="Audio player">
      <div className="player__inner">
        <div className="player__track">
          <img src={current.release.artwork || ''} alt="" width={52} height={52} />
          <div style={{ minWidth: 0 }}>
            <div className="t">{current.track.title}</div>
            <div className="a">{current.release.artist}</div>
            {p.error ? <div className="player__error">{p.error}</div> : <div className="player__label">30s preview · Apple Music</div>}
          </div>
        </div>
        <div className="player__controls">
          <div className="player__buttons">
            <button className="icon-btn" onClick={p.prev} aria-label="Previous track" disabled={p.index === 0}><SkipBack size={18} /></button>
            <button className="play-circle play-circle--sm" onClick={p.toggle} aria-label={p.playing ? 'Pause' : 'Play'}>
              {p.loading ? <Loader2 size={18} className="spin" /> : p.playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />}
            </button>
            <button className="icon-btn" onClick={p.next} aria-label="Next track" disabled={p.index >= p.queue.length - 1}><SkipForward size={18} /></button>
          </div>
          <div className="player__progress">
            <span className="player__time">{fmtTime(p.currentTime)}</span>
            <input className="range" type="range" min={0} max={dur || 30} step={0.1} value={Math.min(p.currentTime, dur || 30)} onChange={e => p.seek(Number(e.target.value))} aria-label="Seek" />
            <span className="player__time">{fmtTime(dur)}</span>
          </div>
        </div>
        <div className="player__right">
          <button className="icon-btn" onClick={() => p.setVolume(p.volume > 0 ? 0 : 0.9)} aria-label={p.volume > 0 ? 'Mute' : 'Unmute'}>{p.volume > 0 ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
          <input className="range range--vol" type="range" min={0} max={1} step={0.01} value={p.volume} onChange={e => p.setVolume(Number(e.target.value))} aria-label="Volume" />
          <button className="icon-btn" onClick={p.close} aria-label="Close player"><X size={18} /></button>
        </div>
      </div>
    </div>
  );
}
