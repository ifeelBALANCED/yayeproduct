import type { ReactNode } from 'react';
import Link from 'next/link';

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-divider px-4 py-3">
        <Link href="/" className="font-serif text-lg italic text-ink">
          Я є
        </Link>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-inkSoft">
            Я є AI · не людина
          </span>
          {/* SOS — завжди видимий, клінічна вимога */}
          <Link
            href="/crisis"
            className="rounded-2xl bg-crisis px-3 py-1.5 font-mono text-xs font-medium tracking-wider text-white transition-opacity active:opacity-80"
            aria-label="SOS — кризова допомога"
          >
            SOS
          </Link>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
