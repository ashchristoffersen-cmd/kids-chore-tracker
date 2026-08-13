import { NextRequest, NextResponse } from 'next/server';
import { requireParent } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getKidsSummary } from '@/lib/queries';
import { parseColor, parseEmoji, parseName } from '@/lib/validate';

export async function GET() {
  const db = getDb();
  return NextResponse.json(getKidsSummary(db));
}

export async function POST(req: NextRequest) {
  const unauthorized = requireParent(req);
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const name = parseName(body?.name);
  if (!name) {
    return NextResponse.json({ error: 'A name of 1-60 characters is required' }, { status: 400 });
  }
  const avatar = parseEmoji(body?.avatar, '🦁');
  const color = parseColor(body?.color, '#4fc3f7');

  const db = getDb();
  const maxOrder = (
    db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM kids').get() as { m: number }
  ).m;
  const info = db
    .prepare('INSERT INTO kids (name, avatar, color, sort_order) VALUES (?, ?, ?, ?)')
    .run(name, avatar, color, maxOrder + 1);
  const kid = db.prepare('SELECT * FROM kids WHERE id = ?').get(info.lastInsertRowid);
  return NextResponse.json(kid, { status: 201 });
}
