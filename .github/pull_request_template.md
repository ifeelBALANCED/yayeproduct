# MR

> Quality Gate: [`docs/quality-gate.md`](../docs/quality-gate.md) — обов'язковий для кожного MR. Merge тільки із зеленими стадіями S0–S7.

## Що змінено

-

## Чеклист (з docs/quality-gate.md §4)

- [ ] S0–S6 зелені (S7 — якщо ввімкнено)
- [ ] Request/response зміни → схеми в `packages/contracts` оновлені
- [ ] Нова міграція → RLS-тести в матриці (S2) + `supabase gen types` перегенеровано
- [ ] Visual baselines оновлені → причина в описі MR
- [ ] Торкався `packages/method` / промпта → інкремент `ANTHROPIC_PROMPT_VERSION` + апрув Methodology Lead
- [ ] Жодних нових порушень меж залежностей (§2.2) і дублікатів (§2.3)

## Security (docs/quality-gate.md §S5)

- [ ] Нові env-змінні не містять секретів у коді (gitleaks пройшов)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` використовується лише у `apps/*/src/lib/supabase/server.ts` або `apps/*/src/server/adapters/`
- [ ] `ANTHROPIC_API_KEY` використовується лише в `src/server/adapters/` або `route.ts`
- [ ] Жодного `console.log/warn/error` з PII (email, phone, telegram, contactValue, userName)
- [ ] Нові route handlers мають 401/403 перевірку сесійного cookie

## GDPR / дані

- [ ] Нові поля у БД задокументовані у `docs/data-retention.md` (строки, правова база)
- [ ] Нові персональні дані не зберігаються без явної згоди (consent_log)
