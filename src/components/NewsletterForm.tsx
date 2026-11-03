import { useState, type FormEvent } from 'react';
import { Check, AlertCircle, Send } from 'lucide-react';
import { api } from '../lib/api';
import { cx } from '../lib/format';

export default function NewsletterForm({ compact = false, source = 'website' }: { compact?: boolean; source?: string }) {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setState('err'); setMsg('Please enter a valid email address.'); return; }
    setState('loading');
    try { const r = await api.newsletter(email, source, website); setState('ok'); setMsg(r.message); setEmail(''); }
    catch (err) { setState('err'); setMsg(err instanceof Error ? err.message : 'Subscription failed. Try again.'); }
  };
  return (
    <form onSubmit={submit} noValidate aria-label="Newsletter signup">
      <div className={compact ? 'newsletter__form' : 'newsletter__form'} style={compact ? { flexDirection: 'column' } : undefined}>
        <label className="sr-only" htmlFor={`nl-${source}-${compact}`}>Email address</label>
        <input id={`nl-${source}-${compact}`} type="email" inputMode="email" autoComplete="email" placeholder="your@email.com" value={email} onChange={e => { setEmail(e.target.value); if (state !== 'idle') setState('idle'); }} aria-invalid={state === 'err'} required />
        <div className="hp" aria-hidden="true"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} /></label></div>
        <button className="btn btn--accent" type="submit" disabled={state === 'loading'}>{state === 'loading' ? 'Joining…' : <><Send size={14} /> Join the list</>}</button>
      </div>
      <div aria-live="polite" style={{ marginTop: 12 }}>
        {state === 'ok' && <div className={cx('form-msg', 'form-msg--ok')}><Check size={16} />{msg}</div>}
        {state === 'err' && <div className={cx('form-msg', 'form-msg--err')}><AlertCircle size={16} />{msg}</div>}
      </div>
    </form>
  );
}
