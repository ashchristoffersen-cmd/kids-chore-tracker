import Database from 'better-sqlite3';
import { migrate } from '../../lib/db';

/** Fresh in-memory database with the production schema and trophy catalog. */
export function makeTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

export function addKid(db: Database.Database, name = 'Kid', sortOrder = 0): number {
  const info = db
    .prepare('INSERT INTO kids (name, avatar, color, sort_order) VALUES (?, ?, ?, ?)')
    .run(name, '🦁', '#4fc3f7', sortOrder);
  return Number(info.lastInsertRowid);
}

export function addChore(
  db: Database.Database,
  kidId: number,
  opts: { name?: string; moneyCents?: number; active?: boolean; sortOrder?: number } = {}
): number {
  const info = db
    .prepare('INSERT INTO chores (kid_id, name, emoji, money_cents, sort_order, active) VALUES (?, ?, ?, ?, ?, ?)')
    .run(
      kidId,
      opts.name ?? 'Make bed',
      '🛏️',
      opts.moneyCents ?? 0,
      opts.sortOrder ?? 0,
      opts.active === false ? 0 : 1
    );
  return Number(info.lastInsertRowid);
}

/** Completes a chore on a date. `time` is a local 'HH:MM' used for the completed_at timestamp. */
export function complete(
  db: Database.Database,
  choreId: number,
  kidId: number,
  date: string,
  time = '12:00'
): number {
  const info = db
    .prepare('INSERT INTO chore_completions (chore_id, kid_id, date, completed_at) VALUES (?, ?, ?, ?)')
    .run(choreId, kidId, date, localTimestampToUtc(date, time));
  return Number(info.lastInsertRowid);
}

export function addTransaction(
  db: Database.Database,
  kidId: number,
  amountCents: number,
  type: 'chore' | 'manual' | 'withdrawal',
  reason = 'test'
): number {
  const info = db
    .prepare('INSERT INTO transactions (kid_id, amount_cents, reason, type) VALUES (?, ?, ?, ?)')
    .run(kidId, amountCents, reason, type);
  return Number(info.lastInsertRowid);
}

/**
 * SQLite stores completed_at in UTC and queries convert it back with 'localtime',
 * so tests that care about the local clock must store the UTC equivalent.
 */
function localTimestampToUtc(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const local = new Date(y, m - 1, d, hh, mm, 0);
  return local.toISOString().slice(0, 19).replace('T', ' ');
}
