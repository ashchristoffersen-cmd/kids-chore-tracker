import { afterEach, describe, expect, it, vi } from 'vitest';
import { addDays, dayOfWeek, toDateStr, todayStr } from '../lib/dates';

describe('toDateStr', () => {
  it('zero-pads month and day', () => {
    expect(toDateStr(new Date(2024, 0, 5))).toBe('2024-01-05');
    expect(toDateStr(new Date(2024, 10, 30))).toBe('2024-11-30');
  });

  it('uses local calendar fields, not UTC', () => {
    // 23:30 local on the 5th stays the 5th even when UTC has rolled over.
    expect(toDateStr(new Date(2024, 5, 5, 23, 30))).toBe('2024-06-05');
  });
});

describe('todayStr', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats the current local date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 2, 9, 8, 15));
    expect(todayStr()).toBe('2024-03-09');
  });
});

describe('addDays', () => {
  it('moves forward and backward', () => {
    expect(addDays('2024-03-10', 1)).toBe('2024-03-11');
    expect(addDays('2024-03-10', -1)).toBe('2024-03-09');
    expect(addDays('2024-03-10', 0)).toBe('2024-03-10');
  });

  it('crosses month and year boundaries', () => {
    expect(addDays('2024-01-31', 1)).toBe('2024-02-01');
    expect(addDays('2024-12-31', 1)).toBe('2025-01-01');
    expect(addDays('2024-01-01', -1)).toBe('2023-12-31');
  });

  it('handles leap years', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2023-02-28', 1)).toBe('2023-03-01');
  });

  it('handles multi-week deltas', () => {
    expect(addDays('2024-03-01', 30)).toBe('2024-03-31');
    expect(addDays('2024-03-01', -30)).toBe('2024-01-31');
  });
});

describe('dayOfWeek', () => {
  it('returns 0 for Sunday through 6 for Saturday', () => {
    expect(dayOfWeek('2024-03-10')).toBe(0);
    expect(dayOfWeek('2024-03-11')).toBe(1);
    expect(dayOfWeek('2024-03-16')).toBe(6);
  });
});
