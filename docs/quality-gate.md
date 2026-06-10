# Quality Gate · Я Є — канонічний документ

> **Статус:** канон. Діє для **кожного MR** у `master`. Якщо CI, код чи рев'ю суперечать цьому документу — документ виграє.
> **Версія:** 1.0 · 2026-06-10
> Кожен PR-опис і кожне рев'ю **посилаються на цей файл** (`docs/quality-gate.md`). PR без проходження required checks зі стадій S0–S7 не мерджиться.

---

## 0 · Принцип

Gate будується на: **SOLID, DRY, GRASP, GoF (мінімально необхідні патерни), YAGNI**, бекенд — **CQRS-lite** (розділення command/query handlers без event sourcing і шин — YAGNI). Кожна стадія: інструмент → що перевіряє → критерій fail. Все, що не автоматизовано — не існує.

Додатковий, специфічний для продукту, шар: **method/AI gates** — методологічна рамка (`docs/method-framework.md`) перевіряється кодом, не рев'ю.

---

## 1 · P0 — передумови ввімкнення gate (Phase 0)

Gate вмикається тільки після виправлення. Зараз ці дефекти роблять будь-який «зелений» CI фікцією:

| #    | Дефект                                                                                                                                   | Де                                                                                    | Чому блокер                                                                                             |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| P0-1 | `crisis_events` insert пише неіснуючі колонки `trigger_text`, `detected_at`, не передає NOT NULL `jurisdiction`                          | `apps/teen/src/app/api/chat/route.ts:126-131` vs `supabase/migrations/20240101000001` | На реальній БД **кожен кризовий евент мовчки втрачається** (fire-and-forget `.then()`). Safety-критично |
| P0-2 | Живий `ANTHROPIC_API_KEY` на диску                                                                                                       | `.env:13` (у git-історії відсутній — перевірено)                                      | Ротувати ключ негайно; додати gitleaks (S0)                                                             |
| P0-3 | `ageBand: '16-17'` захардкожено для всіх                                                                                                 | `apps/teen/src/app/api/chat/route.ts:177`                                             | Safeguarding 13-15 у промпті ніколи не активується — методологічний fail                                |
| P0-4 | CI тригериться на `main`/`develop`, гілка — `master`; coverage-шлях `packages/clinical/` (пакет = `method`)                              | `.github/workflows/ci.yml:5-7,64`                                                     | **CI взагалі не запускається**; coverage ніколи не вантажиться                                          |
| P0-5 | Zero auth на всіх 7 ендпоінтах; IDOR `GET /api/sessions/[id]/messages`; no rate-limit на `/api/chat`; service-role key для всіх операцій | `apps/teen/src/app/api/**`, `apps/teen/src/lib/supabase/server.ts:27-36`              | GDPR Art. 9 (special category data), cost-abuse Anthropic, RLS повністю обійдено                        |
| P0-6 | `turbo.json: test dependsOn ^build` → unit-тести чекають збірки 3 Next.js апок                                                           | `turbo.json:21`                                                                       | Найшвидший фідбек-луп (~1 хв тестів) коштує ~3 хв збірки. Прибрати залежність                           |
| P0-7 | Колізія Mode 4: `mode-detector.ts:38` → diagnosis-stop, system-prompt `[MODE:4]` → specialist-redirect                                   | `packages/method`                                                                     | Два сенси одного значення; контрактний тест (S6) неможливий до фіксу                                    |

---

## 2 · Архітектурні правила (перевіряються в S0)

### 2.1 CQRS-lite на бекенді

Route handler = тонкий **Controller (GRASP)**: parse → виклик handler → серіалізація. Вся логіка — у command/query handlers, які тестуються без HTTP.

```
apps/teen/src/server/
  commands/   sendMessage.ts, createSession.ts, submitBooking.ts, logCrisisEvent.ts
  queries/    getSessionMessages.ts
  ports/      anthropic.ts (AnthropicPort), clock.ts (ClockPort), rateLimiter.ts (RateLimiterPort)
  adapters/   anthropicSdk.ts, systemClock.ts, upstashLimiter.ts
```

