import crypto from 'node:crypto';
import { getJSON, setJSON } from './store.mjs';

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
export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const sessions = await getJSON('sessions', {});
  sessions[tokenHash] = { userId, expiresAt: Date.now() + 1000 * 60 * 60 * 12 };
  // prune expired
  for (const k of Object.keys(sessions)) if (sessions[k].expiresAt < Date.now()) delete sessions[k];
  await setJSON('sessions', sessions);
  return token;
}
export async function getSessionUser(token) {
  if (!token) return null;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const sessions = await getJSON('sessions', {});
  const s = sessions[tokenHash];
  if (!s || s.expiresAt < Date.now()) return null;
  const users = await getJSON('adminUsers', []);
  return users.find(u => u.id === s.userId) || null;
}
export async function destroySession(token) {
  if (!token) return;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const sessions = await getJSON('sessions', {});
  delete sessions[tokenHash]; await setJSON('sessions', sessions);
}
const attempts = new Map();
export function rateLimit(key, max, windowMs) {
  const now = Date.now(); const arr = (attempts.get(key) || []).filter(t => now - t < windowMs);
  if (arr.length >= max) return false; arr.push(now); attempts.set(key, arr); return true;
}
