'use client';

import { useState } from 'react';
import { AVATAR_OPTIONS, AVATAR_COLORS, CHORE_EMOJI_OPTIONS } from '@/lib/emojis';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { centsToDollars, dollarsToCents, formatCents } from '@/lib/money';
import DollarInput from '@/components/DollarInput';
import EmojiPicker from '@/components/EmojiPicker';
import { KidSummary } from './ParentDashboard';

interface ChoreFull {
  id: number;
  kid_id: number;
  name: string;
  emoji: string;
  money_cents: number;
  active: number;
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

  async function loadChores(kidId: number) {
    const data = await apiGet(`/api/kids/${kidId}`);
    setChoresByKid((prev) => ({ ...prev, [kidId]: data.chores }));
  }

  async function toggleExpand(kidId: number) {
    if (expandedKid === kidId) {
      setExpandedKid(null);
      return;
    }
    setExpandedKid(kidId);
    if (!choresByKid[kidId]) await loadChores(kidId);
  }

  async function handleAddKid(e: React.FormEvent) {
    e.preventDefault();
    if (!newKidName.trim()) return;
    await apiPost('/api/kids', { name: newKidName.trim(), avatar: newKidAvatar, color: newKidColor });
    setNewKidName('');
    setAddingKid(false);
    await refreshKids();
  }

  async function handleDeleteKid(kidId: number, name: string) {
    if (!confirm(`Remove ${name} and all their chore history? This can't be undone.`)) return;
    await apiDelete(`/api/kids/${kidId}`);
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
            <ChoreManager kidId={kid.id} chores={choresByKid[kid.id] || []} onChange={() => loadChores(kid.id).then(refreshKids)} />
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
            <EmojiPicker options={AVATAR_OPTIONS} value={newKidAvatar} onChange={setNewKidAvatar} size="lg" />
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
  onChange,
}: {
  kidId: number;
  chores: ChoreFull[];
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(CHORE_EMOJI_OPTIONS[0]);
  const [dollars, setDollars] = useState('0.25');
  const [editingId, setEditingId] = useState<number | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await apiPost('/api/chores', { kid_id: kidId, name: name.trim(), emoji, money_cents: dollarsToCents(dollars) });
    setName('');
    setDollars('0.25');
    setAdding(false);
    onChange();
  }

  async function handleArchive(choreId: number) {
    await apiDelete(`/api/chores/${choreId}`);
    onChange();
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50 p-4">
      <div className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Daily Chores</div>
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
          <EmojiPicker options={CHORE_EMOJI_OPTIONS} value={emoji} onChange={setEmoji} />
          <div className="flex items-center gap-2">
            <DollarInput value={dollars} onChange={setDollars} />
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
  const [dollars, setDollars] = useState(centsToDollars(chore.money_cents));

  async function handleSave() {
    await apiPatch(`/api/chores/${chore.id}`, {
      name: name.trim() || chore.name,
      emoji,
      money_cents: dollarsToCents(dollars),
    });
    onDone();
  }

  return (
    <div className="space-y-3 rounded-2xl bg-white p-3 shadow-sm">
      <EmojiPicker options={CHORE_EMOJI_OPTIONS} value={emoji} onChange={setEmoji} size="sm" />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border-2 border-slate-200 px-3 py-2"
      />
      <div className="flex items-center gap-2">
        <DollarInput value={dollars} onChange={setDollars} />
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
