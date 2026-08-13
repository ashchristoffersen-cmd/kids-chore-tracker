import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getBank, getKidDetail, getKidsSummary } from '../lib/queries';
import { TROPHY_CATALOG } from '../lib/trophies';
import { addChore, addKid, addTransaction, complete, makeTestDb } from './helpers/db';

const TODAY = '2024-03-10';
const YESTERDAY = '2024-03-09';

describe('queries', () => {
  let db: Database.Database;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 10, 12, 0, 0));
    db = makeTestDb();
  });

  afterEach(() => {
    vi.useRealTimers();
    db.close();
  });

  describe('getKidsSummary', () => {
    it('returns an empty list when there are no kids', () => {
      expect(getKidsSummary(db)).toEqual([]);
    });

    it('orders by sort_order then id', () => {
      addKid(db, 'Third', 2);
      addKid(db, 'First', 0);
      addKid(db, 'Second', 1);
      expect(getKidsSummary(db).map((k) => k.name)).toEqual(['First', 'Second', 'Third']);
    });

    it('sums the balance across transaction types', () => {
      const kidId = addKid(db, 'Ada');
      addTransaction(db, kidId, 500, 'chore');
      addTransaction(db, kidId, 250, 'manual');
      addTransaction(db, kidId, -100, 'withdrawal');
      expect(getKidsSummary(db)[0].balanceCents).toBe(650);
    });

    it('counts only active chores and only completions from today', () => {
      const kidId = addKid(db, 'Ada');
      const bed = addChore(db, kidId, { name: 'Bed' });
      const teeth = addChore(db, kidId, { name: 'Teeth' });
      addChore(db, kidId, { name: 'Retired', active: false });
      complete(db, bed, kidId, TODAY);
      complete(db, teeth, kidId, YESTERDAY);

      const [summary] = getKidsSummary(db);
      expect(summary.totalChores).toBe(2);
      expect(summary.doneToday).toBe(1);
    });

    it('does not count a completion of an inactive chore as done today', () => {
      const kidId = addKid(db, 'Ada');
      const retired = addChore(db, kidId, { name: 'Retired', active: false });
      complete(db, retired, kidId, TODAY);
      expect(getKidsSummary(db)[0].doneToday).toBe(0);
    });

    it('keeps each kid balance and counts separate', () => {
      const ada = addKid(db, 'Ada', 0);
      const bo = addKid(db, 'Bo', 1);
      const adaChore = addChore(db, ada);
      addChore(db, bo);
      complete(db, adaChore, ada, TODAY);
      addTransaction(db, bo, 400, 'manual');

      const [adaSummary, boSummary] = getKidsSummary(db);
      expect([adaSummary.doneToday, adaSummary.balanceCents]).toEqual([1, 0]);
      expect([boSummary.doneToday, boSummary.balanceCents]).toEqual([0, 400]);
    });
  });

  describe('getKidDetail', () => {
    it('returns null for an unknown kid', () => {
      expect(getKidDetail(db, 999)).toBeNull();
    });

    it('lists active chores with today state and streaks', () => {
      const kidId = addKid(db, 'Ada');
      const bed = addChore(db, kidId, { name: 'Bed', sortOrder: 0 });
      const teeth = addChore(db, kidId, { name: 'Teeth', sortOrder: 1 });
      addChore(db, kidId, { name: 'Retired', active: false });
      complete(db, bed, kidId, YESTERDAY);
      complete(db, bed, kidId, TODAY);

      const detail = getKidDetail(db, kidId)!;
      expect(detail.chores.map((c) => c.name)).toEqual(['Bed', 'Teeth']);
      expect(detail.chores[0]).toMatchObject({ id: bed, completedToday: true, streak: 2 });
      expect(detail.chores[1]).toMatchObject({ id: teeth, completedToday: false, streak: 0 });
    });

    it('includes the balance and the full trophy catalog with earned flags', () => {
      const kidId = addKid(db, 'Ada');
      addTransaction(db, kidId, 300, 'chore');
      db.prepare('INSERT INTO kid_trophies (kid_id, trophy_id) VALUES (?, ?)').run(kidId, 'first_steps');

      const detail = getKidDetail(db, kidId)!;
      expect(detail.balanceCents).toBe(300);
      expect(detail.trophies).toHaveLength(TROPHY_CATALOG.length);

      const first = detail.trophies.find((t) => t.id === 'first_steps')!;
      expect(first.earned).toBe(true);
      expect(first.earnedAt).toBeTruthy();

      const unearned = detail.trophies.find((t) => t.id === 'chore_legend')!;
      expect(unearned).toMatchObject({ earned: false, earnedAt: null });
    });
  });

  describe('getBank', () => {
    it('returns a zero balance and no transactions for a fresh kid', () => {
      const kidId = addKid(db, 'Ada');
      expect(getBank(db, kidId)).toEqual({ balanceCents: 0, transactions: [] });
    });

    it('returns the balance with newest transactions first', () => {
      const kidId = addKid(db, 'Ada');
      addTransaction(db, kidId, 100, 'chore', 'oldest');
      addTransaction(db, kidId, 200, 'manual', 'newest');

      const bank = getBank(db, kidId);
      expect(bank.balanceCents).toBe(300);
      expect((bank.transactions as { reason: string }[]).map((t) => t.reason)).toEqual(['newest', 'oldest']);
    });

    it('caps the ledger at 100 rows', () => {
      const kidId = addKid(db, 'Ada');
      for (let i = 0; i < 105; i++) addTransaction(db, kidId, 1, 'chore', `t${i}`);
      expect(getBank(db, kidId).transactions).toHaveLength(100);
    });

    it('ignores other kids transactions', () => {
      const ada = addKid(db, 'Ada');
      const bo = addKid(db, 'Bo');
      addTransaction(db, bo, 999, 'manual');
      expect(getBank(db, ada)).toEqual({ balanceCents: 0, transactions: [] });
    });
  });
});
