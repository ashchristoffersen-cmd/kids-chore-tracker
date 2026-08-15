// All "today"/hour-of-day calculations are pinned to this timezone, so the
// app's day boundary matches the household's actual location regardless of
// which region the server happens to run in (Vercel's Node runtime defaults
// to UTC, which would otherwise flip the day at 10am Brisbane time).
const APP_TIMEZONE = 'Australia/Brisbane';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const HOUR_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIMEZONE,
  hour: '2-digit',
  hour12: false,
});

export function todayStr(): string {
  return toDateStr(new Date());
}

/** Calendar date (YYYY-MM-DD) that `d` falls on in the app's timezone. */
export function toDateStr(d: Date): string {
  // en-CA formats as YYYY-MM-DD directly.
  return DATE_FORMATTER.format(d);
}

/** Hour of day (0-23) that `d` falls on in the app's timezone. */
export function hourInAppTimezone(d: Date): number {
  const hour = Number(HOUR_FORMATTER.format(d));
  return hour === 24 ? 0 : hour; // some ICU versions render midnight as "24"
}

export function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function dayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay(); // 0 = Sunday, 6 = Saturday
}
