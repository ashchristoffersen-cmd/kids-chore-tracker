import { NextRequest, NextResponse } from 'next/server';
import { requireParent } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { parseEmoji, parseId, parseMoneyCents, parseName, parseSortOrder } from '@/lib/validate';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireParent(req);
  if (unauthorized) return unauthorized;

  const choreId = parseId(params.id);
  if (!choreId) return NextResponse.json({ error: 'Invalid chore id' }, { status: 400 });

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
  if (body.emoji !== undefined) updates.emoji = parseEmoji(body.emoji, '✅');
  if (body.money_cents !== undefined) {
    const moneyCents = parseMoneyCents(body.money_cents);
    if (moneyCents === null) return NextResponse.json({ error: 'Invalid money_cents' }, { status: 400 });
    updates.money_cents = moneyCents;
  }
  if (body.sort_order !== undefined) {
    const sortOrder = parseSortOrder(body.sort_order);
    if (sortOrder === null) return NextResponse.json({ error: 'Invalid sort_order' }, { status: 400 });
    updates.sort_order = sortOrder;
  }
  if (body.active !== undefined) updates.active = body.active ? 1 : 0;

  const keys = Object.keys(updates);
  if (keys.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const db = getDb();
  db.prepare(`UPDATE chores SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(
    ...keys.map((k) => updates[k]),
    choreId
  );
  const chore = db.prepare('SELECT * FROM chores WHERE id = ?').get(choreId);
  if (!chore) return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
  return NextResponse.json(chore);
}

// Archives the chore (active = 0) rather than hard-deleting, so past
// completions keep contributing to streak/trophy history.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireParent(req);
  if (unauthorized) return unauthorized;

  const choreId = parseId(params.id);
  if (!choreId) return NextResponse.json({ error: 'Invalid chore id' }, { status: 400 });
  const db = getDb();
  db.prepare('UPDATE chores SET active = 0 WHERE id = ?').run(choreId);
  return NextResponse.json({ ok: true });
}
