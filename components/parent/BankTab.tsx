'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { dollarsToCents, formatCents } from '@/lib/money';
import DollarInput from '@/components/DollarInput';
import TransactionList, { Transaction } from '@/components/TransactionList';
import { KidSummary } from './ParentDashboard';

export default function BankTab({ kids, refreshKids }: { kids: KidSummary[]; refreshKids: () => Promise<void> }) {
  const [selectedKidId, setSelectedKidId] = useState<number | null>(kids[0]?.id ?? null);
  const [balanceCents, setBalanceCents] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedKidId && kids[0]) setSelectedKidId(kids[0].id);
  }, [kids, selectedKidId]);

  async function loadBank(kidId: number) {
    const data = await apiGet(`/api/bank/${kidId}`);
    setBalanceCents(data.balanceCents);
    setTransactions(data.transactions);
  }

  useEffect(() => {
    if (selectedKidId) loadBank(selectedKidId);
  }, [selectedKidId]);

  async function handleAdjust(type: 'manual_add' | 'manual_remove') {
    if (!selectedKidId) return;
    const cents = dollarsToCents(amount);
    if (!cents) return;
    setSubmitting(true);
    try {
      await apiPost(`/api/bank/${selectedKidId}`, {
        amount_cents: cents,
        reason: reason.trim() || (type === 'manual_add' ? 'Deposit from parent' : 'Withdrawal'),
        type,
      });
      setAmount('');
      setReason('');
      await loadBank(selectedKidId);
      await refreshKids();
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

      <div className="rounded-3xl bg-white p-6 text-center shadow">
        <div className="text-sm font-bold uppercase text-slate-400">Balance</div>
        <div className="mt-1 text-5xl font-extrabold text-green-600">{formatCents(balanceCents)}</div>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow">
        <div className="mb-3 text-sm font-bold uppercase text-slate-400">Add or Remove Money</div>
        <div className="flex items-center gap-2">
          <DollarInput
            value={amount}
            onChange={setAmount}
            placeholder="0.00"
            inputClassName="w-28 text-lg"
            symbolClassName="text-lg"
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
        <TransactionList transactions={transactions} compact />
      </div>
    </div>
  );
}
