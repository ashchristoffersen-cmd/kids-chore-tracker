import { NextRequest, NextResponse } from 'next/server';
import {
  clearPinAttempts,
  clearSessionCookie,
  clientKey,
  isParentAuthed,
  isPinSet,
  pinLockoutRemainingMs,
  recordFailedPinAttempt,
  setPin,
  setSessionCookie,
  verifyPin,
} from '@/lib/auth';

export async function GET(req: NextRequest) {
  return NextResponse.json({ pinSet: isPinSet(), authed: isParentAuthed(req) });
}

export async function POST(req: NextRequest) {
  const key = clientKey(req);
  const lockedMs = pinLockoutRemainingMs(key);
  if (lockedMs > 0) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(lockedMs / 60000)} minutes.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const pin = String(body?.pin ?? '');
  if (!/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN must be 4-6 digits' }, { status: 400 });
  }

  if (!isPinSet()) {
    setPin(pin);
    return setSessionCookie(NextResponse.json({ ok: true, created: true }));
  }

  if (!verifyPin(pin)) {
    recordFailedPinAttempt(key);
    return NextResponse.json({ ok: false, error: 'Incorrect PIN' }, { status: 401 });
  }
  clearPinAttempts(key);
  return setSessionCookie(NextResponse.json({ ok: true, created: false }));
}

export async function DELETE() {
  return clearSessionCookie(NextResponse.json({ ok: true }));
}
