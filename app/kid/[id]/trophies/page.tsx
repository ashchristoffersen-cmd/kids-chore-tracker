import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getKidDetail } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default function KidTrophiesPage({ params }: { params: { id: string } }) {
  const db = getDb();
  const detail = getKidDetail(db, Number(params.id));
  if (!detail) notFound();

  const earnedCount = detail.trophies.filter((t) => t.earned).length;

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pb-16 pt-6">
      <a
        href={`/kid/${detail.kid.id}`}
        className="tap-target rounded-full bg-white/80 px-4 py-2 text-sm font-bold shadow"
      >
        ← Back
      </a>

      <div className="mt-6 text-center">
        <div className="text-6xl">🏆</div>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-800">{detail.kid.name}&rsquo;s Trophy Case</h1>
        <p className="mt-1 text-lg text-slate-500">
          {earnedCount} of {detail.trophies.length} earned
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {detail.trophies.map((t) => (
          <div
            key={t.id}
            className={`flex flex-col items-center rounded-3xl p-4 text-center shadow ${
              t.earned ? 'bg-white' : 'bg-white/40 grayscale'
            }`}
          >
            <div className={`text-5xl ${t.earned ? '' : 'opacity-40'}`}>{t.icon}</div>
            <div className="mt-2 text-sm font-bold text-slate-700">{t.name}</div>
            <div className="mt-1 text-xs text-slate-400">{t.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
