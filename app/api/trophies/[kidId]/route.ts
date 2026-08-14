import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { buildTrophyCatalog } from '@/lib/trophies';

export async function GET(_req: NextRequest, { params }: { params: { kidId: string } }) {
  const kidId = Number(params.kidId);

  const [activeChores, earnedRows] = await Promise.all([
    query<{ id: number; name: string }>('SELECT id, name FROM chores WHERE kid_id = $1 AND active = 1', [kidId]),
    query<{ trophy_id: string; earned_at: string }>('SELECT trophy_id, earned_at FROM kid_trophies WHERE kid_id = $1', [
      kidId,
    ]),
  ]);
  const earnedMap = new Map(earnedRows.map((r) => [r.trophy_id, r.earned_at]));

  const trophies = buildTrophyCatalog(activeChores).map((t) => ({
    ...t,
    earned: earnedMap.has(t.id),
    earnedAt: earnedMap.get(t.id) || null,
  }));

  return NextResponse.json({ trophies });
}
