import whitelist from '../../../docs/exercises-whitelist.json';

export type ExerciseId = 'breathing-4-6' | 'grounding-54321' | 'body-scan-short' | 'rain' | 'values-compass' | 'meaning-anchor';

export interface Exercise {
  id: ExerciseId;
  name: string;
  duration_seconds: number;
  trigger_modes: Array<1 | 2 | 3 | 4 | 'crisis'>;
  trigger_fm: Array<1 | 2 | 3 | 4>;
  description: string;
  steps?: string[];
  ui_card: {
    title: string;
    subtitle: string;
    cta: string;
  };
}

export function getExercise(id: ExerciseId): Exercise {
  const ex = whitelist.exercises.find((e) => e.id === id);
  if (!ex) throw new Error(`Exercise ${id} not in whitelist`);
  return ex as Exercise;
}

export function suggestExerciseForMode(
  mode: 1 | 2 | 3 | 4 | 'crisis',
  fm?: 1 | 2 | 3 | 4,
): Exercise | null {
  const candidates = whitelist.exercises.filter(
    (e) =>
      e.trigger_modes.includes(mode as never) &&
      (fm === undefined || e.trigger_fm.includes(fm as never)),
  );
  return (candidates[0] as Exercise) ?? null;
}
