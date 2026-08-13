import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isPinSet, setPin, verifyPin } from '../lib/auth';
import { makeTestDb } from './helpers/db';

describe('parent PIN auth', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = makeTestDb();
    global.__choreDb = db;
  });

  afterEach(() => {
    global.__choreDb = undefined;
    db.close();
  });

  it('reports no PIN before one is set', () => {
    expect(isPinSet()).toBe(false);
    expect(verifyPin('1234')).toBe(false);
  });

  it('accepts the PIN it was given and rejects others', () => {
    setPin('1234');
    expect(isPinSet()).toBe(true);
    expect(verifyPin('1234')).toBe(true);
    expect(verifyPin('4321')).toBe(false);
    expect(verifyPin('')).toBe(false);
    expect(verifyPin('12345')).toBe(false);
  });

  it('stores a salted hash rather than the PIN itself', () => {
    setPin('1234');
    const { value } = db.prepare("SELECT value FROM settings WHERE key = 'parent_pin_hash'").get() as {
      value: string;
    };
    const [salt, hash] = value.split(':');
    expect(salt).toHaveLength(32);
    expect(hash).toHaveLength(64);
    expect(value).not.toContain('1234');
  });

  it('uses a fresh salt each time so the same PIN hashes differently', () => {
    setPin('1234');
    const first = (db.prepare("SELECT value FROM settings WHERE key = 'parent_pin_hash'").get() as { value: string })
      .value;
    setPin('1234');
    const second = (db.prepare("SELECT value FROM settings WHERE key = 'parent_pin_hash'").get() as { value: string })
      .value;

    expect(second).not.toBe(first);
    expect(verifyPin('1234')).toBe(true);
  });

  it('replaces the old PIN on change instead of adding a row', () => {
    setPin('1111');
    setPin('2222');
    expect(verifyPin('1111')).toBe(false);
    expect(verifyPin('2222')).toBe(true);
    const count = (db.prepare('SELECT COUNT(*) AS c FROM settings').get() as { c: number }).c;
    expect(count).toBe(1);
  });

  it('supports non-numeric PINs', () => {
    setPin('sekrit-🔒');
    expect(verifyPin('sekrit-🔒')).toBe(true);
    expect(verifyPin('sekrit')).toBe(false);
  });
});
