import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { nextSortOrder } from '@/lib/sql';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { kid_id, name, emoji, money_cents } = body;
  if (!kid_id || !name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'kid_id and name are required' }, { status: 400 });
  }
  const db = getDb();
  const info = db
    .prepare(
      'INSERT INTO chores (kid_id, name, emoji, money_cents, sort_order) VALUES (?, ?, ?, ?, ?)'
    )
    .run(
      kid_id,
      name.trim(),
      emoji || '✅',
      Math.max(0, Math.round(money_cents || 0)),
      nextSortOrder(db, 'chores', kid_id)
    );
  const chore = db.prepare('SELECT * FROM chores WHERE id = ?').get(info.lastInsertRowid);
  return NextResponse.json(chore, { status: 201 });
}
