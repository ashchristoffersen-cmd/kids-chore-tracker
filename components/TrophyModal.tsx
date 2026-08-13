'use client';

import { useEffect } from 'react';
import { fireTrophyConfetti } from '@/lib/confetti';

export interface EarnedTrophy {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export default function TrophyModal({ trophy, onClose }: { trophy: EarnedTrophy; onClose: () => void }) {
  useEffect(() => {
    fireTrophyConfetti();
  }, [trophy.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="animate-pop max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="text-sm font-bold uppercase tracking-widest text-grape">New Trophy!</div>
        <div className="my-4 text-8xl">{trophy.icon}</div>
        <div className="text-3xl font-extrabold text-slate-800">{trophy.name}</div>
        <div className="mt-2 text-lg text-slate-500">{trophy.description}</div>
        <button
          onClick={onClose}
          className="tap-target mt-6 w-full rounded-2xl bg-grape py-4 text-xl font-bold text-white shadow-lg active:scale-95"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}
