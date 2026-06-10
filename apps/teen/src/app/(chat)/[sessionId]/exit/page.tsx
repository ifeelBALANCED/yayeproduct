import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function ExitPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-between bg-bg px-6 py-12">
      {/* Градуація — ключовий KPI */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-inkSoft">
          [GRADUATION · COMPLETED]
        </p>
        <h1 className="font-serif text-[3.5rem] italic leading-tight text-ink">
          сесія
          <br />
          завершена
        </h1>
        <p className="max-w-xs font-sans text-base leading-relaxed text-inkSoft">
          25 хвилин пройшло.
          <br />
          зроби собі чай і повернись, якщо захочеш.
        </p>

        {/* Антипатерн «we miss you» заборонений — ніякого утримання */}
      </div>

      <div className="w-full max-w-sm space-y-3">
        <Link
          href="/specialists"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 font-sans text-base font-medium text-white transition-opacity active:opacity-80"
        >
          поговорити з фахівцем
          <ChevronRight size={18} strokeWidth={1.5} />
        </Link>
        <Link
          href="/"
          className="block text-center font-sans text-sm text-inkSoft underline-offset-2 hover:underline"
        >
          на головну
        </Link>
      </div>
    </main>
  );
}
