export type CrisisSeverity = 'none' | 'elevated' | 'high' | 'imminent';

export interface DetectionResult {
  severity: CrisisSeverity;
  matched_patterns: string[];
  confidence: number;
}

const IMMINENT_PATTERNS = [
  // "вб'ю себе" або просто "вб'ю" (без себе — контекст очевидний)
  /вб'?ю(\s+себе)?/i,
  // Транслітерація: "vb'yu sebe", "vbyu sebe"
  /vb['']?yu(\s+sebe)?/i,
  // "куплю/купила/купив таблетки"
  /куп(лю|ила|ив|ивши|ити)?.{0,15}(таблетки|пігулки|ліки)/i,
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
  // "стрибну вниз з моста/балкона" — flexible word order; мост matches моста/мосту
  /(кину(сь|ся)|стрибну|впаду)\s+.{0,10}(з|вниз).{0,20}(балкон|вікн|дах|поверх|мост|висот)/i,
  /(з\s+)?(балкон|вікн|дах|поверх|мост).{0,20}(стрибн|викину|кину(сь|ся)|впаду)/i,
  // "хочу щоб мене не було" / "хочу щоб мене більше не було" / "хочу щоб мене не стало"
  /хочу\s+(щоб|шоб)\s+мене\s+(більше\s+)?не\s+(було|стало)/i,
  // "щоб я не існував/існувала/існувало/існували"
  /щоб\s+я\s+не\s+існува(в|ла|ло|ли)/i,
  // Transliteration: "ya ne hochu zhyty", "ne hochu zhyty"
  /ya\s+ne\s+hochu\s+zhyty/i,
  /ne\s+hochu\s+zhyty/i,
  // "кінець усьому" + self-reference
  /хочу\s+покласти\s+кінець\s+(всьому|усьому|цьому|своєму\s+життю)/i,
  // "накладу на себе руки"
  /накладу\s+на\s+себе\s+руки/i,
  // "піду/пішла/пішов/піти/пішла б з цього світу" — optional слово між пішла і з
  /п(іду|іти|ішла|ішов|ішли|ити|ишла|ишов)(\s+\S+)?\s+(з|зі)\s+цього\s+світу/i,
  // "мотузка", "повішусь", "петля"
  /(повішусь|повіситись|повішатись)/i,
  /зав'яза(в|ла|ти).{0,20}(мотузку|петлю)/i,
  // "вбий мене" (cry for help under active violence)
  /вбий\s+мене\s+вже/i,
  // Surzhyk / суржик: "ne hochetsya zhit", "ne khochu zhyt"
  /ne\s+khoch(u|etsya)\s+zhyt/i,
  // "зробив/зробила надрізи на руці"
  /зроби(в|ла|ло|ли|вся)\s+(надрізи|порізи|рани)\s+на\s+(руці|руках|зап'ясті)/i,
  // "хочу померти" — direct
  /хочу\s+померти/i,
  // "зараз думаю як це зробити"
  /думаю\s+як\s+це\s+зробити.{0,30}(кінець|вмерти|піти)/i,
  // knife/blade + self
  /(ніж|лезо|скальпель).{0,20}(собі|себе|по\s+(руці|венах|зап'ясті))/i,
];

const HIGH_PATTERNS = [
  /не\s+хочу\s+(жити|прокидатись|прокинутись)/i,
  /навіщо все це.{0,30}(думаю|іноді).{0,30}(не прокинутись|зник)/i,
  // "всім було б краще без мене" або скорочено "всім краще без мене"
  /всім\s+(було\s+б\s+)?краще\s+без\s+мене/i,
  /(хочу|хочеться)\s+зникнути(\s+назавжди)?/i,
  /(коли|іноді)\s+я\s+(роблю|роблю собі)\s+поріз/i,
  /стає\s+легше.{0,20}(поріз|порани)/i,
  // "більше не хочу жити" variant
  /більше\s+не\s+хочу\s+(жити|існувати|прокидатись)/i,
  // "краще б мене не було"
  /краще\s+(б(и)?\s+)?мене\s+не\s+було/i,
  // "нащо мені жити" / "навіщо мені жити"
  /(навіщо|нащо)\s+(мені\s+)?(жити|існувати)/i,
  // "думки про смерть"
  /думки\s+про\s+(смерть|самогубство|суїцид)/i,
  // "хочу спати і не прокидатись"
  /хочу\s+спати\s+і\s+не\s+прокидатись/i,
  // self-harm pattern: "ріжу себе", "порізала руки"
  /(ріжу|різала|порізав(а)?|ріжеш)\s+себе/i,
  /порізала\s+(руки|зап'ястя)/i,
  // passive ideation without method
  /якби\s+я\s+(зник(а)?|помер(ла)?|вмер(ла)?)/i,
  // "втомився/втомилась від цього світу" (passive suicidal ideation marker)
  /втоми(в(ся)?|ла(сь)?|лась)\s+від\s+(цього\s+)?світу/i,
  // "ніхто не помітить якщо мене не стане"
  /ніхто\s+не\s+помітить\s+(якщо\s+)?мене\s+не\s+стане/i,
  // mixed-language: "i don't want to live"
  /i\s+don'?t\s+want\s+to\s+(live|exist)/i,
  // "все. я більше не можу" (context-based, combined)
  /я\s+більше\s+не\s+можу.{0,30}(жити|існувати|це\s+терпіти)/i,
];

const ELEVATED_PATTERNS = [
  /втоми(в(ся)?|ла(сь)?|лась)\s+жити/i,
  /у\s+мене\s+погані\s+думки/i,
  /я\s+нічого\s+не\s+варт(ий|а|у)/i,
  /не\s+сплю\s+(вже\s+)?\d+\s+(нічі|ночей|ночі|днів|днь)/i,
  // "погані думки в голові"
  /погані\s+думки\s+(в\s+голові|про\s+себе|про\s+смерть)/i,
  // "не бачу сенсу"
  /не\s+бачу\s+сенсу\s+(жити|у\s+цьому|у\s+житті)/i,
  // "мені все одно що зі мною буде"
  /мені\s+все\s+(одно|рівно)\s+що\s+(зі\s+мною|зо\s+мною)\s+буде/i,
  // "відчуваю що краще б мене не було" (mild variant)
  /відчуваю\s+що\s+(.{0,20}\s+)?краще\s+без\s+мене/i,
];

// These patterns explicitly indicate NO active crisis.
// IMPORTANT: these override high/imminent detection ONLY when there is NO simultaneous
// active ideation in the same message. They do NOT suppress crisis detected by
// IMMINENT_PATTERNS or HIGH_PATTERNS when combined in one message.
// See detectCrisis() logic — NEGATIVE_OVERRIDES checked first, but active-crisis
// re-check follows (NEGATIVE_OVERRIDES do not win over imminent).
const NEGATIVE_OVERRIDES = [
  /був(а)?\s+у\s+(психіатра|психолога|терапевта).{0,30}(таблетки|ліки|допомагає)/i,
  /мама\s+померла.{0,20}(сумую|тужу|плачу)/i,
  // "лікувався від депресії раніше" — past tense treatment, no current ideation
  /лікував(ся|ась)\s+від\s+(депресії|тривоги|розладу).{0,60}(одужав|краще|допомогло)/i,
  // Past recovery story without active ideation signal
  /колись\s+(ліг|лягла)\s+у\s+(лікарню|психіатричну|клініку).{0,60}(вийшов|вийшла|краще)/i,
  // Grief expression that is clearly not suicidal
  /сум(ую|увала?)\s+за\s+(ним|нею|мамою|татом|бабусею|дідусем|другом|подругою)/i,
  // Rhetorical "killed it" idiom
  /вбив\s+би\s+за\s+(каву|піцу|сон|їжу|їду)/i,
  // "хотів би прибити" (idiom — very angry at someone)
  /хоті(в|ла)\s+би\s+прибити\s+(його|її|їх|брата|сестру)/i,
  // Минулий досвід самошкодування + явна зупинка/одужання ("раніше різала але вже зупинилась")
  /раніше\s+(різа(в|ла)|порізав(а)?|різа(в|ла)).{0,30}(зупинив|зупинила|більше\s+не|вже\s+не|перестав|перестала)/i,
];

export function detectCrisis(text: string): DetectionResult {
  // Imminent patterns always win — NEGATIVE_OVERRIDES never suppress active suicidality.
  const imminentMatches = IMMINENT_PATTERNS.filter((p) => p.test(text)).map((p) => p.source);
  if (imminentMatches.length > 0) {
    return { severity: 'imminent', matched_patterns: imminentMatches, confidence: 0.85 };
  }

  // NEGATIVE_OVERRIDES suppress only elevated/high when no imminent signal present.
  const negativeOverride = NEGATIVE_OVERRIDES.some((p) => p.test(text));

  const highMatches = HIGH_PATTERNS.filter((p) => p.test(text)).map((p) => p.source);
  if (highMatches.length > 0 && !negativeOverride) {
    return { severity: 'high', matched_patterns: highMatches, confidence: 0.8 };
  }

  const elevatedMatches = ELEVATED_PATTERNS.filter((p) => p.test(text)).map((p) => p.source);
  if (elevatedMatches.length > 0 && !negativeOverride) {
    return { severity: 'elevated', matched_patterns: elevatedMatches, confidence: 0.7 };
  }

  return { severity: 'none', matched_patterns: [], confidence: 0.95 };
}
