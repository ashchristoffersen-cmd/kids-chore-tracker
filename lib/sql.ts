import type Database from 'better-sqlite3';
import { NextResponse } from 'next/server';

/**
 * Applies a partial update from a request body, limited to `allowedFields`.
 * Returns the updated row, or null when the body contained nothing to update.
 */
export function patchRow(
  db: Database.Database,
  table: string,
  id: number,
  body: Record<string, unknown>,
  allowedFields: string[]
): unknown | null {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(body[key]);
    }
  }
  if (fields.length === 0) return null;
  db.prepare(`UPDATE ${table} SET ${fields.join(', ')} WHERE id = ?`).run(...values, id);
  return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
}

export function noFieldsResponse() {
  return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
}

/** Next sort_order value for a table, optionally scoped to one kid. */
export function nextSortOrder(db: Database.Database, table: string, kidId?: number): number {
  const sql = `SELECT COALESCE(MAX(sort_order), -1) AS m FROM ${table}${kidId === undefined ? '' : ' WHERE kid_id = ?'}`;
  const stmt = db.prepare(sql);
  const row = (kidId === undefined ? stmt.get() : stmt.get(kidId)) as { m: number };
  return row.m + 1;
}
