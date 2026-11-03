import { Play, ExternalLink } from 'lucide-react';
import type { Video } from '../lib/types';
import { fmtDate } from '../lib/format';
import { Modal } from './ui';

export function VideoCard({ video, onPlay }: { video: Video; onPlay: (v: Video) => void }) {
  return (
    <button className="video-card" onClick={() => onPlay(video)} aria-label={`Play ${video.title}`}>
      <div className="video-card__thumb">
        <img src={video.thumbnail || `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" width={640} height={360} />
        <span className="chip video-card__cat">{video.category || 'Video'}</span>
        <span className="play-circle"><Play size={22} fill="currentColor" style={{ marginLeft: 3 }} /></span>
      </div>
      <div className="video-card__body">
        <h3 className="video-card__title">{video.title}</h3>
        <div className="video-card__meta">{video.category}{video.date ? ` · ${fmtDate(video.date, { year: 'numeric', month: 'short' })}` : ''}</div>
      </div>
    </button>
  );
}
export function VideoFeature({ video, onPlay }: { video: Video; onPlay: (v: Video) => void }) {
  return (
    <div className="video-feature">
      <button className="video-feature__thumb" onClick={() => onPlay(video)} aria-label={`Play ${video.title}`}>
        <img src={video.thumbnail || `https://i.ytimg.com/vi/${video.youtubeId}/maxresdefault.jpg`} alt="" width={1280} height={720} />
        <span className="play-circle"><Play size={30} fill="currentColor" style={{ marginLeft: 4 }} /></span>
      </button>
      <div>
        <p className="eyebrow">Featured video</p>
        <h3 className="display h3">{video.title}</h3>
        <p className="muted" style={{ fontSize: 16 }}>{video.description}</p>
        <div className="row" style={{ marginTop: 20 }}>
          <button className="btn btn--accent" onClick={() => onPlay(video)}><Play size={16} fill="currentColor" /> Play video</button>
          <a className="btn btn--ghost" href={`https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> YouTube</a>
        </div>
      </div>
    </div>
  );
}
export function VideoModal({ video, onClose }: { video: Video | null; onClose: () => void }) {
  return (
    <Modal open={!!video} onClose={onClose} label={video ? `Video: ${video.title}` : 'Video'}>
      {video && (<>
        <div className="modal__video">
          <iframe src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        </div>
        <div className="modal__caption">
          <div><strong>{video.title}</strong><div className="mono muted" style={{ marginTop: 4 }}>{video.category}{video.date ? ` · ${fmtDate(video.date)}` : ''}</div></div>
          <a className="link-arrow" href={`https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noopener noreferrer">Open on YouTube <ExternalLink size={12} /></a>
        </div>
      </>)}
    </Modal>
  );
}
