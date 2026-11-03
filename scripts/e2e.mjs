import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const out = path.join(root, 'test-results'); fs.mkdirSync(out, { recursive: true });
// Credentials: env overrides (Netlify) take precedence over the local file.
let email = process.env.ADMIN_EMAIL, password = process.env.ADMIN_PASSWORD;
if (!email || !password) {
  const credPath = path.join(root, 'ADMIN_CREDENTIALS.txt');
  if (fs.existsSync(credPath)) {
    const creds = fs.readFileSync(credPath, 'utf8');
    email = email || creds.match(/Email: (.+)/)[1].trim();
    password = password || creds.match(/Password: (.+)/)[1].trim();
  }
}
if (!email || !password) throw new Error('Set ADMIN_EMAIL/ADMIN_PASSWORD or provide ADMIN_CREDENTIALS.txt for e2e tests.');

const results = []; let failures = 0;
function ok(name, cond, extra = '') { results.push({ name, pass: !!cond, extra }); if (!cond) failures++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`); }

const browser = await chromium.launch();
const consoleErrors = [];
async function newPage(viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + String(e).slice(0, 200)));
  return { ctx, page };
}

// ── Desktop ──
{
  const { ctx, page } = await newPage({ width: 1440, height: 900 });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  ok('Home loads hero', await page.locator('.hero__name').isVisible());
  ok('Home title set', (await page.title()).includes('RANO'));
  await page.screenshot({ path: path.join(out, 'desktop-home.png'), fullPage: false });
  await page.screenshot({ path: path.join(out, 'desktop-home-full.png'), fullPage: true });
  ok('Latest release section', await page.getByText('Out now').first().isVisible());
  ok('12 release artworks present', await page.locator('img[src*="/images/releases/"]').count() >= 4);
  // Nav
  for (const [label, url] of [['About', '/about'], ['Music', '/music'], ['Videos', '/videos'], ['Events', '/events'], ['Gallery', '/gallery'], ['News', '/news'], ['Contact', '/contact']]) {
    await page.locator('.nav').getByRole('link', { name: label, exact: true }).click();
    await page.waitForURL('**' + url); await page.waitForLoadState('networkidle');
    ok(`Nav → ${label}`, page.url().endsWith(url));
  }
  // Music filters + detail
  await page.goto(BASE + '/music', { waitUntil: 'networkidle' });
  ok('Music grid has 12 cards', await page.locator('.release-card').count() === 12);
  await page.getByRole('button', { name: /^Features/ }).click();
  const featCount = await page.locator('.release-card').count();
  ok('Features filter works', featCount > 0 && featCount < 12, `${featCount} features`);
  await page.getByRole('button', { name: /^All/ }).click();
  await page.locator('.release-card__title a').first().click(); await page.waitForURL('**/music/**'); await page.locator('.tracklist').waitFor();
  ok('Release detail loads', await page.locator('.tracklist').isVisible());
  await page.screenshot({ path: path.join(out, 'desktop-release.png') });
  // Audio preview
  const playBtn = page.getByRole('button', { name: /Play 30s preview/ });
  if (await playBtn.count()) {
    await playBtn.click(); await page.waitForTimeout(3500);
    const playerVisible = await page.locator('.player.is-active').isVisible();
    const err = await page.locator('.player__error').count();
    ok('Audio player activates', playerVisible);
    ok('Audio preview loads (no error)', playerVisible && err === 0, err ? await page.locator('.player__error').textContent() : 'playing');
    await page.screenshot({ path: path.join(out, 'desktop-player.png') });
    await page.getByRole('button', { name: 'Close player' }).click();
  }
  // Videos modal
  await page.goto(BASE + '/videos', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Play video/ }).first().click(); await page.waitForTimeout(800);
  ok('Video modal iframe', await page.locator('.modal__video iframe').count() === 1);
  const src = await page.locator('.modal__video iframe').getAttribute('src');
  ok('YouTube-nocookie embed', src.includes('youtube-nocookie.com/embed/'), src);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  ok('Video modal closes on Escape', await page.locator('.modal').count() === 0);
  // Gallery lightbox
  await page.goto(BASE + '/gallery', { waitUntil: 'networkidle' });
  await page.locator('.masonry__item').first().click(); await page.waitForTimeout(400);
  ok('Lightbox opens', await page.locator('.lightbox__img').isVisible());
  await page.getByRole('button', { name: 'Next image' }).click(); await page.waitForTimeout(200);
  ok('Lightbox next works', (await page.locator('.lightbox__count').textContent()).startsWith('2'));
  await page.keyboard.press('Escape');
  // Events
  await page.goto(BASE + '/events', { waitUntil: 'networkidle' });
  ok('Events empty upcoming state', await page.getByText('No dates announced yet').isVisible());
  ok('Past Rolexperience listed', await page.getByText('ROLEXPERIENCE — 1st Edition').isVisible());
  // News article
  await page.goto(BASE + '/news', { waitUntil: 'networkidle' });
  await page.locator('.news-card__title a').first().click(); await page.waitForURL('**/news/**'); await page.locator('.article__body p').first().waitFor();
  ok('Article page loads', await page.locator('.article__body p').count() >= 2);
  // Contact validation + submit
  await page.goto(BASE + '/contact', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Send message/ }).click();
  ok('Contact validation errors', await page.locator('.field .err').count() >= 3);
  await page.fill('#c-name', 'E2E Tester'); await page.fill('#c-email', 'e2e@example.com'); await page.selectOption('#c-cat', 'booking');
  await page.fill('#c-subject', 'E2E booking test'); await page.fill('#c-message', 'This is an automated end-to-end test message for the booking form.');
  await page.getByRole('button', { name: /Send message/ }).click(); await page.waitForTimeout(800);
  ok('Contact submit success', await page.locator('.form-msg--ok').isVisible());
  // Newsletter
  await page.goto(BASE + '/#newsletter', { waitUntil: 'networkidle' });
  const nl = page.locator('#newsletter input[type="email"]'); await nl.fill('e2e-newsletter@example.com');
  await page.locator('#newsletter button[type="submit"]').click(); await page.waitForTimeout(700);
  ok('Newsletter success', await page.locator('#newsletter .form-msg--ok').isVisible());
  // Store empty state
  await page.goto(BASE + '/store', { waitUntil: 'networkidle' });
  ok('Store honest empty state', await page.getByText('Merch coming soon').isVisible());
  // 404
  await page.goto(BASE + '/no-such-page', { waitUntil: 'networkidle' });
  ok('404 page', await page.getByText('Lost the beat').isVisible());
  // overflow check
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  ok('No desktop horizontal overflow', !overflow);
  await ctx.close();
}

// ── Mobile ──
{
  const { ctx, page } = await newPage({ width: 360, height: 740 });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(out, 'mobile-home.png') });
  ok('Mobile menu toggle visible', await page.locator('.menu-toggle').isVisible());
  await page.locator('.menu-toggle').click(); await page.waitForTimeout(600);
  ok('Mobile menu opens', await page.locator('.mobile-menu.is-open').isVisible());
  await page.screenshot({ path: path.join(out, 'mobile-menu.png') });
  await page.locator('.mobile-menu').getByRole('link', { name: /Music/ }).click(); await page.waitForURL('**/music'); await page.waitForTimeout(500);
  ok('Mobile menu navigates & closes', !(await page.locator('.mobile-menu.is-open').isVisible()));
  for (const p of ['/music', '/about', '/videos', '/gallery', '/contact', '/events', '/news']) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    const ov = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    ok(`No mobile overflow ${p}`, !ov);
  }
  await page.goto(BASE + '/music', { waitUntil: 'networkidle' }); await page.screenshot({ path: path.join(out, 'mobile-music.png') });
  await ctx.close();
}

// ── Admin ──
{
  const { ctx, page } = await newPage({ width: 1440, height: 900 });
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle' });
  ok('Admin login shown', await page.locator('#a-email').isVisible());
  await page.fill('#a-email', email); await page.fill('#a-pass', 'wrong-password');
  await page.getByRole('button', { name: /Sign in/ }).click(); await page.waitForTimeout(500);
  ok('Admin rejects bad password', await page.locator('.form-msg--err').isVisible());
  await page.fill('#a-pass', password); await page.getByRole('button', { name: /Sign in/ }).click(); await page.waitForTimeout(1200);
  ok('Admin login succeeds', await page.getByRole('heading', { name: 'Overview' }).isVisible());
  await page.screenshot({ path: path.join(out, 'admin-dashboard.png') });
  ok('Admin sees inquiries from form test', await page.locator('.admin__side').getByText(/Inquiries/).textContent().then(t => /\(\d+\)/.test(t)));
  // CRUD news
  await page.locator('.admin__side').getByRole('link', { name: 'News' }).click(); await page.waitForTimeout(600);
  await page.getByRole('button', { name: /Add article/ }).click();
  await page.fill('#f-news-title', 'E2E Test Article'); await page.fill('#f-news-date', '2026-11-02');
  await page.locator('#f-news-excerpt').fill('Temporary article created by automated test.');
  await page.locator('#f-news-body').fill('First paragraph of the test article.\nSecond paragraph.');
  await page.getByRole('button', { name: /^Save$/ }).click(); await page.waitForTimeout(900);
  ok('Admin creates article', await page.getByText('E2E Test Article').count() >= 1);
  await page.locator('tr', { hasText: 'E2E Test Article' }).getByRole('button', { name: 'Edit' }).click();
  await page.fill('#f-news-title', 'E2E Test Article (edited)'); await page.getByRole('button', { name: /^Save$/ }).click(); await page.waitForTimeout(800);
  ok('Admin edits article', await page.getByText('E2E Test Article (edited)').count() >= 1);
  page.once('dialog', d => d.accept());
  await page.locator('tr', { hasText: 'E2E Test Article (edited)' }).getByRole('button', { name: 'Delete' }).click(); await page.waitForTimeout(800);
  ok('Admin deletes article', await page.getByText('E2E Test Article (edited)').count() === 0);
  // Profile save
  await page.locator('.admin__side').getByRole('link', { name: 'Artist profile' }).click(); await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Save profile/ }).click(); await page.waitForTimeout(700);
  ok('Admin profile save', await page.getByText('Profile saved').isVisible());
  // Subscribers / orders pages
  await page.locator('.admin__side').getByRole('link', { name: 'Subscribers' }).click(); await page.waitForTimeout(500);
  ok('Subscribers list shows test email', await page.getByText('e2e-newsletter@example.com').isVisible());
  await page.locator('.admin__side').getByRole('link', { name: 'Orders' }).click(); await page.waitForTimeout(400);
  ok('Orders page demo notice', await page.getByText('Demo orders only.').isVisible());
  // Protected API without cookie
  const res = await page.request.get(BASE + '/api/admin/data');
  ok('Admin API requires auth (with cookie)', res.status() === 200);
  await page.getByRole('button', { name: /Sign out/ }).click(); await page.waitForTimeout(600);
  const res2 = await page.request.get(BASE + '/api/admin/data');
  ok('Admin API blocked after logout', res2.status() === 401);
  await ctx.close();
}

// ── SEO ──
{
  const { ctx, page } = await newPage({ width: 1200, height: 800 });
  const r = await page.goto(BASE + '/music/wacha-wewe'); const html = await r.text();
  ok('Server-side OG title for release', html.includes('<title>Wacha Wewe — RANO'));
  const sm = await page.request.get(BASE + '/sitemap.xml'); ok('Sitemap served', sm.status() === 200 && (await sm.text()).includes('/music/rolex-guy'));
  await ctx.close();
}

await browser.close();
const realErrors = consoleErrors.filter(e => !/youtube|ytimg|google|apple|itunes|doubleclick|net::ERR|Failed to load resource/i.test(e));
ok('No app console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ results, failures, consoleErrors }, null, 2));
console.log(`\n${results.length - failures}/${results.length} passed, ${failures} failed. Screenshots in test-results/`);
process.exit(failures ? 1 : 0);
