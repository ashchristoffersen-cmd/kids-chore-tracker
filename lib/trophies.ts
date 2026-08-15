import { addDays, dayOfWeek, hourInAppTimezone, toDateStr, todayStr } from './dates';
import { query } from './db';

export interface TrophyDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface ChoreRow {
  id: number;
  name: string;
  active: number;
  created_at: string | Date;
  archived_at: string | Date | null;
}

export interface KidStats {
  totalCompletions: number;
  totalMoneyCents: number;
  perfectDayStreak: number;
  earlyBird: boolean;
  nightOwl: boolean;
  weekendWarrior: boolean;
  weekdayHero: boolean;
  comebackKid: boolean;
  allRounder: boolean;
  freshStart: boolean;
  activeChores: { id: number; name: string }[];
  choreStreaks: Map<number, number>;
}

const COMPLETION_MILESTONES: { n: number; name: string; icon: string }[] = [
  { n: 1, name: 'First Steps', icon: '👣' },
  { n: 5, name: 'Getting Started', icon: '🌟' },
  { n: 10, name: 'Rising Star', icon: '⭐' },
  { n: 25, name: 'Quarter Century', icon: '🎖️' },
  { n: 50, name: 'Chore Champion', icon: '🏆' },
  { n: 75, name: 'Chore Master', icon: '🥇' },
  { n: 100, name: 'Century Club', icon: '💯' },
  { n: 150, name: 'Chore Pro', icon: '🚀' },
  { n: 200, name: 'Double Century', icon: '🎯' },
  { n: 300, name: 'Chore Wizard', icon: '🧙' },
  { n: 500, name: 'Chore Legend', icon: '🐉' },
  { n: 750, name: 'Unstoppable', icon: '⚡' },
  { n: 1000, name: 'Chore Titan', icon: '🗿' },
  { n: 1500, name: 'Chore Icon', icon: '👑' },
  { n: 2000, name: 'Hall of Fame', icon: '🏛️' },
];

const MONEY_MILESTONES: { cents: number; name: string; icon: string }[] = [
  { cents: 100, name: 'First Dollar', icon: '🪙' },
  { cents: 500, name: 'Small Saver', icon: '💵' },
  { cents: 1000, name: 'Big Saver', icon: '💰' },
  { cents: 2500, name: 'Money Maker', icon: '🤑' },
  { cents: 5000, name: 'Piggy Bank Pro', icon: '🐷' },
  { cents: 7500, name: 'Cash Collector', icon: '💵' },
  { cents: 10000, name: 'Money Master', icon: '💎' },
  { cents: 15000, name: 'Wealth Builder', icon: '🏦' },
  { cents: 20000, name: 'Fortune Founder', icon: '🪙' },
  { cents: 30000, name: 'Treasure Hunter', icon: '🗝️' },
  { cents: 50000, name: 'Big Baller', icon: '💸' },
  { cents: 75000, name: 'Money Mogul', icon: '🏆' },
  { cents: 100000, name: 'Millionaire in Training', icon: '👑' },
];

const PERFECT_DAY_MILESTONES: { n: number; name: string; icon: string }[] = [
  { n: 1, name: 'Perfect Day', icon: '🌟' },
  { n: 3, name: 'Perfect 3', icon: '✨' },
  { n: 5, name: 'Perfect 5', icon: '🌈' },
  { n: 7, name: 'Perfect Week', icon: '🎯' },
  { n: 14, name: 'Perfect Fortnight', icon: '🎇' },
  { n: 21, name: 'Three Perfect Weeks', icon: '🎆' },
  { n: 30, name: 'Perfect Month', icon: '🏅' },
  { n: 60, name: 'Two Perfect Months', icon: '🥈' },
  { n: 90, name: 'Perfect Quarter', icon: '🥇' },
  { n: 180, name: 'Perfect Half-Year', icon: '🏵️' },
  { n: 365, name: 'Perfect Year', icon: '🎊' },
];

const CHORE_STREAK_MILESTONES: { days: number; label: string; icon: string }[] = [
  { days: 3, label: '3-Day Streak', icon: '🔥' },
  { days: 7, label: 'Week Warrior', icon: '🗓️' },
  { days: 14, label: 'Two-Week Titan', icon: '💪' },
  { days: 30, label: 'Monthly Master', icon: '🌙' },
  { days: 100, label: 'Streak Legend', icon: '👑' },
];