- **SRP:** зараз `api/chat/route.ts` робить parse + crisis-detect + prompt-build + stream + 3 інсерти. Розшарувати.
- **DIP / GoF Adapter:** `new Anthropic()` інлайн (`route.ts:96`) → `AnthropicPort`, інжектиться; у тестах — фейк. Те саме для clock (зараз час сесії — **client-supplied**, `route.ts:68-71` — сервер має бути джерелом істини) і rate-limiter.
- **GoF — тільки виправдані:** Adapter (порти), Strategy (crisis-tiers / Phase-2 mode-classifier), Factory (вже є в `packages/db/src/client.ts`). Інших патернів **не вводити** (YAGNI).
- **GRASP Information Expert:** crisis/mode/prompt-логіка живе тільки в `packages/method` (вже так — закріплено правилом залежностей нижче).
- **Заборона:** event sourcing, message bus, generic repository, DI-контейнер — до появи 3 конкретних споживачів (YAGNI).

### 2.2 Межі залежностей (dependency-cruiser, fail у CI)

```
apps/*        ✗ не імпортують одне одного
packages/method ✗ next, react, @supabase/* (чистий TS; зараз @anthropic-ai/sdk типи — допустимий виняток, лише types)
packages/ui     ✗ @supabase/*, packages/db, packages/method
packages/db     ✗ react, next
будь-де         ✗ циклічні залежності
apps/*/src/components ✗ прямі імпорти @supabase/* (тільки через lib/ або server/)
```

### 2.3 DRY — зафіксовані дублікати (борг, gate проти нових)

- Два `HOTLINES`: `packages/method/src/hotlines.ts` і приватний у `system-prompt.ts:221` → одне джерело + тест-кроссчек (S1).
- Два `SessionTimer`: компонент + інлайн-копія в `(chat)/[sessionId]/page.tsx:88` → один.
- Три ідентичні `tailwind.config.ts` → preset у `packages/ui` (3 споживачі є — абстракція виправдана).
- `jscpd` у S0: нові дублікати > 25 рядків — fail.

### 2.4 Контракти клієнт↔сервер — `packages/contracts`

Zod-схеми — **єдине** джерело request/response типів (3 споживачі: route handlers, клієнтські fetch-обгортки, тести — критерій YAGNI виконано):

- Кожен route handler парсить body **тільки** через `Schema.parse()` (зараз — ручні касти, `route.ts:38-79`). ESLint-правило: `req.json()` без zod — error.
- Клієнт використовує `z.infer<>` тих самих схем → дрейф типів неможливий за компіляцією.
- Ліміти в схемах: `userMessage: z.string().min(1).max(2000)` (зараз unbounded — token-stuffing), `sessionId: z.string().uuid()`, `sessionStartedAt`/`turnNumber`/`postCrisisMode` — серверні, з клієнта **не приймаються**.
- SSE-евенти (`token`/`done`/`error`/`crisis`) — discriminated union у contracts; клієнтський парсер (`page.tsx:358` — зараз `JSON.parse` без try/catch) використовує `safeParse`.

---

## 3 · Пайплайн MR — стадії

Тригер: `pull_request` → `master` (+ push у `master`). Turborepo `--affected` + remote cache. Required checks = S0–S6 (S7 — після Phase 3).

### S0 · Static (паралельно, ціль < 3 хв)

| Check            | Інструмент                                                                                                                                                                                                                                                    | Критерій fail          | Стан зараз                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------- |
| Format           | `prettier --check`                                                                                                                                                                                                                                            | будь-який diff         | скрипта немає — додати          |
| Lint             | ESLint flat у **всіх 7** workspace                                                                                                                                                                                                                            | error                  | немає в landing, db, method, ui |
| Typecheck        | `tsc --noEmit` (strict + `noUncheckedIndexedAccess` — вже є)                                                                                                                                                                                                  | error                  | ✅ працює                       |
| Secrets          | gitleaks                                                                                                                                                                                                                                                      | будь-який знахід       | немає (а ключ — на диску)       |
| Deps audit       | `pnpm audit --prod` + osv-scanner                                                                                                                                                                                                                             | high/critical          | немає                           |
| Arch conformance | dependency-cruiser (правила §2.2)                                                                                                                                                                                                                             | порушення              | немає                           |
| Dead code        | knip                                                                                                                                                                                                                                                          | новий unused export    | немає                           |
| Duplication      | jscpd                                                                                                                                                                                                                                                         | новий клон > 25 рядків | немає                           |
| Design tokens    | ESLint custom: emoji-regex у JSX-літералах (поточний селектор `JSXText` ловить **весь** текст — переписати на regex-перевірку значення); заборона `shadow-(md\|lg\|xl\|2xl)` (`CrisisModal.tsx:40` вже порушує); заборона hex-кольорів поза tailwind-конфігом | порушення              | зламаний/немає                  |

