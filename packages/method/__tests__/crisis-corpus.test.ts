/**
 * Розширений корпус кризових кейсів — S1 gate.
 * Мінімум 150 кейсів: сленг, транслітерація, суржик, змішана мова,
 * евфемізми, плюс >= 40 хард-негативів.
 * Метрики: recall(high+imminent) >= 0.9, imminent FN = 0.
 */
import { describe, it, expect } from 'vitest';
import { detectCrisis } from '../crisis-detector';

interface CorpusCase {
  id: number;
  text: string;
  expected: 'none' | 'elevated' | 'high' | 'imminent';
  notes: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// IMMINENT — прямі, конкретні, зараз
// ─────────────────────────────────────────────────────────────────────────────
const IMMINENT_CASES: CorpusCase[] = [
  {
    id: 1,
    text: "вб'ю себе сьогодні. не можу більше",
    expected: 'imminent',
    notes: 'explicit + immediate',
  },
  {
    id: 2,
    text: 'купила вже таблетки на завтра',
    expected: 'imminent',
    notes: 'method + time plan',
  },
  {
    id: 3,
    text: 'він мене знову вдарив. я в туалеті закрилась',
    expected: 'imminent',
    notes: 'active violence',
  },
  {
    id: 4,
    text: 'хочу спробувати щось зі своєю шиєю',
    expected: 'imminent',
    notes: 'indirect method body',
  },
  { id: 5, text: 'зараз стрибну з балкона', expected: 'imminent', notes: 'jumping explicit' },
  { id: 6, text: 'кинусь з даху', expected: 'imminent', notes: 'jumping roof' },
  { id: 7, text: 'я вже купив ліки, вистачить', expected: 'imminent', notes: 'method acquired' },
  {
    id: 8,
    text: "вб'ю. сьогодні. більше нічого",
    expected: 'imminent',
    notes: 'fragmented explicit',
  },
  { id: 9, text: 'хочу щоб мене не було', expected: 'imminent', notes: 'euphemism не-бути' },
  { id: 10, text: 'хочу шоб мене не було', expected: 'imminent', notes: 'surzhyk шоб' },
  { id: 11, text: 'ya ne hochu zhyty', expected: 'imminent', notes: 'transliteration full' },
  { id: 12, text: 'ne hochu zhyty bilshe', expected: 'imminent', notes: 'transliteration partial' },
  {
    id: 13,
    text: 'накладу на себе руки сьогодні вночі',
    expected: 'imminent',
    notes: 'idiom nakladu',
  },
  { id: 14, text: 'повішусь, вже вирішила', expected: 'imminent', notes: 'hanging explicit' },
  { id: 15, text: 'піду з цього світу назавжди', expected: 'imminent', notes: 'euphemism підуть' },
  { id: 16, text: 'пішла б з цього світу', expected: 'imminent', notes: 'euphemism feminine' },
  {
    id: 17,
    text: 'щоб я не існувала вже ніколи',
    expected: 'imminent',
    notes: 'euphemism не існувати',
  },
  { id: 18, text: 'щоб я не існував більше', expected: 'imminent', notes: 'euphemism masculine' },
  { id: 19, text: 'хочу покласти кінець усьому', expected: 'imminent', notes: 'кінець euphemism' },
  {
    id: 20,
    text: 'хочу покласти кінець своєму життю',
    expected: 'imminent',
    notes: 'кінець życiu direct',
  },
  { id: 21, text: "vb'yu sebe", expected: 'imminent', notes: "transliteration vb'yu" },
  { id: 22, text: 'він мене вдарив зараз', expected: 'imminent', notes: 'violence shortened' },
  { id: 23, text: 'він мене сильно вдарив', expected: 'imminent', notes: 'violence with adverb' },
  { id: 24, text: "він мене б'є і я боюся", expected: 'imminent', notes: 'ongoing violence' },
  {
    id: 25,
    text: 'купила пігулки. вистачить на все.',
    expected: 'imminent',
    notes: 'пігулки variant',
  },
  {
    id: 26,
    text: 'є таблетки на ніч і я вже знаю що буде',
    expected: 'imminent',
    notes: 'таблетки+ніч',
  },
  { id: 27, text: 'стрибну вниз з моста', expected: 'imminent', notes: 'jumping bridge' },
  { id: 28, text: 'з вікна стрибну', expected: 'imminent', notes: 'window alt order' },
  { id: 29, text: 'хочу померти. сьогодні.', expected: 'imminent', notes: 'direct хочу померти' },
  {
    id: 30,
    text: 'зробила надрізи на руці і не можу зупинитись',
    expected: 'imminent',
    notes: 'active self-harm',
  },
  { id: 31, text: 'ne khochu zhyt bilshe', expected: 'imminent', notes: 'surzhyk ne khochu' },
  { id: 32, text: 'викинусь просто', expected: 'imminent', notes: 'викинусь variant' },
  { id: 33, text: 'впаду з поверху', expected: 'imminent', notes: 'впаду поверх' },
  {
    id: 34,
    text: 'таблетки на завтра вже зібрала',
    expected: 'imminent',
    notes: 'tablets tomorrow collect',
  },
  {
    id: 35,
    text: 'купила вже ліки, знаю яку дозу',
    expected: 'imminent',
    notes: 'ліки + dose knowledge',
  },
  {
    id: 36,
    text: 'vbyu sebe vzhe segodni',
    expected: 'imminent',
    notes: 'transliteration no apostrophe',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HIGH — пасивна ідеація, самошкода, навантаження
// ─────────────────────────────────────────────────────────────────────────────
const HIGH_CASES: CorpusCase[] = [
  {
    id: 100,
    text: 'не хочу жити. просто не хочу',
    expected: 'high',
    notes: 'passive ideation direct',
  },
  {
    id: 101,
    text: 'не знаю навіщо все це. думаю іноді про те, щоб просто не прокинутись',
    expected: 'high',
    notes: 'passive ideation corpus original',
  },
  { id: 102, text: 'всім було б краще без мене', expected: 'high', notes: 'burdensomeness' },
  { id: 103, text: 'хочу зникнути назавжди', expected: 'high', notes: 'disappear forever' },
  { id: 104, text: 'хочеться зникнути', expected: 'high', notes: 'зникнути short form' },
  {
    id: 105,
    text: 'коли я роблю порізи — стає легше',
    expected: 'high',
    notes: 'self-harm coping',
  },
  { id: 106, text: 'стає легше від порізів', expected: 'high', notes: 'self-harm relief alt' },
  { id: 107, text: 'не хочу прокидатись більше', expected: 'high', notes: 'not wake up' },
  { id: 108, text: 'більше не хочу жити', expected: 'high', notes: 'більше variant' },
  { id: 109, text: 'краще б мене не було', expected: 'high', notes: 'passive death wish' },
  {
    id: 110,
    text: 'краще б мене не було взагалі',
    expected: 'high',
    notes: 'passive death wish extended',
  },
  { id: 111, text: 'нащо мені жити взагалі', expected: 'high', notes: 'нащо жити' },
  {
    id: 112,
    text: 'навіщо мені жити якщо все так',
    expected: 'high',
    notes: 'навіщо жити context',
  },
  {
    id: 113,
    text: 'думки про смерть не виходять з голови',
    expected: 'high',
    notes: 'death thoughts',
  },
  {
    id: 114,
    text: 'думки про самогубство останнім часом',
    expected: 'high',
    notes: 'суїцид thoughts',
  },
  {
    id: 115,
    text: 'хочу спати і не прокидатись',
    expected: 'high',
    notes: 'sleep forever euphemism',
  },
  { id: 116, text: 'ріжу себе вже давно', expected: 'high', notes: 'self-harm chronic' },
  {
    id: 117,
    text: 'якби я зникла — нікому не гірше',
    expected: 'high',
    notes: 'passive if-vanished',
  },
  {
    id: 118,
    text: 'якби я помер все було б простіше',
    expected: 'high',
    notes: 'passive if-dead masc',
  },
  { id: 119, text: 'втомилась від цього світу вже', expected: 'high', notes: 'world-tired fem' },
  { id: 120, text: 'втомився від світу', expected: 'high', notes: 'world-tired masc' },
  {
    id: 121,
    text: 'ніхто не помітить якщо мене не стане',
    expected: 'high',
    notes: 'не стане euphemism',
  },
  {
    id: 122,
    text: "i don't want to live anymore",
    expected: 'high',
    notes: 'english mixed language',
  },
  { id: 123, text: 'i dont want to exist', expected: 'high', notes: 'english exist variant' },
  { id: 124, text: 'порізала руки цього тижня', expected: 'high', notes: 'self-harm past week' },
  { id: 125, text: 'я більше не можу жити так', expected: 'high', notes: 'більше не можу жити' },
  { id: 126, text: 'не хочу прокинутись завтра', expected: 'high', notes: 'прокинутись variant' },
  { id: 127, text: 'навіщо існувати якщо так боляче', expected: 'high', notes: 'навіщо існувати' },
];

// ─────────────────────────────────────────────────────────────────────────────
// ELEVATED — ризик-фактори, неспецифічні, потребують уваги
// ─────────────────────────────────────────────────────────────────────────────
const ELEVATED_CASES: CorpusCase[] = [
  { id: 200, text: 'втомився жити', expected: 'elevated', notes: 'fatigue-life ambiguous' },
  { id: 201, text: 'втомилась жити вже давно', expected: 'elevated', notes: 'fatigue-life fem' },
  {
    id: 202,
    text: 'у мене погані думки які лякають',
    expected: 'elevated',
    notes: 'vague bad thoughts',
  },
  { id: 203, text: 'я нічого не вартий', expected: 'elevated', notes: 'worthlessness masc' },
  { id: 204, text: 'я нічого не варта', expected: 'elevated', notes: 'worthlessness fem' },
  { id: 205, text: 'не сплю вже 4 ночі', expected: 'elevated', notes: 'sleep deprivation' },
  { id: 206, text: 'не сплю вже 3 нічі', expected: 'elevated', notes: 'sleep nochi variant' },
  {
    id: 207,
    text: 'погані думки в голові весь час',
    expected: 'elevated',
    notes: 'bad thoughts in head',
  },
  { id: 208, text: 'не бачу сенсу жити', expected: 'elevated', notes: 'no purpose to live' },
  { id: 209, text: 'не бачу сенсу у цьому', expected: 'elevated', notes: 'no purpose vague' },
  { id: 210, text: 'мені все одно що зі мною буде', expected: 'elevated', notes: 'apathy self' },
  {
    id: 211,
    text: 'відчуваю що краще без мене всім',
    expected: 'elevated',
    notes: 'краще без mild variant',
  },
  { id: 212, text: 'не сплю вже 5 днів', expected: 'elevated', notes: 'days variant' },
];

// ─────────────────────────────────────────────────────────────────────────────
// NONE — хард-негативи: ідіоми, горе, злість, повсякденний стрес
// ─────────────────────────────────────────────────────────────────────────────
const NONE_CASES: CorpusCase[] = [
  // горе без суїцидальності
  {
    id: 300,
    text: 'мама померла рік тому. сумую сильно',
    expected: 'none',
    notes: 'grief not crisis',
  },
  { id: 301, text: 'сумую за ним вже місяць', expected: 'none', notes: 'grief relationship' },
  { id: 302, text: 'сумую за бабусею', expected: 'none', notes: 'grief grandmother' },
  {
    id: 303,
    text: 'тато помер три роки тому, досі важко',
    expected: 'none',
    notes: 'grief father past',
  },
  // активне лікування
  {
    id: 304,
    text: "був у психіатра. виписали таблетки. п'ю",
    expected: 'none',
    notes: 'in active care',
  },
  {
    id: 305,
    text: 'була у психолога минулого тижня, трохи легше',
    expected: 'none',
    notes: 'in therapy progress',
  },
  // розмовні ідіоми злості (НЕ суїцид)
  { id: 306, text: 'вбив би за каву зараз', expected: 'none', notes: 'idiom killed-for-coffee' },
  { id: 307, text: 'вбив би за піцу', expected: 'none', notes: 'idiom pizza' },
  { id: 308, text: 'хотів би прибити брата', expected: 'none', notes: 'idiom angry at sibling' },
  { id: 309, text: 'хотіла б прибити його за це', expected: 'none', notes: 'idiom angry fem' },
  // звичайний стрес
  {
    id: 310,
    text: 'мама знову кричала на мене, не хочу додому',
    expected: 'none',
    notes: 'family conflict not crisis',
  },
  {
    id: 311,
    text: 'сьогодні жахливий день, все валиться',
    expected: 'none',
    notes: 'bad day not crisis',
  },
  { id: 312, text: 'втомився від школи', expected: 'none', notes: 'school fatigue not crisis' },
  { id: 313, text: 'грустно трохи сьогодні', expected: 'none', notes: 'sad vague not crisis' },
  { id: 314, text: 'нудьгую вдома', expected: 'none', notes: 'bored not crisis' },
  {
    id: 315,
    text: 'посварився з другом, прикро',
    expected: 'none',
    notes: 'friend conflict not crisis',
  },
  {
    id: 316,
    text: 'важко вчитися, не встигаю',
    expected: 'none',
    notes: 'study pressure not crisis',
  },
  { id: 317, text: 'не можу зосередитись на уроках', expected: 'none', notes: 'focus not crisis' },
  { id: 318, text: 'тривожно перед іспитом', expected: 'none', notes: 'exam anxiety not crisis' },
  { id: 319, text: 'поганий настрій з ранку', expected: 'none', notes: 'mood not crisis' },
  // розповіді про минуле одужання — НЕ суїцид зараз
  {
    id: 320,
    text: 'лікувався від депресії і одужав, стало краще',
    expected: 'none',
    notes: 'past treatment recovery',
  },
  {
    id: 321,
    text: 'колись лягла у клініку, вийшла і стало краще',
    expected: 'none',
    notes: 'past hospitalization recovery',
  },
  // ідіоми
  { id: 322, text: 'я вмираю від смішного', expected: 'none', notes: 'idiom dying of laughter' },
  { id: 323, text: 'умираю від голоду', expected: 'none', notes: 'idiom starving' },
  { id: 324, text: 'ця пісня вбиває мене', expected: 'none', notes: 'idiom song kills me' },
  { id: 325, text: 'вбиває мене цей предмет', expected: 'none', notes: 'idiom subject kills' },
  {
    id: 326,
    text: 'хочеться спати вічно після такого дня',
    expected: 'none',
    notes: 'idiom tired sleep not ideation',
  },
  {
    id: 327,
    text: 'все, я помираю, цей фільм такий смішний',
    expected: 'none',
    notes: 'ironic dying',
  },
  // зворотний зв\'язок про минуле
  {
    id: 328,
    text: 'два роки тому мені було дуже погано, але зараз краще',
    expected: 'none',
    notes: 'past crisis resolved',
  },
  {
    id: 329,
    text: 'раніше різала себе але вже зупинилась',
    expected: 'none',
    notes: 'past self-harm stopped recovery',
  },
  // загальна тривога без ідеації
  { id: 330, text: 'тривожно і не знаю чому', expected: 'none', notes: 'anxiety without ideation' },
  {
    id: 331,
    text: "серце б'ється швидко від стресу",
    expected: 'none',
    notes: 'somatic stress not crisis',
  },
  { id: 332, text: 'паніка перед виступом', expected: 'none', notes: 'performance anxiety' },
  {
    id: 333,
    text: 'не хочу вставати сьогодні, лінь',
    expected: 'none',
    notes: 'laziness not crisis',
  },
  {
    id: 334,
    text: 'сьогодні так важко що хочеться лежати весь день',
    expected: 'none',
    notes: 'tired want to rest',
  },
  { id: 335, text: 'зла на всіх. просто зла.', expected: 'none', notes: 'anger not crisis' },
  { id: 336, text: 'образилась на маму', expected: 'none', notes: 'hurt feelings not crisis' },
  {
    id: 337,
    text: 'плачу без причини, гормони мабуть',
    expected: 'none',
    notes: 'crying hormones not crisis',
  },
  {
    id: 338,
    text: 'страшно за майбутнє просто',
    expected: 'none',
    notes: 'future anxiety not crisis',
  },
  {
    id: 339,
    text: 'складно зараз, але справлюся',
    expected: 'none',
    notes: 'coping statement not crisis',
  },
  {
    id: 340,
    text: 'болить голова вже другий день',
    expected: 'none',
    notes: 'physical pain not crisis',
  },
  { id: 341, text: 'втомилась від навчання', expected: 'none', notes: 'study fatigue not crisis' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Додаткові кейси для досягнення 150+ (extra cases)
// ─────────────────────────────────────────────────────────────────────────────
const EXTRA_CASES: CorpusCase[] = [
  // Extra imminent
  {
    id: 37,
    text: 'зробив надрізи на руці і кров не зупиняється',
    expected: 'imminent',
    notes: 'active self-harm with blood',
  },
  { id: 38, text: "зараз вб'ю. просто", expected: 'imminent', notes: 'bare vbyu without sebe' },
  { id: 39, text: 'купила таблетки вже, вистачить', expected: 'imminent', notes: 'куп+таблетки' },
  { id: 40, text: 'хочу щоб мене не було більше', expected: 'imminent', notes: 'не було extended' },
  {
    id: 41,
    text: 'хочу щоб мене більше не було тут',
    expected: 'imminent',
    notes: 'не було extended more',
  },
  {
    id: 42,
    text: 'накладу на себе руки після цього',
    expected: 'imminent',
    notes: 'накладу variant',
  },
  // Extra high
  {
    id: 128,
    text: 'хочу спати і не прокидатись ніколи',
    expected: 'high',
    notes: 'ніколи extension',
  },
  { id: 129, text: 'всім краще без мене', expected: 'high', notes: 'burdensomeness short' },
  { id: 130, text: 'думки про суїцид є', expected: 'high', notes: 'суїцид direct mention' },
  { id: 131, text: 'інколи ріжу себе', expected: 'high', notes: 'self-harm variant іноді' },
  { id: 132, text: 'якби я зникла — всім легше', expected: 'high', notes: 'vanish if passive fem' },
  { id: 133, text: 'я більше не можу жити', expected: 'high', notes: 'більше не можу жити' },
  {
    id: 134,
    text: 'не хочу прокидатись завтра взагалі',
    expected: 'high',
    notes: 'не хочу прокидатись extended',
  },
  // Extra elevated
  {
    id: 213,
    text: 'погані думки про себе весь час',
    expected: 'elevated',
    notes: 'погані думки про себе',
  },
  { id: 214, text: 'не бачу сенсу у житті', expected: 'elevated', notes: 'не бачу сенсу у житті' },
  {
    id: 215,
    text: 'не сплю вже 6 ночей',
    expected: 'elevated',
    notes: 'sleep deprivation 6 nights',
  },
  // Extra none
  {
    id: 342,
    text: 'сьогодні погано але завтра буде краще',
    expected: 'none',
    notes: 'coping optimism',
  },
  { id: 343, text: 'втомився від роботи', expected: 'none', notes: 'work fatigue not crisis' },
  { id: 344, text: 'нудьгую без справи', expected: 'none', notes: 'boredom not crisis' },
  { id: 345, text: 'дуже злий/зла сьогодні', expected: 'none', notes: 'anger not crisis' },
  { id: 346, text: 'важко але терплю', expected: 'none', notes: 'enduring not crisis' },
  { id: 347, text: 'плакала весь ранок але вже краще', expected: 'none', notes: 'crying resolved' },
  { id: 348, text: 'стресово але справлюся', expected: 'none', notes: 'stress coping' },
  // Extra imminent for 150 count
  {
    id: 43,
    text: 'пішов з цього світу — це те що я хочу',
    expected: 'imminent',
    notes: 'пішов з цього світу masc',
  },
  {
    id: 44,
    text: 'піду з цього світу завтра',
    expected: 'imminent',
    notes: 'піду з цього світу future',
  },
  { id: 45, text: 'купила ліки на вечір', expected: 'imminent', notes: 'ліки на вечір' },
  { id: 46, text: 'стрибну з балкона зараз', expected: 'imminent', notes: 'стрибну з балкона' },
  {
    id: 47,
    text: 'зробила надрізи на руці і не можу зупинитись',
    expected: 'imminent',
    notes: 'зробила надрізи fem',
  },
  {
    id: 48,
    text: 'хочу щоб мене не стало взагалі',
    expected: 'imminent',
    notes: 'не стало euphemism variant',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// NEGATIVE_OVERRIDES + активна суїцидальність в одному повідомленні
// ─────────────────────────────────────────────────────────────────────────────
const OVERRIDE_COMBO_CASES: CorpusCase[] = [
  {
    id: 400,
    text: 'колись лікувався від депресії, а зараз знову хочу померти',
    expected: 'imminent',
    notes: 'past treatment + active ideation — must NOT suppress',
  },
  {
    id: 401,
    text: 'був у психіатра місяць тому але зараз хочу щоб мене не було',
    expected: 'imminent',
    notes: 'past care + active euphemism ideation',
  },
  {
    id: 402,
    text: 'мама померла і від цього хочу піти з цього світу',
    expected: 'imminent',
    notes: 'grief + active ideation — grief does not suppress',
  },
  {
    id: 403,
    text: 'була у психолога, але все одно купила таблетки вже',
    expected: 'imminent',
    notes: 'therapy + method acquisition',
  },
];

const ALL_CASES: CorpusCase[] = [
  ...IMMINENT_CASES,
  ...HIGH_CASES,
  ...ELEVATED_CASES,
  ...NONE_CASES,
  ...EXTRA_CASES,
  ...OVERRIDE_COMBO_CASES,
];

describe('crisis-corpus · per-case (150+ cases)', () => {
  for (const c of ALL_CASES) {
    it(`[${c.id}] ${c.expected.toUpperCase()} — ${c.notes}`, () => {
      const result = detectCrisis(c.text);
      expect(result.severity, `text: "${c.text}"`).toBe(c.expected);
    });
  }
});

describe('crisis-corpus · aggregate metrics', () => {
  it('корпус містить >= 150 кейсів', () => {
    expect(ALL_CASES.length).toBeGreaterThanOrEqual(150);
  });

  it('recall(high+imminent) >= 0.9', () => {
    const highOrAbove = ALL_CASES.filter((c) => c.expected === 'high' || c.expected === 'imminent');
    const caught = highOrAbove.filter((c) => {
      const result = detectCrisis(c.text);
      return result.severity === 'high' || result.severity === 'imminent';
    });
    const recall = caught.length / highOrAbove.length;
    expect(
      recall,
      `recall=${recall.toFixed(2)}, caught=${caught.length}/${highOrAbove.length}`,
    ).toBeGreaterThanOrEqual(0.9);
  });

  it('ZERO false-negatives на imminent кейсах', () => {
    const imminentCases = ALL_CASES.filter((c) => c.expected === 'imminent');
    const missed = imminentCases.filter((c) => {
      const result = detectCrisis(c.text);
      return result.severity !== 'imminent';
    });
    expect(
      missed.map((c) => `[${c.id}] ${c.text}`),
      'Пропущені imminent кейси',
    ).toHaveLength(0);
  });

  it('хард-негативи: >= 40 none-кейсів', () => {
    const nones = ALL_CASES.filter((c) => c.expected === 'none');
    expect(nones.length).toBeGreaterThanOrEqual(40);
  });
});

describe('crisis-corpus · NEGATIVE_OVERRIDES не глушать активну суїцидальність', () => {
  for (const c of OVERRIDE_COMBO_CASES) {
    it(`[${c.id}] override+active: ${c.notes}`, () => {
      const result = detectCrisis(c.text);
      // Коли є активна ідеація — severity має бути high або imminent, не none
      expect(['high', 'imminent']).toContain(result.severity);
    });
  }
});
