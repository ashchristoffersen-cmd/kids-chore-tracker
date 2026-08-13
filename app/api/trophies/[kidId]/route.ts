import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { TROPHY_CATALOG } from '@/lib/trophies';

export async function GET(_req: NextRequest, { params }: { params: { kidId: string } }) {
  const kidId = Number(params.kidId);
  const earnedRows = await query<{ trophy_id: string; earned_at: string }>(
    'SELECT trophy_id, earned_at FROM kid_trophies WHERE kid_id = $1',
    [kidId]
  );
  const earnedMap = new Map(earnedRows.map((r) => [r.trophy_id, r.earned_at]));

  const trophies = TROPHY_CATALOG.map((t) => ({
    ...t,
    earned: earnedMap.has(t.id),
    earnedAt: earnedMap.get(t.id) || null,
  }));

  return NextResponse.json({ trophies });
}
