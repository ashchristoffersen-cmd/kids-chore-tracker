import { Pool, QueryResultRow } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __chorePool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __choreMigration: Promise<void> | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required (a Postgres connection string)');
  }
  return new Pool({
    connectionString,
    ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? false : { rejectUnauthorized: false },
  });
}

async function migrate(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS kids (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL DEFAULT '🦁',
      color TEXT NOT NULL DEFAULT '#4fc3f7',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS chores (
      id SERIAL PRIMARY KEY,
      kid_id INTEGER NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '✅',
      money_cents INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      archived_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS chore_completions (
      id SERIAL PRIMARY KEY,
      chore_id INTEGER NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
      kid_id INTEGER NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(chore_id, date)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      kid_id INTEGER NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
      amount_cents INTEGER NOT NULL,
      reason TEXT NOT NULL,
      type TEXT NOT NULL,
      chore_completion_id INTEGER REFERENCES chore_completions(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS kid_trophies (
      id SERIAL PRIMARY KEY,
      kid_id INTEGER NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
      trophy_id TEXT NOT NULL,
      earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(kid_id, trophy_id)
    );

    -- Trophy definitions now live in code (lib/trophies.ts) and are generated per kid
    -- (including one set per chore), so trophy_id is no longer a fixed, pre-seeded
    -- catalog — drop the old FK and the now-unused catalog table from earlier deploys.
    ALTER TABLE chores ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
    ALTER TABLE kid_trophies DROP CONSTRAINT IF EXISTS kid_trophies_trophy_id_fkey;
    DROP TABLE IF EXISTS trophies;
  `);
}

async function getPool(): Promise<Pool> {
  if (!global.__chorePool) {
    global.__chorePool = createPool();
  }
  if (!global.__choreMigration) {
    global.__choreMigration = migrate(global.__chorePool);
  }
  await global.__choreMigration;
  return global.__chorePool;
}

export async function query<T extends QueryResultRow = any>(text: string, params?: unknown[]): Promise<T[]> {
  const pool = await getPool();
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export type TxQuery = <T extends QueryResultRow = any>(text: string, params?: unknown[]) => Promise<T[]>;

/** Runs `fn` inside a single Postgres transaction, committing on success and rolling back on any thrown error. */
export async function withTransaction<T>(fn: (q: TxQuery) => Promise<T>): Promise<T> {
  const pool = await getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const txQuery: TxQuery = async (text, params) => {
      const result = await client.query(text, params);
      return result.rows;
    };
    const res = await fn(txQuery);
    await client.query('COMMIT');
    return res;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
