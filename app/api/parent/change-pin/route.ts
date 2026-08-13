import { NextRequest, NextResponse } from 'next/server';
import { verifyPin, setPin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const currentPin = String(body.currentPin || '');
  const newPin = String(body.newPin || '');

  if (!(await verifyPin(currentPin))) {
    return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 401 });
  }
  if (!/^\d{4,6}$/.test(newPin)) {
    return NextResponse.json({ error: 'New PIN must be 4-6 digits' }, { status: 400 });
  }
  await setPin(newPin);
  return NextResponse.json({ ok: true });
}
