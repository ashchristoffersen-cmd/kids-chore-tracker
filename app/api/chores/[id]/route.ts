import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const choreId = Number(params.id);
  const body = await req.json();
  const fields: string[] = [];
  const values: any[] = [];
  for (const key of ['name', 'emoji', 'money_cents', 'sort_order', 'active']) {
    if (body[key] !== undefined) {
      values.push(body[key]);
      fields.push(`${key} = $${values.length}`);
    }
  }
  if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  // Reactivating a chore clears its archived-on-date marker, so it's treated as
  // continuously required going forward instead of still "archived as of" a past date.
  if (Number(body.active) === 1) {
    fields.push('archived_at = NULL');
  }
  values.push(choreId);
  const [chore] = await query(`UPDATE chores SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`, values);
  return NextResponse.json(chore);
}

// Archives the chore (active = 0) rather than hard-deleting, so past
// completions keep contributing to streak/trophy history. Recording
// archived_at (rather than just flipping active) lets us reconstruct which
// chores were actually required on any given past day.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const choreId = Number(params.id);
  await query('UPDATE chores SET active = 0, archived_at = now() WHERE id = $1', [choreId]);
  return NextResponse.json({ ok: true });
}
