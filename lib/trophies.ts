import { addDays, todayStr } from './dates';
import { query } from './db';

export interface TrophyDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface KidStats {
  totalCompletions: number;
  totalMoneyCents: number;
  bestChoreStreak: number;
  perfectDayStreak: number;
  earlyBird: boolean;
  weekendWarrior: boolean;
  comebackKid: boolean;
  allRounder: boolean;
}

// The full trophy case. Add more here any time — evaluation just loops the list.
export const TROPHY_CATALOG: TrophyDef[] = [
  { id: 'first_steps', name: 'First Steps', description: 'Complete your very first chore', icon: '👣' },
  { id: 'ten_star', name: 'Rising Star', description: 'Complete 10 chores total', icon: '⭐' },
  { id: 'chore_champion', name: 'Chore Champion', description: 'Complete 50 chores total', icon: '🏆' },
  { id: 'century_club', name: 'Century Club', description: 'Complete 100 chores total', icon: '💯' },
  { id: 'chore_legend', name: 'Chore Legend', description: 'Complete 500 chores total', icon: '🐉' },

  { id: 'streak_3', name: '3-Day Streak', description: 'Do the same chore 3 days in a row', icon: '🔥' },
  { id: 'streak_7', name: 'Week Warrior', description: 'Do the same chore 7 days in a row', icon: '🗓️' },
  { id: 'streak_14', name: 'Two-Week Titan', description: 'Do the same chore 14 days in a row', icon: '💪' },
  { id: 'streak_30', name: 'Monthly Master', description: 'Do the same chore 30 days in a row', icon: '🌙' },
  { id: 'streak_100', name: 'Streak Legend', description: 'Do the same chore 100 days in a row', icon: '👑' },

  { id: 'perfect_day', name: 'Perfect Day', description: 'Finish every chore in one day', icon: '🌟' },
  { id: 'perfect_week', name: 'Perfect Week', description: 'A perfect day, 7 days in a row', icon: '🎯' },
  { id: 'perfect_month', name: 'Perfect Month', description: 'A perfect day, 30 days in a row', icon: '🏅' },

  { id: 'comeback_kid', name: 'Comeback Kid', description: 'Bounce back and start a new streak after breaking one', icon: '🔁' },
  { id: 'early_bird', name: 'Early Bird', description: 'Complete a chore before 9am', icon: '🌅' },
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Finish every chore on both Saturday and Sunday', icon: '🎪' },
  { id: 'all_rounder', name: 'All-Rounder', description: 'Complete every one of your chores at least once', icon: '🎨' },

  { id: 'first_dollar', name: 'First Dollar', description: 'Earn your first $1 from chores', icon: '🪙' },
  { id: 'big_saver', name: 'Big Saver', description: 'Earn $10 total from chores', icon: '💰' },
  { id: 'piggy_bank_pro', name: 'Piggy Bank Pro', description: 'Earn $50 total from chores', icon: '🐷' },
  { id: 'money_master', name: 'Money Master', description: 'Earn $100 total from chores', icon: '💎' },
];

