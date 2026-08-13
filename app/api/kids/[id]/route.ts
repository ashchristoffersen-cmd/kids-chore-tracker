import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getKidDetail } from '@/lib/queries';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const kidId = Number(params.id);
  const db = getDb();
  const detail = getKidDetail(db, kidId);
  if (!detail) return NextResponse.json({ error: 'Kid not found' }, { status: 404 });
  return NextResponse.json(detail);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const kidId = Number(params.id);
  const body = await req.json();
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];
  for (const key of ['name', 'avatar', 'color', 'sort_order']) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(body[key]);
    }
  }
  if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  values.push(kidId);
  db.prepare(`UPDATE kids SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const kid = db.prepare('SELECT * FROM kids WHERE id = ?').get(kidId);
  return NextResponse.json(kid);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const kidId = Number(params.id);
  const db = getDb();
  db.prepare('DELETE FROM kids WHERE id = ?').run(kidId);
  return NextResponse.json({ ok: true });
}
