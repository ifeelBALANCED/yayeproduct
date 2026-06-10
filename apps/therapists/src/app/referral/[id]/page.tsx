// [13] Деталь реферала — статичний mock для MVP-демо

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const MOCK_SUMMARY = {
  theme: 'тривога',
  age: '13-15',
  turns: 7,
  duration: '18 хв',
  modes: [2, 2, 2, 1, 2, 3, 2],
  summary:
    'підліток звернувся з відчуттям постійної тривоги перед школою. ' +
    'переважав mode 2 (регуляція). запропоновано вправу 4-6 і заземлення 5-4-3-2-1. ' +
    'на 18-й хвилині виник сигнал companionship drift — три-хідова відповідь застосована.',
  flags: ['elevated anxiety', 'companionship drift'],
};

export default async function ReferralPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-bg">
      <header className="flex items-center gap-3 border-b border-divider px-5 py-4">
        <Link
          href="/dashboard"
          className="rounded-xl p-1.5 text-inkSoft transition-colors hover:bg-bgSoft"
          aria-label="назад"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </Link>
        <div>
          <p className="font-sans text-base text-ink">реферал #{id}</p>
          <p className="font-mono text-xs text-inkSoft">
            {MOCK_SUMMARY.theme ?? 'без теми'} · вік {MOCK_SUMMARY.age}
          </p>
        </div>
      </header>

      <div className="px-5 py-6 space-y-5">
        {/* Session stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'ходів', value: MOCK_SUMMARY.turns },
            { label: 'тривалість', value: MOCK_SUMMARY.duration },
            { label: 'mode найчастіший', value: '02' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl border border-divider bg-bgSoft px-4 py-3 text-center">
              <p className="font-mono text-lg text-ink">{value}</p>
              <p className="font-sans text-xs text-inkSoft">{label}</p>
            </div>
          ))}
        </div>

        {/* Mode sequence */}
        <div className="rounded-2xl border border-divider bg-bgSoft px-4 py-3">
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-inkSoft">
            послідовність режимів
          </p>
          <div className="flex gap-1.5">
            {MOCK_SUMMARY.modes.map((m, i) => (
              <span
                key={i}
                className="flex h-7 w-7 items-center justify-center rounded-xl bg-bg font-mono text-xs text-ink"
              >
                {String(m).padStart(2, '0')}
              </span>
            ))}
          </div>
        </div>

        {/* AI summary */}
        <div className="rounded-2xl border border-divider bg-bgSoft px-4 py-4">
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-inkSoft">
            резюме сесії
          </p>
          <p className="font-sans text-sm leading-relaxed text-ink">{MOCK_SUMMARY.summary}</p>
        </div>

        {/* Flags */}
        {MOCK_SUMMARY.flags.length > 0 && (
          <div className="rounded-2xl border border-divider bg-bgSoft px-4 py-3">
            <p className="mb-2 font-mono text-xs uppercase tracking-wider text-inkSoft">
              сигнали
            </p>
            <div className="flex flex-wrap gap-2">
              {MOCK_SUMMARY.flags.map((f) => (
                <span
                  key={f}
                  className="rounded-xl bg-crisisSoft px-3 py-1 font-mono text-xs text-crisis"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <button className="w-full rounded-2xl bg-accent py-4 font-sans text-base text-white transition-opacity hover:opacity-90">
          прийняти реферал
        </button>
      </div>
    </main>
  );
}
