'use client';

import { useState } from 'react';
import ChoreCard, { ChoreState } from './ChoreCard';
import TrophyModal, { EarnedTrophy } from './TrophyModal';
import ErrorBanner from './ErrorBanner';
import { fireChoreConfetti } from '@/lib/confetti';
import { formatCents } from '@/lib/money';
import { errorMessage, fetchJson } from '@/lib/fetchJson';

interface KidInfo {
  id: number;
  name: string;
  avatar: string;
  color: string;
}

export default function KidDashboard({
  kid,
  initialChores,
  initialBalanceCents,
  trophyCount,
  trophyTotal,
}: {
  kid: KidInfo;
  initialChores: ChoreState[];
  initialBalanceCents: number;
  trophyCount: number;
  trophyTotal: number;
}) {
  const [chores, setChores] = useState(initialChores);
  const [balanceCents, setBalanceCents] = useState(initialBalanceCents);
  const [earnedCount, setEarnedCount] = useState(trophyCount);
  const [trophyQueue, setTrophyQueue] = useState<EarnedTrophy[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const doneToday = chores.filter((c) => c.completedToday).length;
  const allDone = chores.length > 0 && doneToday === chores.length;

  async function handleToggle(choreId: number) {
    if (busyId) return;
    setBusyId(choreId);
    setError('');
    try {
      const data = await fetchJson<{ completed: boolean; balanceCents: number; newTrophies?: EarnedTrophy[] }>(
        `/api/chores/${choreId}/complete`,
        { method: 'POST' }
      );

      if (data.completed) fireChoreConfetti();
      setBalanceCents(data.balanceCents);

      const detail = await fetchJson<{ chores: ChoreState[]; trophies: { earned: boolean }[] }>(`/api/kids/${kid.id}`);
      setChores(detail.chores);
      setEarnedCount(detail.trophies.filter((t) => t.earned).length);

      if (data.newTrophies?.length) {
        setTrophyQueue((q) => [...q, ...data.newTrophies!]);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-6">
      <div className="flex items-center justify-between">
        <a href="/" className="tap-target rounded-full bg-white/80 px-4 py-2 text-sm font-bold shadow">
          ← Switch Kid
        </a>
        <a
          href={`/kid/${kid.id}/trophies`}
          className="tap-target rounded-full bg-white/80 px-4 py-2 text-sm font-bold shadow"
        >
          🏆 {earnedCount}/{trophyTotal}
        </a>
      </div>

      <div className="mt-6 flex flex-col items-center text-center">
        <div
          className="flex h-28 w-28 items-center justify-center rounded-full text-6xl shadow-lg"
          style={{ backgroundColor: kid.color + '33' }}
        >
          {kid.avatar}
        </div>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-800">{kid.name}&rsquo;s Chores</h1>

        <a
          href={`/kid/${kid.id}/bank`}
          className="tap-target mt-4 flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xl font-bold text-green-700 shadow-lg active:scale-95"
        >
          🐷 {formatCents(balanceCents)}
        </a>
      </div>

      <div className="mt-8">
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-500">
          <span>Today&rsquo;s Progress</span>
          <span>
            {doneToday}/{chores.length}
          </span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-white shadow-inner">
          <div
            className="h-full rounded-full bg-grassy transition-all duration-500"
            style={{ width: chores.length ? `${(doneToday / chores.length) * 100}%` : '0%' }}
          />
        </div>
        {allDone && (
          <div className="mt-3 animate-wiggle rounded-2xl bg-sunshine/40 p-3 text-center text-lg font-bold text-slate-700">
            🎉 All done for today! Amazing job!
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6">
          <ErrorBanner message={error} onRetry={() => window.location.reload()} />
        </div>
      )}

      <div className="mt-6 space-y-4">
        {chores.length === 0 && (
          <div className="rounded-3xl bg-white/70 p-8 text-center text-slate-500">
            No chores yet — ask a grown-up to add some in Parent Zone!
          </div>
        )}
        {chores.map((chore) => (
          <ChoreCard key={chore.id} chore={chore} onToggle={handleToggle} disabled={busyId === chore.id} />
        ))}
      </div>

      {trophyQueue.length > 0 && (
        <TrophyModal trophy={trophyQueue[0]} onClose={() => setTrophyQueue((q) => q.slice(1))} />
      )}
    </div>
  );
}
