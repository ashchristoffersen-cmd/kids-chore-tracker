'use client';

import { useEffect, useState } from 'react';
import { formatCents } from '@/lib/money';
import { errorMessage, fetchJson, postJson } from '@/lib/fetchJson';
import ErrorBanner from '../ErrorBanner';
import { KidSummary } from './ParentDashboard';

interface Transaction {
  id: number;
  amount_cents: number;
  reason: string;
  type: string;
  created_at: string;
}

export default function BankTab({ kids, refreshKids }: { kids: KidSummary[]; refreshKids: () => Promise<void> }) {
  const [selectedKidId, setSelectedKidId] = useState<number | null>(kids[0]?.id ?? null);
  const [balanceCents, setBalanceCents] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selectedKidId && kids[0]) setSelectedKidId(kids[0].id);
  }, [kids, selectedKidId]);

  async function loadBank(kidId: number) {
    const data = await fetchJson<{ balanceCents: number; transactions: Transaction[] }>(`/api/bank/${kidId}`);
    setBalanceCents(data.balanceCents);
    setTransactions(data.transactions ?? []);
  }

  useEffect(() => {
    if (!selectedKidId) return;
    setError('');
    loadBank(selectedKidId).catch((err) => setError(errorMessage(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKidId]);

  async function handleAdjust(type: 'manual_add' | 'manual_remove') {
    if (!selectedKidId) return;
    const dollars = parseFloat(amount);
    const cents = Number.isFinite(dollars) ? Math.round(dollars * 100) : 0;
    if (cents <= 0) {
      setError('Enter an amount greater than $0.00');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await postJson(`/api/bank/${selectedKidId}`, {
        amount_cents: cents,
        reason: reason.trim() || (type === 'manual_add' ? 'Deposit from parent' : 'Withdrawal'),
        type,
      });
      setAmount('');
      setReason('');
      await loadBank(selectedKidId);
      await refreshKids();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (kids.length === 0) {
    return <div className="rounded-3xl bg-white p-8 text-center text-slate-400">Add a kid first to manage their bank.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto">
        {kids.map((kid) => (
          <button
            key={kid.id}
            onClick={() => setSelectedKidId(kid.id)}
            className={`tap-target flex shrink-0 items-center gap-2 rounded-full px-4 py-2 font-bold ${
              selectedKidId === kid.id ? 'bg-grape text-white' : 'bg-white text-slate-500'
            }`}
          >
            <span className="text-xl">{kid.avatar}</span> {kid.name}
          </button>
        ))}
      </div>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={
            selectedKidId
              ? () => {
                  setError('');
                  loadBank(selectedKidId).catch((err) => setError(errorMessage(err)));
                }
              : undefined
          }
        />
      )}

      <div className="rounded-3xl bg-white p-6 text-center shadow">
        <div className="text-sm font-bold uppercase text-slate-400">Balance</div>
        <div className="mt-1 text-5xl font-extrabold text-green-600">{formatCents(balanceCents)}</div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <div className="mb-3 text-sm font-bold uppercase text-slate-400">Add or Remove Money</div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-500">$</span>
          <input
            type="number"
            step="0.05"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-28 rounded-xl border-2 border-slate-200 px-3 py-2 text-lg"
          />
          <input
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex-1 rounded-xl border-2 border-slate-200 px-3 py-2"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            disabled={submitting}
            onClick={() => handleAdjust('manual_add')}
            className="tap-target flex-1 rounded-xl bg-grassy py-3 font-bold text-white disabled:opacity-50"
          >
            + Add Money
          </button>
          <button
            disabled={submitting}
            onClick={() => handleAdjust('manual_remove')}
            className="tap-target flex-1 rounded-xl bg-bubblegum py-3 font-bold text-white disabled:opacity-50"
          >
            − Take Out
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-bold uppercase text-slate-400">History</div>
        <div className="space-y-2">
          {transactions.length === 0 && (
            <div className="rounded-2xl bg-white/70 p-6 text-center text-slate-400">No activity yet</div>
          )}
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
              <div>
                <div className="text-sm font-semibold text-slate-700">{t.reason}</div>
                <div className="text-xs text-slate-400">{new Date(t.created_at).toLocaleString()}</div>
              </div>
              <div className={`font-bold ${t.amount_cents >= 0 ? 'text-green-600' : 'text-red-500'}`}>
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
