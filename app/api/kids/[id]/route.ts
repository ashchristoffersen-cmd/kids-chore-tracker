import { NextRequest, NextResponse } from 'next/server';
import { requireParent } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { getKidDetail } from '@/lib/queries';
import { parseColor, parseEmoji, parseId, parseName, parseSortOrder } from '@/lib/validate';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const kidId = parseId(params.id);
  if (!kidId) return NextResponse.json({ error: 'Invalid kid id' }, { status: 400 });
  const db = getDb();
  const detail = getKidDetail(db, kidId);
  if (!detail) return NextResponse.json({ error: 'Kid not found' }, { status: 404 });
  return NextResponse.json(detail);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireParent(req);
  if (unauthorized) return unauthorized;

  const kidId = parseId(params.id);
  if (!kidId) return NextResponse.json({ error: 'Invalid kid id' }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const updates: Record<string, string | number> = {};
  if (body.name !== undefined) {
    const name = parseName(body.name);
    if (!name) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    updates.name = name;
  }
  if (body.avatar !== undefined) updates.avatar = parseEmoji(body.avatar, '🦁');
  if (body.color !== undefined) updates.color = parseColor(body.color, '#4fc3f7');
  if (body.sort_order !== undefined) {
    const sortOrder = parseSortOrder(body.sort_order);
    if (sortOrder === null) return NextResponse.json({ error: 'Invalid sort_order' }, { status: 400 });
    updates.sort_order = sortOrder;
  }

  const keys = Object.keys(updates);
  if (keys.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const db = getDb();
  db.prepare(`UPDATE kids SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(
    ...keys.map((k) => updates[k]),
    kidId
  );
  const kid = db.prepare('SELECT * FROM kids WHERE id = ?').get(kidId);
  if (!kid) return NextResponse.json({ error: 'Kid not found' }, { status: 404 });
  return NextResponse.json(kid);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireParent(req);
  if (unauthorized) return unauthorized;

  const kidId = parseId(params.id);
  if (!kidId) return NextResponse.json({ error: 'Invalid kid id' }, { status: 400 });
  const db = getDb();
  db.prepare('DELETE FROM kids WHERE id = ?').run(kidId);
  return NextResponse.json({ ok: true });
}
