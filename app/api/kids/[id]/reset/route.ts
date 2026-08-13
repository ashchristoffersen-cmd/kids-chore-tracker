import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';

// Wipes a kid's progress (completions, transactions, earned trophies) but keeps
// the kid and their chore list intact — useful for resetting after testing.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const kidId = Number(params.id);

  await withTransaction(async (q) => {
    await q('DELETE FROM transactions WHERE kid_id = $1', [kidId]);
    await q('DELETE FROM chore_completions WHERE kid_id = $1', [kidId]);
    await q('DELETE FROM kid_trophies WHERE kid_id = $1', [kidId]);
  });

  return NextResponse.json({ ok: true });
}
