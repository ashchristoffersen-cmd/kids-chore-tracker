import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { getDb } from './db';

const PIN_HASH_KEY = 'parent_pin_hash';

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
