import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, getSetting, setSetting, allRows, getRow, upsertRow, deleteRow, rowToObj } from './db.js';
import { hashPassword, verifyPassword, createSession, getSessionUser, destroySession, cleanSessions, rateLimit, sessionSecret } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const PORT = Number(process.env.PORT || 3000);
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Note: no X-Frame-Options / frame-ancestors restriction so the site can be embedded in the Arena live preview.
  // For a standalone production deployment you may add: res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

const COOKIE = 'rano_admin';
const isProd = process.env.NODE_ENV === 'production';
function cookieOpts(req) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  return { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 1000 * 60 * 60 * 12 };
}
function currentUser(req) { return getSessionUser(req.cookies?.[COOKIE]); }
function requireAdmin(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required.' });
  req.user = user; next();
}
function sameOrigin(req, res, next) {
  const origin = req.headers.origin;
  if (origin) {
    try {
      const o = new URL(origin); const h = new URL(`${req.protocol}://${req.get('host')}`);
      if (o.host !== h.host) return res.status(403).json({ error: 'Cross-origin request blocked.' });
    } catch { return res.status(403).json({ error: 'Invalid origin.' }); }
  }
  next();
}

// ---------- Public content ----------
function publicContent() {
  return {
    profile: getSetting('profile', {}),
    releases: allRows('releases'),
    videos: allRows('videos'),
    gallery: allRows('gallery'),
    news: allRows('news', 'date DESC'),
    events: allRows('events'),
    products: allRows('products').filter(p => p.active),
  };
}
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));
app.get('/api/content', (req, res) => res.json(publicContent()));

// ---------- Public forms ----------
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function cleanStr(v, max = 2000) { return String(v ?? '').trim().slice(0, max); }
function spamCheck(req, body) {
  if (cleanStr(body.website)) return false; // honeypot
  if (!rateLimit(`form:${req.ip}`, 8, 60_000)) return false;
  return true;
}
app.post('/api/newsletter', (req, res) => {
  const b = req.body || {};
  if (!spamCheck(req, b)) return res.status(400).json({ error: 'Please wait a moment and try again.' });
  const email = cleanStr(b.email, 254).toLowerCase();
  if (!emailRe.test(email)) return res.status(422).json({ error: 'Please enter a valid email address.' });
  const existing = db.prepare('SELECT id FROM subscribers WHERE email = ?').get(email);
  if (!existing) {
    db.prepare('INSERT INTO subscribers(id,email,createdAt,status,source) VALUES(?,?,?,?,?)')
      .run(crypto.randomUUID(), email, new Date().toISOString(), 'active', cleanStr(b.source, 60) || 'website');
  }
  res.json({ ok: true, message: existing ? 'You are already on the list. Thank you!' : 'You are on the list. Welcome to the movement.' });
});
app.post('/api/contact', (req, res) => {
  const b = req.body || {};
  if (!spamCheck(req, b)) return res.status(400).json({ error: 'Please wait a moment and try again.' });
  const name = cleanStr(b.name, 120), email = cleanStr(b.email, 254).toLowerCase();
  const category = cleanStr(b.category, 60), subject = cleanStr(b.subject, 160), message = cleanStr(b.message, 4000);
  const cats = ['booking', 'business', 'press', 'collaboration', 'general'];
  if (name.length < 2) return res.status(422).json({ error: 'Please enter your name.' });
  if (!emailRe.test(email)) return res.status(422).json({ error: 'Please enter a valid email address.' });
  if (!cats.includes(category)) return res.status(422).json({ error: 'Please choose an inquiry category.' });
  if (subject.length < 3) return res.status(422).json({ error: 'Please add a subject.' });
  if (message.length < 10) return res.status(422).json({ error: 'Message must be at least 10 characters.' });
  db.prepare('INSERT INTO inquiries(id,createdAt,name,email,category,subject,message,status,ip) VALUES(?,?,?,?,?,?,?,?,?)')
    .run(crypto.randomUUID(), new Date().toISOString(), name, email, category, subject, message, 'new', req.ip || '');
  res.json({ ok: true, message: 'Message received. The team will get back to you as soon as possible.' });
});

