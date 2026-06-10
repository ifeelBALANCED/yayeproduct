// Сценарії розмов — мапи на Фундаментальні Мотивації Лєнгле.
// Wellness-мова обов'язково (не clinical).
// openingPrompt — українською. systemContext — англійською (внутрішній).

export interface Scenario {
  id: string;
  title: string;           // внутрішня назва (не показується користувачу)
  fm: 1 | 2 | 3 | 4;      // Фундаментальна Мотивація
  mode: 1 | 2 | 3 | 4;    // режим розмови
  triggerKeywords: string[]; // ключові слова для matchScenario
  openingPrompt: string;   // перше повідомлення AI (українською)
  systemContext: string;   // додатковий контекст для системного промту (англійська)
}

// ─────────────────────────────────────────────────────────────────────────────
// ФМ1 · «Я можу бути» — захист, простір, опора, довіра
// ─────────────────────────────────────────────────────────────────────────────

const fm1NoSpace: Scenario = {
  id: 'fm1-no-space',
  title: 'Мені тут не місце',
  fm: 1,
  mode: 2,
  triggerKeywords: [
    'зайвий', 'зайва', 'не моє місце', 'ніде не можу бути', 'нікуди не дітися',
    'хочу зникнути', 'втомився від усіх', 'втомилася від усіх',
    'немає місця', 'не вписуюся', 'не вписуюсь',
    'всюди чужий', 'всюди чужа', 'де мені бути',
    'нікому не потрібен', 'нікому не потрібна',
    'не можу там бути', 'немає де бути',
  ],
  openingPrompt:
    'звучить так, наче ти шукаєш місце, де можна просто бути — і поки що не знаходиш його. це важко.\n\nя тут. розкажи мені — де саме тобі зараз найважче?',
  systemContext:
    'User is experiencing FM1 deficit: absence of space and protection. ' +
    'They feel they don\'t belong anywhere. ' +
    'Focus on: (1) acknowledging the experience without minimizing, ' +
    '(2) helping them locate even a small felt sense of space or safety, ' +
    '(3) do NOT push toward solutions — stay in presence. ' +
    'Key phenomenological move: "Де ти зараз почуваєшся хоч трохи собою?" ' +
    'If crisis signals appear → trigger [CRISIS]. ' +
    'Mode 4 threshold: if user mentions self-harm, isolation longer than weeks, complete hopelessness.',
};

const fm1Freeze: Scenario = {
  id: 'fm1-freeze',
  title: 'Не можу витримати',
  fm: 1,
  mode: 2,
  triggerKeywords: [
    'не можу витримати', 'не маю сил', 'все застигло', 'як заморожений', 'як заморожена',
    'нічого не відчуваю', 'паралізований', 'паралізована',
    'завмер', 'завмерла', 'не знаю що робити', 'все зупинилося',
    'відключився', 'відключилася', 'порожньо всередині',
    'не реагую', 'нічого не хочу', 'все заціпеніло',
  ],
  openingPrompt:
    'іноді, коли стає дуже важко — всередині все немов замирає. це не слабкість. це спосіб, яким ти справляєшся.\n\nти зараз у безпеці? розкажи, що відбувається.',
  systemContext:
    'User may be in FM1 coping reaction: Totstell-Reflex (freeze/shutdown). ' +
    'They feel overwhelmed and may be dissociating or numbing. ' +
    'DO NOT: push them to "do something", analyze, or explain their state. ' +
    'DO: slow the pace, validate the experience, gently check safety. ' +
    'Key move: help them find ONE small thing that feels real/present right now. ' +
    'Grounding question: "Що зараз є поруч з тобою? Щось, що ти можеш відчути або побачити?" ' +
    'If no response or crisis signals → [CRISIS].',
};

