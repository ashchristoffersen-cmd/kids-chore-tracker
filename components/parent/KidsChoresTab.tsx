'use client';

import { useState } from 'react';
import { AVATAR_OPTIONS, AVATAR_COLORS, CHORE_EMOJI_OPTIONS } from '@/lib/emojis';
import { formatCents } from '@/lib/money';
import { KidSummary } from './ParentDashboard';

interface ChoreFull {
  id: number;
  kid_id: number;
  name: string;
  emoji: string;
  money_cents: number;
  active: number;
}

interface TrophyState {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt: string | null;
}

export default function KidsChoresTab({
  kids,
  refreshKids,
}: {
  kids: KidSummary[];
  refreshKids: () => Promise<void>;
}) {
  const [addingKid, setAddingKid] = useState(false);
  const [newKidName, setNewKidName] = useState('');
  const [newKidAvatar, setNewKidAvatar] = useState(AVATAR_OPTIONS[0]);
  const [newKidColor, setNewKidColor] = useState(AVATAR_COLORS[0]);

  const [expandedKid, setExpandedKid] = useState<number | null>(null);
  const [choresByKid, setChoresByKid] = useState<Record<number, ChoreFull[]>>({});
  const [trophiesByKid, setTrophiesByKid] = useState<Record<number, TrophyState[]>>({});

  async function loadKidDetail(kidId: number) {
    const res = await fetch(`/api/kids/${kidId}`);
    const data = await res.json();
    setChoresByKid((prev) => ({ ...prev, [kidId]: data.chores }));
    setTrophiesByKid((prev) => ({ ...prev, [kidId]: data.trophies }));
  }

  async function toggleExpand(kidId: number) {
    if (expandedKid === kidId) {
      setExpandedKid(null);
      return;
    }
    setExpandedKid(kidId);
    if (!choresByKid[kidId]) await loadKidDetail(kidId);
  }

  async function handleAddKid(e: React.FormEvent) {
    e.preventDefault();
    if (!newKidName.trim()) return;
    await fetch('/api/kids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKidName.trim(), avatar: newKidAvatar, color: newKidColor }),
    });
    setNewKidName('');
    setAddingKid(false);
    await refreshKids();
  }

  async function handleDeleteKid(kidId: number, name: string) {
    if (!confirm(`Remove ${name} and all their chore history? This can't be undone.`)) return;
    await fetch(`/api/kids/${kidId}`, { method: 'DELETE' });
    await refreshKids();
  }

  return (
    <div className="space-y-4">
      {kids.map((kid) => (
        <div key={kid.id} className="overflow-hidden rounded-3xl bg-white shadow">
          <div className="flex items-center gap-4 p-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-3xl"
              style={{ backgroundColor: kid.color + '33' }}
            >
              {kid.avatar}
            </div>
            <div className="flex-1">
              <div className="text-xl font-bold text-slate-800">{kid.name}</div>
              <div className="text-sm text-slate-400">
                {kid.totalChores} chore{kid.totalChores === 1 ? '' : 's'} · {formatCents(kid.balanceCents)} saved
              </div>
            </div>
            <button
              onClick={() => toggleExpand(kid.id)}
              className="tap-target rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600"
            >
              {expandedKid === kid.id ? 'Close' : 'Manage'}
            </button>
            <button
              onClick={() => handleDeleteKid(kid.id, kid.name)}
              className="tap-target rounded-full bg-red-50 px-3 py-2 text-sm font-bold text-red-500"
            >
              🗑️
            </button>
          </div>

          {expandedKid === kid.id && (
            <ChoreManager
              kidId={kid.id}
              chores={choresByKid[kid.id] || []}
              trophies={trophiesByKid[kid.id] || []}
              onChange={() => loadKidDetail(kid.id).then(refreshKids)}
            />
          )}
        </div>
      ))}

      {addingKid ? (
        <form onSubmit={handleAddKid} className="space-y-4 rounded-3xl bg-white p-5 shadow">
          <input
            autoFocus
            placeholder="Kid's name"
            value={newKidName}
            onChange={(e) => setNewKidName(e.target.value)}
            className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-lg"
          />
          <div>
            <div className="mb-1 text-xs font-bold uppercase text-slate-400">Avatar</div>
            <div className="flex flex-wrap gap-2">
              {AVATAR_OPTIONS.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setNewKidAvatar(a)}
                  className={`tap-target flex h-11 w-11 items-center justify-center rounded-full text-2xl ${
                    newKidAvatar === a ? 'bg-grape/20 ring-2 ring-grape' : 'bg-slate-50'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs font-bold uppercase text-slate-400">Color</div>
            <div className="flex gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setNewKidColor(c)}
                  className={`tap-target h-9 w-9 rounded-full ${newKidColor === c ? 'ring-4 ring-slate-300' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="tap-target flex-1 rounded-xl bg-grape py-3 font-bold text-white">
              Add Kid
            </button>
            <button
              type="button"
              onClick={() => setAddingKid(false)}
              className="tap-target rounded-xl bg-slate-100 px-5 py-3 font-bold text-slate-500"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAddingKid(true)}
          className="tap-target w-full rounded-3xl border-4 border-dashed border-slate-300 py-6 text-lg font-bold text-slate-400"
        >
          + Add a Kid
        </button>
      )}
    </div>
  );
}