// ---------- Demo checkout (no real payment) ----------
app.post('/api/orders', (req, res) => {
  const b = req.body || {};
  if (!spamCheck(req, b)) return res.status(400).json({ error: 'Please wait and try again.' });
  const items = Array.isArray(b.items) ? b.items.slice(0, 30) : [];
  if (!items.length) return res.status(422).json({ error: 'Your cart is empty.' });
  const customer = { name: cleanStr(b.customer?.name, 120), email: cleanStr(b.customer?.email, 254).toLowerCase(), phone: cleanStr(b.customer?.phone, 40), address: cleanStr(b.customer?.address, 400) };
  if (customer.name.length < 2 || !emailRe.test(customer.email)) return res.status(422).json({ error: 'Please provide a valid name and email.' });
  let total = 0; const currency = 'UGX'; const lineItems = [];
  for (const it of items) {
    const p = getRow('products', cleanStr(it.productId, 80));
    const qty = Math.max(1, Math.min(20, Number(it.qty) || 1));
    if (!p || !p.active) return res.status(422).json({ error: 'A product in your cart is no longer available.' });
    total += p.priceCents * qty;
    lineItems.push({ productId: p.id, name: p.name, priceCents: p.priceCents, qty, size: cleanStr(it.size, 20), color: cleanStr(it.color, 30) });
  }
  const id = 'RANO-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  db.prepare('INSERT INTO orders(id,createdAt,customer,items,totalCents,currency,status,demo) VALUES(?,?,?,?,?,?,?,?)')
    .run(id, new Date().toISOString(), JSON.stringify(customer), JSON.stringify(lineItems), total, currency, 'demo_pending', 1);
  res.json({ ok: true, orderId: id, demo: true, totalCents: total, currency, message: 'Demo order recorded. No payment was taken.' });
});

// ---------- Admin auth ----------
app.post('/api/admin/login', sameOrigin, (req, res) => {
  const ip = req.ip || 'unknown';
  if (!rateLimit(`login:${ip}`, 8, 10 * 60_000)) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  const email = cleanStr(req.body?.email, 254).toLowerCase();
  const password = String(req.body?.password ?? '');
  const user = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email);
  if (!user || !verifyPassword(password, user.passwordHash)) return res.status(401).json({ error: 'Invalid email or password.' });
  cleanSessions();
  const { token } = createSession(user.id);
  res.cookie(COOKIE, token, cookieOpts(req));
  res.json({ ok: true, user: { id: user.id, email: user.email } });
});
app.post('/api/admin/logout', requireAdmin, sameOrigin, (req, res) => {
  destroySession(req.cookies?.[COOKIE]); res.clearCookie(COOKIE, { path: '/' }); res.json({ ok: true });
});
app.get('/api/admin/me', (req, res) => {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user: u });
});
app.post('/api/admin/change-password', requireAdmin, sameOrigin, (req, res) => {
  const current = String(req.body?.currentPassword ?? ''); const next = String(req.body?.newPassword ?? '');
  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.user.id);
  if (!verifyPassword(current, user.passwordHash)) return res.status(403).json({ error: 'Current password is incorrect.' });
  if (next.length < 10) return res.status(422).json({ error: 'New password must be at least 10 characters.' });
  db.prepare('UPDATE admin_users SET passwordHash = ? WHERE id = ?').run(hashPassword(next), user.id);
  res.json({ ok: true });
});

// ---------- Admin data ----------
const COLLECTIONS = ['releases', 'videos', 'gallery', 'news', 'events', 'products'];
app.get('/api/admin/data', requireAdmin, (req, res) => {
  res.json({
    profile: getSetting('profile', {}),
    releases: allRows('releases'), videos: allRows('videos'), gallery: allRows('gallery'),
    news: allRows('news', 'date DESC'), events: allRows('events'), products: allRows('products'),
    inquiries: allRows('inquiries', 'createdAt DESC'),
    subscribers: allRows('subscribers', 'createdAt DESC'),
    orders: allRows('orders', 'createdAt DESC'),
  });
});
app.put('/api/admin/profile', requireAdmin, sameOrigin, (req, res) => {
  const p = req.body || {};
  if (!cleanStr(p.name, 80)) return res.status(422).json({ error: 'Artist name is required.' });
  setSetting('profile', p); res.json({ ok: true, profile: p });
});

