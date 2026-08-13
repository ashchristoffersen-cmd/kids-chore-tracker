import { NextRequest, NextResponse } from 'next/server';
import { requireParent } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getBank } from '@/lib/queries';
import { MAX_REASON_LENGTH, parseId, parseMoneyCents, parseText } from '@/lib/validate';

export async function GET(_req: NextRequest, { params }: { params: { kidId: string } }) {
  const kidId = parseId(params.kidId);
  if (!kidId) return NextResponse.json({ error: 'Invalid kid id' }, { status: 400 });
  const db = getDb();
  return NextResponse.json(getBank(db, kidId));
}

export async function POST(req: NextRequest, { params }: { params: { kidId: string } }) {
  const unauthorized = requireParent(req);
  if (unauthorized) return unauthorized;

  const kidId = parseId(params.kidId);
  if (!kidId) return NextResponse.json({ error: 'Invalid kid id' }, { status: 400 });

  const body = await req.json().catch(() => null);
  const amountCents = parseMoneyCents(body?.amount_cents);
  if (!amountCents) {
    return NextResponse.json(
      { error: 'amount_cents must be a positive number no greater than 1000000' },
      { status: 400 }
    );
  }
  const type = body?.type;
  if (type !== 'manual_add' && type !== 'manual_remove') {
    return NextResponse.json({ error: "type must be 'manual_add' or 'manual_remove'" }, { status: 400 });
  }

  const db = getDb();
  const kid = db.prepare('SELECT id FROM kids WHERE id = ?').get(kidId);
  if (!kid) return NextResponse.json({ error: 'Kid not found' }, { status: 404 });

  const reason = parseText(
    body?.reason,
    MAX_REASON_LENGTH,
    type === 'manual_add' ? 'Deposit' : 'Withdrawal'
  );
  const signedAmount = type === 'manual_add' ? amountCents : -amountCents;
  db.prepare(
    `INSERT INTO transactions (kid_id, amount_cents, reason, type) VALUES (?, ?, ?, ?)`
  ).run(kidId, signedAmount, reason, type);

  return NextResponse.json(getBank(db, kidId), { status: 201 });
}