const FUN_TROPHIES: TrophyDef[] = [
  { id: 'comeback_kid', name: 'Comeback Kid', description: 'Bounce back and start a new streak after breaking one', icon: '🔁' },
  { id: 'early_bird', name: 'Early Bird', description: 'Complete a chore before 9am', icon: '🌅' },
  { id: 'night_owl', name: 'Night Owl', description: 'Complete a chore after 8pm', icon: '🦉' },
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Finish every chore on both Saturday and Sunday', icon: '🎪' },
  { id: 'weekday_hero', name: 'Weekday Hero', description: 'Finish every chore Monday through Friday', icon: '🦸' },
  { id: 'all_rounder', name: 'All-Rounder', description: 'Complete every one of your chores at least once', icon: '🎨' },
  { id: 'double_digits', name: 'Double Digits', description: 'Have 10 or more chores on your list at once', icon: '🔟' },
  { id: 'fresh_start', name: 'Fresh Start', description: 'Complete a chore on the first day of the month', icon: '🌱' },
];

function completionMilestoneId(n: number) {
  return `completions_${n}`;
}
function moneyMilestoneId(cents: number) {
  return `money_${cents}`;
}
function perfectDayMilestoneId(n: number) {
  return `perfect_${n}`;
}
export function choreStreakTrophyId(choreId: number, days: number) {
  return `streak_${days}_chore_${choreId}`;
}

/** Builds the full trophy catalog for a kid, given their currently active chores. */
export function buildTrophyCatalog(activeChores: { id: number; name: string }[]): TrophyDef[] {
  const completions = COMPLETION_MILESTONES.map((m) => ({
    id: completionMilestoneId(m.n),
    name: m.name,
    description: `Complete ${m.n} chore${m.n === 1 ? '' : 's'} total`,
    icon: m.icon,
  }));

  const money = MONEY_MILESTONES.map((m) => ({
    id: moneyMilestoneId(m.cents),
    name: m.name,
    description: `Earn $${(m.cents / 100).toFixed(m.cents % 100 === 0 ? 0 : 2)} total from chores`,
    icon: m.icon,
  }));

  const perfectDays = PERFECT_DAY_MILESTONES.map((m) => ({
    id: perfectDayMilestoneId(m.n),
    name: m.name,
    description: m.n === 1 ? 'Finish every chore in one day' : `A perfect day, ${m.n} days in a row`,
    icon: m.icon,
  }));

  const perChoreStreaks = activeChores.flatMap((chore) =>
    CHORE_STREAK_MILESTONES.map((m) => ({
      id: choreStreakTrophyId(chore.id, m.days),
      name: `${m.label}: ${chore.name}`,
      description: `Do "${chore.name}" ${m.days} days in a row`,
      icon: m.icon,
    }))
  );

  return [...completions, ...money, ...perfectDays, ...FUN_TROPHIES, ...perChoreStreaks];
}

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

interface ChoreLifecycle {
  id: number;
  createdDate: string;
  archivedDate: string | null;
}

/** Was this chore part of the kid's active list on the given date? Archiving or adding a
 * chore today must never change the answer for a past date, so this is date-of-record aware
 * rather than based on the chore's *current* active flag. */
function wasChoreRequiredOnDate(chore: ChoreLifecycle, date: string): boolean {
  if (chore.createdDate > date) return false;
  if (chore.archivedDate && chore.archivedDate < date) return false;
  return true;
}

