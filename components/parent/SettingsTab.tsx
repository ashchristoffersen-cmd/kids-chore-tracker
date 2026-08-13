'use client';

import { useState } from 'react';
import { errorMessage, postJson } from '@/lib/fetchJson';

export default function SettingsTab() {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPin !== confirmPin) {
      setError('New PINs do not match');
      return;
    }
    setSubmitting(true);
    try {
      await postJson('/api/parent/change-pin', { currentPin, newPin });
      setMessage('PIN updated!');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <div className="mb-4 text-lg font-bold text-slate-700">Change Parent PIN</div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          inputMode="numeric"
          placeholder="Current PIN"
          value={currentPin}
          onChange={(e) => setCurrentPin(e.target.value)}
          className="w-full rounded-xl border-2 border-slate-200 px-4 py-3"
        />
        <input
          type="password"
          inputMode="numeric"
          placeholder="New PIN"
          value={newPin}
          onChange={(e) => setNewPin(e.target.value)}
          className="w-full rounded-xl border-2 border-slate-200 px-4 py-3"
        />
        <input
          type="password"
          inputMode="numeric"
          placeholder="Confirm New PIN"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
          className="w-full rounded-xl border-2 border-slate-200 px-4 py-3"
        />
        {error && <div className="text-sm font-semibold text-red-500">{error}</div>}
        {message && <div className="text-sm font-semibold text-green-600">{message}</div>}
        <button
          type="submit"
          disabled={submitting}
          className="tap-target w-full rounded-xl bg-grape py-3 font-bold text-white disabled:opacity-50"
        >
          {submitting ? 'Updating…' : 'Update PIN'}
        </button>
      </form>
    </div>
  );
}
