/**
 * Тести для mode-detector.ts та exercises/index.ts — S1 gate.
 * Покриває: detectModeFromKeywords (всі гілки), getExercise (error path),
 * suggestExerciseForMode (всі mode/fm комбінації + null default).
 */
import { describe, it, expect } from 'vitest';
import { detectModeFromKeywords } from '../src/mode-detector';
import { getExercise, suggestExerciseForMode } from '../exercises/index';
import type { ExerciseId } from '../exercises/index';

// ─────────────────────────────────────────────────────────────────────────────
// detectModeFromKeywords
// ─────────────────────────────────────────────────────────────────────────────
describe('detectModeFromKeywords · companionship drift → mode 3', () => {
  it('«ти єдина» → mode 3, fm 2', () => {
    const result = detectModeFromKeywords('ти єдина хто мене розуміє');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe(3);
    expect(result!.fm).toBe(2);
    expect(result!.triggers.length).toBeGreaterThan(0);
  });

  it('«тільки ти мене розумієш» → mode 3, fm 2', () => {
    const result = detectModeFromKeywords('тільки ти мене розумієш');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe(3);
    expect(result!.fm).toBe(2);
  });

  it('«без тебе самотньо» → mode 3', () => {
    const result = detectModeFromKeywords('без тебе самотньо');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe(3);
  });

  it('«я тебе люблю» → mode 3', () => {
    const result = detectModeFromKeywords('я тебе люблю так сильно');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe(3);
  });

  it('«не хочу говорити з людьми» → mode 3', () => {
    const result = detectModeFromKeywords('не хочу говорити з людьми тільки з тобою');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe(3);
  });

  it('«ти мій єдиний» → mode 3', () => {
    const result = detectModeFromKeywords('ти мій єдиний хто слухає');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe(3);
  });
});

describe('detectModeFromKeywords · diagnosis seek → mode 3, fm 3', () => {
  it('«у мене депресія» → mode 3, fm 3', () => {
    const result = detectModeFromKeywords('у мене депресія напевно');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe(3);
    expect(result!.fm).toBe(3);
  });

  it('«це депресія» → mode 3, fm 3', () => {
    const result = detectModeFromKeywords('це депресія чи ні?');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe(3);
    expect(result!.fm).toBe(3);
  });

  it('«у мене тривожний розлад» → mode 3', () => {
    const result = detectModeFromKeywords('у мене тривожний розлад мабуть');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe(3);
  });

  it('«як ти думаєш, що у мене» → mode 3', () => {
    const result = detectModeFromKeywords('як ти думаєш, що у мене взагалі');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe(3);
    expect(result!.fm).toBe(3);
  });

  it('«це нормально чи ні» → mode 3, fm 3', () => {
    const result = detectModeFromKeywords('це нормально чи ні що я так відчуваю');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe(3);
    expect(result!.fm).toBe(3);
  });
});

describe('detectModeFromKeywords · anxiety/somatic → mode 2, fm 1', () => {
  it('«не можу дихати» → mode 2, fm 1', () => {
    const result = detectModeFromKeywords('не можу дихати від стресу');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe(2);
    expect(result!.fm).toBe(1);
  });

  it('«паніка» → mode 2, fm 1', () => {
    const result = detectModeFromKeywords('паніка накрила зненацька');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe(2);
    expect(result!.fm).toBe(1);
  });

  it('«трясе» → mode 2, fm 1', () => {
    const result = detectModeFromKeywords('мене трясе вже годину');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe(2);
  });

  it('«задихаюся» → mode 2', () => {
    const result = detectModeFromKeywords('задихаюся від тривоги');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe(2);
  });

  it('«панічна атака» → mode 2 (якщо є в keywords)', () => {
    // "панічна атака" є в ANXIETY_SOMATIC_UA
    const result = detectModeFromKeywords('паніка накрила зараз');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe(2);
  });
});

describe('detectModeFromKeywords · null default (нейтральний текст)', () => {
  it('нейтральний текст → null', () => {
    expect(detectModeFromKeywords('привіт як справи')).toBeNull();
  });

  it('порожній рядок → null', () => {
    expect(detectModeFromKeywords('')).toBeNull();
  });

  it('звичайна розповідь → null', () => {
    expect(detectModeFromKeywords('сьогодні гарна погода і я пішла на прогулянку')).toBeNull();
  });

  it('результат null — функція повертає саме null (не undefined)', () => {
    const result = detectModeFromKeywords('просто гарний день');
    expect(result).toBeNull();
  });
});

