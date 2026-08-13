import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getDb } from './db';

const PIN_HASH_KEY = 'parent_pin_hash';
const SESSION_SECRET_KEY = 'session_secret';

export const SESSION_COOKIE = 'parent_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function hashPin(pin: string, salt: string): string {
  return scryptSync(pin, salt, 32).toString('hex');
}

export function isPinSet(): boolean {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(PIN_HASH_KEY);
  return !!row;
}

export function setPin(pin: string): void {
  const db = getDb();
  const salt = randomBytes(16).toString('hex');
  const hash = hashPin(pin, salt);
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(PIN_HASH_KEY, `${salt}:${hash}`);
}

export function verifyPin(pin: string): boolean {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(PIN_HASH_KEY) as
    | { value: string }
    | undefined;
  if (!row) return false;
  const [salt, storedHash] = row.value.split(':');
  const candidate = hashPin(pin, salt);
  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function getSessionSecret(): string {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(SESSION_SECRET_KEY) as
    | { value: string }
    | undefined;
  if (row) return row.value;
  const secret = randomBytes(32).toString('hex');
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(SESSION_SECRET_KEY, secret);
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('hex');
}

export function createSessionToken(): string {
  const payload = `${Date.now() + SESSION_TTL_MS}.${randomBytes(8).toString('hex')}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const idx = token.lastIndexOf('.');
  if (idx < 0) return false;
  const payload = token.slice(0, idx);
  const signature = token.slice(idx + 1);
  const expected = Buffer.from(sign(payload), 'hex');
  const provided = Buffer.from(signature, 'hex');
  if (expected.length !== provided.length) return false;
  if (!timingSafeEqual(expected, provided)) return false;
  const expiresAt = Number(payload.split('.')[0]);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function isParentAuthed(req: NextRequest): boolean {
  return isValidSessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

/**
 * Returns a 401 response when the request has no valid parent session, or
 * null when the caller may proceed.
 */
export function requireParent(req: NextRequest): NextResponse | null {
  if (isParentAuthed(req)) return null;
  return NextResponse.json({ error: 'Parent authentication required' }, { status: 401 });
}

export function setSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set({
    name: SESSION_COOKIE,
    value: createSessionToken(),
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
  return res;
}

export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set({ name: SESSION_COOKIE, value: '', path: '/', maxAge: 0 });
  return res;
}

const attempts = new Map<string, { count: number; firstAt: number }>();

export function pinLockoutRemainingMs(key: string): number {
  const entry = attempts.get(key);
  if (!entry) return 0;
  const elapsed = Date.now() - entry.firstAt;
  if (elapsed > LOCKOUT_MS) {
    attempts.delete(key);
    return 0;
  }
  if (entry.count < MAX_ATTEMPTS) return 0;
  return LOCKOUT_MS - elapsed;
}

export function recordFailedPinAttempt(key: string): void {
  const entry = attempts.get(key);
  if (!entry || Date.now() - entry.firstAt > LOCKOUT_MS) {
    attempts.set(key, { count: 1, firstAt: Date.now() });
    return;
  }
  entry.count += 1;
}

export function clearPinAttempts(key: string): void {
  attempts.delete(key);
}

export function clientKey(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
}
