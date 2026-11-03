import { useState, type FormEvent } from 'react';
import { Save, Plus, Trash2, Upload, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useAdmin } from './AdminApp';
import type { Profile } from '../../lib/types';

export default function ProfileAdmin() {
  const { data, refresh, toast } = useAdmin();
  const [p, setP] = useState<Profile>(JSON.parse(JSON.stringify(data.profile)));
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const set = (k: keyof Profile, v: any) => setP(s => ({ ...s, [k]: v }));
  const upload = async (file: File, key: 'portrait' | 'heroImage') => { try { const r = await api.admin.upload(file); set(key, r.url); toast('Image uploaded'); } catch (e) { toast(e instanceof Error ? e.message : 'Upload failed', true); } };
  const save = async (e: FormEvent) => { e.preventDefault(); setBusy(true); setErr(''); try { await api.admin.saveProfile(p); await refresh(); toast('Profile saved'); } catch (e) { setErr(e instanceof Error ? e.message : 'Save failed'); } finally { setBusy(false); } };
  const socialEdit = (i: number, k: string, v: string) => { const s = [...p.socials]; s[i] = { ...s[i], [k]: v }; set('socials', s); };
  return (<>
    <div className="admin__head"><h1>Artist profile</h1></div>
    <form className="admin-form" onSubmit={save}>
      <div className="admin-panel"><p className="eyebrow">Identity</p><div className="form-row">
        <div className="field"><label>Artist name</label><input value={p.name} onChange={e => set('name', e.target.value)} required /></div>
        <div className="field"><label>Short name / wordmark</label><input value={p.shortName} onChange={e => set('shortName', e.target.value)} /></div>
        <div className="field"><label>Tagline</label><input value={p.tagline} onChange={e => set('tagline', e.target.value)} /></div>
        <div className="field"><label>Location</label><input value={p.location} onChange={e => set('location', e.target.value)} /></div>
        <div className="field"><label>Genre line</label><input value={p.genre} onChange={e => set('genre', e.target.value)} /></div>
      </div></div>
      <div className="admin-panel"><p className="eyebrow">Imagery</p><div className="form-row">
        {(['portrait', 'heroImage'] as const).map(k => <div className="field" key={k}><label>{k === 'portrait' ? 'Portrait / about image' : 'Hero background'}</label><div className="upload">{p[k] && <img src={p[k]} alt="" />}<input value={p[k] || ''} onChange={e => set(k, e.target.value)} style={{ flex: 1, minWidth: 180 }} /><label className="btn btn--ghost btn--sm" style={{ cursor: 'pointer' }}><Upload size={14} />Upload<input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) upload(f, k); }} /></label></div><span className="hint">Upload the artist's own photography here to replace temporary official artwork/stills.</span></div>)}
      </div></div>
      <div className="admin-panel"><p className="eyebrow">Biography (one paragraph per line)</p><div className="field"><textarea rows={10} value={p.bio.join('\n')} onChange={e => set('bio', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))} /></div></div>
      <div className="admin-panel"><p className="eyebrow">Contact emails (leave blank until confirmed)</p><div className="form-row">
        <div className="field"><label>Booking email</label><input type="email" value={p.bookingEmail || ''} onChange={e => set('bookingEmail', e.target.value || null)} /></div>
        <div className="field"><label>Press email</label><input type="email" value={p.pressEmail || ''} onChange={e => set('pressEmail', e.target.value || null)} /></div>
        <div className="field"><label>General email</label><input type="email" value={p.contactEmail || ''} onChange={e => set('contactEmail', e.target.value || null)} /></div>
      </div></div>
      <div className="admin-panel"><div className="spread"><p className="eyebrow" style={{ margin: 0 }}>Social profiles (verified links only)</p><button type="button" className="btn btn--ghost btn--sm" onClick={() => set('socials', [...p.socials, { platform: 'Instagram', url: '', handle: '' }])}><Plus size={14} />Add</button></div>
        {p.socials.map((s, i) => <div key={i} className="form-row" style={{ marginTop: 12, gridTemplateColumns: '1fr 2fr 1fr auto' }}><input value={s.platform} onChange={e => socialEdit(i, 'platform', e.target.value)} placeholder="Platform" /><input value={s.url} onChange={e => socialEdit(i, 'url', e.target.value)} placeholder="https://…" /><input value={s.handle || ''} onChange={e => socialEdit(i, 'handle', e.target.value)} placeholder="@handle" /><button type="button" className="icon-btn" onClick={() => set('socials', p.socials.filter((_, j) => j !== i))} aria-label="Remove"><Trash2 size={14} /></button></div>)}
        <p className="hint" style={{ marginTop: 12 }}>Only add links you have verified belong to the artist. Unverified handles are intentionally left out.</p>
      </div>
      <div className="admin-panel"><p className="eyebrow">Streaming profiles</p>{p.streaming.map((s, i) => <div key={i} className="form-row" style={{ marginTop: 12, gridTemplateColumns: '1fr 3fr' }}><input value={s.platform} onChange={e => { const st = [...p.streaming]; st[i] = { ...st[i], platform: e.target.value }; set('streaming', st); }} /><input value={s.url} onChange={e => { const st = [...p.streaming]; st[i] = { ...st[i], url: e.target.value }; set('streaming', st); }} /></div>)}</div>
      <div className="admin-panel"><p className="eyebrow">SEO</p><div className="field"><label>Site title</label><input value={p.seo.title} onChange={e => set('seo', { ...p.seo, title: e.target.value })} /></div><div className="field" style={{ marginTop: 12 }}><label>Meta description</label><textarea rows={2} value={p.seo.description} onChange={e => set('seo', { ...p.seo, description: e.target.value })} /></div></div>
      {err && <div className="form-msg form-msg--err"><AlertCircle size={16} />{err}</div>}
      <div><button className="btn btn--accent" disabled={busy}><Save size={14} />{busy ? 'Saving…' : 'Save profile'}</button></div>
    </form>
  </>);
}
