import type Database from 'better-sqlite3';
import { todayStr } from './dates';
import { getChoreStreaks, TROPHY_CATALOG, TrophyDef } from './trophies';

export interface TrophyStatus extends TrophyDef {
  earned: boolean;
  earnedAt: string | null;
}

/** Total piggy-bank balance for a kid, in cents. */
export function getBalanceCents(db: Database.Database, kidId: number): number {
  return (
    db.prepare('SELECT COALESCE(SUM(amount_cents), 0) AS s FROM transactions WHERE kid_id = ?').get(kidId) as {
      s: number;
    }
  ).s;
}

/** The whole trophy catalog, annotated with whether this kid has earned each one. */
export function getTrophyStatus(db: Database.Database, kidId: number): TrophyStatus[] {
  const earnedRows = db
    .prepare('SELECT trophy_id, earned_at FROM kid_trophies WHERE kid_id = ?')
    .all(kidId) as { trophy_id: string; earned_at: string }[];
  const earnedMap = new Map(earnedRows.map((r) => [r.trophy_id, r.earned_at]));

  return TROPHY_CATALOG.map((t) => ({
    ...t,
    earned: earnedMap.has(t.id),
    earnedAt: earnedMap.get(t.id) || null,
  }));
}

export function getKidsSummary(db: Database.Database) {
  const kids = db.prepare('SELECT * FROM kids ORDER BY sort_order ASC, id ASC').all() as any[];
  const today = todayStr();

  return kids.map((kid) => {
    const balanceCents = getBalanceCents(db, kid.id);
    const totalChores = (
      db.prepare('SELECT COUNT(*) AS c FROM chores WHERE kid_id = ? AND active = 1').get(kid.id) as { c: number }
    ).c;
    const doneToday = (
      db
        .prepare(
          `SELECT COUNT(*) AS c FROM chore_completions cc
           JOIN chores c ON c.id = cc.chore_id
           WHERE cc.kid_id = ? AND cc.date = ? AND c.active = 1`
        )
        .get(kid.id, today) as { c: number }
    ).c;
    return { ...kid, balanceCents, totalChores, doneToday };
  });
}

export function getKidDetail(db: Database.Database, kidId: number) {
  const kid = db.prepare('SELECT * FROM kids WHERE id = ?').get(kidId) as any;
  if (!kid) return null;

  const today = todayStr();
  const chores = db
    .prepare('SELECT * FROM chores WHERE kid_id = ? AND active = 1 ORDER BY sort_order ASC, id ASC')
    .all(kidId) as any[];

  const completedToday = new Set(
    (
      db
        .prepare('SELECT chore_id FROM chore_completions WHERE kid_id = ? AND date = ?')
        .all(kidId, today) as { chore_id: number }[]
    ).map((r) => r.chore_id)
  );

  const streaks = getChoreStreaks(db, kidId);

  const choresWithState = chores.map((c) => ({
    ...c,
    completedToday: completedToday.has(c.id),
    streak: streaks.get(c.id) || 0,
  }));

  return {
    kid,
    chores: choresWithState,
    balanceCents: getBalanceCents(db, kidId),
    trophies: getTrophyStatus(db, kidId),
  };
}

export function getBank(db: Database.Database, kidId: number) {
  const balanceCents = getBalanceCents(db, kidId);
  const transactions = db
    .prepare('SELECT * FROM transactions WHERE kid_id = ? ORDER BY created_at DESC, id DESC LIMIT 100')
    .all(kidId);
  return { balanceCents, transactions };
}
