import { NextResponse } from 'next/server';
import { isPinSet, setPin, verifyPin } from '@/lib/auth';
import { badRequest, readJsonBody, route } from '@/lib/api';

export const GET = route(async () => {
  return NextResponse.json({ pinSet: isPinSet() });
});

export const POST = route(async (req) => {
  const body = await readJsonBody(req);
  const pin = typeof body.pin === 'string' || typeof body.pin === 'number' ? String(body.pin) : '';
  if (!/^\d{4,6}$/.test(pin)) {
    throw badRequest('PIN must be 4-6 digits');
  }

  if (!isPinSet()) {
    setPin(pin);
    return NextResponse.json({ ok: true, created: true });
  }

  if (!verifyPin(pin)) {
    return NextResponse.json({ ok: false, error: 'Incorrect PIN' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, created: false });
});
