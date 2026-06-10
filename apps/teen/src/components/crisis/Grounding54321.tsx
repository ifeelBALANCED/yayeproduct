'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@ya-ye/ui';

const STEPS = [
  {
    number: 5,
    sense: 'очі',
    prompt: 'назви 5 речей, які ти зараз бачиш',
    hint: 'стіна, вікно, стіл, телефон, рука — будь-що',
  },
  {
    number: 4,
    sense: 'дотик',
    prompt: 'торкнись 4 різних поверхонь',
    hint: 'одяг, стіл, волосся, підлога — відчуй текстуру',
  },
  {
    number: 3,
    sense: 'вуха',
    prompt: 'почуй 3 звуки навколо',
    hint: 'вентиляція, вулиця, власне дихання',
  },
  {
    number: 2,
    sense: 'запах',
    prompt: 'відчуй 2 запахи',
    hint: 'свіже повітря, їжа, кімната — або просто понюхай руки',
  },
  {
    number: 1,
    sense: 'смак',
    prompt: '1 смак, який відчуваєш зараз',
    hint: 'або просто відчуй язик, зуби — ти тут',
  },
];

interface Grounding54321Props {
  onDone: () => void;
}

export function Grounding54321({ onDone }: Grounding54321Props) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const current = STEPS[step];

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <p className="font-serif text-3xl italic text-ink">ти тут.</p>
        <p className="font-sans text-sm leading-relaxed text-inkSoft">
          дихання сповільнилось. тіло на місці.
          <br />
          якщо все ще важко — зателефонуй на лінію довіри.
        </p>
        <button
          onClick={onDone}
          className="rounded-2xl bg-accent px-6 py-3 font-sans text-sm text-white active:opacity-80"
        >
          повернутись
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Прогрес */}
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s.number}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i <= step ? 'bg-accent' : 'bg-divider',
            )}
          />
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-5xl italic text-ink">{current?.number}</span>
          <span className="font-mono text-xs uppercase tracking-wider text-inkSoft">
            {current?.sense}
          </span>
        </div>

        <p className="font-sans text-lg text-ink">{current?.prompt}</p>
        <p className="font-sans text-sm text-inkSoft">{current?.hint}</p>
      </div>

      <div className="flex gap-2">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1 rounded-2xl border border-divider px-4 py-3 font-sans text-sm text-inkSoft active:opacity-80"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
            назад
          </button>
        )}
        <button
          onClick={handleNext}
          className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-accent py-3 font-sans text-sm text-white active:opacity-80"
        >
          {step < STEPS.length - 1 ? 'далі' : 'завершити'}
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
