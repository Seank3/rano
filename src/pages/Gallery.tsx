import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../lib/content';
import { usePageMeta } from '../lib/hooks';
import { Reveal, SectionHead } from '../components/ui';
import Lightbox from '../components/Lightbox';

export default function Gallery() {
  const { content } = useContent();
  const [cat, setCat] = useState('all');
  const [index, setIndex] = useState<number | null>(null);
  usePageMeta('Gallery — RANO', 'Official artwork, video stills and photography from Ugakid RANO.');
  const items = useMemo(() => content?.gallery || [], [content]);
  const cats = ['all', ...Array.from(new Set(items.map(i => i.category || 'Other')))];
  const filtered = items.filter(i => cat === 'all' || (i.category || 'Other') === cat);
  if (!content) return null;
  return (
    <>
      <div className="page-hero" data-word="Gallery"><div className="container"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>Gallery</span></div><p className="eyebrow">Gallery</p><h1 className="display h1">In frame</h1><p className="lead">Official artwork and video stills. Original photography will replace these as it is supplied — every image here is from RANO's own releases and channel.</p></div></div>
      <section className="section"><div className="container">
        <Reveal><SectionHead eyebrow={`${filtered.length} images`} title="The gallery" right={<div className="filters" role="group" aria-label="Filter gallery">{cats.map(c => <button key={c} className={`filter ${cat === c ? 'is-active' : ''}`} onClick={() => { setCat(c); setIndex(null); }} aria-pressed={cat === c}>{c === 'all' ? 'All' : c}</button>)}</div>} /></Reveal>
        <div className="masonry">{filtered.map((item, i) => (
          <Reveal key={item.id} delay={(i % 3) as 0 | 1 | 2}>
            <button className="masonry__item" onClick={() => setIndex(i)} aria-label={`Open image: ${item.alt || item.caption}`}>
              <img src={item.src} alt={item.alt || item.caption || ''} loading="lazy" width={item.width || 600} height={item.height || 600} style={{ aspectRatio: item.width && item.height ? `${item.width}/${item.height}` : undefined }} />
              <span className="masonry__cap">{item.caption}</span>
            </button>
          </Reveal>
        ))}</div>
      </div></section>
      <Lightbox items={filtered} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />
    </>
  );
}
