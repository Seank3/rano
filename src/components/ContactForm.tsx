import { useState, type FormEvent } from 'react';
import { Check, AlertCircle, Send } from 'lucide-react';
import { api } from '../lib/api';

const CATS = [
  { v: 'booking', l: 'Booking & performances' }, { v: 'business', l: 'Business inquiries' },
  { v: 'press', l: 'Press & media' }, { v: 'collaboration', l: 'Collaborations' }, { v: 'general', l: 'General message' },
];
export default function ContactForm({ defaultCategory = 'general' }: { defaultCategory?: string }) {
  const [f, setF] = useState({ name: '', email: '', category: defaultCategory, subject: '', message: '', website: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');
  const set = (k: string, v: string) => { setF(s => ({ ...s, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };
  const validate = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) e.email = 'Please enter a valid email address.';
    if (!CATS.some(c => c.v === f.category)) e.category = 'Choose a category.';
    if (f.subject.trim().length < 3) e.subject = 'Please add a subject.';
    if (f.message.trim().length < 10) e.message = 'Message must be at least 10 characters.';
    setErrors(e); return Object.keys(e).length === 0;
  };
  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setState('loading');
    try { const r = await api.contact(f); setState('ok'); setMsg(r.message); setF({ name: '', email: '', category: defaultCategory, subject: '', message: '', website: '' }); }
    catch (err) { setState('err'); setMsg(err instanceof Error ? err.message : 'Could not send. Please try again.'); }
  };
  return (
    <form className="form" onSubmit={submit} noValidate aria-label="Contact form">
      <div className="form-row">
        <div className="field"><label htmlFor="c-name">Name</label><input id="c-name" value={f.name} onChange={e => set('name', e.target.value)} autoComplete="name" aria-invalid={!!errors.name} required />{errors.name && <span className="err">{errors.name}</span>}</div>
        <div className="field"><label htmlFor="c-email">Email</label><input id="c-email" type="email" value={f.email} onChange={e => set('email', e.target.value)} autoComplete="email" aria-invalid={!!errors.email} required />{errors.email && <span className="err">{errors.email}</span>}</div>
      </div>
      <div className="form-row">
        <div className="field"><label htmlFor="c-cat">Inquiry type</label><select id="c-cat" value={f.category} onChange={e => set('category', e.target.value)} aria-invalid={!!errors.category}>{CATS.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}</select>{errors.category && <span className="err">{errors.category}</span>}</div>
        <div className="field"><label htmlFor="c-subject">Subject</label><input id="c-subject" value={f.subject} onChange={e => set('subject', e.target.value)} aria-invalid={!!errors.subject} required />{errors.subject && <span className="err">{errors.subject}</span>}</div>
      </div>
      <div className="field"><label htmlFor="c-message">Message</label><textarea id="c-message" value={f.message} onChange={e => set('message', e.target.value)} aria-invalid={!!errors.message} required placeholder="Tell us about the event, project or inquiry…" />{errors.message && <span className="err">{errors.message}</span>}<span className="hint">For bookings, include date, city, venue and expected audience.</span></div>
      <div className="hp" aria-hidden="true"><label>Leave empty<input name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={e => setF(s => ({ ...s, website: e.target.value }))} /></label></div>
      <div aria-live="polite">
        {state === 'ok' && <div className="form-msg form-msg--ok"><Check size={16} />{msg}</div>}
        {state === 'err' && <div className="form-msg form-msg--err"><AlertCircle size={16} />{msg}</div>}
      </div>
      <div><button className="btn btn--accent" type="submit" disabled={state === 'loading'}>{state === 'loading' ? 'Sending…' : <><Send size={14} /> Send message</>}</button></div>
    </form>
  );
}
