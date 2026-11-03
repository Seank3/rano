import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

export const db = new Database(path.join(dataDir, 'rano.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL, createdAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  tokenHash TEXT PRIMARY KEY, userId INTEGER NOT NULL,
  expiresAt INTEGER NOT NULL, createdAt TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS releases (
  id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, artist TEXT NOT NULL,
  type TEXT NOT NULL, date TEXT, genre TEXT, artwork TEXT, description TEXT,
  appleUrl TEXT, spotifyUrl TEXT, youtubeUrl TEXT, audiomackUrl TEXT,
  previewUrl TEXT, durationMs INTEGER, credits TEXT, tracks TEXT, featured INTEGER DEFAULT 0,
  sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, youtubeId TEXT NOT NULL, date TEXT,
  thumbnail TEXT, description TEXT, category TEXT, featured INTEGER DEFAULT 0, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY, src TEXT NOT NULL, alt TEXT, caption TEXT, category TEXT,
  width INTEGER, height INTEGER, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL, date TEXT,
  image TEXT, tags TEXT, excerpt TEXT, body TEXT, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, date TEXT, time TEXT, venue TEXT, city TEXT, country TEXT,
  poster TEXT, ticketPrice TEXT, ticketUrl TEXT, status TEXT DEFAULT 'upcoming',
  recapVideoId TEXT, description TEXT, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, description TEXT,
  priceCents INTEGER NOT NULL DEFAULT 0, currency TEXT DEFAULT 'UGX', images TEXT,
  sizes TEXT, colors TEXT, inventory INTEGER DEFAULT 0, active INTEGER DEFAULT 1, sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, createdAt TEXT NOT NULL, customer TEXT, items TEXT,
  totalCents INTEGER, currency TEXT, status TEXT DEFAULT 'demo_pending', demo INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY, createdAt TEXT NOT NULL, name TEXT, email TEXT, category TEXT,
  subject TEXT, message TEXT, status TEXT DEFAULT 'new', ip TEXT
);
CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, createdAt TEXT NOT NULL,
  status TEXT DEFAULT 'active', source TEXT
);
`);

export function getSetting(key, fallback = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  if (!row) return fallback;
  try { return JSON.parse(row.value); } catch { return row.value; }
}
export function setSetting(key, value) {
  db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
    .run(key, JSON.stringify(value));
}

export const JSON_FIELDS = {
  releases: ['credits', 'tracks'],
  videos: [],
  gallery: [],
  news: ['tags', 'body'],
  events: [],
  products: ['images', 'sizes', 'colors'],
  orders: ['customer', 'items'],
};

export function rowToObj(table, row) {
  if (!row) return null;
  const out = { ...row };
  for (const f of JSON_FIELDS[table] || []) {
    if (out[f] != null) { try { out[f] = JSON.parse(out[f]); } catch { out[f] = []; } }
  }
  if ('featured' in out) out.featured = !!out.featured;
  if ('active' in out) out.active = !!out.active;
  if ('demo' in out) out.demo = !!out.demo;
  return out;
}
export function allRows(table, orderBy = 'sort ASC') {
  return db.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`).all().map(r => rowToObj(table, r));
}
export function getRow(table, id) {
  return rowToObj(table, db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id));
}
export function upsertRow(table, obj) {
  const cols = Object.keys(obj);
  const vals = cols.map(c => {
    const v = obj[c];
    if ((JSON_FIELDS[table] || []).includes(c)) return JSON.stringify(v ?? []);
    if (typeof v === 'boolean') return v ? 1 : 0;
    return v ?? null;
  });
  const placeholders = cols.map(() => '?').join(',');
  const updates = cols.filter(c => c !== 'id').map(c => `${c}=excluded.${c}`).join(',');
  db.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})
    ON CONFLICT(id) DO UPDATE SET ${updates}`).run(...vals);
  return getRow(table, obj.id);
}
export function deleteRow(table, id) {
  return db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
}
