# RANO — Official Artist Platform

A premium, full-stack website for **Ugakid RANO (RANO)** — Ugandan rapper, singer and storyteller.
Built with React + TypeScript + Vite on the front end and Express + SQLite on the back end.

The site is populated with the artist's **real, verified catalog**: 12 releases/features with official
Apple Music artwork and legal 30-second previews, 8 official YouTube videos, release news, and the
Rolexperience event recap. No invented achievements, dates, contacts or social handles.

## Quick start

```bash
npm install
npm run build          # builds the React front end into dist/
node server/seed.js    # seeds SQLite with the real catalog + creates the admin account
npm start              # serves API + site on http://0.0.0.0:3000
```

Open `http://localhost:3000`. The admin dashboard is at `/admin`.

### Admin credentials
On first seed, a strong random password is generated and written to **`ADMIN_CREDENTIALS.txt`**
(gitignored, private, never served to the browser). Default email: `admin@rano.local`.
Sign in at `/admin`, then change the password under **Settings**.

To set your own credentials instead:

```bash
ADMIN_EMAIL=you@domain.com ADMIN_PASSWORD='a-long-random-password' node server/seed.js
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev:client` | Vite dev server (port 5173, proxies `/api` to 3000) |
| `npm run dev:server` | Express with `--watch` |
| `npm run dev:netlify` | Netlify dev (static + functions + edge, local Blobs) on port 8888 |
| `npm run build` | Production front-end build |
| `npm start` | Serve built site + API |
| `npm run seed` | Re-seed content (`--reset` wipes content tables first) |
| `npm run test:e2e` | Playwright end-to-end suite (55 checks) |

## What's implemented

**Public site** — Home (cinematic hero, latest release, discography, videos, events, news, newsletter),
About (bio, milestones, sound, highlights), Music (filter by type/year, release detail pages, tracklists,
credits, custom audio player), Videos (featured + archive, lazy YouTube-nocookie modal), Events
(upcoming/past, honest empty states, recap playback), Gallery (masonry + keyboard lightbox), News
(article pages, sharing, related), Contact (categorised, validated form), Store (catalog, product pages,
cart, **demo checkout**), Privacy, Terms, 404.

**Audio player** — plays official Apple Music 30-second previews (real, authorised). Play/pause,
prev/next, seek, volume, mute, Media Session metadata, graceful error state. No autoplay.

**Admin dashboard** (`/admin`) — scrypt-hashed passwords, HTTP-only same-site session cookies,
rate-limited login, server-side protected routes and uploads, CSRF same-origin checks. Manage artist
profile, releases + tracks, videos, events, gallery, news, merch; view/export booking inquiries,
newsletter subscribers and demo orders; image uploads; change password.

**SEO / a11y** — per-route server-injected `<title>`/description/Open Graph, `sitemap.xml`, `robots.txt`,
semantic HTML, skip link, focus traps in modals, visible focus states, labelled forms, alt text,
`prefers-reduced-motion` support, lazy images and on-demand video embeds.

## Configuration

Copy `.env.example` to `.env` and set:

- `SITE_URL` — public origin (canonical URLs, OG, sitemap)
- `SESSION_SECRET` — random 32+ byte secret (`openssl rand -hex 32`)
- `NODE_ENV=production`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — optional, first seed only

### Content editing
Everything is editable in `/admin` without touching code. Seed content lives in `content/seed.json`.
Upload the artist's own photography via **Admin → Artist profile** (portrait/hero) and **Admin → Gallery**.

## Honest limitations (require the artist's input / credentials)

- **Social links:** only YouTube is linked (verified). Instagram/TikTok/X are intentionally omitted until
  the artist confirms handles. Add them in Admin → Artist profile.
- **Contact details:** no email/phone is published until confirmed; the contact form delivers to the
  admin dashboard. Add emails in Admin → Artist profile.
- **Events:** no upcoming dates are invented. The page shows a "no dates announced" state plus the past
  Rolexperience recap. Add real events with official ticket URLs in Admin → Events.
- **Payments:** checkout is clearly labelled **demo mode** — orders are recorded, no money moves and no
  card data is collected. To go live, connect Stripe server-side (see below).
- **Email delivery:** submissions are stored in SQLite. To also send email notifications, implement
  `server/mailer.js` with your SMTP/Resend/Postmark provider.
- **Imagery:** hero/gallery currently use official video stills and artwork as placeholders for the
  artist's own photography. Release artwork is official and permanent.

### Enabling real payments (Stripe)
1. `npm i stripe`
2. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env`.
3. In `server/index.js`, replace the demo `POST /api/orders` with a Stripe Checkout Session creation and
   add a webhook endpoint to mark orders paid. Never handle raw card details yourself.

## Deployment

### GitHub → Netlify (recommended)

The repo includes a complete Netlify adapter: `netlify.toml`, Netlify Functions (`netlify/functions/`)
backed by **Netlify Blobs**, and an edge function for per-route SEO. The Express/SQLite server is not
used on Netlify. See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full GitHub push + Netlify connect
walkthrough. In short:

1. Push this repo to GitHub.
2. Netlify → **Import an existing project** → select the repo. Build `npm run build`, publish `dist`.
3. Set environment variables **`ADMIN_EMAIL`** and **`ADMIN_PASSWORD`** (required), plus `SITE_URL`.
4. Deploy. Content auto-seeds into Netlify Blobs on first request; sign in at `/admin`.

Local Netlify preview: `ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run dev:netlify` → `http://localhost:8888`.

### Node / Express / Docker

Any Node 20+ host (Railway, Render, Fly.io, a VPS, etc.):

```bash
npm ci && npm run build
node server/seed.js      # first deploy only
NODE_ENV=production npm start
```

Or with Docker:

```bash
docker build -t rano-site .
docker run -p 3000:3000 -v rano-data:/app/server/data -v rano-uploads:/app/server/uploads rano-site
```

Persist `server/data/` (SQLite) and `server/uploads/` (uploaded images) across deploys.
Put the app behind HTTPS so session cookies are `Secure`.

## Project structure

```
content/         seed.json + catalog source data (iTunes/YouTube provenance)
netlify/         Netlify Functions (Blobs API + uploads) and edge SEO function
netlify.toml     Netlify build, redirects, headers, edge config
public/images/   official release artwork, video thumbnails, channel avatar
server/          Express API, SQLite schema, auth, seed, uploads (Node hosts)
src/components/  Header, Footer, Hero, ReleaseCard, AudioPlayer, VideoCards, EventList,
                 NewsCard, ContactForm, NewsletterForm, Lightbox, shared UI
src/pages/       all public pages + admin/
src/lib/         API client, types, content/player/cart contexts, hooks, formatting
scripts/e2e.mjs  Playwright test suite
```

## Testing

`npm run test:e2e` runs 55 checks across desktop (1440px) and mobile (360px): navigation, filters,
release detail, real audio preview playback, video modal, lightbox, events, news, form validation and
submission, newsletter, store empty state, 404, horizontal-overflow checks, admin auth (reject/accept),
admin CRUD, profile save, protected API, server-side SEO and sitemap, and console-error monitoring.
Verified against both the Express server and the Netlify runtime. Override the target/credentials with
`BASE_URL`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` (e.g. for `netlify dev` on port 8888).
