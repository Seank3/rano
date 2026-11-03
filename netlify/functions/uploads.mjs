import crypto from 'node:crypto';
import { parse as parseCookie } from 'cookie';
import { ensureSeeded, uploadsStore } from './lib/store.mjs';
import { getSessionUser } from './lib/auth.mjs';

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default async function handler(req) {
  await ensureSeeded();
  const url = new URL(req.url);
  let name = url.pathname.replace(/^\/\.netlify\/functions\/uploads/, '').replace(/^\/uploads/, '').replace(/^\//, '');
  const i = url.pathname.indexOf('/uploads/'); if (i >= 0) name = url.pathname.slice(i + '/uploads/'.length);
  name = decodeURIComponent(name || '');

  // Serve an uploaded image
  if (req.method === 'GET') {
    if (!name || !/^[a-f0-9]+\.(jpg|jpeg|png|webp|gif)$/.test(name)) return new Response('Not found', { status: 404 });
    const res = await uploadsStore.getWithMetadata(name, { type: 'arrayBuffer' });
    if (!res || !res.data) return new Response('Not found', { status: 404 });
    return new Response(res.data, { headers: { 'content-type': res.metadata?.contentType || 'image/jpeg', 'cache-control': 'public, max-age=604800, immutable' } });
  }

  // Admin upload (POST /api/admin/upload is redirected here)
  if (req.method === 'POST') {
    const token = parseCookie(req.headers.get('cookie') || '').rano_admin;
    const user = await getSessionUser(token);
    if (!user) return json({ error: 'Authentication required.' }, 401);
    const origin = req.headers.get('origin');
    if (origin) {
      // Same normalization as the API: behind Netlify's proxy the Host header
      // can differ from the browser origin (localhost vs 127.0.0.1 in dev).
      const norm = h => String(h || '').trim().toLowerCase().replace(/^127\.0\.0\.1(?=[:/]|$)/, 'localhost').replace(/^\[::1\](?=[:/]|$)/, 'localhost');
      let o; try { o = new URL(origin); } catch { return json({ error: 'Invalid origin.' }, 403); }
      const candidates = [req.headers.get('host'), req.headers.get('x-forwarded-host'), url.host]
        .filter(Boolean).flatMap(h => String(h).split(',')).map(norm);
      if (!candidates.includes(norm(o.host))) return json({ error: 'Cross-origin request blocked.' }, 403);
    }
    let form; try { form = await req.formData(); } catch { return json({ error: 'Expected multipart form data.' }, 422); }
    const file = form.get('image');
    if (!file || typeof file === 'string') return json({ error: 'No image uploaded.' }, 422);
    if (!ALLOWED.includes(file.type)) return json({ error: 'Only JPG, PNG, WebP or GIF images are allowed.' }, 422);
    if (file.size > 6 * 1024 * 1024) return json({ error: 'Image must be 6 MB or smaller.' }, 422);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace('jpeg', 'jpg');
    const key = crypto.randomBytes(10).toString('hex') + '.' + ext;
    const buf = new Uint8Array(await file.arrayBuffer());
    await uploadsStore.set(key, buf, { metadata: { contentType: file.type, uploadedBy: user.email, uploadedAt: new Date().toISOString() } });
    return json({ ok: true, url: `/uploads/${key}`, name: key });
  }
  return json({ error: 'Method not allowed' }, 405);
}
