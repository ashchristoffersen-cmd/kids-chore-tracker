import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { kidExists } from '@/lib/queries';
import { TROPHY_CATALOG } from '@/lib/trophies';
import { notFound, parseIdParam, route } from '@/lib/api';

type Ctx = { params: { kidId: string } };

export const GET = route<Ctx>(async (_req, { params }) => {
  const kidId = parseIdParam(params.kidId, 'kid id');
  const db = getDb();
  if (!kidExists(db, kidId)) throw notFound('Kid not found');

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
});
