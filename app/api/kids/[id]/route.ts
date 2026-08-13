import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getKidDetail } from '@/lib/queries';
import { noFieldsResponse, patchRow } from '@/lib/sql';

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
  const kid = patchRow(db, 'kids', kidId, body, ['name', 'avatar', 'color', 'sort_order']);
  if (!kid) return noFieldsResponse();
  return NextResponse.json(kid);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const kidId = Number(params.id);
  const db = getDb();
  db.prepare('DELETE FROM kids WHERE id = ?').run(kidId);
  return NextResponse.json({ ok: true });
}
