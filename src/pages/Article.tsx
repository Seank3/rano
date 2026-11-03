import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Twitter, Facebook, Link2, Check, MessageCircle } from 'lucide-react';
import { useContent } from '../lib/content';
import { usePageMeta } from '../lib/hooks';
import { fmtDate } from '../lib/format';
import { Reveal } from '../components/ui';
import NewsCard from '../components/NewsCard';
import NotFound from './NotFound';

export default function Article() {
  const { slug } = useParams();
  const { content } = useContent();
  const [copied, setCopied] = useState(false);
  const article = content?.news.find(n => n.slug === slug);
  usePageMeta(article ? `${article.title} — RANO` : 'News — RANO', article?.excerpt || undefined);
  if (!content) return null;
  if (!article) return <NotFound />;
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const share = (kind: string) => {
    const t = encodeURIComponent(article.title); const u = encodeURIComponent(url);
    const map: Record<string, string> = { twitter: `https://twitter.com/intent/tweet?text=${t}&url=${u}`, facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`, whatsapp: `https://wa.me/?text=${t}%20${u}` };
    if (kind === 'copy') { navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); return; }
    window.open(map[kind], '_blank', 'noopener,noreferrer');
  };
  const related = content.news.filter(n => n.id !== article.id && n.tags?.some(t => article.tags?.includes(t))).slice(0, 3);
  const fallback = content.news.filter(n => n.id !== article.id).slice(0, 3);
  const rel = related.length ? related : fallback;
  return (
    <>
      <div className="page-hero"><div className="container"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/news">News</Link><span>/</span><span>{article.title}</span></div><Link to="/news" className="link-arrow" style={{ marginBottom: 24 }}><ArrowLeft size={14} /> All news</Link><div className="row" style={{ marginBottom: 16 }}><span className="mono muted">{fmtDate(article.date)}</span>{article.tags?.map(t => <span key={t} className="chip chip--accent">{t}</span>)}</div><h1 className="display h2" style={{ maxWidth: 18 }}>{article.title}</h1></div></div>
      <section className="section"><div className="container"><Reveal className="article">
        {article.image && <img className="article__hero" src={article.image} alt="" width={1200} height={675} />}
        <div className="article__body">{article.body?.map((p, i) => <p key={i}>{p}</p>)}</div>
        <div className="spread" style={{ marginTop: 40, borderTop: '1px solid var(--line)', paddingTop: 24 }}>
          <span className="mono muted">Share this story</span>
          <div className="share">
            <button className="icon-btn" onClick={() => share('twitter')} aria-label="Share on X"><Twitter size={16} /></button>
            <button className="icon-btn" onClick={() => share('facebook')} aria-label="Share on Facebook"><Facebook size={16} /></button>
            <button className="icon-btn" onClick={() => share('whatsapp')} aria-label="Share on WhatsApp"><MessageCircle size={16} /></button>
            <button className="icon-btn" onClick={() => share('copy')} aria-label="Copy link">{copied ? <Check size={16} /> : <Link2 size={16} />}</button>
          </div>
        </div>
      </Reveal></div></section>
      {rel.length > 0 && <section className="section section--surface"><div className="container"><Reveal><p className="eyebrow">Related</p><h2 className="display h3" style={{ marginBottom: 32 }}>Keep reading</h2></Reveal><div className="news-grid">{rel.map(n => <Reveal key={n.id}><NewsCard article={n} /></Reveal>)}</div></div></section>}
    </>
  );
}