export async function computeKidStats(kidId: number): Promise<KidStats> {
  const today = todayStr();

  const [totalMoneyRows, allChores, completionRows] = await Promise.all([
    query<{ s: number }>(
      `SELECT COALESCE(SUM(amount_cents), 0)::int AS s FROM transactions WHERE kid_id = $1 AND type = 'chore'`,
      [kidId]
    ),
    query<ChoreRow>('SELECT id, name, active, created_at, archived_at FROM chores WHERE kid_id = $1', [kidId]),
    query<{ chore_id: number; date: string; completed_at: string }>(
      'SELECT chore_id, date, completed_at FROM chore_completions WHERE kid_id = $1 ORDER BY date ASC',
      [kidId]
    ),
  ]);

  const totalMoneyCents = totalMoneyRows[0].s;
  const totalCompletions = completionRows.length;

  const activeChores = allChores.filter((c) => c.active === 1).map((c) => ({ id: c.id, name: c.name }));
  const activeChoreIds = new Set(activeChores.map((c) => c.id));

  const choreLifecycles: ChoreLifecycle[] = allChores.map((c) => ({
    id: c.id,
    createdDate: toDateStr(new Date(c.created_at)),
    archivedDate: c.archived_at ? toDateStr(new Date(c.archived_at)) : null,
  }));

  const datesByChore = new Map<number, string[]>();
  const distinctChoreIdsCompleted = new Set<number>();
  for (const row of completionRows) {
    distinctChoreIdsCompleted.add(row.chore_id);
    if (!datesByChore.has(row.chore_id)) datesByChore.set(row.chore_id, []);
    datesByChore.get(row.chore_id)!.push(row.date);
  }

  const choreStreaks = new Map<number, number>();
  let comebackKid = false;

  for (const [choreId, dates] of datesByChore) {
    const dateSet = new Set(dates);
    choreStreaks.set(choreId, currentStreakFromDates(dateSet, today));

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

  const earlyBird = completionRows.some((row) => hourInAppTimezone(new Date(row.completed_at)) < 9);
  const nightOwl = completionRows.some((row) => hourInAppTimezone(new Date(row.completed_at)) >= 20);
  const freshStart = completionRows.some((row) => row.date.slice(-2) === '01');

  // Perfect-day tracking uses the set of chores that actually existed (and weren't yet
  // archived) on each given date, not today's chore list — so editing today's chores
  // never rewrites whether past days were "perfect".
  const completionsByDate = new Map<string, Set<number>>();
  for (const row of completionRows) {
    if (!completionsByDate.has(row.date)) completionsByDate.set(row.date, new Set());
    completionsByDate.get(row.date)!.add(row.chore_id);
  }

  const perfectDates = new Set<string>();
  for (const [date, completedIds] of completionsByDate) {
    const requiredIds = choreLifecycles.filter((c) => wasChoreRequiredOnDate(c, date)).map((c) => c.id);
    if (requiredIds.length === 0) continue;
    if (requiredIds.every((id) => completedIds.has(id))) perfectDates.add(date);
  }

  const perfectDayStreak = currentStreakFromDates(perfectDates, today);

  let weekendWarrior = false;
  for (const date of perfectDates) {
    if (dayOfWeek(date) === 6 && perfectDates.has(addDays(date, 1))) {
      weekendWarrior = true;
      break;
    }
  }

  let weekdayHero = false;
  for (const date of perfectDates) {
    if (dayOfWeek(date) !== 1) continue; // Monday
    if ([1, 2, 3, 4].every((offset) => perfectDates.has(addDays(date, offset)))) {
      weekdayHero = true;
      break;
    }
  }

  const allRounder = activeChoreIds.size > 0 && [...activeChoreIds].every((id) => distinctChoreIdsCompleted.has(id));

  return {
    totalCompletions,
    totalMoneyCents,
    perfectDayStreak,
    earlyBird,
    nightOwl,
    weekendWarrior,
    weekdayHero,
    comebackKid,
    allRounder,
    freshStart,
    activeChores,
    choreStreaks,
  };
}

const CHORE_STREAK_ID_PATTERN = /^streak_(\d+)_chore_(\d+)$/;

function isTrophyEarned(id: string, s: KidStats): boolean {
  if (id.startsWith('completions_')) {
    return s.totalCompletions >= Number(id.slice('completions_'.length));
  }
  if (id.startsWith('money_')) {
    return s.totalMoneyCents >= Number(id.slice('money_'.length));
  }
  if (id.startsWith('perfect_')) {
    return s.perfectDayStreak >= Number(id.slice('perfect_'.length));
  }
  const streakMatch = id.match(CHORE_STREAK_ID_PATTERN);
  if (streakMatch) {
    const days = Number(streakMatch[1]);
    const choreId = Number(streakMatch[2]);
    return (s.choreStreaks.get(choreId) || 0) >= days;
  }
  switch (id) {
    case 'comeback_kid':
      return s.comebackKid;
    case 'early_bird':
      return s.earlyBird;
    case 'night_owl':
      return s.nightOwl;
    case 'weekend_warrior':
      return s.weekendWarrior;
    case 'weekday_hero':
      return s.weekdayHero;
    case 'all_rounder':
      return s.allRounder;
    case 'double_digits':
      return s.activeChores.length >= 10;
    case 'fresh_start':
      return s.freshStart;
    default:
      return false;
  }
}

/** Evaluates all trophies for a kid, awards any newly-earned ones, and returns them. */
export async function evaluateAndAwardTrophies(kidId: number): Promise<TrophyDef[]> {
  const [stats, alreadyEarnedRows] = await Promise.all([
    computeKidStats(kidId),
    query<{ trophy_id: string }>('SELECT trophy_id FROM kid_trophies WHERE kid_id = $1', [kidId]),
  ]);
  const alreadyEarned = new Set(alreadyEarnedRows.map((r) => r.trophy_id));
  const catalog = buildTrophyCatalog(stats.activeChores);

  const newlyEarned = catalog.filter((trophy) => !alreadyEarned.has(trophy.id) && isTrophyEarned(trophy.id, stats));

  if (newlyEarned.length > 0) {
    const values: unknown[] = [];
    const rows: string[] = [];
    newlyEarned.forEach((trophy) => {
      const base = values.length;
      rows.push(`($${base + 1}, $${base + 2})`);
      values.push(kidId, trophy.id);
    });
    await query(`INSERT INTO kid_trophies (kid_id, trophy_id) VALUES ${rows.join(', ')}`, values);
  }

  return newlyEarned;
}
