import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import type { Article } from '../lib/types';
import { fmtDate } from '../lib/format';

export default function NewsCard({ article }: { article: Article }) {
  return (
    <article className="news-card">
      <Link to={`/news/${article.slug}`} className="news-card__img" tabIndex={-1} aria-hidden><img src={article.image || ''} alt="" loading="lazy" width={640} height={400} /></Link>
      <div className="news-card__meta"><span className="mono muted">{fmtDate(article.date)}</span>{article.tags?.slice(0, 1).map(t => <span key={t} className="chip chip--accent">{t}</span>)}</div>
      <h3 className="news-card__title"><Link to={`/news/${article.slug}`}>{article.title}</Link></h3>
      <p className="news-card__excerpt">{article.excerpt}</p>
      <Link to={`/news/${article.slug}`} className="link-arrow">Read story <ArrowUpRight size={14} /></Link>
    </article>
  );
}