### S1 · Unit (ціль < 2 хв, **без** `dependsOn ^build`)

- `packages/method` — найвищий пріоритет (safety-core):
  - `buildSystemPrompt`: тести на **кожну** гілку crisis-роутингу (`system-prompt.ts:596-608`: elevated / high-imminent / postCrisis / none) — зараз **0 тестів**;
  - crisis-корпус: розширити 15 → ≥ 150 кейсів (сленг, транслітерація, «хочу щоб мене не було», suржик, mixed-language); recall high+imminent ≥ 0.9, **імінентні false-negative = 0**;
  - `NEGATIVE_OVERRIDES` (`crisis-detector.ts:44-47`): тести, що минулий досвід лікування / горе **не** глушить активну суїцидальність;
  - кроссчек двох HOTLINES-структур (до злиття) + `getHotlines` fallback;
  - `getExercise` error path, `suggestExerciseForMode`, `detectModeFromKeywords`;
  - sanitization `userName` у `buildContextBlock` (`system-prompt.ts:611-614`) — prompt-injection через ім'я.
- `packages/contracts` — кожна схема: valid/invalid/boundary.
- `apps/teen` command/query handlers — з фейковими портами (без HTTP, без БД).
- Coverage: v8, пороги 80% — **enforced у CI** (зараз пороги є, CI їх не бачить); для `crisis-detector.ts` і `system-prompt.ts` — 100% branches.

### S2 · Integration + DB (supabase local, ціль < 6 хв)

`supabase start` у CI (офіційний CLI action) → міграції з нуля → `supabase db reset` на кожен прогін.

- **Schema↔code contract:** `supabase gen types typescript` → diff із `packages/db/src/types.ts` → будь-який дрейф = fail. (Зараз types.ts ручний, **відсутні 3 таблиці** — `specialists`, `booking_requests`, `exercise_feedback`; саме цей gate зловив би P0-1.) Після фіксу — types.ts тільки генерований.
- **RLS-матриця:** для кожної таблиці × роль (anon / authenticated / service_role) × операція (S/I/U/D) — явний тест «дозволено/заборонено». Виявлені дірки: `sessions` без DELETE-policy, `booking_requests` без UPDATE/DELETE навіть для service_role, `exercise_feedback` без SELECT, конфліктні SELECT-policies `therapists`.
- **API-інтеграційні** (реальна локальна БД + фейковий `AnthropicPort`): create session → persist; chat → повідомлення в `messages` з `prompt_version`; кризовий тригер → **рядок у `crisis_events` реально існує** (анти-P0-1); IDOR-тести: сесія A не читається з токеном B (після auth).
- **Інваріант:** жоден інсерт не fire-and-forget для safety-даних — крах інсерту `crisis_events`/`messages` повертає помилку, тест перевіряє.
- Seed: `auth.users` синхронізовані з PK therapists (зараз RLS `auth.uid()=id` локально нетестовний).

### S3 · E2E-флоу (Playwright, ціль < 8 хв, проти `next build` + supabase local)

Anthropic мокається через `page.route()` (детерміновані SSE-фікстури).

