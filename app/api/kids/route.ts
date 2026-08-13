import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getKidsSummary } from '@/lib/queries';

export async function GET() {
  return NextResponse.json(await getKidsSummary());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, avatar, color } = body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const [{ m: maxOrder }] = await query<{ m: number }>('SELECT COALESCE(MAX(sort_order), -1) AS m FROM kids');
  const [kid] = await query(
    'INSERT INTO kids (name, avatar, color, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
    [name.trim(), avatar || '🦁', color || '#4fc3f7', maxOrder + 1]
  );
  return NextResponse.json(kid, { status: 201 });
}
