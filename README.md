# Chore Champions

A gamified chore tracker for kids, built with Next.js and SQLite.

## Features

- **Daily chores per kid** — each kid gets their own recurring chore list with emoji and an optional dollar value.
- **One-tap completion** with confetti celebration.
- **Streaks** tracked per chore, shown right on the chore card.
- **21 trophies** — completion milestones, streaks, perfect days/weeks/months, money milestones, and fun ones (Early Bird, Comeback Kid, Weekend Warrior, All-Rounder).
- **Piggy bank** — chores can earn money automatically; a PIN-protected Parent Zone lets you add or withdraw money manually and see the full ledger.
- **Parent Zone** (PIN-protected) — manage kids, chores, and money.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000. On first visit there are no kids yet — go to
**Parent Zone**, set a PIN, and add your kids and their chores.

Data is stored in a local SQLite file at `data/chores.db` (created automatically,
not checked into git).

## Production

```bash
npm run build
npm run start
```

This is a small self-hosted app meant to run on a home server, NAS, or
Raspberry Pi and be opened from a shared tablet/browser on your home network.
Only the Parent Zone is PIN-protected — there's no per-user login — so treat
it as a single-household app rather than a multi-tenant service.

## Deploying (Railway)

The repo includes a `Dockerfile` and `railway.toml` for deploying to
[Railway](https://railway.app):

1. In Railway, create a new project from this GitHub repo (pick the branch
   you want deployed).
2. Railway will detect the `Dockerfile` automatically and build from it.
3. Add a **volume** to the service, mounted at `/data`. This is where the
   SQLite database lives — without it, data is lost on every redeploy.
4. Set the env var `DATA_DIR=/data` (the Dockerfile already sets this as a
   default, but setting it explicitly is a good safety net).
5. Deploy, then generate a public domain for the service under
   Settings → Networking to get your app's URL.

The app listens on `$PORT` (Railway sets this automatically) and has no other
required environment variables — the parent PIN is set from within the app on
first visit, not via config.
