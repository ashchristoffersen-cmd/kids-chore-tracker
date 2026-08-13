import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { getBank } from '@/lib/queries';
import { formatCents } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function KidBankPage({ params }: { params: { id: string } }) {
  const [kid] = await query<any>('SELECT * FROM kids WHERE id = $1', [Number(params.id)]);
  if (!kid) notFound();

  const { balanceCents, transactions } = await getBank(kid.id);

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 pb-16 pt-6">
      <a href={`/kid/${kid.id}`} className="tap-target rounded-full bg-white/80 px-4 py-2 text-sm font-bold shadow">
        ← Back
      </a>

      <div className="mt-6 text-center">
        <div className="text-6xl">🐷</div>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-800">{kid.name}&rsquo;s Piggy Bank</h1>
        <div className="mt-4 text-5xl font-extrabold text-green-600">{formatCents(balanceCents)}</div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-slate-600">Recent Activity</h2>
        <div className="space-y-2">
          {(transactions as any[]).length === 0 && (
            <div className="rounded-2xl bg-white/70 p-6 text-center text-slate-400">No activity yet</div>
          )}
          {(transactions as any[]).map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow">
              <div>
                <div className="font-semibold text-slate-700">{t.reason}</div>
                <div className="text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString()}</div>
              </div>
              <div className={`text-lg font-bold ${t.amount_cents >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {t.amount_cents >= 0 ? '+' : ''}
                {formatCents(t.amount_cents)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
