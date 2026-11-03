import { useState, type FormEvent } from 'react';
import { KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useAdmin } from './AdminApp';
export default function SettingsAdmin() {
  const { user, toast } = useAdmin();
  const [cur, setCur] = useState(''); const [next, setNext] = useState(''); const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr('');
    if (next.length < 10) { setErr('New password must be at least 10 characters.'); return; }
    if (next !== confirm) { setErr('Passwords do not match.'); return; }
    setBusy(true); try { await api.admin.changePassword(cur, next); toast('Password changed'); setCur(''); setNext(''); setConfirm(''); } catch (e) { setErr(e instanceof Error ? e.message : 'Failed'); } finally { setBusy(false); }
  };
  return (<>
    <div className="admin__head"><h1>Settings</h1></div>
    <div className="two-col">
      <form className="admin-panel admin-form" onSubmit={submit}><p className="eyebrow"><KeyRound size={12} /> Change password</p>
        <div className="field"><label>Current password</label><input type="password" value={cur} onChange={e => setCur(e.target.value)} autoComplete="current-password" required /></div>
        <div className="field"><label>New password (min 10 chars)</label><input type="password" value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" required /></div>
        <div className="field"><label>Confirm new password</label><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" required /></div>
        {err && <div className="form-msg form-msg--err"><AlertCircle size={16} />{err}</div>}
        <button className="btn btn--accent" disabled={busy}>Update password</button>
      </form>
      <div className="admin-panel"><p className="eyebrow"><ShieldCheck size={12} /> Security & configuration</p>
        <ul className="muted" style={{ paddingLeft: 18, lineHeight: 1.9, fontSize: 14 }}>
          <li>Signed in as <strong style={{ color: 'var(--text)' }}>{user.email}</strong>. Sessions expire after 12 hours.</li>
          <li>Passwords are hashed with scrypt; session cookies are HTTP-only and same-site.</li>
          <li>Admin routes and uploads are protected server-side; credentials never appear in frontend code.</li>
          <li><strong style={{ color: 'var(--text)' }}>Email delivery:</strong> submissions are stored in the database. Connect an SMTP/Resend provider in <code>server/mailer.js</code> to also send notifications.</li>
          <li><strong style={{ color: 'var(--text)' }}>Payments:</strong> checkout is in demo mode. Add Stripe keys server-side and implement webhook fulfilment to accept real payments.</li>
          <li><strong style={{ color: 'var(--text)' }}>Deployment:</strong> set <code>SITE_URL</code>, <code>SESSION_SECRET</code> and <code>NODE_ENV=production</code>; run <code>npm run build</code> then <code>npm start</code>.</li>
        </ul>
      </div>
    </div>
  </>);
}
