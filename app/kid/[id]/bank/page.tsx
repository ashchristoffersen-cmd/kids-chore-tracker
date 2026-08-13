import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getBank } from '@/lib/queries';
import { formatCents } from '@/lib/money';
import BackLink from '@/components/BackLink';
import TransactionList, { Transaction } from '@/components/TransactionList';

export const dynamic = 'force-dynamic';

export default function KidBankPage({ params }: { params: { id: string } }) {
  const db = getDb();
  const kid = db.prepare('SELECT * FROM kids WHERE id = ?').get(Number(params.id)) as any;
  if (!kid) notFound();

  const { balanceCents, transactions } = getBank(db, kid.id);

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 pb-16 pt-6">
      <BackLink href={`/kid/${kid.id}`}>← Back</BackLink>

      <div className="mt-6 text-center">
        <div className="text-6xl">🐷</div>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-800">{kid.name}&rsquo;s Piggy Bank</h1>
        <div className="mt-4 text-5xl font-extrabold text-green-600">{formatCents(balanceCents)}</div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-slate-600">Recent Activity</h2>
        <TransactionList transactions={transactions as Transaction[]} />
      </div>
    </div>
  );
}
