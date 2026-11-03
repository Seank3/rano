import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, getSetting, setSetting } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const secretFile = path.join(__dirname, 'data', '.session-secret');

export function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  let s = getSetting('sessionSecret');
  if (!s) {
    s = crypto.randomBytes(32).toString('hex');
    setSetting('sessionSecret', s);
    try { fs.writeFileSync(secretFile, s, { mode: 0o600 }); } catch {}
  }
  return s;
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex'); const b = Buffer.from(test, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = Date.now() + 1000 * 60 * 60 * 12; // 12h
  db.prepare('INSERT INTO sessions(tokenHash,userId,expiresAt,createdAt) VALUES(?,?,?,?)')
    .run(tokenHash, userId, expiresAt, new Date().toISOString());
  return { token, expiresAt };
}
export function getSessionUser(token) {
  if (!token) return null;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const row = db.prepare('SELECT * FROM sessions WHERE tokenHash = ?').get(tokenHash);
  if (!row || row.expiresAt < Date.now()) return null;
  const user = db.prepare('SELECT id,email,createdAt FROM admin_users WHERE id = ?').get(row.userId);
  return user || null;
}
export function destroySession(token) {
  if (!token) return;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  db.prepare('DELETE FROM sessions WHERE tokenHash = ?').run(tokenHash);
}
export function cleanSessions() {
  db.prepare('DELETE FROM sessions WHERE expiresAt < ?').run(Date.now());
}

const attempts = new Map();
export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const arr = (attempts.get(key) || []).filter(t => now - t < windowMs);
  if (arr.length >= max) return false;
  arr.push(now); attempts.set(key, arr);
  return true;
}
