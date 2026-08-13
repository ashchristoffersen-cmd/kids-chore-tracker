import { getKidsSummary } from '@/lib/queries';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const kids = await getKidsSummary();

  if (kids.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="text-7xl">🌟</div>
        <h1 className="mt-4 text-4xl font-extrabold text-slate-800">Welcome to Chore Champions!</h1>
        <p className="mt-3 max-w-md text-lg text-slate-500">
          Let&rsquo;s get set up. Head to the Parent Zone to add your kids and their chores.
        </p>
        <a
          href="/parent"
          className="tap-target mt-8 rounded-2xl bg-grape px-8 py-4 text-xl font-bold text-white shadow-lg active:scale-95"
        >
          👪 Go to Parent Zone
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-12">
      <h1 className="text-4xl font-extrabold text-slate-800">Who&rsquo;s Ready? 🎉</h1>
      <p className="mt-2 text-lg text-slate-500">Tap your name to start!</p>

      <div className="mt-10 grid w-full max-w-xl grid-cols-1 gap-6 sm:grid-cols-2">
        {kids.map((kid: any) => (
          <a
            key={kid.id}
            href={`/kid/${kid.id}`}
            className="tap-target flex flex-col items-center rounded-3xl bg-white p-8 shadow-lg transition-transform active:scale-95"
            style={{ borderBottom: `8px solid ${kid.color}` }}
          >
            <div className="text-7xl">{kid.avatar}</div>
            <div className="mt-3 text-2xl font-bold text-slate-800">{kid.name}</div>
            {kid.totalChores > 0 && (
              <div className="mt-2 text-sm font-semibold text-slate-400">
                {kid.doneToday}/{kid.totalChores} done today
              </div>
            )}
          </a>
        ))}
      </div>

      <a href="/parent" className="tap-target mt-14 rounded-full bg-white/70 px-5 py-2 text-sm font-bold text-slate-500 shadow">
        👪 Parent Zone
      </a>
    </div>
  );
}
