import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';
import seed from '../../../content/seed.json';

// Netlify Blobs-backed store. Mirrors the SQLite layer's public API so the
// React front end can talk to the same /api contracts on Netlify.
const store = getStore({ name: 'rano-data', consistency: 'strong' });
export const uploadsStore = getStore({ name: 'rano-uploads', consistency: 'strong' });

const COLLECTIONS = ['releases', 'videos', 'gallery', 'news', 'events', 'products'];
const RECORDS = ['inquiries', 'subscribers', 'orders'];

export async function getJSON(key, fallback = null) {
  const v = await store.get(key, { type: 'json' });
  return v ?? fallback;
}
export async function setJSON(key, value) { await store.setJSON(key, value); }

// Creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD env vars.
// Safe to call repeatedly: only acts when no admin exists yet.
export async function ensureAdminFromEnv() {
  const email = process.env.ADMIN_EMAIL; const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const users = await getJSON('adminUsers', []);
  if (users.length) return;
  const { hashPassword } = await import('./auth.mjs');
  await setJSON('adminUsers', [{ id: 1, email: email.toLowerCase(), passwordHash: hashPassword(password), createdAt: new Date().toISOString() }]);
}

export async function ensureSeeded() {
  const done = await getJSON('meta:seeded', false);
  if (!done) {
    await setJSON('profile', seed.profile);
    for (const t of COLLECTIONS) {
      const items = (seed[t] || []).map((x, i) => ({ ...x, sort: x.sort ?? i }));
      await setJSON(`col:${t}`, items);
    }
    for (const r of RECORDS) await setJSON(`rec:${r}`, []);
    await setJSON('adminUsers', []);
    await setJSON('meta:seeded', true);
  }
  await ensureAdminFromEnv();
}

export async function getProfile() { return getJSON('profile', seed.profile); }
export async function setProfile(p) { await setJSON('profile', p); }

export async function allRows(table) {
  const key = COLLECTIONS.includes(table) ? `col:${table}` : `rec:${table}`;
  const rows = await getJSON(key, []);
  if (table === 'news') return [...rows].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  if (RECORDS.includes(table)) return [...rows].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return [...rows].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}
export async function getRow(table, id) { const rows = await allRows(table); return rows.find(r => r.id === id) || null; }
export async function upsertRow(table, obj) {
  const key = COLLECTIONS.includes(table) ? `col:${table}` : `rec:${table}`;
  const rows = await getJSON(key, []);
  const i = rows.findIndex(r => r.id === obj.id);
  const item = { ...(i >= 0 ? rows[i] : {}), ...obj };
  if (i >= 0) rows[i] = item; else rows.push(item);
  await setJSON(key, rows);
  return item;
}
export async function deleteRow(table, id) {
  const key = COLLECTIONS.includes(table) ? `col:${table}` : `rec:${table}`;
  const rows = await getJSON(key, []);
  await setJSON(key, rows.filter(r => r.id !== id));
}
export async function appendRecord(table, obj) {
  const key = `rec:${table}`; const rows = await getJSON(key, []); rows.push(obj); await setJSON(key, rows); return obj;
}
export async function publicContent() {
  const [profile, releases, videos, gallery, news, events, products] = await Promise.all([
    getProfile(), allRows('releases'), allRows('videos'), allRows('gallery'), allRows('news'), allRows('events'), allRows('products'),
  ]);
  return { profile, releases, videos, gallery, news, events, products: products.filter(p => p.active) };
}
export { COLLECTIONS, RECORDS };
