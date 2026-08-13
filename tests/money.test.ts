import { describe, expect, it } from 'vitest';
import { formatCents } from '../lib/money';

describe('formatCents', () => {
  it('formats whole dollars and cents with two decimals', () => {
    expect(formatCents(0)).toBe('$0.00');
    expect(formatCents(5)).toBe('$0.05');
    expect(formatCents(100)).toBe('$1.00');
    expect(formatCents(1234)).toBe('$12.34');
  });

  it('puts the sign before the dollar symbol for negatives', () => {
    expect(formatCents(-1)).toBe('-$0.01');
    expect(formatCents(-2500)).toBe('-$25.00');
  });

  it('rounds fractional cents rather than dropping them', () => {
    expect(formatCents(0.5)).toBe('$0.01');
  });
});
