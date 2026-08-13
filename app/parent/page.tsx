'use client';

import { useEffect, useState } from 'react';
import ParentDashboard from '@/components/parent/ParentDashboard';

const SESSION_KEY = 'chore_tracker_parent_authed';

export default function ParentGatePage() {
  const [pinSet, setPinSet] = useState<boolean | null>(null);
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === 'true') {
      setAuthed(true);
    }
    fetch('/api/parent/auth')
      .then((r) => r.json())
      .then((d) => setPinSet(d.pinSet));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!pinSet && pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/parent/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Incorrect PIN');
        return;
      }
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (authed) {
    return <ParentDashboard />;
  }

  if (pinSet === null) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl">🔒</div>
      <h1 className="mt-4 text-3xl font-extrabold text-slate-800">
        {pinSet ? 'Enter Parent PIN' : 'Create a Parent PIN'}
      </h1>
      <p className="mt-2 text-slate-500">
        {pinSet ? 'Enter your PIN to manage kids, chores, and money.' : 'Choose a 4-6 digit PIN to protect the parent zone.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="rounded-2xl border-2 border-slate-200 px-5 py-4 text-center text-2xl tracking-widest shadow-inner"
          autoFocus
        />
        {!pinSet && (
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Confirm PIN"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            className="rounded-2xl border-2 border-slate-200 px-5 py-4 text-center text-2xl tracking-widest shadow-inner"
          />
        )}
        {error && <div className="text-sm font-semibold text-red-500">{error}</div>}
        <button
          type="submit"
          disabled={submitting || pin.length < 4}
          className="tap-target mt-2 rounded-2xl bg-grape py-4 text-xl font-bold text-white shadow-lg disabled:opacity-50 active:scale-95"
        >
          {pinSet ? 'Unlock' : 'Create PIN'}
        </button>
      </form>

      <a href="/" className="mt-8 text-sm font-bold text-slate-400">
        ← Back to kid view
      </a>
    </div>
  );
}
