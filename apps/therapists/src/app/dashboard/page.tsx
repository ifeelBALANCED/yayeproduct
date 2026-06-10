// [12] Dashboard рефералів — статичний mock для MVP-демо

import Link from 'next/link';

interface Referral {
  id: number;
  status: 'new' | 'accepted' | 'completed';
  urgency?: 'urgent' | 'normal';
  theme: string;
  age: string;
  ago: string;
  modes: number[];
}

const MOCK_REFERRALS: Referral[] = [
  { id: 1, status: 'new', urgency: 'normal', theme: 'стосунки', age: '16-17', ago: '5 хв тому', modes: [1, 1, 2, 3] },
  { id: 2, status: 'new', urgency: 'urgent', theme: 'тривога', age: '13-15', ago: '23 хв тому', modes: [2, 2, 2] },
  { id: 3, status: 'accepted', theme: 'майбутнє', age: '18-25', ago: 'вчора', modes: [1, 1, 1] },
  { id: 4, status: 'completed', theme: 'сенс', age: '16-17', ago: '3 дні тому', modes: [1, 2, 1] },
];

const STATUS_LABEL: Record<Referral['status'], string> = {
  new: 'новий',
  accepted: 'прийнятий',
  completed: 'завершено',
};

const STATUS_COLOR: Record<Referral['status'], string> = {
  new: 'bg-ok/10 text-ok',
  accepted: 'bg-accent/10 text-accent',
  completed: 'bg-bgSoft text-inkSoft',
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-divider px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-serif text-xl italic text-ink">Я Є — для фахівців</p>
            <p className="font-mono text-xs text-inkSoft">Тарас М. · УСП · 3914</p>
          </div>
          <div className="flex gap-3 text-center">
            <KPICard label="нові" value={2} color="text-ok" />
            <KPICard label="активні" value={7} color="text-accent" />
            <KPICard label="завершені" value={12} color="text-inkSoft" />
          </div>
        </div>
      </header>

      {/* Referral list */}
      <div className="px-6 py-6 space-y-3">
        <p className="font-mono text-xs uppercase tracking-wider text-inkSoft">реферали</p>
        {MOCK_REFERRALS.map((r) => (
          <Link
            key={r.id}
            href={`/referral/${r.id}`}
            className="block rounded-2xl border border-divider bg-bgSoft px-5 py-4 transition-colors hover:border-accent/30"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-xl px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STATUS_COLOR[r.status]}`}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                  {r.urgency === 'urgent' && (
                    <span className="rounded-xl bg-crisis/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-crisis">
                      терміново
                    </span>
                  )}
                </div>
                {/* theme може бути null у реальних рефералах — theme picker видалено */}
                <p className="mt-1.5 font-sans text-base text-ink">{r.theme ?? 'без визначеної теми'}</p>
                <p className="font-sans text-xs text-inkSoft">
                  вік {r.age} · {r.modes.length} ходів · {r.ago}
                </p>
              </div>
              <div className="flex gap-0.5 self-center">
                {r.modes.map((m, i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-accent/40"
                    title={`mode ${m}`}
                  />
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

function KPICard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-divider bg-bgSoft px-4 py-2 text-center">
      <p className={`font-mono text-xl font-medium tabular-nums ${color}`}>{value}</p>
      <p className="font-sans text-xs text-inkSoft">{label}</p>
    </div>
  );
}
