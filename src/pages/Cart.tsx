import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../lib/cart';
import { usePageMeta } from '../lib/hooks';
import { money } from '../lib/format';
import { DemoBanner } from '../components/ui';

export default function Cart() {
  const { items, remove, setQty, total, count } = useCart();
  usePageMeta('Cart — RANO Store');
  return (
    <section className="section" style={{ paddingTop: 'calc(var(--header-h) + 48px)' }}><div className="container">
      <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/store">Store</Link><span>/</span><span>Cart</span></div>
      <h1 className="display h2">Your cart</h1>
      {items.length === 0 ? <div className="empty-state" style={{ marginTop: 32 }}><ShoppingBag size={32} className="muted" /><p className="display h3">Your cart is empty</p><Link to="/store" className="btn btn--accent">Browse the store</Link></div> : (
        <div className="two-col" style={{ marginTop: 32, gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)' }}>
          <div>{items.map((it, i) => <div key={i} className="cart-row">{it.image ? <img src={it.image} alt="" /> : <div style={{ width: 80, height: 100, background: 'var(--surface)' }} />}<div><strong>{it.name}</strong><div className="mono muted" style={{ marginTop: 4 }}>{[it.size, it.color].filter(Boolean).join(' · ')}</div><div className="muted" style={{ fontSize: 14 }}>{money(it.priceCents, it.currency)}</div></div><div className="qty"><button onClick={() => setQty(i, it.qty - 1)} aria-label="Decrease">−</button><span>{it.qty}</span><button onClick={() => setQty(i, it.qty + 1)} aria-label="Increase">+</button></div><div className="row"><strong>{money(it.priceCents * it.qty, it.currency)}</strong><button className="icon-btn" onClick={() => remove(i)} aria-label={`Remove ${it.name}`}><Trash2 size={16} /></button></div></div>)}</div>
          <div className="stack"><div className="summary"><div className="summary__row"><span>Items</span><span>{count}</span></div><div className="summary__row"><span>Shipping</span><span className="muted">Calculated at checkout</span></div><div className="summary__row summary__total"><span>Total</span><span>{money(total, items[0].currency)}</span></div><Link to="/checkout" className="btn btn--accent" style={{ marginTop: 8 }}>Checkout</Link></div><DemoBanner><strong>Demo mode.</strong> No payment is processed. Checkout records a demo order for the team to review.</DemoBanner></div>
        </div>
      )}
    </div></section>
  );
}
