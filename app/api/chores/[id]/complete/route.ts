import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { todayStr } from '@/lib/dates';
import { evaluateAndAwardTrophies } from '@/lib/trophies';
import { notFound, parseIdParam, route } from '@/lib/api';

type Ctx = { params: { id: string } };

export const POST = route<Ctx>(async (_req, { params }) => {
  const choreId = parseIdParam(params.id, 'chore id');
  const db = getDb();
  const chore = db.prepare('SELECT * FROM chores WHERE id = ?').get(choreId) as
    | { id: number; kid_id: number; name: string; money_cents: number }
    | undefined;
  if (!chore) throw notFound('Chore not found');

  const today = todayStr();
  const existing = db
    .prepare('SELECT * FROM chore_completions WHERE chore_id = ? AND date = ?')
    .get(choreId, today) as { id: number } | undefined;

  let completed: boolean;

  if (existing) {
    const uncomplete = db.transaction(() => {
      db.prepare('DELETE FROM transactions WHERE chore_completion_id = ?').run(existing.id);
      db.prepare('DELETE FROM chore_completions WHERE id = ?').run(existing.id);
    });
    uncomplete();
    completed = false;
  } else {
    const complete = db.transaction(() => {
      const info = db
        .prepare('INSERT INTO chore_completions (chore_id, kid_id, date) VALUES (?, ?, ?)')
        .run(choreId, chore.kid_id, today);
      if (chore.money_cents > 0) {
        db.prepare(
          `INSERT INTO transactions (kid_id, amount_cents, reason, type, chore_completion_id)
           VALUES (?, ?, ?, 'chore', ?)`
        ).run(chore.kid_id, chore.money_cents, `Completed: ${chore.name}`, info.lastInsertRowid);
      }
    });
    complete();
    completed = true;
  }

  // Trophy evaluation is a bonus on top of the completion that already
  // committed — never fail the request (and lose the toggle) because of it.
  let newTrophies: ReturnType<typeof evaluateAndAwardTrophies> = [];
  if (completed) {
    try {
      newTrophies = evaluateAndAwardTrophies(db, chore.kid_id);
    } catch (err) {
      console.error(`[api] trophy evaluation failed for kid ${chore.kid_id}:`, err);
    }
  }

  const balanceCents = (
    db.prepare('SELECT COALESCE(SUM(amount_cents), 0) AS s FROM transactions WHERE kid_id = ?').get(chore.kid_id) as {
      s: number;
    }
  ).s;

  return NextResponse.json({ completed, newTrophies, balanceCents });
});
