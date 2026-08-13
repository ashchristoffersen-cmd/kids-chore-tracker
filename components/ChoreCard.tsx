'use client';

import { formatCents } from '@/lib/money';

export interface ChoreState {
  id: number;
  name: string;
  emoji: string;
  money_cents: number;
  completedToday: boolean;
  streak: number;
}

export default function ChoreCard({
  chore,
  onToggle,
  disabled,
}: {
  chore: ChoreState;
  onToggle: (choreId: number) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(chore.id)}
      className={`tap-target w-full rounded-3xl border-4 p-5 text-left transition-all active:scale-95 ${
        chore.completedToday
          ? 'border-grassy bg-grassy/20 shadow-inner'
          : 'border-white bg-white shadow-lg hover:shadow-xl'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="text-5xl">{chore.emoji}</div>
        <div className="flex-1">
          <div className={`text-2xl font-bold ${chore.completedToday ? 'text-green-700 line-through' : ''}`}>
            {chore.name}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
            {chore.money_cents > 0 && (
              <span className="rounded-full bg-sunshine/40 px-2 py-0.5 font-semibold text-slate-700">
                {formatCents(chore.money_cents)}
              </span>
            )}
            {chore.streak > 0 && (
              <span className="flex items-center gap-1 font-semibold text-orange-500">
                🔥 {chore.streak} day{chore.streak === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 text-3xl ${
            chore.completedToday ? 'border-grassy bg-grassy text-white animate-pop' : 'border-slate-300 bg-slate-50'
          }`}
        >
          {chore.completedToday ? '✓' : ''}
        </div>
      </div>
    </button>
  );
}
