export function fmtDate(iso?: string | null, opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }) {
  if (!iso) return 'Date TBA';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', opts).format(d);
}
export function fmtDuration(ms?: number | null) {
  if (!ms || ms < 0) return '—';
  const s = Math.round(ms / 1000); const m = Math.floor(s / 60); const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}
export function fmtTime(sec: number) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60); const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
export function money(cents: number, currency = 'UGX') {
  try { return new Intl.NumberFormat('en-UG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / (currency === 'UGX' ? 1 : 100)); }
  catch { return `${currency} ${Math.round(cents).toLocaleString()}`; }
}
export function year(iso?: string | null) { return iso ? iso.slice(0, 4) : ''; }
export function isUpcoming(e: { date?: string | null; status: string }) {
  if (e.status === 'past' || e.status === 'cancelled') return false;
  if (!e.date) return e.status === 'upcoming';
  return new Date(e.date + 'T23:59:59').getTime() >= Date.now();
}
export function cx(...parts: (string | false | null | undefined)[]) { return parts.filter(Boolean).join(' '); }
export function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
