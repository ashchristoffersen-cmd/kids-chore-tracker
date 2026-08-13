import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { badRequest, notFound, parseIdParam, readJsonBody, route } from '@/lib/api';

type Ctx = { params: { id: string } };

export const PATCH = route<Ctx>(async (req, { params }) => {
  const choreId = parseIdParam(params.id, 'chore id');
  const body = await readJsonBody(req);

  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) throw badRequest('name must be a non-empty string');
    fields.push('name = ?');
    values.push(body.name.trim());
  }
  if (body.emoji !== undefined) {
    if (typeof body.emoji !== 'string' || !body.emoji) throw badRequest('emoji must be a non-empty string');
    fields.push('emoji = ?');
    values.push(body.emoji);
  }
  if (body.money_cents !== undefined) {
    if (typeof body.money_cents !== 'number' || !Number.isFinite(body.money_cents) || body.money_cents < 0) {
      throw badRequest('money_cents must be a non-negative number');
    }
    fields.push('money_cents = ?');
    values.push(Math.round(body.money_cents));
  }
  if (body.sort_order !== undefined) {
    if (typeof body.sort_order !== 'number' || !Number.isFinite(body.sort_order)) {
      throw badRequest('sort_order must be a number');
    }
    fields.push('sort_order = ?');
    values.push(Math.round(body.sort_order));
  }
  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean' && body.active !== 0 && body.active !== 1) {
      throw badRequest('active must be 0, 1, or a boolean');
    }
    fields.push('active = ?');
    values.push(body.active ? 1 : 0);
  }

  if (fields.length === 0) throw badRequest('No fields to update');

  const db = getDb();
  values.push(choreId);
  const info = db.prepare(`UPDATE chores SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  if (info.changes === 0) throw notFound('Chore not found');

  const chore = db.prepare('SELECT * FROM chores WHERE id = ?').get(choreId);
  return NextResponse.json(chore);
});

// Archives the chore (active = 0) rather than hard-deleting, so past
// completions keep contributing to streak/trophy history.
export const DELETE = route<Ctx>(async (_req, { params }) => {
  const choreId = parseIdParam(params.id, 'chore id');
  const info = getDb().prepare('UPDATE chores SET active = 0 WHERE id = ?').run(choreId);
  if (info.changes === 0) throw notFound('Chore not found');
  return NextResponse.json({ ok: true });
});
