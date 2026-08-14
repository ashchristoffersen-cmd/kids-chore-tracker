import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Lets a parent revoke a mistakenly-earned trophy (e.g. an accidental chore
// tick that triggered a batch of milestones). The trophy simply becomes
// earnable again the next time its conditions are actually met.
export async function DELETE(_req: NextRequest, { params }: { params: { kidId: string; trophyId: string } }) {
  const kidId = Number(params.kidId);
  const trophyId = params.trophyId;
  await query('DELETE FROM kid_trophies WHERE kid_id = $1 AND trophy_id = $2', [kidId, trophyId]);
  return NextResponse.json({ ok: true });
}
