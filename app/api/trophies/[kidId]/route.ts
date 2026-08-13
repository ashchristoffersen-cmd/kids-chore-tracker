import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { TROPHY_CATALOG } from '@/lib/trophies';
import { parseId } from '@/lib/validate';

export async function GET(_req: NextRequest, { params }: { params: { kidId: string } }) {
  const kidId = parseId(params.kidId);
  if (!kidId) return NextResponse.json({ error: 'Invalid kid id' }, { status: 400 });
  const db = getDb();
  const earnedRows = db
    .prepare('SELECT trophy_id, earned_at FROM kid_trophies WHERE kid_id = ?')
    .all(kidId) as { trophy_id: string; earned_at: string }[];
  const earnedMap = new Map(earnedRows.map((r) => [r.trophy_id, r.earned_at]));

  const trophies = TROPHY_CATALOG.map((t) => ({
    ...t,
    earned: earnedMap.has(t.id),
    earnedAt: earnedMap.get(t.id) || null,
  }));

  return NextResponse.json({ trophies });
}
