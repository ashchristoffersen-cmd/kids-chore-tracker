import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getKidsSummary } from '@/lib/queries';
import { nextSortOrder } from '@/lib/sql';

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
  const info = db
    .prepare('INSERT INTO kids (name, avatar, color, sort_order) VALUES (?, ?, ?, ?)')
    .run(name.trim(), avatar || '🦁', color || '#4fc3f7', nextSortOrder(db, 'kids'));
  const kid = db.prepare('SELECT * FROM kids WHERE id = ?').get(info.lastInsertRowid);
  return NextResponse.json(kid, { status: 201 });
}
