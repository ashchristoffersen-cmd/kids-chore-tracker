export const MAX_NAME_LENGTH = 60;
export const MAX_EMOJI_LENGTH = 8;
export const MAX_REASON_LENGTH = 120;
export const MAX_MONEY_CENTS = 1_000_000;

export function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function parseName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  if (!name || name.length > MAX_NAME_LENGTH) return null;
  return name;
}

export function parseEmoji(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  return value.trim().slice(0, MAX_EMOJI_LENGTH);
}

export function parseColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

export function parseMoneyCents(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const cents = Math.round(value);
  if (cents < 0 || cents > MAX_MONEY_CENTS) return null;
  return cents;
}

export function parseSortOrder(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 10_000) return null;
  return value;
}

export function parseText(value: unknown, maxLength: number, fallback: string): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  return value.trim().slice(0, maxLength);
}
