'use client';

/** `$`-prefixed number input for dollar amounts, held as a plain string. */
export default function DollarInput({
  value,
  onChange,
  placeholder,
  inputClassName = 'w-24 text-base',
  symbolClassName = 'text-sm',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputClassName?: string;
  symbolClassName?: string;
}) {
  return (
    <>
      <span className={`font-bold text-slate-500 ${symbolClassName}`}>$</span>
      <input
        type="number"
        step="0.05"
        min="0"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-xl border-2 border-slate-200 px-3 py-2 ${inputClassName}`}
      />
    </>
  );
}
