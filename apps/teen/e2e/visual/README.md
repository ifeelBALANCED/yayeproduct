# S4 Visual Regression — Я Є

> quality-gate §3 S4 · [`docs/quality-gate.md`](../../../../docs/quality-gate.md)

## Структура

```
e2e/visual/
  chat-bubble.spec.ts    ChatBubble: 2 ролі × streaming × mode 1–4/немає
  crisis-modal.spec.ts   CrisisModal: phone/chat hotline, ±onGrounding
  grounding54321.spec.ts Grounding54321: steps 0–4 + done
  island.spec.ts         Island: hero/mini/explainer + activeFm 1–4
  onboarding.spec.ts     Onboarding: splash / age / parental notice / name / submitting
  specialists.spec.ts    SessionTypeCard ±recommended, SpecialistCard, CalendarMockup
  chat-page.spec.ts      Chat: empty / streaming / crisis open / postCrisis / exercise card
  landing.spec.ts        Landing hero 375/1280, GroundingMinute states 0–7
  therapists.spec.ts     Therapists dashboard + referral detail (fixme — окремий порт)
```

Матриця viewport: **375 / 768 / 1280** px × локаль **uk** × `prefers-reduced-motion: reduce`.
`maxDiffPixelRatio: 0.01`. Динамічні зони (таймер сесії) — `mask`.

## Локальний запуск

```bash
# Збірка (якщо не зроблено)
pnpm --filter @ya-ye/teen build

# Генерація / оновлення базлайнів
npx playwright test --project=visual --update-snapshots

# Тільки перевірка (без оновлення)
npx playwright test --project=visual
```

Базлайни зберігаються у `e2e/visual/**-snapshots/` як `*-darwin.png` (локально) або `*-linux.png` (CI).
Linux-базлайни генеруються у CI при першому запуску після додавання нових тестів.

## Протокол оновлення базлайнів

**Оновлення базлайнів = окремий коміт** з повідомленням:

```
test(visual): update baselines — <причина>
```

Приклади допустимих причин:

- `оновлення дизайн-токенів (accent color #C28160 → #BF7A5E)`
- `рефакторинг ChatBubble layout`
- `додано новий стан CrisisModal`

**Оновлення базлайнів без пояснення причини в PR → reject.**
(quality-gate §3 S4: «оновлення без пояснення в PR = reject»)

Базлайни НЕ оновлюються в одному коміті разом із продуктовими змінами —
тільки окремим коміт `test(visual): update baselines — <причина>`.

## Відомі caveats

| Компонент                    | Стан                 | Причина                                                                              |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| `Island` mini / explainer    | `test.fixme`         | Немає роуту у teen або landing. Борг: `/island-demo` або Storybook (>30 компонентів) |
| `Island` hero на landing     | Умовний `test.fixme` | Landing (port 3001) не в webServer playwright.config. Запустити окремо.              |
| `GroundingMinute` states 0–7 | Умовний `test.fixme` | Той самий caveat — landing на port 3001                                              |
| Therapists dashboard         | `test.fixme`         | apps/therapists — окремий порт (3002), поза поточним harness                         |
| Therapists referral detail   | `test.fixme`         | Той самий caveat                                                                     |
| Linux baselines              | Відсутні             | Генеруються у CI при першому прогоні — fix-forward                                   |
