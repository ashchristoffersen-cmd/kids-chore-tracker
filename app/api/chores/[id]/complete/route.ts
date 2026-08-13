import { NextRequest, NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { todayStr } from '@/lib/dates';
import { evaluateAndAwardTrophies } from '@/lib/trophies';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const choreId = Number(params.id);
  const [chore] = await query<any>('SELECT * FROM chores WHERE id = $1', [choreId]);
  if (!chore) return NextResponse.json({ error: 'Chore not found' }, { status: 404 });

  const today = todayStr();
  const [existing] = await query<any>('SELECT * FROM chore_completions WHERE chore_id = $1 AND date = $2', [
    choreId,
    today,
  ]);

  let completed: boolean;

  if (existing) {
    await withTransaction(async (q) => {
      await q('DELETE FROM transactions WHERE chore_completion_id = $1', [existing.id]);
      await q('DELETE FROM chore_completions WHERE id = $1', [existing.id]);
    });
    completed = false;
  } else {
    await withTransaction(async (q) => {
      const [inserted] = await q<{ id: number }>(
        'INSERT INTO chore_completions (chore_id, kid_id, date) VALUES ($1, $2, $3) RETURNING id',
        [choreId, chore.kid_id, today]
      );
      if (chore.money_cents > 0) {
        await q(
          `INSERT INTO transactions (kid_id, amount_cents, reason, type, chore_completion_id)
           VALUES ($1, $2, $3, 'chore', $4)`,
          [chore.kid_id, chore.money_cents, `Completed: ${chore.name}`, inserted.id]
        );
      }
    });
    completed = true;
  }

  const newTrophies = completed ? await evaluateAndAwardTrophies(chore.kid_id) : [];

  const [{ s: balanceCents }] = await query<{ s: number }>(
    'SELECT COALESCE(SUM(amount_cents), 0)::int AS s FROM transactions WHERE kid_id = $1',
    [chore.kid_id]
  );

  return NextResponse.json({ completed, newTrophies, balanceCents });
}