function ChoreManager({
  kidId,
  chores,
  trophies,
  onChange,
}: {
  kidId: number;
  chores: ChoreFull[];
  trophies: TrophyState[];
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(CHORE_EMOJI_OPTIONS[0]);
  const [dollars, setDollars] = useState('0.25');
  const [editingId, setEditingId] = useState<number | null>(null);

  const earnedTrophies = trophies
    .filter((t) => t.earned)
    .sort((a, b) => (b.earnedAt || '').localeCompare(a.earnedAt || ''));

  async function handleRemoveTrophy(trophyId: string) {
    await fetch(`/api/trophies/${kidId}/${trophyId}`, { method: 'DELETE' });
    onChange();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const money_cents = Math.max(0, Math.round(parseFloat(dollars || '0') * 100));
    await fetch('/api/chores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kid_id: kidId, name: name.trim(), emoji, money_cents }),
    });
    setName('');
    setDollars('0.25');
    setAdding(false);
    onChange();
  }

  async function handleArchive(choreId: number) {
    await fetch(`/api/chores/${choreId}`, { method: 'DELETE' });
    onChange();
  }

  async function handleResetProgress() {
    if (
      !confirm(
        'Reset this kid’s progress? This clears all completions, streaks, trophies, and piggy bank balance. Their chore list stays the same. This can’t be undone.'
      )
    )
      return;
    await fetch(`/api/kids/${kidId}/reset`, { method: 'POST' });
    onChange();
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-bold uppercase tracking-wide text-slate-400">Daily Chores</div>
        <button
          onClick={handleResetProgress}
          className="tap-target rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-500"
        >
          Reset Progress
        </button>
      </div>
      <div className="space-y-2">
        {chores.map((chore) =>
          editingId === chore.id ? (
            <EditChoreRow
              key={chore.id}
              chore={chore}
              onDone={() => {
                setEditingId(null);
                onChange();
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={chore.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <div className="text-2xl">{chore.emoji}</div>
              <div className="flex-1 font-semibold text-slate-700">{chore.name}</div>
              <div className="text-sm font-bold text-slate-500">{formatCents(chore.money_cents)}</div>
              <button
                onClick={() => setEditingId(chore.id)}
                className="tap-target rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleArchive(chore.id)}
                className="tap-target rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-500"
              >
                Remove
              </button>
            </div>
          )
        )}
        {chores.length === 0 && <div className="py-4 text-center text-sm text-slate-400">No chores yet.</div>}
      </div>

      {adding ? (
        <form onSubmit={handleAdd} className="mt-4 space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          <input
            autoFocus
            placeholder="Chore name (e.g. Make bed)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border-2 border-slate-200 px-3 py-2"
          />
          <div className="flex flex-wrap gap-2">
            {CHORE_EMOJI_OPTIONS.map((em) => (
              <button
                type="button"
                key={em}
                onClick={() => setEmoji(em)}
                className={`tap-target flex h-9 w-9 items-center justify-center rounded-full text-xl ${
                  emoji === em ? 'bg-grape/20 ring-2 ring-grape' : 'bg-slate-50'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500">$</span>
            <input
              type="number"
              step="0.05"
              min="0"
              value={dollars}
              onChange={(e) => setDollars(e.target.value)}
              className="w-24 rounded-xl border-2 border-slate-200 px-3 py-2"
            />
            <span className="text-xs text-slate-400">per completion (0 for none)</span>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="tap-target flex-1 rounded-xl bg-grape py-2.5 font-bold text-white">
              Add Chore
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="tap-target rounded-xl bg-slate-100 px-4 py-2.5 font-bold text-slate-500"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="tap-target mt-4 w-full rounded-2xl border-2 border-dashed border-slate-300 py-3 text-sm font-bold text-slate-400"
        >
          + Add Chore
        </button>
      )}

      <div className="mt-6 mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">
        Trophies Earned ({earnedTrophies.length}) — newest first
      </div>
      <div className="max-h-72 space-y-2 overflow-y-auto">
        {earnedTrophies.map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <div className="text-2xl">{t.icon}</div>
            <div className="flex-1">
              <div className="font-semibold text-slate-700">{t.name}</div>
              <div className="text-xs text-slate-400">{t.description}</div>
            </div>
            <button
              onClick={() => handleRemoveTrophy(t.id)}
              className="tap-target rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-500"
            >
              Remove
            </button>
          </div>
        ))}
        {earnedTrophies.length === 0 && (
          <div className="py-4 text-center text-sm text-slate-400">No trophies earned yet.</div>
        )}
      </div>
    </div>
  );
}

function EditChoreRow({
  chore,
  onDone,
  onCancel,
}: {
  chore: ChoreFull;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(chore.name);
  const [emoji, setEmoji] = useState(chore.emoji);
  const [dollars, setDollars] = useState((chore.money_cents / 100).toFixed(2));

  async function handleSave() {
    const money_cents = Math.max(0, Math.round(parseFloat(dollars || '0') * 100));
    await fetch(`/api/chores/${chore.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() || chore.name, emoji, money_cents }),
    });
    onDone();
  }

  return (
    <div className="space-y-3 rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {CHORE_EMOJI_OPTIONS.map((em) => (
          <button
            type="button"
            key={em}
            onClick={() => setEmoji(em)}
            className={`tap-target flex h-8 w-8 items-center justify-center rounded-full text-lg ${
              emoji === em ? 'bg-grape/20 ring-2 ring-grape' : 'bg-slate-50'
            }`}
          >
            {em}
          </button>
        ))}
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border-2 border-slate-200 px-3 py-2"
      />
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-slate-500">$</span>
        <input
          type="number"
          step="0.05"
          min="0"
          value={dollars}
          onChange={(e) => setDollars(e.target.value)}
          className="w-24 rounded-xl border-2 border-slate-200 px-3 py-2"
        />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} className="tap-target flex-1 rounded-xl bg-grassy py-2 font-bold text-white">
          Save
        </button>
        <button onClick={onCancel} className="tap-target rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-500">
          Cancel
        </button>
      </div>
    </div>
  );
}
