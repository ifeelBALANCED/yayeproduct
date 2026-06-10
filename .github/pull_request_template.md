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
