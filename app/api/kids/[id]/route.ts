import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getKidDetail } from '@/lib/queries';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const kidId = Number(params.id);
  const detail = await getKidDetail(kidId);
  if (!detail) return NextResponse.json({ error: 'Kid not found' }, { status: 404 });
  return NextResponse.json(detail);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const kidId = Number(params.id);
  const body = await req.json();
  const fields: string[] = [];
  const values: any[] = [];
  for (const key of ['name', 'avatar', 'color', 'sort_order']) {
    if (body[key] !== undefined) {
      values.push(body[key]);
      fields.push(`${key} = $${values.length}`);
    }
  }
  if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  values.push(kidId);
  const [kid] = await query(`UPDATE kids SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`, values);
  return NextResponse.json(kid);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const kidId = Number(params.id);
  await query('DELETE FROM kids WHERE id = $1', [kidId]);
  return NextResponse.json({ ok: true });
}
