import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../lib/content';
import { usePageMeta } from '../lib/hooks';
import { Reveal, SectionHead } from '../components/ui';
import NewsCard from '../components/NewsCard';

export default function News() {
  const { content } = useContent();
  const [tag, setTag] = useState('all');
  usePageMeta('News — RANO', 'Release news, collaborations and announcements from Ugakid RANO.');
  const news = useMemo(() => [...(content?.news || [])].sort((a, b) => (b.date || '').localeCompare(a.date || '')), [content]);
  const tags = ['all', ...Array.from(new Set(news.flatMap(n => n.tags || [])))];
  const filtered = news.filter(n => tag === 'all' || n.tags?.includes(tag));
  if (!content) return null;
  return (
    <>
      <div className="page-hero" data-word="News"><div className="container"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>News</span></div><p className="eyebrow">Updates</p><h1 className="display h1">News</h1><p className="lead">Releases, collaborations and announcements — drawn from official channels.</p></div></div>
      <section className="section"><div className="container">
        <Reveal><SectionHead eyebrow={`${filtered.length} stories`} title="Latest stories" right={<div className="filters" role="group" aria-label="Filter news">{tags.map(t => <button key={t} className={`filter ${tag === t ? 'is-active' : ''}`} onClick={() => setTag(t)} aria-pressed={tag === t}>{t === 'all' ? 'All' : t}</button>)}</div>} /></Reveal>
        {filtered.length ? <div className="news-grid">{filtered.map((n, i) => <Reveal key={n.id} delay={(i % 3) as 0 | 1 | 2}><NewsCard article={n} /></Reveal>)}</div> : <div className="empty-state"><p className="display h3">No stories in this category</p></div>}
      </div></section>
    </>
  );
}
