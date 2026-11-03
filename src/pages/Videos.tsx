import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../lib/content';
import { usePageMeta } from '../lib/hooks';
import type { Video } from '../lib/types';
import { Reveal, SectionHead } from '../components/ui';
import { VideoCard, VideoFeature, VideoModal } from '../components/VideoCards';

export default function Videos() {
  const { content } = useContent();
  const [video, setVideo] = useState<Video | null>(null);
  const [cat, setCat] = useState('all');
  usePageMeta('Videos — RANO', 'Official music videos, visualizers and lyrics videos by Ugakid RANO.');
  const videos = useMemo(() => [...(content?.videos || [])].sort((a, b) => (b.date || '').localeCompare(a.date || '')), [content]);
  if (!content) return null;
  const featured = videos.find(v => v.featured) || videos[0];
  const cats = ['all', ...Array.from(new Set(videos.map(v => v.category || 'Video')))];
  const rest = videos.filter(v => v.id !== featured?.id && (cat === 'all' || (v.category || 'Video') === cat));
  return (
    <>
      <div className="page-hero" data-word="Watch"><div className="container"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>Videos</span></div><p className="eyebrow">Visuals</p><h1 className="display h1">Videos</h1><p className="lead">Official music videos, visualizers, lyrics videos and event recaps — straight from the RANO YouTube channel.</p></div></div>
      {featured && <section className="section"><div className="container"><Reveal><VideoFeature video={featured} onPlay={setVideo} /></Reveal></div></section>}
      <section className="section section--surface section--tight"><div className="container">
        <Reveal><SectionHead eyebrow="All videos" title="The archive" right={<div className="filters" role="group" aria-label="Filter videos">{cats.map(c => <button key={c} className={`filter ${cat === c ? 'is-active' : ''}`} onClick={() => setCat(c)} aria-pressed={cat === c}>{c === 'all' ? 'All' : c}</button>)}</div>} /></Reveal>
        {rest.length ? <div className="video-grid">{rest.map((v, i) => <Reveal key={v.id} delay={(i % 3) as 0 | 1 | 2}><VideoCard video={v} onPlay={setVideo} /></Reveal>)}</div> : <div className="empty-state"><p className="display h3">Nothing else in this category</p></div>}
        <p className="mono muted" style={{ marginTop: 32 }}>Videos load only when you press play · <a href={content.profile.socials.find(s => s.platform === 'YouTube')?.url || 'https://www.youtube.com/@UgakidRANO'} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Subscribe on YouTube</a></p>
      </div></section>
      <VideoModal video={video} onClose={() => setVideo(null)} />
    </>
  );
}