| Флоу                | Перевірки                                                                                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Onboarding          | splash → age (13-15 → parental notice) → name → редірект у сесію; `age_band` реально збережено і **використано в промпті** (анти-P0-3)                                                  |
| Chat                | send → SSE-стрім → баблі → mode-лейбл з відповіді (зараз стрічка хардкодить `[01 · підтримую]` — `page.tsx:400`); обрив стріму → UI не зависає (анти `JSON.parse`-краш)                 |
| Crisis              | тригер → `{type:'crisis'}` → модалка з hotlines → grounding 5-4-3-2-1 → post-crisis режим; back-link з `/crisis` веде в сесію (зараз веде на неіснуючий `/chat` — `crisis/page.tsx:29`) |
| Session expiry      | таймер → exit-екран; `setTimeout`-leak (`page.tsx:234`) не стріляє після unmount                                                                                                        |
| Specialists/booking | каталог → профіль → форма (email-валідація — зараз її немає; minor notice) → success; невалідний slug → справжній 404, не 200                                                           |
| A11y                | `@axe-core/playwright` на кожній сторінці флоу: 0 serious/critical; keyboard-тест focus-trap CrisisModal (зараз **fail** — трапа немає, WCAG 2.1.2)                                     |

### S4 · Visual regression (Playwright `toHaveScreenshot`)

- Матриця: viewport **375 / 768 / 1280** × локаль **uk** (en не сервиться — `i18n/request.ts:5`) × `prefers-reduced-motion: reduce` (анімації Island недетерміновані без цього).
- `maxDiffPixelRatio: 0.01`; динамічні зони (таймер) — `mask`.
- Інвентар станів (повний — з аудиту):
  - `ChatBubble`: 2 ролі × streaming on/off × mode 1–4/немає (8 снапшотів)
  - `CrisisModal`: phone / chat-hotline / ±onGrounding
  - `Grounding54321`: steps 0–4 + done (2 варіанти)
  - `Island`: hero / mini / explainer (+ activeFm 1–4 — клік)
  - Onboarding: 3 кроки + parental notice + submitting
  - `SessionTypeCard` ±recommended; `SpecialistCard`; `CalendarMockup` (порожній/обраний слот, 375px snap-scroll)
  - Chat-сторінка: порожня / зі стрімом / crisis open / postCrisis / exercise card collapsed+expanded; SOS-кнопка
  - Therapists: dashboard, referral detail; Landing: hero (375 без Island / 1280 з), GroundingMinute states 0–7
- **Протокол оновлення базлайнів:** окремий коміт `test(visual): update baselines — <причина>`; оновлення без пояснення в PR = reject. Storybook/Chromatic **не вводимо** (YAGNI — Playwright-харнес достатній; переглянути при > 30 компонентах).

### S5 · Security (частина — S0, решта тут)

| Check            | Інструмент / тест                                                                                                                       | Стан                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| SAST             | semgrep (OWASP top-10 ruleset + кастом: заборона `SUPABASE_SERVICE_ROLE_KEY` поза `server/adapters`)                                    | немає                                  |
| Security headers | інтеграційний тест: відповідь містить CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy           | **зараз 0 хедерів** в обох next.config |
| AuthN/Z          | кожен route: 401 без токена; IDOR-регресія (S2)                                                                                         | auth немає взагалі                     |
| Rate limit       | тест: N+1-й запит до `/api/chat` → 429                                                                                                  | лімітера немає                         |
| Input bounds     | zod-ліміти з contracts (S1)                                                                                                             | unbounded                              |
| Prompt-injection | history **тільки з БД**, не з клієнта (`route.ts:51-61` — зараз клієнт інжектить assistant-репліки); тест: crafted history відхиляється | відкрито                               |
| PII              | semgrep: `console.log` з PII-полями (зараз booking логує контакти — `submit/route.ts:74-86`); error-відповіді без internals             | відкрито                               |
| GDPR             | `DELETE /api/sessions/[id]` (cascade) + тест; retention-політика задокументована                                                        | ендпоінта немає                        |

### S6 · Method/AI gates (специфіка продукту — найвищий пріоритет рев'ю)

- **Crisis recall gate:** корпус ≥ 150; high+imminent recall ≥ 0.9; imminent FN = 0. Fail = блок мерджу, без винятків.
- **Prompt snapshot:** снапшоти `buildSystemPrompt` на матриці контекстів (ageBand × crisisLevel × elapsedMin × postCrisis). Зміна снапшота вимагає: інкремент `ANTHROPIC_PROMPT_VERSION` + апрув Methodology Lead (CODEOWNERS, §4).
- **Asymmetry:** `validateAsymmetry` викликається в `route.ts:230` — тест-фіксація виклику; рішення «warn → block» — за Methodology Lead.
- **Контракт mode:** вихід `detectMode` ∈ валідні `[MODE:n]` системного промпта (ловить P0-7); FM4-сценарії відсутні — зафіксовано боргом.
- **Анти-патерни відповіді** (рамка §4 CLAUDE.md): на SSE-фікстурах — без emoji, малі літери, 2–4 баблі, заборонені фрази («я думала про тебе», «сумую») — regex-валідатор як unit-gate.

