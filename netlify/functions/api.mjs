import crypto from 'node:crypto';
import { parse as parseCookie, serialize as serializeCookie } from 'cookie';
import { ensureSeeded, getProfile, setProfile, allRows, getRow, upsertRow, deleteRow, appendRecord, publicContent, COLLECTIONS, getJSON, setJSON } from './lib/store.mjs';
import { hashPassword, verifyPassword, createSession, getSessionUser, destroySession, rateLimit } from './lib/auth.mjs';

const COOKIE = 'rano_admin';
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
const cleanStr = (v, max = 2000) => String(v ?? '').trim().slice(0, max);
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function routePath(req) {
  const u = new URL(req.url); let p = u.pathname;
  // Netlify rewrites /sitemap.xml and /robots.txt to this function but the
  // request keeps its original path, so map those explicitly.
  if (p === '/sitemap.xml') return '/api/sitemap.xml';
  if (p === '/robots.txt') return '/api/robots.txt';
  p = p.replace(/^\/\.netlify\/functions\/api/, '/api');
  const i = p.indexOf('/api/'); if (i >= 0) p = p.slice(i);
  return p;
}
function cookies(req) { return parseCookie(req.headers.get('cookie') || ''); }
function cookieOpts(req) {
  const secure = (req.headers.get('x-forwarded-proto') || new URL(req.url).protocol.replace(':', '')) === 'https';
  return { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 60 * 60 * 12 };
}
async function currentUser(req) { return getSessionUser(cookies(req)[COOKIE]); }
function sameOriginOk(req) {
  const origin = req.headers.get('origin'); if (!origin) return true;
  let o; try { o = new URL(origin); } catch { return false; }
  // Behind Netlify's proxy the Host header may differ from the browser origin
  // (e.g. localhost vs 127.0.0.1 in local dev). Accept any of the forwarded
  // hosts and treat loopback aliases as equivalent.
  const norm = h => String(h || '').trim().toLowerCase().replace(/^127\.0\.0\.1(?=[:/]|$)/, 'localhost').replace(/^\[::1\](?=[:/]|$)/, 'localhost');
  const candidates = [req.headers.get('host'), req.headers.get('x-forwarded-host'), new URL(req.url).host]
    .filter(Boolean).flatMap(h => String(h).split(',')).map(norm);
  return candidates.includes(norm(o.host));
}
async function body(req) { try { return await req.json(); } catch { return {}; } }
function clientIp(req) { return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'; }
function spamOk(req, b) { if (cleanStr(b.website)) return false; return rateLimit(`form:${clientIp(req)}`, 8, 60_000); }

const required = { releases: ['slug', 'title', 'artist'], videos: ['title', 'youtubeId'], gallery: ['src'], news: ['slug', 'title'], events: ['title'], products: ['slug', 'name'] };
function validate(table, obj) {
  for (const f of required[table] || []) if (!cleanStr(obj[f], 200)) return `Field "${f}" is required.`;
  if (table === 'products' && (!Number.isFinite(Number(obj.priceCents)) || Number(obj.priceCents) < 0)) return 'Price must be a positive number.';
  if (table === 'videos' && obj.youtubeId && !/^[A-Za-z0-9_-]{6,20}$/.test(obj.youtubeId)) return 'Invalid YouTube video ID.';
  if (obj.slug && !/^[a-z0-9-]+$/.test(obj.slug)) return 'Slug must be lowercase letters, numbers and hyphens.';
  return null;
}

export default async function handler(req) {
  await ensureSeeded();
  const path = routePath(req); const method = req.method.toUpperCase();
  const url = new URL(req.url);
  const site = (process.env.SITE_URL || `${url.protocol}//${req.headers.get('host') || url.host}`).replace(/\/$/, '');

  // SEO endpoints (redirected from /sitemap.xml and /robots.txt)
  if (path === '/api/sitemap.xml') {
    const c = await publicContent();
    const urls = ['/', '/about', '/music', '/videos', '/events', '/gallery', '/news', '/contact', '/store', ...c.releases.map(r => `/music/${r.slug}`), ...c.news.map(n => `/news/${n.slug}`)];
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${esc(site + u)}</loc></url>`).join('')}</urlset>`, { headers: { 'content-type': 'application/xml' } });
  }
  if (path === '/api/robots.txt') return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\nSitemap: ${site}/sitemap.xml\n`, { headers: { 'content-type': 'text/plain' } });

  if (path === '/api/health') return json({ ok: true, ts: Date.now(), runtime: 'netlify' });
  if (path === '/api/content' && method === 'GET') return json(await publicContent());

  // Public forms
  if (path === '/api/newsletter' && method === 'POST') {
    const b = await body(req); if (!spamOk(req, b)) return json({ error: 'Please wait a moment and try again.' }, 400);
    const email = cleanStr(b.email, 254).toLowerCase();
    if (!emailRe.test(email)) return json({ error: 'Please enter a valid email address.' }, 422);
    const subs = await allRows('subscribers'); const existing = subs.find(s => s.email === email);
    if (!existing) await appendRecord('subscribers', { id: crypto.randomUUID(), email, createdAt: new Date().toISOString(), status: 'active', source: cleanStr(b.source, 60) || 'website' });
    return json({ ok: true, message: existing ? 'You are already on the list. Thank you!' : 'You are on the list. Welcome to the movement.' });
  }
  if (path === '/api/contact' && method === 'POST') {
    const b = await body(req); if (!spamOk(req, b)) return json({ error: 'Please wait a moment and try again.' }, 400);
    const name = cleanStr(b.name, 120), email = cleanStr(b.email, 254).toLowerCase(), category = cleanStr(b.category, 60), subject = cleanStr(b.subject, 160), message = cleanStr(b.message, 4000);
    const cats = ['booking', 'business', 'press', 'collaboration', 'general'];
    if (name.length < 2) return json({ error: 'Please enter your name.' }, 422);
    if (!emailRe.test(email)) return json({ error: 'Please enter a valid email address.' }, 422);
    if (!cats.includes(category)) return json({ error: 'Please choose an inquiry category.' }, 422);
    if (subject.length < 3) return json({ error: 'Please add a subject.' }, 422);
    if (message.length < 10) return json({ error: 'Message must be at least 10 characters.' }, 422);
    await appendRecord('inquiries', { id: crypto.randomUUID(), createdAt: new Date().toISOString(), name, email, category, subject, message, status: 'new', ip: clientIp(req) });
    return json({ ok: true, message: 'Message received. The team will get back to you as soon as possible.' });
  }
  if (path === '/api/orders' && method === 'POST') {
    const b = await body(req); if (!spamOk(req, b)) return json({ error: 'Please wait and try again.' }, 400);
    const items = Array.isArray(b.items) ? b.items.slice(0, 30) : [];
    if (!items.length) return json({ error: 'Your cart is empty.' }, 422);
    const customer = { name: cleanStr(b.customer?.name, 120), email: cleanStr(b.customer?.email, 254).toLowerCase(), phone: cleanStr(b.customer?.phone, 40), address: cleanStr(b.customer?.address, 400) };
    if (customer.name.length < 2 || !emailRe.test(customer.email)) return json({ error: 'Please provide a valid name and email.' }, 422);
    let total = 0; const lineItems = [];
    for (const it of items) {
      const p = await getRow('products', cleanStr(it.productId, 80)); const qty = Math.max(1, Math.min(20, Number(it.qty) || 1));
      if (!p || !p.active) return json({ error: 'A product in your cart is no longer available.' }, 422);
      total += p.priceCents * qty; lineItems.push({ productId: p.id, name: p.name, priceCents: p.priceCents, qty, size: cleanStr(it.size, 20), color: cleanStr(it.color, 30) });
    }
    const id = 'RANO-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    await appendRecord('orders', { id, createdAt: new Date().toISOString(), customer, items: lineItems, totalCents: total, currency: 'UGX', status: 'demo_pending', demo: true });
    return json({ ok: true, orderId: id, demo: true, totalCents: total, currency: 'UGX', message: 'Demo order recorded. No payment was taken.' });
  }

  // Admin auth
  if (path === '/api/admin/login' && method === 'POST') {
    if (!sameOriginOk(req)) return json({ error: 'Cross-origin request blocked.' }, 403);
    if (!rateLimit(`login:${clientIp(req)}`, 8, 600_000)) return json({ error: 'Too many attempts. Try again later.' }, 429);
    const b = await body(req); const email = cleanStr(b.email, 254).toLowerCase(); const password = String(b.password ?? '');
    const users = await getJSON('adminUsers', []);
    if (!users.length) return json({ error: 'Admin is not configured yet. Set ADMIN_EMAIL and ADMIN_PASSWORD in the Netlify environment, then redeploy.' }, 503);
    const user = users.find(u => u.email === email);
    if (!user || !verifyPassword(password, user.passwordHash)) return json({ error: 'Invalid email or password.' }, 401);
    const token = await createSession(user.id);
    return json({ ok: true, user: { id: user.id, email: user.email } }, 200, { 'set-cookie': serializeCookie(COOKIE, token, cookieOpts(req)) });
  }
  if (path === '/api/admin/logout' && method === 'POST') {
    const u = await currentUser(req); if (!u) return json({ error: 'Authentication required.' }, 401);
    await destroySession(cookies(req)[COOKIE]);
    return json({ ok: true }, 200, { 'set-cookie': serializeCookie(COOKIE, '', { path: '/', maxAge: 0 }) });
  }
  if (path === '/api/admin/me' && method === 'GET') {
    const u = await currentUser(req); if (!u) return json({ error: 'Not authenticated' }, 401);
    return json({ user: { id: u.id, email: u.email, createdAt: u.createdAt } });
  }
  if (path === '/api/admin/change-password' && method === 'POST') {
    const u = await currentUser(req); if (!u) return json({ error: 'Authentication required.' }, 401);
    if (!sameOriginOk(req)) return json({ error: 'Cross-origin request blocked.' }, 403);
    const b = await body(req); const users = await getJSON('adminUsers', []); const me = users.find(x => x.id === u.id);
    if (!verifyPassword(String(b.currentPassword ?? ''), me.passwordHash)) return json({ error: 'Current password is incorrect.' }, 403);
    const next = String(b.newPassword ?? ''); if (next.length < 10) return json({ error: 'New password must be at least 10 characters.' }, 422);
    me.passwordHash = hashPassword(next); await setJSON('adminUsers', users);
    return json({ ok: true });
  }

  // Admin data + CRUD
  if (path.startsWith('/api/admin')) {
    const u = await currentUser(req); if (!u) return json({ error: 'Authentication required.' }, 401);
    if (method !== 'GET' && !sameOriginOk(req)) return json({ error: 'Cross-origin request blocked.' }, 403);
    if (path === '/api/admin/data' && method === 'GET') {
      const [profile, releases, videos, gallery, news, events, products, inquiries, subscribers, orders] = await Promise.all([
        getProfile(), allRows('releases'), allRows('videos'), allRows('gallery'), allRows('news'), allRows('events'), allRows('products'), allRows('inquiries'), allRows('subscribers'), allRows('orders'),
      ]);
      return json({ profile, releases, videos, gallery, news, events, products, inquiries, subscribers, orders });
    }
    if (path === '/api/admin/profile' && method === 'PUT') {
      const p = await body(req); if (!cleanStr(p.name, 80)) return json({ error: 'Artist name is required.' }, 422);
      await setProfile(p); return json({ ok: true, profile: p });
    }
    const m = path.match(/^\/api\/admin\/([a-z]+)(?:\/([^/]+))?$/);
    if (m) {
      const t = m[1]; const id = m[2] ? decodeURIComponent(m[2]) : null;
      const known = [...COLLECTIONS, 'inquiries', 'subscribers', 'orders'];
      if (!known.includes(t)) return json({ error: 'Unknown collection' }, 404);
      if (method === 'GET') return json(await allRows(t));
      if (method === 'POST' && COLLECTIONS.includes(t)) {
        const obj = await body(req); const err = validate(t, obj); if (err) return json({ error: err }, 422);
        obj.id = cleanStr(obj.id, 80) || obj.slug || crypto.randomUUID();
        if (['releases', 'news', 'products'].includes(t)) { const rows = await allRows(t); if (rows.some(r => r.slug === obj.slug && r.id !== obj.id)) return json({ error: 'Slug already exists.' }, 422); }
        obj.sort = obj.sort ?? 999; return json({ ok: true, item: await upsertRow(t, obj) });
      }
      if (method === 'PUT' && id) {
        const existing = await getRow(t, id); if (!existing) return json({ error: 'Not found' }, 404);
        const b = await body(req);
        if (COLLECTIONS.includes(t)) { const obj = { ...existing, ...b, id }; const err = validate(t, obj); if (err) return json({ error: err }, 422); return json({ ok: true, item: await upsertRow(t, obj) }); }
        const status = cleanStr(b.status, 40); if (!status) return json({ error: 'Status required' }, 422);
        return json({ ok: true, item: await upsertRow(t, { ...existing, status }) });
      }
      if (method === 'DELETE' && id) { await deleteRow(t, id); return json({ ok: true }); }
    }
    return json({ error: 'Not found' }, 404);
  }
  return json({ error: 'Not found' }, 404);
}
