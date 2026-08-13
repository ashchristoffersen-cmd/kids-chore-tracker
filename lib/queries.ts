import { query } from './db';
import { todayStr } from './dates';
import { getChoreStreaks, TROPHY_CATALOG } from './trophies';

export async function getKidsSummary() {
  const kids = await query<any>('SELECT * FROM kids ORDER BY sort_order ASC, id ASC');
  const today = todayStr();

  const summaries = [];
  for (const kid of kids) {
    const [{ s: balanceCents }] = await query<{ s: number }>(
      'SELECT COALESCE(SUM(amount_cents), 0)::int AS s FROM transactions WHERE kid_id = $1',
      [kid.id]
    );
    const [{ c: totalChores }] = await query<{ c: number }>(
      'SELECT COUNT(*)::int AS c FROM chores WHERE kid_id = $1 AND active = 1',
      [kid.id]
    );
    const [{ c: doneToday }] = await query<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM chore_completions cc
       JOIN chores c ON c.id = cc.chore_id
       WHERE cc.kid_id = $1 AND cc.date = $2 AND c.active = 1`,
      [kid.id, today]
    );
    summaries.push({ ...kid, balanceCents, totalChores, doneToday });
  }

  return summaries;
}

export async function getKidDetail(kidId: number) {
  const [kid] = await query<any>('SELECT * FROM kids WHERE id = $1', [kidId]);
  if (!kid) return null;

  const today = todayStr();
  const chores = await query<any>(
    'SELECT * FROM chores WHERE kid_id = $1 AND active = 1 ORDER BY sort_order ASC, id ASC',
    [kidId]
  );

  const completedTodayRows = await query<{ chore_id: number }>(
    'SELECT chore_id FROM chore_completions WHERE kid_id = $1 AND date = $2',
    [kidId, today]
  );
  const completedToday = new Set(completedTodayRows.map((r) => r.chore_id));

  const streaks = await getChoreStreaks(kidId);

  const choresWithState = chores.map((c) => ({
    ...c,
    completedToday: completedToday.has(c.id),
    streak: streaks.get(c.id) || 0,
  }));

  const [{ s: balanceCents }] = await query<{ s: number }>(
    'SELECT COALESCE(SUM(amount_cents), 0)::int AS s FROM transactions WHERE kid_id = $1',
    [kidId]
  );

  const earnedTrophyRows = await query<{ trophy_id: string; earned_at: string }>(
    'SELECT trophy_id, earned_at FROM kid_trophies WHERE kid_id = $1',
    [kidId]
  );
  const earnedMap = new Map(earnedTrophyRows.map((r) => [r.trophy_id, r.earned_at]));

  const trophies = TROPHY_CATALOG.map((t) => ({
    ...t,
    earned: earnedMap.has(t.id),
    earnedAt: earnedMap.get(t.id) || null,
  }));

  return { kid, chores: choresWithState, balanceCents, trophies };
}

export async function getBank(kidId: number) {
  const [{ s: balanceCents }] = await query<{ s: number }>(
    'SELECT COALESCE(SUM(amount_cents), 0)::int AS s FROM transactions WHERE kid_id = $1',
    [kidId]
  );
  const transactions = await query(
    'SELECT * FROM transactions WHERE kid_id = $1 ORDER BY created_at DESC, id DESC LIMIT 100',
    [kidId]
  );
  return { balanceCents, transactions };
}
