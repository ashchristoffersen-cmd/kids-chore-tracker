import { NextRequest, NextResponse } from 'next/server';
import {
  clearPinAttempts,
  clientKey,
  pinLockoutRemainingMs,
  recordFailedPinAttempt,
  requireParent,
  setPin,
  setSessionCookie,
  verifyPin,
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  const unauthorized = requireParent(req);
  if (unauthorized) return unauthorized;

  const key = clientKey(req);
  const lockedMs = pinLockoutRemainingMs(key);
  if (lockedMs > 0) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(lockedMs / 60000)} minutes.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const currentPin = String(body?.currentPin ?? '');
  const newPin = String(body?.newPin ?? '');

  if (!verifyPin(currentPin)) {
    recordFailedPinAttempt(key);
    return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 401 });
  }
  clearPinAttempts(key);
  if (!/^\d{4,6}$/.test(newPin)) {
    return NextResponse.json({ error: 'New PIN must be 4-6 digits' }, { status: 400 });
  }
  setPin(newPin);
  return setSessionCookie(NextResponse.json({ ok: true }));
}
