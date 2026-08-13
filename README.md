# Chore Champions

A gamified chore tracker for kids, built with Next.js and Postgres.

## Features

- **Daily chores per kid** — each kid gets their own recurring chore list with emoji and an optional dollar value.
- **One-tap completion** with confetti celebration.
- **Streaks** tracked per chore, shown right on the chore card.
- **21 trophies** — completion milestones, streaks, perfect days/weeks/months, money milestones, and fun ones (Early Bird, Comeback Kid, Weekend Warrior, All-Rounder).
- **Piggy bank** — chores can earn money automatically; a PIN-protected Parent Zone lets you add or withdraw money manually and see the full ledger.
- **Parent Zone** (PIN-protected) — manage kids, chores, and money.

## Running it

You need a Postgres database — [Supabase](https://supabase.com) has a free tier
that works well. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to
your connection string (from Supabase: Project Settings → Database →
Connection string).

```bash
npm install
npm run dev
```

Then open http://localhost:3000. On first visit there are no kids yet — go to
**Parent Zone**, set a PIN, and add your kids and their chores. The database
schema and trophy catalog are created automatically on first request.

## Production

```bash
npm run build
npm run start
```

Only the Parent Zone is PIN-protected — there's no per-user login — so treat
it as a single-household app rather than a multi-tenant service.

## Deploying (Vercel + Supabase)

1. In [Supabase](https://supabase.com), create a project and grab its Postgres
   connection string (Project Settings → Database → Connection string). Use
   the **Transaction pooler** URI (port 6543) — Vercel's serverless functions
   need pooled connections rather than a direct connection.
2. In [Vercel](https://vercel.com), import this GitHub repo as a new project
   (pick the branch you want deployed).
3. Set the env var `DATABASE_URL` to the connection string from step 1.
4. Deploy. Vercel gives you a `*.vercel.app` URL immediately, plus the option
   to attach a custom domain.

No other environment variables are required — the parent PIN is set from
within the app on first visit, not via config.

## Deploying (Railway, alternative)

The repo also includes a `Dockerfile` and `railway.toml` if you'd rather run
this as a long-lived container instead of on Vercel:

1. In Railway, create a new project from this GitHub repo.
2. Railway detects the `Dockerfile` and builds from it automatically.
3. Set the env var `DATABASE_URL` (same Supabase connection string as above,
   or any other Postgres instance — no volume needed since data lives in
   Postgres, not on local disk).
4. Deploy, then generate a public domain under Settings → Networking.