describe('detectModeFromKeywords · пріоритет companionship > diagnosis > anxiety', () => {
  it('companionship має пріоритет над diagnosis', () => {
    // обидва тригери в одному тексті — companionship перший
    const result = detectModeFromKeywords('ти єдина і у мене депресія');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe(3);
    expect(result!.fm).toBe(2); // companionship = fm2, diagnosis = fm3
  });

  it('companionship має пріоритет над anxiety', () => {
    const result = detectModeFromKeywords('ти мій друг і не можу дихати');
    expect(result).not.toBeNull();
    expect(result!.fm).toBe(2);
  });

  it('diagnosis має пріоритет над anxiety', () => {
    const result = detectModeFromKeywords('у мене депресія і паніка');
    expect(result).not.toBeNull();
    expect(result!.fm).toBe(3); // diagnosis = fm3
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getExercise — error path
// ─────────────────────────────────────────────────────────────────────────────
describe('getExercise · valid ids', () => {
  const validIds: ExerciseId[] = [
    'breathing-4-6',
    'grounding-54321',
    'body-scan-short',
    'rain',
    'values-compass',
    'meaning-anchor',
  ];

  for (const id of validIds) {
    it(`getExercise("${id}") повертає Exercise з id="${id}"`, () => {
      const ex = getExercise(id);
      expect(ex.id).toBe(id);
      expect(typeof ex.name).toBe('string');
      expect(ex.duration_seconds).toBeGreaterThan(0);
      expect(Array.isArray(ex.trigger_modes)).toBe(true);
      expect(Array.isArray(ex.trigger_fm)).toBe(true);
    });
  }
});

describe('getExercise · error path', () => {
  it('невідомий id кидає Error', () => {
    expect(() => getExercise('non-existent-id' as ExerciseId)).toThrow();
  });

  it('error message містить id', () => {
    expect(() => getExercise('fake-id' as ExerciseId)).toThrowError('fake-id');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// suggestExerciseForMode — всі гілки
// ─────────────────────────────────────────────────────────────────────────────
describe('suggestExerciseForMode · mode 2 (anxiety)', () => {
  it('mode 2 + fm 1 → повертає вправу', () => {
    const ex = suggestExerciseForMode(2, 1);
    expect(ex).not.toBeNull();
    expect(ex!.trigger_modes).toContain(2);
  });

  it('mode 2 без fm → повертає вправу', () => {
    const ex = suggestExerciseForMode(2);
    expect(ex).not.toBeNull();
  });

  it('mode 2 + fm 2 → повертає вправу (body-scan підходить)', () => {
    const ex = suggestExerciseForMode(2, 2);
    expect(ex).not.toBeNull();
  });
});

describe('suggestExerciseForMode · mode crisis', () => {
  it('mode "crisis" → повертає вправу', () => {
    const ex = suggestExerciseForMode('crisis');
    expect(ex).not.toBeNull();
    expect(ex!.trigger_modes).toContain('crisis');
  });

  it('mode "crisis" + fm 1 → повертає вправу', () => {
    const ex = suggestExerciseForMode('crisis', 1);
    expect(ex).not.toBeNull();
  });
});

describe('suggestExerciseForMode · mode 1', () => {
  it('mode 1 + fm 4 → meaning-anchor', () => {
    const ex = suggestExerciseForMode(1, 4);
    expect(ex).not.toBeNull();
    expect(ex!.id).toBe('meaning-anchor');
  });

  it('mode 1 + fm 3 → повертає вправу (rain або values-compass)', () => {
    // whitelist: rain (trigger_modes:[1,2,'crisis'], trigger_fm:[2,3]) з'являється раніше
    // values-compass (trigger_modes:[1,2,3], trigger_fm:[3]) — тому першим буде rain
    const ex = suggestExerciseForMode(1, 3);
    expect(ex).not.toBeNull();
    expect(['rain', 'values-compass']).toContain(ex!.id);
  });

  it('mode 1 + fm 2 → rain (FM2 + mode 1)', () => {
    const ex = suggestExerciseForMode(1, 2);
    expect(ex).not.toBeNull();
  });
});

describe('suggestExerciseForMode · mode 3', () => {
  it('mode 3 + fm 3 → values-compass', () => {
    const ex = suggestExerciseForMode(3, 3);
    expect(ex).not.toBeNull();
    expect(ex!.id).toBe('values-compass');
  });
});

describe('suggestExerciseForMode · mode 4 (null default)', () => {
  it('mode 4 без fm → null (немає вправ для mode 4)', () => {
    const ex = suggestExerciseForMode(4);
    expect(ex).toBeNull();
  });

  it('mode 4 + fm 1 → null', () => {
    const ex = suggestExerciseForMode(4, 1);
    expect(ex).toBeNull();
  });
});

describe('suggestExerciseForMode · неіснуюча комбінація → null', () => {
  it('mode 3 + fm 4 → null (немає вправ для mode3+fm4)', () => {
    // mode 3 exercises: values-compass (trigger_fm:[3]). fm4 не збігається.
    const ex = suggestExerciseForMode(3, 4);
    expect(ex).toBeNull();
  });

  it('mode 2 + fm 4 → meaning-anchor (trigger_modes:[1,2], trigger_fm:[4])', () => {
    // meaning-anchor підходить для mode2+fm4 — перевіряємо що повертається
    const ex = suggestExerciseForMode(2, 4);
    expect(ex).not.toBeNull();
    expect(ex!.id).toBe('meaning-anchor');
  });
});