const fm1SelfTrust: Scenario = {
  id: 'fm1-self-trust',
  title: 'Боюся, що не впораюся',
  fm: 1,
  mode: 3,
  triggerKeywords: [
    'боюся не впоратися', 'боюсь не впоратися', 'не знаю чи зможу',
    'не вірю в себе', 'я не здатний', 'я не здатна',
    'провалюся', 'не готовий', 'не готова',
    'не достатньо хороший', 'не достатньо хороша', 'не достатньо добрий',
    'всі впораються а я ні', 'страшно спробувати',
    'що якщо не вийде', 'не вистачить сил',
    'зможу я чи ні', 'невпевненість у собі', 'не вірю що зможу',
  ],
  openingPrompt:
    'стояти перед чимось важливим і не знати, чи вистачить сил — це знайоме майже кожному.\n\nщо саме зараз здається найстрашнішим у цьому?',
  systemContext:
    'User is experiencing FM1 deficit in self-trust (Selbstvertrauen). ' +
    'They doubt their Können (ability/capacity). ' +
    'Approach: phenomenological — help them examine the fear concretely, not reassure abstractly. ' +
    'Key moves: ' +
    '(1) "Що конкретно ти боїшся, що станеться?" ' +
    '(2) "Чи було щось схоже раніше — і як ти тоді впорався?" ' +
    '(3) Help locate even small evidence of their own Können. ' +
    'Do NOT: give generic encouragement ("ти впораєшся!") — it does not land. ' +
    'Mode 4 if: they express complete hopelessness about future or self-worth.',
};

// ─────────────────────────────────────────────────────────────────────────────
// ФМ2 · «Я маю право жити» — стосунки, цінність, радість, смуток
// ─────────────────────────────────────────────────────────────────────────────

const fm2NoJoy: Scenario = {
  id: 'fm2-no-joy',
  title: 'Нічого не радує',
  fm: 2,
  mode: 2,
  triggerKeywords: [
    'нічого не радує', 'все сіре', 'нічого не відчуваю', 'втратив інтерес', 'втратила інтерес',
    'не знаю чого хочу', 'не цікаво нічого', 'все однаково', 'порожньо',
    'не можу радіти', 'радість зникла', 'нічого не хочеться',
    'байдуже до всього', 'не відчуваю нічого', 'все втратило сенс',
  ],
  openingPrompt:
    'іноді буває так, що живеш — але не відчуваєш що живеш. це справді важко.\n\nколи ти востаннє відчував щось справжнє — навіть маленьке?',
  systemContext:
    'User is experiencing FM2 deficit: loss of contact with inner life and values. ' +
    'They cannot access "Gefallen" (liking/enjoyment). ' +
    'DO NOT: push toward positivity, give advice, minimize. ' +
    'DO: slow down, stay present, help locate even the smallest felt sense of aliveness. ' +
    'Key phenomenological move: find ONE thing that still pulls, even slightly. ' +
    'Mode 4 threshold: if joy has been absent for weeks and user seeks help. ' +
    'Crisis threshold: if user expresses no desire to live.',
};

const fm2Loss: Scenario = {
  id: 'fm2-loss',
  title: 'Втрата і смуток',
  fm: 2,
  mode: 2,
  triggerKeywords: [
    'не можу відпустити', 'досі болить', 'сумую', 'втратив', 'втратила',
    'не можу забути', 'скучаю', 'розставання', 'втрата',
    'більше немає', 'не повернути', 'важко відпустити', 'все нагадує',
    'живу минулим', 'не можу рухатися далі',
  ],
  openingPrompt:
    'втрачати щось важливе — боляче. і цей біль каже про те, наскільки це мало для тебе значення.\n\nрозкажи мені — що сталося?',
  systemContext:
    'User is processing grief/loss — FM2 core theme. ' +
    'Grief is healthy and needs to complete naturally, not be interrupted. ' +
    'DO NOT: comfort prematurely, say "everything will be fine", push toward "what\'s next". ' +
    'DO: be present in the grief, help user articulate what was valuable, honor the loss. ' +
    'Key move: "Що це означало для тебе у твоєму житті?" ' +
    'Grief that is stuck/frozen for very long time → Mode 4. ' +
    'Any signs of self-harm ideation → [CRISIS].',
};

