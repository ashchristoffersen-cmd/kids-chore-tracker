import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getKidsSummary } from '@/lib/queries';
import { badRequest, readJsonBody, route } from '@/lib/api';

export const GET = route(async () => {
  const db = getDb();
  return NextResponse.json(getKidsSummary(db));
});

export const POST = route(async (req) => {
  const body = await readJsonBody(req);
  const { name, avatar, color } = body;
  if (typeof name !== 'string' || !name.trim()) {
    throw badRequest('Name is required');
  }
  if (avatar !== undefined && typeof avatar !== 'string') {
    throw badRequest('avatar must be a string');
  }
  if (color !== undefined && typeof color !== 'string') {
    throw badRequest('color must be a string');
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
});
