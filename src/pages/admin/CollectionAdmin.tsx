import { useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, X, Upload, Save, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useAdmin } from './AdminApp';
import { slugify } from '../../lib/format';

type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'image' | 'list' | 'json' | 'checkbox' | 'url';
interface Field { key: string; label: string; type: FieldType; options?: string[]; hint?: string; required?: boolean; }
const SCHEMAS: Record<string, { title: string; singular: string; fields: Field[]; defaults: any }> = {
  releases: { title: 'Music releases', singular: 'Release', defaults: { type: 'single', artist: 'Ugakid RANO', tracks: [], credits: [], featured: false }, fields: [
    { key: 'title', label: 'Title', type: 'text', required: true }, { key: 'slug', label: 'Slug (URL)', type: 'text', hint: 'Lowercase, hyphens. Auto-generated from title if left blank on create.' },
    { key: 'artist', label: 'Artist credit', type: 'text', required: true }, { key: 'type', label: 'Type', type: 'select', options: ['single', 'album', 'ep', 'feature'] },
    { key: 'date', label: 'Release date', type: 'date' }, { key: 'genre', label: 'Genre', type: 'text' },
    { key: 'artwork', label: 'Cover artwork', type: 'image' }, { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'appleUrl', label: 'Apple Music URL', type: 'url' }, { key: 'spotifyUrl', label: 'Spotify URL', type: 'url' }, { key: 'youtubeUrl', label: 'YouTube URL', type: 'url' }, { key: 'audiomackUrl', label: 'Audiomack URL', type: 'url' },
    { key: 'previewUrl', label: 'Audio preview URL (30s, authorised)', type: 'url' }, { key: 'durationMs', label: 'Duration (ms)', type: 'number' },
    { key: 'credits', label: 'Credits (one per line)', type: 'list' }, { key: 'tracks', label: 'Tracks (JSON array)', type: 'json', hint: '[{"n":1,"title":"…","durationMs":180000,"previewUrl":"…"}]' },
    { key: 'featured', label: 'Featured on homepage', type: 'checkbox' } ] },
  videos: { title: 'Videos', singular: 'Video', defaults: { category: 'Music Video', featured: false }, fields: [
    { key: 'title', label: 'Title', type: 'text', required: true }, { key: 'youtubeId', label: 'YouTube video ID', type: 'text', required: true, hint: 'e.g. EiHolcPDLG4 (from watch?v=…)' },
    { key: 'date', label: 'Release date', type: 'date' }, { key: 'category', label: 'Category', type: 'select', options: ['Music Video', 'Lyrics Video', 'Visualizer', 'Audio', 'Event Recap', 'Live'] },
    { key: 'thumbnail', label: 'Thumbnail', type: 'image' }, { key: 'description', label: 'Description', type: 'textarea' }, { key: 'featured', label: 'Featured', type: 'checkbox' } ] },
  gallery: { title: 'Gallery', singular: 'Image', defaults: { category: 'Photography' }, fields: [
    { key: 'src', label: 'Image', type: 'image', required: true }, { key: 'alt', label: 'Alt text (accessibility)', type: 'text' }, { key: 'caption', label: 'Caption', type: 'text' },
    { key: 'category', label: 'Category', type: 'select', options: ['Photography', 'Video Stills', 'Events', 'Artwork', 'Studio', 'Live', 'Behind the Scenes'] },
    { key: 'width', label: 'Width (px)', type: 'number' }, { key: 'height', label: 'Height (px)', type: 'number' } ] },
  news: { title: 'News', singular: 'Article', defaults: { tags: [], body: [] }, fields: [
    { key: 'title', label: 'Title', type: 'text', required: true }, { key: 'slug', label: 'Slug (URL)', type: 'text', hint: 'Auto-generated from title if blank.' }, { key: 'date', label: 'Publication date', type: 'date' },
    { key: 'image', label: 'Featured image', type: 'image' }, { key: 'tags', label: 'Tags (one per line)', type: 'list' }, { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
    { key: 'body', label: 'Body paragraphs (one per line)', type: 'list' } ] },
  events: { title: 'Events', singular: 'Event', defaults: { status: 'upcoming' }, fields: [
    { key: 'title', label: 'Event title', type: 'text', required: true }, { key: 'date', label: 'Date (leave blank if not confirmed)', type: 'date' }, { key: 'time', label: 'Time', type: 'text' },
    { key: 'venue', label: 'Venue', type: 'text' }, { key: 'city', label: 'City', type: 'text' }, { key: 'country', label: 'Country', type: 'text' },
    { key: 'poster', label: 'Event poster', type: 'image' }, { key: 'ticketPrice', label: 'Ticket price (display)', type: 'text' }, { key: 'ticketUrl', label: 'Ticket URL (official)', type: 'url' },
    { key: 'status', label: 'Status', type: 'select', options: ['upcoming', 'past', 'cancelled'] }, { key: 'recapVideoId', label: 'Recap YouTube ID (past events)', type: 'text' }, { key: 'description', label: 'Description', type: 'textarea' } ] },
  products: { title: 'Merch', singular: 'Product', defaults: { currency: 'UGX', priceCents: 0, images: [], sizes: [], colors: [], inventory: 0, active: true }, fields: [
    { key: 'name', label: 'Product name', type: 'text', required: true }, { key: 'slug', label: 'Slug (URL)', type: 'text', hint: 'Auto-generated from name if blank.' }, { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'priceCents', label: 'Price (UGX whole units, e.g. 80000)', type: 'number', required: true }, { key: 'currency', label: 'Currency', type: 'select', options: ['UGX', 'USD', 'KES', 'EUR', 'GBP'] },
    { key: 'images', label: 'Product images (one URL per line; upload below)', type: 'list' }, { key: 'sizes', label: 'Sizes (one per line)', type: 'list' }, { key: 'colors', label: 'Colors (one per line)', type: 'list' },
    { key: 'inventory', label: 'Inventory', type: 'number' }, { key: 'active', label: 'Visible in store', type: 'checkbox' } ] },
};
function listColsFor(table: string) {
  return (item: any) => {
    switch (table) {
      case 'releases': return { img: item.artwork, title: item.title, sub: `${item.artist} · ${item.type} · ${item.date || ''}` };
      case 'videos': return { img: item.thumbnail, title: item.title, sub: `${item.category || ''} · ${item.youtubeId}` };
      case 'gallery': return { img: item.src, title: item.caption || item.alt || item.src, sub: item.category || '' };
      case 'news': return { img: item.image, title: item.title, sub: `${item.date || ''} · ${(item.tags || []).join(', ')}` };
      case 'events': return { img: item.poster, title: item.title, sub: `${item.status} · ${item.date || 'date TBA'} · ${item.city || ''}` };
      case 'products': return { img: item.images?.[0], title: item.name, sub: `${item.currency} ${item.priceCents} · ${item.active ? 'active' : 'hidden'}` };
      default: return { title: item.title || item.name || item.id, sub: '' };
    }
  };
}
export default function CollectionAdmin() {
  const { collection = 'releases' } = useParams();
  const { data, refresh, toast } = useAdmin();
  const schema = SCHEMAS[collection];
  const [editing, setEditing] = useState<any | null>(null);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const items = (data as any)[collection] || [];
  const cols = useMemo(() => listColsFor(collection), [collection]);
  if (!schema) return <p>Unknown collection.</p>;
  const startNew = () => { setErr(''); setEditing({ ...schema.defaults, id: '' }); };
  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const obj = { ...editing };
      if (!obj.slug && (obj.title || obj.name)) obj.slug = slugify(obj.title || obj.name);
      if (!obj.id) delete obj.id;
      if (editing.id) await api.admin.update(collection, editing.id, obj); else await api.admin.create(collection, obj);
      await refresh(); toast(`${schema.singular} saved`); setEditing(null);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Save failed'); } finally { setBusy(false); }
  };
  const remove = async (item: any) => {
    if (!confirm(`Delete "${item.title || item.name || item.caption || item.id}"? This cannot be undone.`)) return;
    try { await api.admin.remove(collection, item.id); await refresh(); toast('Deleted'); } catch (e) { toast(e instanceof Error ? e.message : 'Delete failed', true); }
  };
  const set = (k: string, v: any) => setEditing((s: any) => ({ ...s, [k]: v }));
  return (<>
    <div className="admin__head"><h1>{schema.title} <span className="muted" style={{ fontSize: 16 }}>({items.length})</span></h1><button className="btn btn--accent btn--sm" onClick={startNew}><Plus size={14} /> Add {schema.singular.toLowerCase()}</button></div>
    {editing && <form className="admin-panel admin-form" onSubmit={save}>
      <div className="spread"><h2 className="display h4">{editing.id ? 'Edit' : 'New'} {schema.singular.toLowerCase()}</h2><button type="button" className="icon-btn" onClick={() => setEditing(null)} aria-label="Close editor"><X size={16} /></button></div>
      <div className="form-row">{schema.fields.map(f => <FieldInput key={f.key} field={f} value={editing[f.key]} onChange={v => set(f.key, v)} collection={collection} />)}</div>
      {err && <div className="form-msg form-msg--err"><AlertCircle size={16} />{err}</div>}
      <div className="row"><button className="btn btn--accent" disabled={busy}><Save size={14} />{busy ? 'Saving…' : 'Save'}</button><button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>Cancel</button></div>
    </form>}
    <div className="table-wrap"><table className="admin-table"><thead><tr><th></th><th>Title</th><th>Details</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead><tbody>
      {items.map((item: any) => { const c = cols(item); return <tr key={item.id}><td>{c.img ? <img src={c.img} alt="" /> : <div style={{ width: 44, height: 44, background: 'var(--surface2)' }} />}</td><td><strong>{c.title}</strong></td><td className="muted">{c.sub}</td><td style={{ textAlign: 'right' }}><div className="row" style={{ justifyContent: 'flex-end' }}><button className="icon-btn" onClick={() => { setErr(''); setEditing({ ...item }); }} aria-label="Edit"><Pencil size={14} /></button><button className="icon-btn" onClick={() => remove(item)} aria-label="Delete"><Trash2 size={14} /></button></div></td></tr>; })}
      {!items.length && <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 32 }}>Nothing here yet. Add your first {schema.singular.toLowerCase()}.</td></tr>}
    </tbody></table></div>
  </>);
}
function FieldInput({ field, value, onChange, collection }: { field: Field; value: any; onChange: (v: any) => void; collection: string }) {
  const id = `f-${collection}-${field.key}`;
  const [uploading, setUploading] = useState(false);
  const [jsonErr, setJsonErr] = useState('');
  const upload = async (file: File, append = false) => {
    setUploading(true);
    try { const r = await api.admin.upload(file); if (append) onChange([...(value || []), r.url]); else onChange(r.url); }
    catch (e) { alert(e instanceof Error ? e.message : 'Upload failed'); } finally { setUploading(false); }
  };
  const wrap = (children: React.ReactNode) => <div className="field" style={field.type === 'textarea' || field.type === 'list' || field.type === 'json' ? { gridColumn: '1 / -1' } : undefined}><label htmlFor={id}>{field.label}{field.required ? ' *' : ''}</label>{children}{field.hint && <span className="hint">{field.hint}</span>}</div>;
  switch (field.type) {
    case 'textarea': return wrap(<textarea id={id} value={value || ''} onChange={e => onChange(e.target.value)} rows={3} />);
    case 'list': return wrap(<><textarea id={id} value={(value || []).join('\n')} onChange={e => onChange(e.target.value.split('\n').map((s: string) => s.trim()).filter(Boolean))} rows={4} placeholder="One item per line" />{field.key === 'images' && <label className="btn btn--ghost btn--sm" style={{ cursor: 'pointer', marginTop: 8, width: 'fit-content' }}><Upload size={14} />{uploading ? 'Uploading…' : 'Upload image'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={e => { const f = e.target.files?.[0]; if (f) upload(f, true); }} /></label>}</>);
    case 'json': return wrap(<><textarea id={id} defaultValue={JSON.stringify(value || [], null, 2)} onChange={e => { try { onChange(JSON.parse(e.target.value)); setJsonErr(''); } catch { setJsonErr('Invalid JSON — fix before saving'); } }} rows={5} style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />{jsonErr && <span className="err">{jsonErr}</span>}</>);
    case 'number': return wrap(<input id={id} type="number" value={value ?? ''} onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))} />);
    case 'date': return wrap(<input id={id} type="date" value={value || ''} onChange={e => onChange(e.target.value || null)} />);
    case 'select': return wrap(<select id={id} value={value || field.options?.[0]} onChange={e => onChange(e.target.value)}>{field.options?.map(o => <option key={o} value={o}>{o}</option>)}</select>);
    case 'checkbox': return wrap(<label style={{ display: 'flex', gap: 10, alignItems: 'center', textTransform: 'none', letterSpacing: 0, fontSize: 14, color: 'var(--text)' }}><input id={id} type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} style={{ width: 18, height: 18, minHeight: 0 }} /> Enabled</label>);
    case 'image': return wrap(<div className="upload">{value && <img src={value} alt="" />}<input id={id} type="url" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="/images/… or https://…" style={{ flex: 1, minWidth: 200 }} /><label className="btn btn--ghost btn--sm" style={{ cursor: 'pointer' }}><Upload size={14} />{uploading ? 'Uploading…' : 'Upload'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={e => { const f = e.target.files?.[0]; if (f) upload(f, collection === 'products' && field.key === 'images'); }} /></label></div>);
    default: return wrap(<input id={id} type={field.type === 'url' ? 'url' : 'text'} value={value || ''} onChange={e => onChange(e.target.value)} required={field.required} />);
  }
}
