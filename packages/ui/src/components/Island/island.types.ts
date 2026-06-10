// «Я-острів» — методологічна метафора з 4 шарами, мапа на 4 ФМ Лєнгле.
// Спеціфікація: Demo Day Sprint v2.1, розділ «Метафора Я-острів».
//
// КРИТИЧНО: ці тексти — user-facing. НЕ показуй «де знаходиться користувач»,
// НЕ підсвічуй один шар як активний. Острів — модель, не зчитування.

export interface IslandLayer {
  readonly fm: 1 | 2 | 3 | 4;
  readonly name: string;
  readonly metaphor: string;
  readonly shortText: string;
  readonly longText: string;
  readonly example: string;
  readonly color: 'island-foundation' | 'island-bay' | 'island-rock' | 'island-lighthouse';
}

export const ISLAND_LAYERS: readonly IslandLayer[] = [
  {
    fm: 1,
    name: 'я можу бути',
    metaphor: 'берег',
    shortText: 'земля над водою. безпека, тіло, простір.',
    longText:
      'берег — це основа. чи я тут? чи дихаю? коли все хитається, ми починаємо звідси.',
    example: 'паніка, тривога, відчуття «земля йде з-під ніг»',
    color: 'island-foundation',
  },
  {
    fm: 2,
    name: 'я маю право жити',
    metaphor: 'бухта',
    shortText: 'місце, де можна сидіти разом. близькість, тепло, цінність.',
    longText:
      'бухта — про тих, хто поруч. і тих, що пішли. чи я важливий(а)? чи приймаю себе?',
    example: 'втрата, самотність, складні стосунки',
    color: 'island-bay',
  },
  {
    fm: 3,
    name: 'я є собою',
    metaphor: 'скеля',
    shortText: 'контури острова. ідентичність, межі, автентичність.',
    longText: 'скеля — це межа. де закінчується моє і починається чуже?',
    example: 'тиск очікувань, пошук себе, межі',
    color: 'island-rock',
  },
  {
    fm: 4,
    name: 'я маю сенс',
    metaphor: 'маяк',
    shortText: 'світло, що видно з моря. спрямованість, цінності, що жило.',
    longText:
      'маяк — про напрям. що мене кудись веде? що жило, навіть коли важко?',
    example: 'питання «навіщо», пошук покликання, апатія',
    color: 'island-lighthouse',
  },
] as const;

export type IslandVariant = 'hero' | 'mini' | 'explainer';