### S7 · Build + budget (після Phase 3)

- `turbo build --affected` — обов'язково зелений (вже required імпліцитно).
- `size-limit` на client-бандли ключових роутів: chat ≤ 160 kB gz (базлайн зняти першим прогоном, далі — ±5%).
- Lighthouse CI на Vercel preview: perf ≥ 90, a11y = 100, PWA-аудит (SW з `aggressiveFrontEndNavCaching` **не кешує** `/api/*` і SSE — окремий тест; зараз не перевірено).

---

## 4 · Механіка MR

- **Required checks:** S0–S6 (S7 після Phase 3). Без зелених — merge заблоковано налаштуваннями гілки `master`.
- **CODEOWNERS:**
  - `packages/method/**`, `docs/system-prompt-canonical.md`, `docs/method-framework.md`, `docs/crisis-test-corpus*.jsonl` → Methodology Lead (обов'язковий апрув);
  - `supabase/migrations/**`, `packages/db/**` → backend-овнер;
  - `docs/quality-gate.md`, `.github/workflows/**` → tech lead.
- **PR-шаблон** (`.github/pull_request_template.md`) містить посилання на цей документ і чекбокси: contracts оновлені / міграція має RLS-тести / visual baselines пояснені / prompt-version інкрементовано (якщо торкався method).
- Зміна цього документа — звичайний MR із тим самим gate.

---

## 5 · Rollout (gate вмикається тільки зеленим)

| Фаза  | Зміст                                                                          | Required з               |
| ----- | ------------------------------------------------------------------------------ | ------------------------ |
| **0** | P0-1…P0-7 + ротація ключа + фікс CI-тригерів                                   | typecheck, build (вже є) |
| **1** | S0 повністю + S1 (contracts, тести method, coverage у CI)                      | + S0, S1                 |
| **2** | S2 (supabase local, RLS-матриця, schema-contract) + auth/rate-limit + S5-тести | + S2, S5                 |
| **3** | S3 + S4 (E2E, visual, a11y)                                                    | + S3, S4, S6             |
| **4** | S7 (budget, Lighthouse, PWA)                                                   | + S7                     |

Анти-правило: **не вмикати** check у required, поки він червоний — мертвий gate гірший за відсутній.

---

## 6 · Реєстр відомого боргу (не блокує merge, блокує релокацію в «done»)

| Борг                                                            | Де                                                   |
| --------------------------------------------------------------- | ---------------------------------------------------- |
| FM4: немає сценаріїв і keyword-детекції                         | `packages/method/scenarios.ts`, `mode-detector.ts`   |
| `users.user_name` ігнорується сервером                          | `api/sessions/route.ts:17`                           |
| `parental_consent` — stub 501, флоу не гейтиться                | `api/consent/route.ts`                               |
| `api/crisis`, `api/handoff` — 501                               | stubs                                                |
| `types.ts` ручний, `25+` vs `AgeBand` розсинхрон                | `packages/db/src/types.ts`                           |
| Міграція `…000004` відсутня в послідовності                     | `supabase/migrations/`                               |
| Supabase Realtime у стеку CLAUDE.md, у коді не використовується | стек-дрейф                                           |
| Особисті контакти реальної людини в коді й seed                 | `system-prompt.ts:227`, `migrations/…000005:137-140` |
| en.json є, локаль захардкожена `uk`                             | `apps/teen/src/i18n/request.ts:5`                    |
| `outputFileTracingIncludes` тягне `docs/**` у serverless-бандл  | `apps/teen/next.config.mjs:13-15`                    |

---

_Цей документ — частина методологічного контуру продукту. Якщо перевірка конфліктує з `docs/method-framework.md` — рамка виграє, перевірка переписується._
