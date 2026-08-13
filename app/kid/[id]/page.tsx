import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getKidDetail } from '@/lib/queries';
import KidDashboard from '@/components/KidDashboard';

export const dynamic = 'force-dynamic';

export default function KidPage({ params }: { params: { id: string } }) {
  const db = getDb();
  const detail = getKidDetail(db, Number(params.id));
  if (!detail) notFound();

  const trophyCount = detail.trophies.filter((t) => t.earned).length;

  return (
    <KidDashboard
      kid={detail.kid}
      initialChores={detail.chores}
      initialBalanceCents={detail.balanceCents}
      trophyCount={trophyCount}
      trophyTotal={detail.trophies.length}
    />
  );
}
