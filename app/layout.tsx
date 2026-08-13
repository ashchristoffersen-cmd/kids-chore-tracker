import type { Metadata } from 'next';
import './globals.css';

const favicon =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">🏆</text></svg>'
  );

export const metadata: Metadata = {
  title: 'Chore Champions',
  description: 'A gamified chore tracker for kids',
  icons: { icon: favicon },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-fun text-slate-800">{children}</body>
    </html>
  );
}
