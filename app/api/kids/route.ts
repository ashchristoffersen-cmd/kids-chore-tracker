import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getKidsSummary } from '@/lib/queries';

export async function GET() {
  const db = getDb();
  return NextResponse.json(getKidsSummary(db));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, avatar, color } = body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const db = getDb();
  const maxOrder = (
    db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM kids').get() as { m: number }
  ).m;
  const info = db
    .prepare('INSERT INTO kids (name, avatar, color, sort_order) VALUES (?, ?, ?, ?)')
    .run(name.trim(), avatar || '🦁', color || '#4fc3f7', maxOrder + 1);
  const kid = db.prepare('SELECT * FROM kids WHERE id = ?').get(info.lastInsertRowid);
  return NextResponse.json(kid, { status: 201 });
}
