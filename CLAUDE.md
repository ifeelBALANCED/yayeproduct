# Я Є · Claude Code Build Prompt

> Канонічний документ для Claude Code. Якщо щось у коді відхиляється від цього документа — документ виграє, код переписується.

---

## 0 · Контекст і дух продукту

**«Я Є»** — AI-співрозмовник для саморозуміння у підлітків та молодих людей 13–25 (WHO young people; Lancet 2018 extended adolescence). Wellness-продукт, не медичний. Побудований на **екзистенційному аналізі Альфріда Лєнгле** (4 фундаментальні мотивації).

**Це не чатбот. Це не компаньйон.** Продукт існує, щоб бути **анти-Character.AI, анти-Replika**. Він спроєктований так, щоб **не утримувати** користувача, **не симулювати взаємність**, **не заповнювати порожнечу**.

Перш ніж писати будь-який код, що стосується AI-поведінки, **обов'язково прочитай** `/docs/method-framework.md`. **Методологічна рамка завжди виграє над технічними чи UX-зручностями.**

**Один тест для кожного AI-відповіді:** «Це присутність — чи симуляція взаємності?» Якщо друге — переписати.

---

## 1 · Технічний стек

| Шар | Технологія |
|---|---|
| Framework | Next.js 15 (App Router, RSC, Server Actions) |
| Мова | TypeScript strict mode |
| Стилі | Tailwind CSS + shadcn/ui |
| База даних | Supabase Postgres (eu-central-1, Frankfurt) |
| Auth | Supabase Auth (magic link, OTP) |
| AI | Anthropic API, модель `claude-opus-4-7` (MVP-демо) |
| Realtime | Supabase Realtime |
| PWA | @ducanh2912/next-pwa |
| Аналітика | PostHog EU self-hosted або Plausible |
| Hosting | Vercel (Frankfurt region) |
| i18n | next-intl |

**Env-змінні:**
- `ANTHROPIC_MODEL=claude-opus-4-7`
- `ANTHROPIC_PROMPT_VERSION=v1.8`

**Монорепо:** turborepo + pnpm workspaces
- `apps/teen` → app.ya-ye.app
- `apps/therapists` → therapists.ya-ye.app
- `packages/method` → AI prompt builders, mode/crisis detection
- `packages/db` → Supabase types, client
- `packages/ui` → shared design system

---

## 2 · Дизайн-система

### Кольори
```ts
bg: '#F5EFE4'       // основний фон
bgSoft: '#EDE5D6'   // картки, поля
ink: '#1F1B16'      // основний текст
inkSoft: '#5A5347'  // вторинний
accent: '#C28160'   // user bubble, CTA
crisis: '#A8331E'   // SOS, crisis modal
crisisSoft: '#F0D5CD'
ok: '#6B8E5A'
divider: '#D9D0BD'
```

### Типографіка
- Serif italic: `Cormorant Garamond` — заголовки, «Я є»
- Sans body: `Inter` — UI, повідомлення
- Mono: `JetBrains Mono` — `[01 · ПІДТРИМУЮ]`, статуси

### Правила
- `rounded-2xl` для бабблів, кнопок
- `rounded-3xl` для модалок
- Тільки `shadow-sm`. Без різких тіней.
- **Без emoji у UI взагалі.**
- Іконки: `lucide-react`, `strokeWidth={1.5}`

---

## 3 · Database schema (Supabase)

Всі таблиці у `eu-central-1` (Frankfurt). GDPR-compliant.

| Таблиця | Колонка | Тип | Примітка |
|---|---|---|---|
| `crisis_events` | `review_at` | `timestamptz` | (було `clinical_review_at`) |
| `crisis_events` | `review_by` | `text` | (було `clinical_review_by`) |
| `crisis_events` | `review_notes` | `text` | (було `clinical_notes`) |
| `messages` | `prompt_version` | `text` | default `'v1.8'` (runtime: ANTHROPIC_PROMPT_VERSION) |

Міграція перейменування: `supabase/migrations/20240101000002_rename_clinical_to_review.sql`

---

## 4 · Anti-patterns (hard fails)

| НЕ | Замість |
|---|---|
| «я думала про тебе» | «я чую тебе.», «я тут.» |
| Emoji у відповідях AI | Жодних |
| Push «we miss you» | Жодного утримання |
| Streaks, badges | Containment Rate як primary KPI |
| «Можливо, у тебе депресія» | «коли востаннє щось радувало тебе?» |
| Довгі параграфи | 2–4 короткі баббли, малі літери |
| Google Analytics, Facebook Pixel | PostHog EU або Plausible |
| DAU/MAU як success indicator | Containment Rate |

---

## 5 · Конфігурація проєкту

- **AI модель:** `claude-opus-4-7` (MVP-демо; production: `claude-sonnet-4-6` + prompt caching)
- **Hosting:** Vercel, Frankfurt region
- **Crisis reviewer для MVP:** `reviewer@ya-ye.app` (placeholder, замінити перед launch)

---

## 6 · Методологічний шар

- Пакет: `packages/method` (колишній `packages/clinical`)
- Канонічний промт: `/docs/system-prompt-canonical.md` (v1.8)
- Рамка: `/docs/method-framework.md`
- **Методологічна рамка завжди виграє** над технічними/UX-зручностями
- Будь-яка зміна промта → review Methodology Lead → інкремент версії

---

## 7 · Quality Gate

- **Канон:** `/docs/quality-gate.md` — діє для **кожного MR**. Завжди посилайся на нього в PR, рев'ю та при будь-яких змінах CI/тестів.
- Стадії S0–S7 (static → unit → DB-integration → E2E → visual → security → method/AI → budget) — required checks для merge у `master`.
- Якщо CI або код суперечать `/docs/quality-gate.md` — документ виграє.

---

*Methodology framework: Olena Vovk, Methodology Lead.*
*Якщо код суперечить методологічній рамці — рамка виграє.*
