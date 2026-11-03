import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Check } from 'lucide-react';
import { useContent } from '../lib/content';
import { useCart } from '../lib/cart';
import { usePageMeta } from '../lib/hooks';
import { money } from '../lib/format';
import { Reveal, DemoBanner } from '../components/ui';
import NotFound from './NotFound';

export default function ProductDetail() {
  const { slug } = useParams();
  const { content } = useContent();
  const { add } = useCart();
  const nav = useNavigate();
  const product = content?.products.find(p => p.slug === slug);
  const [size, setSize] = useState(product?.sizes?.[0] || '');
  const [color, setColor] = useState(product?.colors?.[0] || '');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  usePageMeta(product ? `${product.name} — RANO Store` : 'Store — RANO');
  if (!content) return null;
  if (!product) return <NotFound />;
  const addAndGo = () => { add(product, { qty, size, color }); setAdded(true); setTimeout(() => nav('/cart'), 600); };
  return (
    <section className="section" style={{ paddingTop: 'calc(var(--header-h) + 48px)' }}><div className="container">
      <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/store">Store</Link><span>/</span><span>{product.name}</span></div>
      <Link to="/store" className="link-arrow" style={{ marginBottom: 24 }}><ArrowLeft size={14} /> Back to store</Link>
      <Reveal className="product-detail">
        <div>{product.images?.[0] ? <img className="product-detail__img" src={product.images[0]} alt={product.name} /> : <div className="product-detail__img skeleton" />}</div>
        <div>
          <p className="eyebrow">Official merch</p><h1 className="display h3">{product.name}</h1>
          <div className="price" style={{ margin: '16px 0' }}>{money(product.priceCents, product.currency)}</div>
          <p className="muted">{product.description}</p>
          {product.sizes && product.sizes.length > 0 && <div className="field" style={{ marginTop: 20 }}><label>Size</label><div className="variant-group">{product.sizes.map(s => <button key={s} className={`variant ${size === s ? 'is-active' : ''}`} onClick={() => setSize(s)} aria-pressed={size === s}>{s}</button>)}</div></div>}
          {product.colors && product.colors.length > 0 && <div className="field" style={{ marginTop: 20 }}><label>Color</label><div className="variant-group">{product.colors.map(c => <button key={c} className={`variant ${color === c ? 'is-active' : ''}`} onClick={() => setColor(c)} aria-pressed={color === c}>{c}</button>)}</div></div>}
          <div className="field" style={{ marginTop: 20 }}><label>Quantity</label><div className="qty"><button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button><span>{qty}</span><button onClick={() => setQty(q => Math.min(20, q + 1))} aria-label="Increase quantity">+</button></div></div>
          <div className="row" style={{ marginTop: 28 }}><button className="btn btn--accent" onClick={addAndGo}>{added ? <><Check size={16} /> Added</> : <><ShoppingBag size={16} /> Add to cart</>}</button><button className="btn btn--ghost" onClick={() => add(product, { qty, size, color })}>Keep shopping</button></div>
          <div style={{ marginTop: 28 }}><DemoBanner><strong>Demo checkout.</strong> Payments are not enabled yet. Orders are recorded for review only — no card details are collected and no money is taken. Connect Stripe in the server configuration to accept real payments.</DemoBanner></div>
        </div>
      </Reveal>
    </div></section>
  );
}
