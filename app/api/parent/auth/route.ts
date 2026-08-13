import { NextRequest, NextResponse } from 'next/server';
import { isPinSet, setPin, verifyPin } from '@/lib/auth';

export async function GET() {
  return NextResponse.json({ pinSet: isPinSet() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const pin = String(body.pin || '');
  if (!/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN must be 4-6 digits' }, { status: 400 });
  }

  if (!isPinSet()) {
    setPin(pin);
    return NextResponse.json({ ok: true, created: true });
  }

  const ok = verifyPin(pin);
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, created: false });
}
