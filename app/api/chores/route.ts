import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { kid_id, name, emoji, money_cents } = body;
  if (!kid_id || !name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'kid_id and name are required' }, { status: 400 });
  }
  const [{ m: maxOrder }] = await query<{ m: number }>(
    'SELECT COALESCE(MAX(sort_order), -1) AS m FROM chores WHERE kid_id = $1',
    [kid_id]
  );
  const [chore] = await query(
    `INSERT INTO chores (kid_id, name, emoji, money_cents, sort_order)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [kid_id, name.trim(), emoji || '✅', Math.max(0, Math.round(money_cents || 0)), maxOrder + 1]
  );
  return NextResponse.json(chore, { status: 201 });
}
