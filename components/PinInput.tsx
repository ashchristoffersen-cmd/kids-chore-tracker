'use client';

/** Numeric-keypad password field used for parent PIN entry. */
export default function PinInput({
  value,
  onChange,
  placeholder,
  autoFocus,
  className = 'w-full rounded-xl px-4 py-3',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <input
      type="password"
      inputMode="numeric"
      pattern="[0-9]*"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoFocus={autoFocus}
      className={`border-2 border-slate-200 ${className}`}
    />
  );
}