// ─────────────────────────────────────────────────────────────────────────────
// ФМ3 · «Я є я» — автентичність, межі, ідентичність
// ─────────────────────────────────────────────────────────────────────────────

const fm3NoSelf: Scenario = {
  id: 'fm3-no-self',
  title: 'Не знаю чого хочу сам',
  fm: 3,
  mode: 2,
  triggerKeywords: [
    'не знаю чого хочу', 'живу для інших', 'завжди підлаштовуюся',
    'не знаю хто я', 'відчуваю себе порожнім', 'відчуваю себе порожньою',
    'як ніби мене немає', 'живу не своїм життям', 'роблю все правильно але',
    'втомився від ролей', 'втомилася від ролей', 'не своє', 'загубив себе',
    'загубила себе', 'не впізнаю себе', 'не знаю що моє',
  ],
  openingPrompt:
    'іноді буває так — живеш, все робиш, а відчуття що тебе немає всередині.\n\nє щось що зараз відчувається як справді твоє — навіть маленьке?',
  systemContext:
    'User is experiencing FM3 deficit: loss of contact with own Self, absence of inner content. ' +
    'They may be living for others, unable to set boundaries, feeling empty despite functioning. ' +
    'DO NOT: push toward "just say no" or "be yourself" as advice. ' +
    'DO: help locate even the smallest felt sense of "own" — thought, wish, feeling that is truly theirs. ' +
    'Key phenomenological move: find what is authentic before finding the boundary. ' +
    'Mode 4 threshold: prolonged emptiness/alienation from self, weeks or months. ' +
    'Crisis threshold: complete loss of self + despair about future.',
};

const fm3Boundary: Scenario = {
  id: 'fm3-boundary',
  title: 'Не можу сказати ні',
  fm: 3,
  mode: 3,
  triggerKeywords: [
    'не можу відмовити', 'не можу сказати ні', 'боюся відмовити',
    'завжди погоджуюся', 'зрадив себе', 'зрадила себе',
    'знову погодився хоча не хотів', 'знову погодилася хоча не хотіла',
    'не вмію відстояти себе', 'тиснуть на мене', 'змушують',
    'не маю права відмовити', 'відчуваю провину коли відмовляю',
    'боюся що відкинуть', 'погоджуюся щоб не образити',
  ],
  openingPrompt:
    'погоджуватися коли всередині «ні» — це виснажливо.\n\nрозкажи — що зараз відбувається?',
  systemContext:
    'User is experiencing FM3 deficit: inability to set boundaries, self-betrayal. ' +
    'Key insight from Langle: boundary only exists where there is Own content behind it. ' +
    'DO NOT: advise to "just say no" or validate anger at others. ' +
    'DO: first find what they want to protect — what is their Own in this situation. ' +
    'Key moves: ' +
    '(1) "Що для тебе важливо в цій ситуації — що твоє?" ' +
    '(2) "Що відбувається всередині коли треба відмовити?" ' +
    '(3) Help locate the value behind the boundary, not just the refusal. ' +
    'Mode 3 — reflection and finding own position. ' +
    'Mode 4 if: chronic pattern causing significant life disruption.',
};

// ─────────────────────────────────────────────────────────────────────────────
// Реєстр усіх сценаріїв
// ─────────────────────────────────────────────────────────────────────────────

export const SCENARIOS: readonly Scenario[] = [
  // ФМ1
  fm1NoSpace,
  fm1Freeze,
  fm1SelfTrust,
  // ФМ2
  fm2NoJoy,
  fm2Loss,
  // ФМ3
  fm3NoSelf,
  fm3Boundary,
];

export { fm1NoSpace, fm1Freeze, fm1SelfTrust };
export { fm2NoJoy, fm2Loss };
export { fm3NoSelf, fm3Boundary };
