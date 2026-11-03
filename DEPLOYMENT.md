# Deploying RANO — GitHub → Netlify

This repo ships with **two interchangeable backends** so you can host it anywhere:

| Runtime | Frontend | API | Database | Uploads | Best for |
|---|---|---|---|---|---|
| **Netlify** (recommended for GitHub + Netlify) | Vite static build (`dist/`) | Netlify Functions (`netlify/functions/`) | **Netlify Blobs** | Netlify Blobs | Zero-server hosting, automatic HTTPS/CDN |
| **Node / Express** | Same `dist/` | `server/index.js` | SQLite (`server/data/rano.db`) | Disk (`server/uploads/`) | VPS, Railway, Render, Fly.io, Docker |

The React frontend is identical in both. On Netlify the Express/SQLite server is **not** used —
Netlify cannot run a long-lived Express process or the native `better-sqlite3` module. Instead,
`netlify/functions/api.mjs` implements the same `/api/*` contract on top of Netlify Blobs, and
`netlify/functions/uploads.mjs` stores/serves images from Blobs. An edge function
(`netlify/edge-functions/meta.js`) injects per-route SEO/OG tags into the SPA shell.

---

## 1. Push to GitHub

The repo is already initialised and committed locally (see the latest commit). Create an **empty**
GitHub repository (no README, no .gitignore, no license), then:

```bash
cd rano
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

If you prefer SSH:

```bash
git remote add origin git@github.com:<your-username>/<repo-name>.git
git push -u origin main
```

> Nothing secret is committed. `ADMIN_CREDENTIALS.txt`, `.env`, `server/data/`, `server/uploads/`,
> `node_modules/`, `dist/` and `.netlify/` are all gitignored.

## 2. Connect Netlify

1. Sign in at <https://app.netlify.com> → **Add new site** → **Import an existing project**.
2. Choose **GitHub**, authorise Netlify, and select the repository you just pushed.
3. Netlify reads `netlify.toml` automatically. Confirm:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
   - `NPM_FLAGS=--ignore-scripts` is preset so Netlify skips the native SQLite/ffmpeg/Playwright
     install scripts it doesn’t need. Your local `npm install` is unaffected.
4. **Before the first deploy**, open **Site configuration → Environment variables** and add:

   | Key | Value | Required |
   |---|---|---|
   | `ADMIN_EMAIL` | the email you want to sign in with | **Yes** |
   | `ADMIN_PASSWORD` | a long, random password | **Yes** |
   | `SITE_URL` | `https://<your-site>.netlify.app` (or your custom domain) | Recommended |
   | `NODE_VERSION` | `20` (already set in `netlify.toml`) | — |

5. Click **Deploy**. The first build installs dependencies, builds the React app, and bundles the
   functions + edge function.

## 3. First run

- The first request to `/api/content` (or any page) **seeds Netlify Blobs** from `content/seed.json`:
  12 releases, 8 videos, 5 news items, 8 gallery images, 1 past event, and the artist profile.
- The admin account is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. If you forgot to set them,
  add them in Netlify and trigger a new deploy (or just wait for the next request — the API
  re-checks until the admin exists).
- Sign in at `https://<your-site>.netlify.app/admin`.
- Uploaded images are stored in the `rano-uploads` Blob store and served from `/uploads/<id>.<ext>`.
- Content edits, inquiries, subscribers and demo orders persist in the `rano-data` Blob store.

> **Do not delete the Netlify site or its Blob stores** unless you intend to wipe all live content.
> Blob data is independent of Git deploys — redeploying code does **not** reset your content.

## 4. Custom domain (optional)

Netlify → **Domain management** → **Add a domain**. Netlify provisions HTTPS automatically.
Then update `SITE_URL` to the custom domain and redeploy so canonical URLs, OG tags and the sitemap
use the correct origin.

---

## Local Netlify development

```bash
npm install
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' npx netlify-cli dev --offline
# or: npm run dev:netlify  (set the env vars in your shell / .env first)
```

This serves the static build + functions + edge function on `http://localhost:8888` with a local
Blob emulator (`.netlify/blobs-serve`, gitignored). It does **not** touch your production data.

> If your environment sets `NODE_OPTIONS=--use-openssl-ca` (some sandboxes/proxies do), Netlify's
> function worker will reject it. Run with `env -u NODE_OPTIONS npx netlify-cli dev …`.

## Testing

```bash
# Against the Express server (default http://127.0.0.1:3000)
npm run test:e2e

# Against a Netlify dev server
BASE_URL=http://127.0.0.1:8888 ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='…' npm run test:e2e
```

The suite runs 55 checks (desktop + mobile): navigation, filters, release detail, real audio
previews, video modal, lightbox, forms, admin auth/CRUD, protected API, SEO/sitemap, console errors.
It has been verified against **both** runtimes.

---

## Alternative: Node / Express / Docker

If you ever move off Netlify, the original full-stack server is still here:

```bash
npm ci && npm run build
node server/seed.js                 # first deploy only; writes ADMIN_CREDENTIALS.txt
NODE_ENV=production npm start       # http://0.0.0.0:3000
```

Or Docker:

```bash
docker build -t rano-site .
docker run -p 3000:3000 \
  -v rano-data:/app/server/data \
  -v rano-uploads:/app/server/uploads \
  rano-site
```

Persist `server/data/` and `server/uploads/`. Put it behind HTTPS so session cookies are `Secure`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/admin` login says “Admin is not configured yet” | Set `ADMIN_EMAIL` + `ADMIN_PASSWORD` in Netlify env vars, redeploy. |
| API 500 locally: `invalid NODE_OPTIONS … --use-openssl-ca` | `env -u NODE_OPTIONS npx netlify-cli dev …` |
| `/sitemap.xml` or `/robots.txt` returns HTML | Ensure `netlify.toml` redirects are intact; the API maps those paths explicitly. |
| Uploads 404 on Netlify | The `/api/admin/upload` redirect must precede `/api/*`; `/uploads/*` must point at the uploads function. Already configured. |
| Content looks stale after editing seed.json | Blob data is seeded **once**. Edit content in `/admin`, or wipe the `rano-data` Blob store to re-seed (destructive). |
| Netlify build tries to compile `better-sqlite3` | Keep `NPM_FLAGS=--ignore-scripts` in `netlify.toml`. The Netlify runtime uses Blobs, not SQLite. |
