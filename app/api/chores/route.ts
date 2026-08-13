import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { kidExists } from '@/lib/queries';
import { badRequest, notFound, readJsonBody, route } from '@/lib/api';

export const POST = route(async (req) => {
  const body = await readJsonBody(req);
  const { kid_id, name, emoji, money_cents } = body;

  if (typeof kid_id !== 'number' || !Number.isInteger(kid_id) || kid_id <= 0) {
    throw badRequest('kid_id must be a positive integer');
  }
  if (typeof name !== 'string' || !name.trim()) {
    throw badRequest('name is required');
  }
  if (emoji !== undefined && typeof emoji !== 'string') {
    throw badRequest('emoji must be a string');
  }
  if (money_cents !== undefined && (typeof money_cents !== 'number' || !Number.isFinite(money_cents))) {
    throw badRequest('money_cents must be a number');
  }

  const db = getDb();
  if (!kidExists(db, kid_id)) throw notFound('Kid not found');

  const maxOrder = (
    db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM chores WHERE kid_id = ?').get(kid_id) as {
      m: number;
    }
  ).m;
  const info = db
    .prepare(
      'INSERT INTO chores (kid_id, name, emoji, money_cents, sort_order) VALUES (?, ?, ?, ?, ?)'
    )
    .run(kid_id, name.trim(), emoji || '✅', Math.max(0, Math.round(money_cents || 0)), maxOrder + 1);
  const chore = db.prepare('SELECT * FROM chores WHERE id = ?').get(info.lastInsertRowid);
  return NextResponse.json(chore, { status: 201 });
});
