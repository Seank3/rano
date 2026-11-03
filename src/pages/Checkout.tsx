import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, AlertCircle } from 'lucide-react';
import { useCart } from '../lib/cart';
import { api } from '../lib/api';
import { usePageMeta } from '../lib/hooks';
import { money } from '../lib/format';
import { DemoBanner } from '../components/ui';

export default function Checkout() {
  const { items, total, clear } = useCart();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', phone: '', address: '' });
  const [state, setState] = useState<'idle' | 'loading' | 'err'>('idle');
  const [err, setErr] = useState('');
  usePageMeta('Checkout — RANO Store');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) { setState('err'); setErr('Please enter a valid name and email.'); return; }
    setState('loading');
    try {
      const r = await api.order({ items: items.map(i => ({ productId: i.productId, qty: i.qty, size: i.size, color: i.color })), customer: f });
      clear(); nav(`/order/${r.orderId}`, { state: { order: r, customer: f, items } });
    } catch (e) { setState('err'); setErr(e instanceof Error ? e.message : 'Checkout failed.'); }
  };
  if (!items.length) return <section className="section" style={{ paddingTop: 'calc(var(--header-h) + 48px)' }}><div className="container"><div className="empty-state"><p className="display h3">Your cart is empty</p><Link to="/store" className="btn btn--accent">Back to store</Link></div></div></section>;
  return (
    <section className="section" style={{ paddingTop: 'calc(var(--header-h) + 48px)' }}><div className="container">
      <div className="breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/cart">Cart</Link><span>/</span><span>Checkout</span></div>
      <h1 className="display h2">Checkout</h1>
      <div style={{ margin: '24px 0' }}><DemoBanner><strong>Demo checkout — no payment is taken.</strong> This records your order so the team can follow up. To enable real card payments, the site owner must connect a payment provider (e.g. Stripe) on the server. Card details are never collected here.</DemoBanner></div>
      <div className="two-col" style={{ gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)' }}>
        <form className="form" onSubmit={submit} noValidate>
          <div className="form-row"><div className="field"><label htmlFor="o-name">Full name</label><input id="o-name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} autoComplete="name" required /></div><div className="field"><label htmlFor="o-email">Email</label><input id="o-email" type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} autoComplete="email" required /></div></div>
          <div className="field"><label htmlFor="o-phone">Phone (optional)</label><input id="o-phone" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} autoComplete="tel" /></div>
          <div className="field"><label htmlFor="o-address">Delivery address / city</label><textarea id="o-address" value={f.address} onChange={e => setF({ ...f, address: e.target.value })} autoComplete="street-address" placeholder="Where should the order be delivered?" /></div>
          {state === 'err' && <div className="form-msg form-msg--err"><AlertCircle size={16} />{err}</div>}
          <button className="btn btn--accent" disabled={state === 'loading'}>{state === 'loading' ? 'Placing order…' : <><Check size={16} /> Place demo order</>}</button>
        </form>
        <div className="summary"><p className="eyebrow" style={{ marginBottom: 8 }}>Order summary</p>{items.map((it, i) => <div key={i} className="summary__row"><span>{it.name} × {it.qty}{it.size ? ` (${it.size})` : ''}</span><span>{money(it.priceCents * it.qty, it.currency)}</span></div>)}<div className="summary__row summary__total"><span>Total</span><span>{money(total, items[0].currency)}</span></div></div>
      </div>
    </div></section>
  );
}
