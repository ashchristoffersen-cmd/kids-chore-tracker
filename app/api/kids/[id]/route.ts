import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getKidDetail } from '@/lib/queries';
import { badRequest, notFound, parseIdParam, readJsonBody, route } from '@/lib/api';

type Ctx = { params: { id: string } };

const TEXT_FIELDS = ['name', 'avatar', 'color'] as const;

export const GET = route<Ctx>(async (_req, { params }) => {
  const kidId = parseIdParam(params.id, 'kid id');
  const detail = getKidDetail(getDb(), kidId);
  if (!detail) throw notFound('Kid not found');
  return NextResponse.json(detail);
});

export const PATCH = route<Ctx>(async (req, { params }) => {
  const kidId = parseIdParam(params.id, 'kid id');
  const body = await readJsonBody(req);

  const fields: string[] = [];
  const values: (string | number)[] = [];

  for (const key of TEXT_FIELDS) {
    const value = body[key];
    if (value === undefined) continue;
    if (typeof value !== 'string' || (key === 'name' && !value.trim())) {
      throw badRequest(`${key} must be a non-empty string`);
    }
    fields.push(`${key} = ?`);
    values.push(key === 'name' ? value.trim() : value);
  }

  if (body.sort_order !== undefined) {
    if (typeof body.sort_order !== 'number' || !Number.isFinite(body.sort_order)) {
      throw badRequest('sort_order must be a number');
    }
    fields.push('sort_order = ?');
    values.push(Math.round(body.sort_order));
  }

  if (fields.length === 0) throw badRequest('No fields to update');

  const db = getDb();
  values.push(kidId);
  const info = db.prepare(`UPDATE kids SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  if (info.changes === 0) throw notFound('Kid not found');

  const kid = db.prepare('SELECT * FROM kids WHERE id = ?').get(kidId);
  return NextResponse.json(kid);
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const kidId = parseIdParam(params.id, 'kid id');
  const info = getDb().prepare('DELETE FROM kids WHERE id = ?').run(kidId);
  if (info.changes === 0) throw notFound('Kid not found');
  return NextResponse.json({ ok: true });
});
