import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getBank, kidExists } from '@/lib/queries';
import { badRequest, notFound, parseIdParam, readJsonBody, route } from '@/lib/api';

type Ctx = { params: { kidId: string } };

export const GET = route<Ctx>(async (_req, { params }) => {
  const kidId = parseIdParam(params.kidId, 'kid id');
  const db = getDb();
  if (!kidExists(db, kidId)) throw notFound('Kid not found');
  return NextResponse.json(getBank(db, kidId));
});

export const POST = route<Ctx>(async (req, { params }) => {
  const kidId = parseIdParam(params.kidId, 'kid id');
  const body = await readJsonBody(req);
  const { amount_cents, reason, type } = body;

  if (typeof amount_cents !== 'number' || !Number.isFinite(amount_cents) || amount_cents <= 0) {
    throw badRequest('amount_cents must be a positive number');
  }
  if (type !== 'manual_add' && type !== 'manual_remove') {
    throw badRequest("type must be 'manual_add' or 'manual_remove'");
  }
  if (reason !== undefined && typeof reason !== 'string') {
    throw badRequest('reason must be a string');
  }
  const reasonText = typeof reason === 'string' ? reason.trim() : '';

  const db = getDb();
  if (!kidExists(db, kidId)) throw notFound('Kid not found');

  const signedAmount = type === 'manual_add' ? Math.round(amount_cents) : -Math.round(amount_cents);
  db.prepare(
    `INSERT INTO transactions (kid_id, amount_cents, reason, type) VALUES (?, ?, ?, ?)`
  ).run(kidId, signedAmount, reasonText || (type === 'manual_add' ? 'Deposit' : 'Withdrawal'), type);

  return NextResponse.json(getBank(db, kidId), { status: 201 });
});
