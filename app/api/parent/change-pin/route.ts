import { NextResponse } from 'next/server';
import { verifyPin, setPin, isPinSet } from '@/lib/auth';
import { ApiError, badRequest, readJsonBody, route } from '@/lib/api';

function asPin(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

export const POST = route(async (req) => {
  const body = await readJsonBody(req);
  const currentPin = asPin(body.currentPin);
  const newPin = asPin(body.newPin);

  if (!isPinSet()) {
    throw new ApiError(409, 'No PIN has been set yet');
  }
  if (!verifyPin(currentPin)) {
    throw new ApiError(401, 'Current PIN is incorrect');
  }
  if (!/^\d{4,6}$/.test(newPin)) {
    throw badRequest('New PIN must be 4-6 digits');
  }
  setPin(newPin);
  return NextResponse.json({ ok: true });
});
