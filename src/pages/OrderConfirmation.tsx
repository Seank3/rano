import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { usePageMeta } from '../lib/hooks';
import { money } from '../lib/format';
import { DemoBanner } from '../components/ui';
export default function OrderConfirmation() {
  const { id } = useParams();
  const { state } = useLocation() as { state?: any };
  usePageMeta('Order confirmed — RANO Store');
  return (
    <section className="section" style={{ paddingTop: 'calc(var(--header-h) + 80px)', minHeight: '70vh' }}><div className="container" style={{ maxWidth: 720 }}>
      <div className="empty-state"><CheckCircle2 size={44} style={{ color: 'var(--green)' }} /><p className="eyebrow">Order recorded</p><h1 className="display h3">Thank you{state?.customer?.name ? `, ${state.customer.name.split(' ')[0]}` : ''}</h1><p className="muted">Order reference</p><p className="mono" style={{ fontSize: 22, color: 'var(--accent)', margin: 0 }}>{id}</p>{state?.order && <p className="muted">Total: {money(state.order.totalCents, state.order.currency)}</p>}<DemoBanner><strong>This was a demo order.</strong> No payment was taken. The team will see it in the admin dashboard and can follow up by email.</DemoBanner><div className="row" style={{ marginTop: 12 }}><Link to="/" className="btn btn--accent">Back home</Link><Link to="/music" className="btn btn--ghost">Listen to RANO</Link></div></div>
    </div></section>
  );
}
