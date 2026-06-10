export type CrisisSeverity = 'none' | 'elevated' | 'high' | 'imminent';

export interface DetectionResult {
  severity: CrisisSeverity;
  matched_patterns: string[];
  confidence: number;
}

const IMMINENT_PATTERNS = [
  /вб'?ю себе/i,
  // "купила вже таблетки" or "вже купила таблетки" — order-agnostic
  /куп(ила|ив|ивши)?.{0,15}(таблетки|пігулки|ліки)/i,
  // "таблетки на завтра" or "на завтра таблетки"
  /(таблетки|пігулки|ліки).{0,30}(на|до)\s+(завтра|вечір|ніч)|((на|до)\s+(завтра|вечір|ніч).{0,30}(таблетки|пігулки|ліки))/i,
  // "зі своєю шиєю" — allow optional word(s) between з/зі/зо and body part
  /(зробити|спробувати)\s+щось\s+з[іо]?.{0,12}(шиєю|собою|венами)/i,
  // "він мене знову вдарив" — optional word between мене and вдарив (\S+ for Cyrillic)
  /він\s+мене(\s+\S+)?\s+(вдарив|б'є|бив)/i,
  // "в туалеті закрилась" — зараз not required
  /(в|у)\s+туалеті\s+(сховала|закрилась|плачу)/i,
  // Jumping from height — "викинусь", "кинусь з балкона/вікна/даху", "стрибну вниз"
  /викину(сь|ся)/i,
  /(кину(сь|ся)|стрибну|впаду)\s+(з|вниз).{0,20}(балкон|вікн|дах|поверх|міст|висот)/i,
  /(з\s+)?(балкон|вікн|дах|поверх|мост).{0,20}(стрибн|викину|кину(сь|ся)|впаду)/i,
];

const HIGH_PATTERNS = [
  /не\s+хочу\s+(жити|прокидатись|прокинутись)/i,
  /навіщо все це.{0,30}(думаю|іноді).{0,30}(не прокинутись|зник)/i,
  /всім\s+було\s+б\s+краще\s+без\s+мене/i,
  /(хочу|хочеться)\s+зникнути(\s+назавжди)?/i,
  /(коли|іноді)\s+я\s+(роблю|роблю собі)\s+поріз/i,
  /стає\s+легше.{0,20}(поріз|порани)/i,
];

const ELEVATED_PATTERNS = [
  /втомив(ся|лась)\s+жити/i,
  /у\s+мене\s+погані\s+думки/i,
  /я\s+нічого\s+не\s+варт(ий|а|у)/i,
  /не\s+сплю\s+(вже\s+)?\d+\s+(нічі|ночей|ночі|днів|днь)/i,
];

// These patterns explicitly indicate no crisis
const NEGATIVE_OVERRIDES = [
  /був(а)?\s+у\s+(психіатра|психолога|терапевта).{0,30}(таблетки|ліки|допомагає)/i,
  /мама\s+померла.{0,20}(сумую|тужу|плачу)/i,
];

export function detectCrisis(text: string): DetectionResult {
  for (const pattern of NEGATIVE_OVERRIDES) {
    if (pattern.test(text)) {
      return { severity: 'none', matched_patterns: [], confidence: 0.9 };
    }
  }

  const imminentMatches = IMMINENT_PATTERNS.filter((p) => p.test(text)).map((p) => p.source);
  if (imminentMatches.length > 0) {
    return { severity: 'imminent', matched_patterns: imminentMatches, confidence: 0.85 };
  }

  const highMatches = HIGH_PATTERNS.filter((p) => p.test(text)).map((p) => p.source);
  if (highMatches.length > 0) {
    return { severity: 'high', matched_patterns: highMatches, confidence: 0.80 };
  }

  const elevatedMatches = ELEVATED_PATTERNS.filter((p) => p.test(text)).map((p) => p.source);
  if (elevatedMatches.length > 0) {
    return { severity: 'elevated', matched_patterns: elevatedMatches, confidence: 0.70 };
  }

  return { severity: 'none', matched_patterns: [], confidence: 0.95 };
}
