import { NextRequest, NextResponse } from 'next/server';
import { requireParent } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { parseEmoji, parseId, parseMoneyCents, parseName } from '@/lib/validate';

export async function POST(req: NextRequest) {
  const unauthorized = requireParent(req);
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const kidId = parseId(String(body?.kid_id ?? ''));
  const name = parseName(body?.name);
  if (!kidId || !name) {
    return NextResponse.json({ error: 'A valid kid_id and name are required' }, { status: 400 });
  }
  const moneyCents = parseMoneyCents(body?.money_cents ?? 0);
  if (moneyCents === null) {
    return NextResponse.json({ error: 'money_cents must be between 0 and 1000000' }, { status: 400 });
  }
  const emoji = parseEmoji(body?.emoji, '✅');

  const db = getDb();
  const kid = db.prepare('SELECT id FROM kids WHERE id = ?').get(kidId);
  if (!kid) return NextResponse.json({ error: 'Kid not found' }, { status: 404 });

  const maxOrder = (
    db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM chores WHERE kid_id = ?').get(kidId) as {
      m: number;
    }
  ).m;
  const info = db
    .prepare(
      'INSERT INTO chores (kid_id, name, emoji, money_cents, sort_order) VALUES (?, ?, ?, ?, ?)'
    )
    .run(kidId, name, emoji, moneyCents, maxOrder + 1);
  const chore = db.prepare('SELECT * FROM chores WHERE id = ?').get(info.lastInsertRowid);
  return NextResponse.json(chore, { status: 201 });
}
