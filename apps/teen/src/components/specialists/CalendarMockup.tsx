'use client';

// Mock-календар для booking-сторінки. ЦЕ НЕ функціональний картер —
// це placeholder з 7 днями та довільними слотами, щоб юзер бачив
// як виглядатиме реальний Cal.com-embed у production (Phase G).
//
// Поведінка: кліки візуально підсвічують обраний слот (state у компоненті),
// але НЕ зберігаються — реальне бронювання робиться через форму нижче.

import { useState } from 'react';
import { cn } from '@ya-ye/ui';

const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд'] as const;

// 7 днів × 3-5 слотів. Деякі дні без слотів — реалістичніше.
const MOCK_SLOTS: ReadonlyArray<{ day: string; date: number; slots: readonly string[] }> = [
  { day: 'пн', date: 10, slots: ['10:00', '14:30', '17:00'] },
  { day: 'вт', date: 11, slots: ['11:00', '15:00'] },
  { day: 'ср', date: 12, slots: [] },
  { day: 'чт', date: 13, slots: ['10:30', '13:00', '16:30', '18:00'] },
  { day: 'пт', date: 14, slots: ['11:00', '14:00'] },
  { day: 'сб', date: 15, slots: [] },
  { day: 'нд', date: 16, slots: [] },
];

interface CalendarMockupProps {
  onSelect?: (day: string, time: string) => void;
}

export function CalendarMockup({ onSelect }: CalendarMockupProps) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleClick(day: string, date: number, time: string) {
    const key = `${day}-${date}-${time}`;
    setSelected(key);
    onSelect?.(`${day} ${date}`, time);
  }

  return (
    <div className="space-y-3">
      {/* Підпис вгорі — частина mock-розкриття */}
      <p className="font-mono text-[10px] uppercase tracking-wider text-inkSoft">
        наступні 7 днів · приклад слотів
      </p>

      {/* На mobile — горизонтальний скрол (snap-x), на desktop — grid 7×1.
          Так на 320-375px кожен день має достатньо місця для tappable слотів,
          а на ≥sm повертаємось до повної сітки тижня. */}
      <div className="-mx-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-2 pb-2 sm:mx-0 sm:grid sm:grid-cols-7 sm:overflow-visible sm:px-0 sm:pb-0">
        {MOCK_SLOTS.map((d) => (
          <div
            key={`${d.day}-${d.date}`}
            className="flex w-20 shrink-0 snap-start flex-col items-center gap-1.5 rounded-2xl border border-divider bg-bgSoft p-2 sm:w-auto sm:shrink"
          >
            <div className="flex w-full flex-col items-center border-b border-divider pb-1.5">
              <span className="font-mono text-[10px] uppercase text-inkSoft">{d.day}</span>
              <span className="font-mono text-base text-ink">{d.date}</span>
            </div>
            <div className="flex w-full flex-col gap-1">
              {d.slots.length === 0 ? (
                <span className="text-center font-mono text-[10px] text-inkSoft/50">—</span>
              ) : (
                d.slots.map((t) => {
                  const key = `${d.day}-${d.date}-${t}`;
                  const isActive = selected === key;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleClick(d.day, d.date, t)}
                      className={cn(
                        'rounded-lg px-1 py-1 font-mono text-[10px] transition-colors',
                        isActive ? 'bg-accent text-white' : 'bg-bg text-ink hover:bg-accent/10',
                      )}
                    >
                      {t}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="font-sans text-xs italic leading-relaxed text-inkSoft">
        [PLACEHOLDER] тут буде embed Cal.com з реальними слотами Олени. У Demo версії — мок-сітка
        для візуалізації потоку.
      </p>
    </div>
  );
}
