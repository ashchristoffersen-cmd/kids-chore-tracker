import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const choreId = Number(params.id);
  const body = await req.json();
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];
  for (const key of ['name', 'emoji', 'money_cents', 'sort_order', 'active']) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(body[key]);
    }
  }
  if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  values.push(choreId);
  db.prepare(`UPDATE chores SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const chore = db.prepare('SELECT * FROM chores WHERE id = ?').get(choreId);
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
