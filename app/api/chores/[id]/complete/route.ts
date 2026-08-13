import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { todayStr } from '@/lib/dates';
import { evaluateAndAwardTrophies } from '@/lib/trophies';
import { parseId } from '@/lib/validate';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const choreId = parseId(params.id);
  if (!choreId) return NextResponse.json({ error: 'Invalid chore id' }, { status: 400 });
  const db = getDb();
  const chore = db.prepare('SELECT * FROM chores WHERE id = ?').get(choreId) as any;
  if (!chore) return NextResponse.json({ error: 'Chore not found' }, { status: 404 });

  const today = todayStr();
  const existing = db
    .prepare('SELECT * FROM chore_completions WHERE chore_id = ? AND date = ?')
    .get(choreId, today) as any;

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

  const newTrophies = completed ? evaluateAndAwardTrophies(db, chore.kid_id) : [];

  const balanceCents = (
    db.prepare('SELECT COALESCE(SUM(amount_cents), 0) AS s FROM transactions WHERE kid_id = ?').get(chore.kid_id) as {
      s: number;
    }
  ).s;

  return NextResponse.json({ completed, newTrophies, balanceCents });
}
