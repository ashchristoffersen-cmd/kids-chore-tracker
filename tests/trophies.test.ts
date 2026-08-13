import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TROPHY_CATALOG,
  computeKidStats,
  currentStreakFromDates,
  evaluateAndAwardTrophies,
  getChoreStreaks,
} from '../lib/trophies';
import { addChore, addKid, addTransaction, complete, makeTestDb } from './helpers/db';

const TODAY = '2024-03-10'; // a Sunday
const YESTERDAY = '2024-03-09'; // Saturday

function freezeToday() {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2024, 2, 10, 12, 0, 0));
}

describe('currentStreakFromDates', () => {
  it('is 0 with no completions', () => {
    expect(currentStreakFromDates(new Set(), TODAY)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const dates = new Set(['2024-03-08', '2024-03-09', '2024-03-10']);
    expect(currentStreakFromDates(dates, TODAY)).toBe(3);
  });

  it('still counts a streak that ended yesterday (today not done yet)', () => {
    const dates = new Set(['2024-03-08', '2024-03-09']);
    expect(currentStreakFromDates(dates, TODAY)).toBe(2);
  });

  it('is 0 once two days have been missed', () => {
    const dates = new Set(['2024-03-06', '2024-03-07', '2024-03-08']);
    expect(currentStreakFromDates(dates, TODAY)).toBe(0);
  });

  it('stops at the first gap and ignores older runs', () => {
    const dates = new Set(['2024-03-01', '2024-03-02', '2024-03-03', '2024-03-10']);
    expect(currentStreakFromDates(dates, TODAY)).toBe(1);
  });
});

describe('database-backed trophy logic', () => {
  let db: Database.Database;
  let kidId: number;

  beforeEach(() => {
    freezeToday();
    db = makeTestDb();
    kidId = addKid(db, 'Ada');
  });

  afterEach(() => {
    vi.useRealTimers();
    db.close();
  });

  describe('getChoreStreaks', () => {
    it('returns an empty map when nothing has been completed', () => {
      addChore(db, kidId);
      expect(getChoreStreaks(db, kidId).size).toBe(0);
    });

    it('tracks each chore independently', () => {
      const bed = addChore(db, kidId, { name: 'Bed' });
      const teeth = addChore(db, kidId, { name: 'Teeth' });
      complete(db, bed, kidId, '2024-03-08');
      complete(db, bed, kidId, YESTERDAY);
      complete(db, bed, kidId, TODAY);
      complete(db, teeth, kidId, '2024-03-01');

      const streaks = getChoreStreaks(db, kidId);
      expect(streaks.get(bed)).toBe(3);
      expect(streaks.get(teeth)).toBe(0);
    });

    it('ignores other kids completions', () => {
      const otherKid = addKid(db, 'Bo');
      const mine = addChore(db, kidId);
      const theirs = addChore(db, otherKid);
      complete(db, mine, kidId, TODAY);
      complete(db, theirs, otherKid, TODAY);

      expect([...getChoreStreaks(db, kidId).keys()]).toEqual([mine]);
    });
  });

  describe('computeKidStats', () => {
    it('reports zeroes for a kid with no chores', () => {
      expect(computeKidStats(db, kidId)).toEqual({
        totalCompletions: 0,
        totalMoneyCents: 0,
        bestChoreStreak: 0,
        perfectDayStreak: 0,
        earlyBird: false,
        weekendWarrior: false,
        comebackKid: false,
        allRounder: false,
      });
    });

    it('counts completions and only chore-type money', () => {
      const chore = addChore(db, kidId);
      complete(db, chore, kidId, YESTERDAY);
      complete(db, chore, kidId, TODAY);
      addTransaction(db, kidId, 250, 'chore');
      addTransaction(db, kidId, 5000, 'manual');
      addTransaction(db, kidId, -100, 'withdrawal');

      const stats = computeKidStats(db, kidId);
      expect(stats.totalCompletions).toBe(2);
      expect(stats.totalMoneyCents).toBe(250);
    });

    it('takes the best current streak across chores', () => {
      const bed = addChore(db, kidId, { name: 'Bed' });
      const teeth = addChore(db, kidId, { name: 'Teeth' });
      complete(db, bed, kidId, TODAY);
      for (const d of ['2024-03-07', '2024-03-08', YESTERDAY, TODAY]) {
        complete(db, teeth, kidId, d);
      }
      expect(computeKidStats(db, kidId).bestChoreStreak).toBe(4);
    });

    it('flags earlyBird only for completions before 9am local time', () => {
      const chore = addChore(db, kidId);
      complete(db, chore, kidId, YESTERDAY, '09:30');
      expect(computeKidStats(db, kidId).earlyBird).toBe(false);

      complete(db, chore, kidId, TODAY, '07:45');
      expect(computeKidStats(db, kidId).earlyBird).toBe(true);
    });

    it('flags comebackKid after a broken 3+ day run is followed by a new run', () => {
      const chore = addChore(db, kidId);
      for (const d of ['2024-03-01', '2024-03-02', '2024-03-03']) complete(db, chore, kidId, d);
      expect(computeKidStats(db, kidId).comebackKid).toBe(false);

      complete(db, chore, kidId, TODAY);
      expect(computeKidStats(db, kidId).comebackKid).toBe(true);
    });

    it('does not flag comebackKid when the broken run was shorter than 3 days', () => {
      const chore = addChore(db, kidId);
      complete(db, chore, kidId, '2024-03-01');
      complete(db, chore, kidId, '2024-03-02');
      complete(db, chore, kidId, TODAY);
      expect(computeKidStats(db, kidId).comebackKid).toBe(false);
    });

    it('counts a perfect day only when every active chore is done', () => {
      const bed = addChore(db, kidId, { name: 'Bed' });
      const teeth = addChore(db, kidId, { name: 'Teeth' });
      complete(db, bed, kidId, TODAY);
      expect(computeKidStats(db, kidId).perfectDayStreak).toBe(0);

      complete(db, teeth, kidId, TODAY);
      expect(computeKidStats(db, kidId).perfectDayStreak).toBe(1);
    });

    it('ignores inactive chores when judging perfect days', () => {
      const bed = addChore(db, kidId, { name: 'Bed' });
      const retired = addChore(db, kidId, { name: 'Retired', active: false });
      complete(db, bed, kidId, TODAY);
      complete(db, retired, kidId, TODAY);
      expect(computeKidStats(db, kidId).perfectDayStreak).toBe(1);
    });

    it('streaks perfect days across consecutive dates', () => {
      const chore = addChore(db, kidId);
      for (const d of ['2024-03-08', YESTERDAY, TODAY]) complete(db, chore, kidId, d);
      expect(computeKidStats(db, kidId).perfectDayStreak).toBe(3);
    });

    it('flags weekendWarrior for a perfect Saturday plus Sunday', () => {
      const chore = addChore(db, kidId);
      complete(db, chore, kidId, YESTERDAY); // Saturday
      expect(computeKidStats(db, kidId).weekendWarrior).toBe(false);

      complete(db, chore, kidId, TODAY); // Sunday
      expect(computeKidStats(db, kidId).weekendWarrior).toBe(true);
    });

    it('does not flag weekendWarrior for two perfect weekdays', () => {
      const chore = addChore(db, kidId);
      complete(db, chore, kidId, '2024-03-06'); // Wednesday
      complete(db, chore, kidId, '2024-03-07'); // Thursday
      expect(computeKidStats(db, kidId).weekendWarrior).toBe(false);
    });

    it('flags allRounder once every active chore has been done at least once', () => {
      const bed = addChore(db, kidId, { name: 'Bed' });
      const teeth = addChore(db, kidId, { name: 'Teeth' });
      complete(db, bed, kidId, '2024-03-01');
      expect(computeKidStats(db, kidId).allRounder).toBe(false);

      complete(db, teeth, kidId, '2024-03-02');
      expect(computeKidStats(db, kidId).allRounder).toBe(true);
    });
  });

  describe('evaluateAndAwardTrophies', () => {
    it('awards nothing for a kid with no activity', () => {
      expect(evaluateAndAwardTrophies(db, kidId)).toEqual([]);
    });

    it('awards the first-chore trophy and persists it', () => {
      const chore = addChore(db, kidId);
      complete(db, chore, kidId, TODAY);

      const awarded = evaluateAndAwardTrophies(db, kidId).map((t) => t.id);
      expect(awarded).toContain('first_steps');

      const stored = db
        .prepare('SELECT trophy_id FROM kid_trophies WHERE kid_id = ?')
        .all(kidId) as { trophy_id: string }[];
      expect(stored.map((r) => r.trophy_id)).toEqual(expect.arrayContaining(awarded));
    });

    it('is idempotent — a second run awards nothing new', () => {
      const chore = addChore(db, kidId);
      complete(db, chore, kidId, TODAY);
      expect(evaluateAndAwardTrophies(db, kidId).length).toBeGreaterThan(0);
      expect(evaluateAndAwardTrophies(db, kidId)).toEqual([]);
    });

    it('awards every streak tier reached at once', () => {
      const chore = addChore(db, kidId);
      let date = TODAY;
      for (let i = 0; i < 7; i++) {
        complete(db, chore, kidId, date);
        date = `2024-03-${String(10 - i - 1).padStart(2, '0')}`;
      }
      const awarded = evaluateAndAwardTrophies(db, kidId).map((t) => t.id);
      expect(awarded).toContain('streak_3');
      expect(awarded).toContain('streak_7');
      expect(awarded).not.toContain('streak_14');
    });

    it('awards money trophies at their cent thresholds', () => {
      addTransaction(db, kidId, 99, 'chore');
      expect(evaluateAndAwardTrophies(db, kidId).map((t) => t.id)).not.toContain('first_dollar');

      addTransaction(db, kidId, 1, 'chore');
      expect(evaluateAndAwardTrophies(db, kidId).map((t) => t.id)).toContain('first_dollar');
    });

    it('awards completion-count trophies at their thresholds', () => {
      const chore = addChore(db, kidId);
      // 10 completions on distinct dates in the past.
      for (let i = 1; i <= 10; i++) {
        complete(db, chore, kidId, `2024-02-${String(i).padStart(2, '0')}`);
      }
      const awarded = evaluateAndAwardTrophies(db, kidId).map((t) => t.id);
      expect(awarded).toContain('ten_star');
      expect(awarded).not.toContain('chore_champion');
    });

    it('keeps each kid trophy case separate', () => {
      const otherKid = addKid(db, 'Bo');
      const chore = addChore(db, kidId);
      complete(db, chore, kidId, TODAY);
      evaluateAndAwardTrophies(db, kidId);
      expect(evaluateAndAwardTrophies(db, otherKid)).toEqual([]);
    });
  });
});

describe('TROPHY_CATALOG', () => {
  it('has unique ids', () => {
    const ids = TROPHY_CATALOG.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every trophy a name, description and icon', () => {
    for (const t of TROPHY_CATALOG) {
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.icon).toBeTruthy();
    }
  });

  it('is fully seeded into the trophies table by the migration', () => {
    const db = makeTestDb();
    const count = (db.prepare('SELECT COUNT(*) AS c FROM trophies').get() as { c: number }).c;
    expect(count).toBe(TROPHY_CATALOG.length);
    db.close();
  });
});
