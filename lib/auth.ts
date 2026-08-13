import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { query } from './db';

const PIN_HASH_KEY = 'parent_pin_hash';

function hashPin(pin: string, salt: string): string {
  return scryptSync(pin, salt, 32).toString('hex');
}

export async function isPinSet(): Promise<boolean> {
  const rows = await query<{ value: string }>('SELECT value FROM settings WHERE key = $1', [PIN_HASH_KEY]);
  return rows.length > 0;
}

export async function setPin(pin: string): Promise<void> {
  const salt = randomBytes(16).toString('hex');
  const hash = hashPin(pin, salt);
  await query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [PIN_HASH_KEY, `${salt}:${hash}`]
  );
}

export async function verifyPin(pin: string): Promise<boolean> {
  const rows = await query<{ value: string }>('SELECT value FROM settings WHERE key = $1', [PIN_HASH_KEY]);
  if (rows.length === 0) return false;
  const [salt, storedHash] = rows[0].value.split(':');
  const candidate = hashPin(pin, salt);
  const a = Buffer.from(candidate, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
