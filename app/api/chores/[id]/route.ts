import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { noFieldsResponse, patchRow } from '@/lib/sql';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const choreId = Number(params.id);
  const body = await req.json();
  const db = getDb();
  const chore = patchRow(db, 'chores', choreId, body, ['name', 'emoji', 'money_cents', 'sort_order', 'active']);
  if (!chore) return noFieldsResponse();
  return NextResponse.json(chore);
}

// Archives the chore (active = 0) rather than hard-deleting, so past
// completions keep contributing to streak/trophy history.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const choreId = Number(params.id);
  const db = getDb();
  db.prepare('UPDATE chores SET active = 0 WHERE id = ?').run(choreId);
  return NextResponse.json({ ok: true });
}
