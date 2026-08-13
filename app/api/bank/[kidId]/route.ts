import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getBank } from '@/lib/queries';

export async function GET(_req: NextRequest, { params }: { params: { kidId: string } }) {
  const kidId = Number(params.kidId);
  return NextResponse.json(await getBank(kidId));
}

export async function POST(req: NextRequest, { params }: { params: { kidId: string } }) {
  const kidId = Number(params.kidId);
  const body = await req.json();
  const { amount_cents, reason, type } = body;

  if (!amount_cents || typeof amount_cents !== 'number' || amount_cents <= 0) {
    return NextResponse.json({ error: 'amount_cents must be a positive number' }, { status: 400 });
  }
  if (type !== 'manual_add' && type !== 'manual_remove') {
    return NextResponse.json({ error: "type must be 'manual_add' or 'manual_remove'" }, { status: 400 });
  }

  const signedAmount = type === 'manual_add' ? Math.round(amount_cents) : -Math.round(amount_cents);
  await query('INSERT INTO transactions (kid_id, amount_cents, reason, type) VALUES ($1, $2, $3, $4)', [
    kidId,
    signedAmount,
    reason || (type === 'manual_add' ? 'Deposit' : 'Withdrawal'),
    type,
  ]);

  return NextResponse.json(await getBank(kidId), { status: 201 });
}
