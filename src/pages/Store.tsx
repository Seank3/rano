import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useContent } from '../lib/content';
import { usePageMeta } from '../lib/hooks';
import { money } from '../lib/format';
import { Reveal, SectionHead } from '../components/ui';
import NewsletterForm from '../components/NewsletterForm';

export default function Store() {
  const { content } = useContent();
  usePageMeta('Store — RANO', 'Official RANO merchandise.');
  if (!content) return null;
  const products = content.products;
  return (
    <>
      <div className="page-hero" data-word="Store"><div className="container"><div className="breadcrumb"><Link to="/">Home</Link><span>/</span><span>Store</span></div><p className="eyebrow">Official merch</p><h1 className="display h1">Store</h1><p className="lead">Wear the movement. Official merchandise drops are announced here.</p></div></div>
      <section className="section"><div className="container">
        {products.length ? (<>
          <Reveal><SectionHead eyebrow={`${products.length} products`} title="Shop" /></Reveal>
          <div className="product-grid">{products.map(p => <Reveal key={p.id}><Link to={`/store/${p.slug}`} className="product-card"><div className="product-card__img">{p.images?.[0] ? <img src={p.images[0]} alt={p.name} loading="lazy" /> : <div className="skeleton" style={{ width: '100%', height: '100%' }} />}</div><h3 style={{ margin: '0 0 4px', fontSize: 18 }}>{p.name}</h3><div className="price" style={{ fontSize: 22 }}>{money(p.priceCents, p.currency)}</div></Link></Reveal>)}</div>
        </>) : (
          <Reveal className="empty-state"><ShoppingBag size={36} className="muted" aria-hidden /><p className="display h2">Merch coming soon</p><p className="muted" style={{ maxWidth: '50ch', margin: 0 }}>No products are on sale yet. When the first drop lands, it will appear here. Join the list to be first to know.</p><div style={{ width: 'min(480px, 100%)', marginTop: 8 }}><NewsletterForm source="store" /></div></Reveal>
        )}
      </div></section>
    </>
  );
}
