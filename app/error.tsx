'use client';

import { useEffect } from 'react';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app] render error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-6xl">😵</div>
      <h1 className="text-2xl font-extrabold text-slate-800">Something went wrong</h1>
      <p className="max-w-md text-slate-500">
        The app hit an unexpected error. Try again — if it keeps happening, check the server logs.
      </p>
      <div className="mt-2 flex gap-3">
        <button onClick={reset} className="tap-target rounded-2xl bg-grape px-6 py-3 font-bold text-white shadow-lg">
          Try again
        </button>
        <a href="/" className="tap-target rounded-2xl bg-white px-6 py-3 font-bold text-slate-600 shadow">
          Home
        </a>
      </div>
    </div>
  );
}