const required = { releases: ['slug', 'title', 'artist'], videos: ['title', 'youtubeId'], gallery: ['src'], news: ['slug', 'title'], events: ['title'], products: ['slug', 'name'] };
function validateCollection(table, obj) {
  for (const f of required[table] || []) if (!cleanStr(obj[f], 200)) return `Field "${f}" is required.`;
  if (table === 'products' && (!Number.isFinite(Number(obj.priceCents)) || Number(obj.priceCents) < 0)) return 'Price must be a positive number.';
  if (table === 'videos' && obj.youtubeId && !/^[A-Za-z0-9_-]{6,20}$/.test(obj.youtubeId)) return 'Invalid YouTube video ID.';
  if (obj.slug && !/^[a-z0-9-]+$/.test(obj.slug)) return 'Slug must be lowercase letters, numbers and hyphens.';
  return null;
}
app.post('/api/admin/upload', requireAdmin, sameOrigin, (req, res, next) => {
  const storage = multer.diskStorage({
    destination: path.join(__dirname, 'uploads'),
    filename: (r, file, cb) => cb(null, crypto.randomBytes(10).toString('hex') + path.extname(file.originalname).toLowerCase()),
  });
  const upload = multer({ storage, limits: { fileSize: 6 * 1024 * 1024 }, fileFilter: (r, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
    cb(ok ? null : new Error('Only JPG, PNG, WebP or GIF images are allowed.'), ok);
  } }).single('image');
  upload(req, res, err => {
    if (err) return res.status(422).json({ error: err.message });
    if (!req.file) return res.status(422).json({ error: 'No image uploaded.' });
    res.json({ ok: true, url: `/uploads/${req.file.filename}`, name: req.file.filename });
  });
});
app.get('/api/admin/:collection', requireAdmin, (req, res) => {
  const t = req.params.collection;
  if (![...COLLECTIONS, 'inquiries', 'subscribers', 'orders'].includes(t)) return res.status(404).json({ error: 'Unknown collection' });
  res.json(allRows(t, t === 'news' ? 'date DESC' : 'sort ASC'));
});
app.post('/api/admin/:collection', requireAdmin, sameOrigin, (req, res) => {
  const t = req.params.collection;
  if (!COLLECTIONS.includes(t)) return res.status(405).json({ error: 'Read-only collection' });
  const obj = { ...req.body };
  const err = validateCollection(t, obj); if (err) return res.status(422).json({ error: err });
  obj.id = cleanStr(obj.id, 80) || obj.slug || crypto.randomUUID();
  if (t === 'releases' || t === 'news' || t === 'products') {
    const dupe = db.prepare(`SELECT id FROM ${t} WHERE slug = ? AND id != ?`).get(obj.slug, obj.id);
    if (dupe) return res.status(422).json({ error: 'Slug already exists.' });
  }
  obj.sort = obj.sort ?? 999;
  res.json({ ok: true, item: upsertRow(t, obj) });
});
app.put('/api/admin/:collection/:id', requireAdmin, sameOrigin, (req, res) => {
  const t = req.params.collection;
  if ([...COLLECTIONS, 'inquiries', 'subscribers', 'orders'].includes(t) === false) return res.status(404).json({ error: 'Unknown collection' });
  const existing = getRow(t, req.params.id); if (!existing) return res.status(404).json({ error: 'Not found' });
  if (COLLECTIONS.includes(t)) {
    const obj = { ...existing, ...req.body, id: req.params.id };
    const err = validateCollection(t, obj); if (err) return res.status(422).json({ error: err });
    res.json({ ok: true, item: upsertRow(t, obj) });
  } else {
    const status = cleanStr(req.body?.status, 40);
    if (!status) return res.status(422).json({ error: 'Status required' });
    db.prepare(`UPDATE ${t} SET status = ? WHERE id = ?`).run(status, req.params.id);
    res.json({ ok: true, item: getRow(t, req.params.id) });
  }
});
app.delete('/api/admin/:collection/:id', requireAdmin, sameOrigin, (req, res) => {
  const t = req.params.collection;
  if (![...COLLECTIONS, 'inquiries', 'subscribers', 'orders'].includes(t)) return res.status(404).json({ error: 'Unknown collection' });
  deleteRow(t, req.params.id); res.json({ ok: true });
});

