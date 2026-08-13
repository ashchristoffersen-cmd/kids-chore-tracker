export function formatCents(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}$${(abs / 100).toFixed(2)}`;
}

/** Parses a dollar text input (e.g. "1.25") into non-negative whole cents. */
export function dollarsToCents(dollars: string): number {
  return Math.max(0, Math.round(parseFloat(dollars || '0') * 100));
}

/** Renders cents as the plain dollar string used in number inputs (e.g. "1.25"). */
export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}
