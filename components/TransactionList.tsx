import { formatCents } from '@/lib/money';

export interface Transaction {
  id: number;
  amount_cents: number;
  reason: string;
  type?: string;
  created_at: string;
}

/**
 * Shared piggy-bank history list. `compact` renders the denser parent-zone
 * styling (smaller rows, date + time); otherwise the roomier kid-facing one.
 */
export default function TransactionList({
  transactions,
  compact = false,
}: {
  transactions: Transaction[];
  compact?: boolean;
}) {
  if (transactions.length === 0) {
    return <div className="rounded-2xl bg-white/70 p-6 text-center text-slate-400">No activity yet</div>;
  }

  return (
    <div className="space-y-2">
      {transactions.map((t) => (
        <div
          key={t.id}
          className={`flex items-center justify-between rounded-2xl bg-white ${compact ? 'p-3 shadow-sm' : 'p-4 shadow'}`}
        >
          <div>
            <div className={`font-semibold text-slate-700 ${compact ? 'text-sm' : ''}`}>{t.reason}</div>
            <div className="text-xs text-slate-400">
              {compact
                ? new Date(t.created_at).toLocaleString()
                : new Date(t.created_at).toLocaleDateString()}
            </div>
          </div>
          <div
            className={`font-bold ${compact ? '' : 'text-lg'} ${
              t.amount_cents >= 0 ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {t.amount_cents >= 0 ? '+' : ''}
            {formatCents(t.amount_cents)}
          </div>
        </div>
      ))}
    </div>
  );
}