// ---------- Static ----------
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d', immutable: true }));
app.use(express.static(dist, { maxAge: isProd ? '1h' : 0, index: false }));

// SEO meta injection + SPA fallback
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function metaFor(pathname) {
  const c = publicContent(); const p = c.profile || {};
  const base = p.seo?.title || 'RANO — Official Website';
  const desc = p.seo?.description || 'Official website of Ugakid RANO.';
  const img = p.heroImage || p.portrait || '';
  let title = base, description = desc, image = img;
  const mRel = pathname.match(/^\/music\/([^/]+)/); const mNews = pathname.match(/^\/news\/([^/]+)/);
  if (pathname === '/about') { title = `About — ${base}`; description = (p.bio?.[0] || desc).slice(0, 160); image = p.portrait || img; }
  else if (pathname === '/music') { title = `Music — ${base}`; description = `Songs, singles and collaborations by ${p.name || 'RANO'}.`; }
  else if (mRel) { const r = c.releases.find(x => x.slug === mRel[1]); if (r) { title = `${r.title} — ${base}`; description = r.description || desc; image = r.artwork || img; } }
  else if (pathname === '/videos') { title = `Videos — ${base}`; description = `Official music videos, visualizers and lyrics videos by ${p.name || 'RANO'}.`; }
  else if (pathname === '/events') { title = `Events — ${base}`; description = `Upcoming shows and past events from ${p.name || 'RANO'}.`; }
  else if (pathname === '/gallery') { title = `Gallery — ${base}`; description = `Photos and artwork from ${p.name || 'RANO'}.`; }
  else if (pathname === '/news') { title = `News — ${base}`; description = `Release news and announcements from ${p.name || 'RANO'}.`; }
  else if (mNews) { const n = c.news.find(x => x.slug === mNews[1]); if (n) { title = `${n.title} — ${base}`; description = n.excerpt || desc; image = n.image || img; } }
  else if (pathname === '/contact') { title = `Contact & Bookings — ${base}`; description = `Bookings, press, business and collaborations with ${p.name || 'RANO'}.`; }
  else if (pathname === '/store') { title = `Store — ${base}`; description = `Official ${p.name || 'RANO'} merchandise.`; }
  const site = process.env.SITE_URL || '';
  const canonical = site ? `${site.replace(/\/$/, '')}${pathname}` : '';
  return `<title>${esc(title)}</title><meta name="description" content="${esc(description)}"/>
<meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(description)}"/>
<meta property="og:image" content="${esc(image)}"/><meta property="og:type" content="website"/>
${canonical ? `<link rel="canonical" href="${esc(canonical)}"/><meta property="og:url" content="${esc(canonical)}"/>` : ''}
<meta name="twitter:card" content="summary_large_image"/>`;
}
app.get('/sitemap.xml', (req, res) => {
  const c = publicContent(); const site = (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const urls = ['/', '/about', '/music', '/videos', '/events', '/gallery', '/news', '/contact', '/store',
    ...c.releases.map(r => `/music/${r.slug}`), ...c.news.map(n => `/news/${n.slug}`)];
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${esc(site + u)}</loc></url>`).join('')}</urlset>`);
});
app.get('/robots.txt', (req, res) => {
  const site = (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\nSitemap: ${site}/sitemap.xml\n`);
});
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  const file = path.join(dist, 'index.html');
  if (!fs.existsSync(file)) return res.status(503).send('Frontend not built yet. Run npm run build.');
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace('<!--META-->', metaFor(req.path));
  res.type('html').send(html);
});

app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});
app.listen(PORT, '0.0.0.0', () => {
  console.log(`RANO server listening on http://0.0.0.0:${PORT}`);
  if (!fs.existsSync(path.join(dist, 'index.html'))) console.log('[warn] dist/ not built — run npm run build');
});
