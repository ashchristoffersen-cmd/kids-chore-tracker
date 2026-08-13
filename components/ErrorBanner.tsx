'use client';

export default function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-600">
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="tap-target rounded-xl bg-red-500 px-3 py-2 font-bold text-white">
          Retry
        </button>
      )}
    </div>
  );
}
