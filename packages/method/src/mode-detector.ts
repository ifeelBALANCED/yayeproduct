import type { Message, ModeDetection } from './types';

// Companionship drift — Mode 3 (межа) + Принцип I
const COMPANIONSHIP_DRIFT_UA = [
  'ти єдина',
  'ти мій єдиний',
  'без тебе самотньо',
  'ти моя подруга',
  'ти мій друг',
  'я тебе люблю',
  'ти розумієш мене краще',
  'не хочу говорити з людьми',
  'тільки ти мене розумієш',
];

// Diagnosis seek — Mode 3 (обережно: стоп-діагноз, межа компетенції) + Принцип III.
// NB (P0-7): Mode 4 зарезервовано за bridge-to-specialist — маркер [MODE:4]
// у системному промпті (system-prompt.ts:168). Раніше тут було mode:4, що
// створювало колізію двох різних понять під одним значенням.
const DIAGNOSIS_SEEK_UA = [
  'у мене депресія',
  'це депресія',
  'у мене біполярка',
  'у мене тривожний розлад',
  'я невротик',
  'мені діагностували',
  'як ти думаєш, що у мене',
  'у мене є розлад',
  'це нормально чи ні',
];

// Anxiety/somatic — Mode 2 (регуляція) + FM1
const ANXIETY_SOMATIC_UA = [
  'не можу дихати',
  'паніка',
  'панічна атака',
  'трясе',
  'тремтю',
  "серце б'ється",
  'задихаюся',
  'темніє в очах',
  'все навколо нереальне',
  'відчуваю себе поза тілом',
];

function matchKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw.toLowerCase()));
}

export function detectModeFromKeywords(
  message: string,
): Pick<ModeDetection, 'mode' | 'fm' | 'triggers'> | null {
  const driftTriggers = matchKeywords(message, COMPANIONSHIP_DRIFT_UA);
  if (driftTriggers.length > 0) {
    return { mode: 3, fm: 2, triggers: driftTriggers };
  }

  const diagTriggers = matchKeywords(message, DIAGNOSIS_SEEK_UA);
  if (diagTriggers.length > 0) {
    return { mode: 3, fm: 3, triggers: diagTriggers };
  }

  const anxietyTriggers = matchKeywords(message, ANXIETY_SOMATIC_UA);
  if (anxietyTriggers.length > 0) {
    return { mode: 2, fm: 1, triggers: anxietyTriggers };
  }

  return null;
}

// Повна детекція з Claude classifier додається у Phase 2
export async function detectMode(
  _history: Message[],
  newUserMessage: string,
): Promise<ModeDetection> {
  const keywordResult = detectModeFromKeywords(newUserMessage);

  if (keywordResult) {
    return {
      ...keywordResult,
      confidence: 0.9,
    };
  }

  // Дефолт Mode 1 — підтримую
  return {
    mode: 1,
    fm: 1,
    confidence: 0.5,
    triggers: [],
  };
}