export function currentStreakFromDates(dateSet: Set<string>, today: string): number {
  let cursor = today;
  if (!dateSet.has(cursor)) {
    cursor = addDays(cursor, -1);
  }
  let streak = 0;
  while (dateSet.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Current consecutive-day streak for each of a kid's chores, keyed by chore id. */
export async function getChoreStreaks(kidId: number): Promise<Map<number, number>> {
  const today = todayStr();
  const rows = await query<{ chore_id: number; date: string }>(
    'SELECT chore_id, date FROM chore_completions WHERE kid_id = $1 ORDER BY date ASC',
    [kidId]
  );

  const datesByChore = new Map<number, Set<string>>();
  for (const row of rows) {
    if (!datesByChore.has(row.chore_id)) datesByChore.set(row.chore_id, new Set());
    datesByChore.get(row.chore_id)!.add(row.date);
  }

  const streaks = new Map<number, number>();
  for (const [choreId, dates] of datesByChore) {
    streaks.set(choreId, currentStreakFromDates(dates, today));
  }
  return streaks;
}

export async function computeKidStats(kidId: number): Promise<KidStats> {
  const today = todayStr();

  const [{ c: totalCompletions }] = await query<{ c: number }>(
    'SELECT COUNT(*)::int AS c FROM chore_completions WHERE kid_id = $1',
    [kidId]
  );

  const [{ s: totalMoneyCents }] = await query<{ s: number }>(
    `SELECT COALESCE(SUM(amount_cents), 0)::int AS s FROM transactions WHERE kid_id = $1 AND type = 'chore'`,
    [kidId]
  );

  const activeChores = await query<{ id: number }>('SELECT id FROM chores WHERE kid_id = $1 AND active = 1', [
    kidId,
  ]);
  const activeChoreIds = activeChores.map((c) => c.id);

  const completionRows = await query<{ chore_id: number; date: string; completed_at: string }>(
    'SELECT chore_id, date, completed_at FROM chore_completions WHERE kid_id = $1 ORDER BY date ASC',
    [kidId]
  );

  const datesByChore = new Map<number, string[]>();
  const distinctChoreIdsCompleted = new Set<number>();
  for (const row of completionRows) {
    distinctChoreIdsCompleted.add(row.chore_id);
    if (!datesByChore.has(row.chore_id)) datesByChore.set(row.chore_id, []);
    datesByChore.get(row.chore_id)!.push(row.date);
  }

  let bestChoreStreak = 0;
  let comebackKid = false;

  for (const [, dates] of datesByChore) {
    const dateSet = new Set(dates);
    const streak = currentStreakFromDates(dateSet, today);
    if (streak > bestChoreStreak) bestChoreStreak = streak;

    // Detect runs of consecutive days to spot a broken 3+ streak followed by a new one.
    const runs: number[] = [];
    let runLen = 0;
    let prev: string | null = null;
    for (const d of dates) {
      if (prev && addDays(prev, 1) === d) {
        runLen += 1;
      } else {
        if (runLen > 0) runs.push(runLen);
        runLen = 1;
      }
      prev = d;
    }
    if (runLen > 0) runs.push(runLen);
    for (let i = 1; i < runs.length; i++) {
      if (runs[i - 1] >= 3) comebackKid = true;
    }
  }

  const earlyBird = completionRows.some((row) => new Date(row.completed_at).getHours() < 9);

  // Perfect-day tracking uses only currently active chores.
  const dateCompletionCounts = new Map<string, Set<number>>();
  for (const row of completionRows) {
    if (!activeChoreIds.includes(row.chore_id)) continue;
    if (!dateCompletionCounts.has(row.date)) dateCompletionCounts.set(row.date, new Set());
    dateCompletionCounts.get(row.date)!.add(row.chore_id);
  }
  const perfectDates = new Set<string>();
  if (activeChoreIds.length > 0) {
    for (const [date, choreIds] of dateCompletionCounts) {
      if (choreIds.size >= activeChoreIds.length) perfectDates.add(date);
    }
  }
  const perfectDayStreak = currentStreakFromDates(perfectDates, today);

  let weekendWarrior = false;
  for (const date of perfectDates) {
    const [y, m, d] = date.split('-').map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    if (dow === 6 && perfectDates.has(addDays(date, 1))) {
      weekendWarrior = true;
      break;
    }
  }

  const allRounder = activeChoreIds.length > 0 && activeChoreIds.every((id) => distinctChoreIdsCompleted.has(id));

  return {
    totalCompletions,
    totalMoneyCents,
    bestChoreStreak,
    perfectDayStreak,
    earlyBird,
    weekendWarrior,
    comebackKid,
    allRounder,
  };
}

function isTrophyEarned(id: string, s: KidStats): boolean {
  switch (id) {
    case 'first_steps':
      return s.totalCompletions >= 1;
    case 'ten_star':
      return s.totalCompletions >= 10;
    case 'chore_champion':
      return s.totalCompletions >= 50;
    case 'century_club':
      return s.totalCompletions >= 100;
    case 'chore_legend':
      return s.totalCompletions >= 500;
    case 'streak_3':
      return s.bestChoreStreak >= 3;
    case 'streak_7':
      return s.bestChoreStreak >= 7;
    case 'streak_14':
      return s.bestChoreStreak >= 14;
    case 'streak_30':
      return s.bestChoreStreak >= 30;
    case 'streak_100':
      return s.bestChoreStreak >= 100;
    case 'perfect_day':
      return s.perfectDayStreak >= 1;
    case 'perfect_week':
      return s.perfectDayStreak >= 7;
    case 'perfect_month':
      return s.perfectDayStreak >= 30;
    case 'comeback_kid':
      return s.comebackKid;
    case 'early_bird':
      return s.earlyBird;
    case 'weekend_warrior':
      return s.weekendWarrior;
    case 'all_rounder':
      return s.allRounder;
    case 'first_dollar':
      return s.totalMoneyCents >= 100;
    case 'big_saver':
      return s.totalMoneyCents >= 1000;
    case 'piggy_bank_pro':
      return s.totalMoneyCents >= 5000;
    case 'money_master':
      return s.totalMoneyCents >= 10000;
    default:
      return false;
  }
}

/** Evaluates all trophies for a kid, awards any newly-earned ones, and returns them. */
export async function evaluateAndAwardTrophies(kidId: number): Promise<TrophyDef[]> {
  const stats = await computeKidStats(kidId);
  const alreadyEarnedRows = await query<{ trophy_id: string }>(
    'SELECT trophy_id FROM kid_trophies WHERE kid_id = $1',
    [kidId]
  );
  const alreadyEarned = new Set(alreadyEarnedRows.map((r) => r.trophy_id));

  const newlyEarned: TrophyDef[] = [];

  for (const trophy of TROPHY_CATALOG) {
    if (alreadyEarned.has(trophy.id)) continue;
    if (isTrophyEarned(trophy.id, stats)) {
      await query('INSERT INTO kid_trophies (kid_id, trophy_id) VALUES ($1, $2)', [kidId, trophy.id]);
      newlyEarned.push(trophy);
    }
  }

  return newlyEarned;
}
