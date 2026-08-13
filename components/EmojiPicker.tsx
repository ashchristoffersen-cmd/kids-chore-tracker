'use client';

type Size = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-8 w-8 text-lg',
  md: 'h-9 w-9 text-xl',
  lg: 'h-11 w-11 text-2xl',
};

/** Row of selectable emoji buttons (avatars, chore icons). */
export default function EmojiPicker({
  options,
  value,
  onChange,
  size = 'md',
}: {
  options: string[];
  value: string;
  onChange: (emoji: string) => void;
  size?: Size;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((emoji) => (
        <button
          type="button"
          key={emoji}
          onClick={() => onChange(emoji)}
          className={`tap-target flex items-center justify-center rounded-full ${SIZE_CLASSES[size]} ${
            value === emoji ? 'bg-grape/20 ring-2 ring-grape' : 'bg-slate-50'
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
