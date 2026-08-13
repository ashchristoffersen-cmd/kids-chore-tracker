import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { getDb } from './db';

const PIN_HASH_KEY = 'parent_pin_hash';

export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

function hashPin(pin: string, salt: string): string {
  return scryptSync(pin, salt, 32).toString('hex');
}

function getSetting(key: string): string | undefined {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value;
}

export function isPinSet(): boolean {
  return getSetting(PIN_HASH_KEY) !== undefined;
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
  const stored = getSetting(PIN_HASH_KEY);
  if (!stored) return false;
  const [salt, storedHash] = stored.split(':');
  const candidate = hashPin(pin, salt);
  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
