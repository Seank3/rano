import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db, setSetting, getSetting, upsertRow } from './db.js';
import { hashPassword } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const seed = JSON.parse(fs.readFileSync(path.join(root, 'content', 'seed.json'), 'utf8'));
const reset = process.argv.includes('--reset');

const tables = ['releases', 'videos', 'gallery', 'news', 'events', 'products'];
if (reset) {
  for (const t of tables) db.prepare(`DELETE FROM ${t}`).run();
  db.prepare('DELETE FROM settings WHERE key = ?').run('profile');
}

setSetting('profile', seed.profile);
for (const t of tables) {
  const items = seed[t] || [];
  items.forEach((item, i) => upsertRow(t, { ...item, sort: item.sort ?? i }));
}

// Admin account
const email = process.env.ADMIN_EMAIL || 'admin@rano.local';
const existing = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email);
if (!existing) {
  const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
  db.prepare('INSERT INTO admin_users(email,passwordHash,createdAt) VALUES(?,?,?)')
    .run(email, hashPassword(password), new Date().toISOString());
  const credFile = path.join(root, 'ADMIN_CREDENTIALS.txt');
  fs.writeFileSync(credFile, `RANO Admin Dashboard\nURL: /admin\nEmail: ${email}\nPassword: ${password}\n\nKeep this file private. Delete it after saving the password.\nChange the password in Admin → Settings after first login.\n`, { mode: 0o600 });
  console.log(`[seed] Admin created: ${email}`);
  console.log(`[seed] Credentials written to ADMIN_CREDENTIALS.txt (private, gitignored).`);
} else {
  console.log(`[seed] Admin exists: ${email}`);
}
console.log(`[seed] Done. Releases=${seed.releases.length} Videos=${seed.videos.length} News=${seed.news.length}`);
