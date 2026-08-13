/** The small pill-shaped navigation link used at the top of pages. */
export default function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="tap-target rounded-full bg-white/80 px-4 py-2 text-sm font-bold shadow">
      {children}
    </a>
  );
}
