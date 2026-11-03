import { useState, type FormEvent } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
export default function AdminLogin({ onSuccess }: { onSuccess: (u: { id: number; email: string }) => void }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'err'>('idle'); const [err, setErr] = useState('');
  const submit = async (e: FormEvent) => { e.preventDefault(); setState('loading'); try { const r = await api.admin.login(email, password); onSuccess(r.user); } catch (e) { setState('err'); setErr(e instanceof Error ? e.message : 'Login failed'); } };
  return (
    <div className="admin admin-login"><div className="admin-login__box">
      <div className="wordmark" style={{ fontSize: 34, marginBottom: 8 }}>RANO<span>⚡</span></div>
      <p className="mono muted" style={{ marginBottom: 28 }}>Admin dashboard · authorised access only</p>
      <form className="form" onSubmit={submit}>
        <div className="field"><label htmlFor="a-email">Email</label><input id="a-email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required /></div>
        <div className="field"><label htmlFor="a-pass">Password</label><input id="a-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></div>
        {state === 'err' && <div className="form-msg form-msg--err"><AlertCircle size={16} />{err}</div>}
        <button className="btn btn--accent" disabled={state === 'loading'}><Lock size={14} />{state === 'loading' ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="muted" style={{ fontSize: 13, marginTop: 24 }}>Credentials are created on first server seed and stored privately on the server (ADMIN_CREDENTIALS.txt). They are never exposed in frontend code.</p>
    </div></div>
  );
}
