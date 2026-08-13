import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getTrophyStatus } from '@/lib/queries';

export async function GET(_req: NextRequest, { params }: { params: { kidId: string } }) {
  const kidId = Number(params.kidId);
  const db = getDb();
  return NextResponse.json({ trophies: getTrophyStatus(db, kidId) });
}
