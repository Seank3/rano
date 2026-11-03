// Injects per-route SEO/OG tags into the static SPA shell on Netlify.
// Skips API, assets and non-HTML requests. Falls back to the untouched shell
// if the content API is unavailable.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async (request, context) => {
  const url = new URL(request.url);
  const p = url.pathname;
  if (p.startsWith('/api') || p.startsWith('/uploads') || p.startsWith('/assets') || p.startsWith('/images') || p.startsWith('/.netlify') || p === '/sitemap.xml' || p === '/robots.txt') return context.next();
  const accept = request.headers.get('accept') || '';
  if (!accept.includes('text/html')) return context.next();

  const response = await context.next();
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return response;

  let html = await response.text();
  if (!html.includes('<!--META-->')) return new Response(html, response);
  try {
    const res = await fetch(new URL('/api/content', request.url), { headers: { accept: 'application/json' } });
    const c = await res.json();
    const prof = c.profile || {};
    const base = prof.seo?.title || 'RANO — Official Website';
    const desc = prof.seo?.description || 'Official website of Ugakid RANO.';
    let title = base, description = desc, image = prof.heroImage || prof.portrait || '';
    const mRel = p.match(/^\/music\/([^/]+)/); const mNews = p.match(/^\/news\/([^/]+)/);
    if (p === '/about') { title = `About — ${base}`; description = (prof.bio?.[0] || desc).slice(0, 160); image = prof.portrait || image; }
    else if (p === '/music') title = `Music — ${base}`;
    else if (mRel) { const r = (c.releases || []).find(x => x.slug === mRel[1]); if (r) { title = `${r.title} — ${base}`; description = r.description || desc; image = r.artwork || image; } }
    else if (p === '/videos') title = `Videos — ${base}`;
    else if (p === '/events') title = `Events — ${base}`;
    else if (p === '/gallery') title = `Gallery — ${base}`;
    else if (p === '/news') title = `News — ${base}`;
    else if (mNews) { const n = (c.news || []).find(x => x.slug === mNews[1]); if (n) { title = `${n.title} — ${base}`; description = n.excerpt || desc; image = n.image || image; } }
    else if (p === '/contact') title = `Contact & Bookings — ${base}`;
    else if (p === '/store') title = `Store — ${base}`;
    const origin = `${url.protocol}//${url.host}`;
    const absImg = image && image.startsWith('/') ? origin + image : image;
    const meta = `<title>${esc(title)}</title><meta name="description" content="${esc(description)}"/><meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(description)}"/><meta property="og:image" content="${esc(absImg)}"/><meta property="og:type" content="website"/><link rel="canonical" href="${esc(origin + p)}"/><meta property="og:url" content="${esc(origin + p)}"/><meta name="twitter:card" content="summary_large_image"/>`;
    html = html.replace('<!--META-->', meta);
  } catch { /* leave default shell */ }
  return new Response(html, { status: response.status, headers: response.headers });
};
