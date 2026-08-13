'use client';

import { useEffect, useState, useCallback } from 'react';
import BackLink from '@/components/BackLink';
import { apiGet } from '@/lib/api';
import KidsChoresTab from './KidsChoresTab';
import BankTab from './BankTab';
import SettingsTab from './SettingsTab';

export interface KidSummary {
  id: number;
  name: string;
  avatar: string;
  color: string;
  balanceCents: number;
  totalChores: number;
  doneToday: number;
}

type Tab = 'kids' | 'bank' | 'settings';

export default function ParentDashboard() {
  const [tab, setTab] = useState<Tab>('kids');
  const [kids, setKids] = useState<KidSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshKids = useCallback(async () => {
    setKids(await apiGet('/api/kids'));
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshKids();
  }, [refreshKids]);

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 pb-16 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-slate-800">👪 Parent Zone</h1>
        <BackLink href="/">Exit</BackLink>
      </div>

      <div className="mt-6 flex gap-2 rounded-2xl bg-white/60 p-1.5">
        {(
          [
            ['kids', '🧒 Kids & Chores'],
            ['bank', '🐷 Bank'],
            ['settings', '⚙️ Settings'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`tap-target flex-1 rounded-xl py-3 text-sm font-bold transition-colors ${
              tab === key ? 'bg-white shadow text-grape' : 'text-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading…</div>
        ) : (
          <>
            {tab === 'kids' && <KidsChoresTab kids={kids} refreshKids={refreshKids} />}
            {tab === 'bank' && <BankTab kids={kids} refreshKids={refreshKids} />}
            {tab === 'settings' && <SettingsTab />}
          </>
        )}
      </div>
    </div>
  );
}
