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

## Tests

```bash
npm test              # run the unit tests once
npm run test:coverage # run with a coverage report
```

Unit tests live in `tests/` and cover the `lib/` logic (dates, money formatting,
trophy evaluation, dashboard queries, parent PIN hashing) against a fresh
in-memory SQLite database built from the real schema.

## Production

```bash
npm run build
npm run start
```

This is a small self-hosted app meant to run on a home server, NAS, or
Raspberry Pi and be opened from a shared tablet/browser on your home network —
there's no built-in HTTPS or multi-household auth, so don't expose it directly
to the internet.
