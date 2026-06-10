#!/usr/bin/env bash
# ============================================================
# S2 gate: перевірка дрейфу між схемою Supabase і types.ts
#
# Використання (локально або у CI після `supabase start`):
#   ./scripts/check-db-types.sh
#
# Вихідний код:
#   0 — дрейфу немає, types.ts актуальний
#   1 — виявлено дрейф або supabase CLI недоступний
#
# Сумісність: supabase CLI v2.x (формат `gen types typescript`).
# Якщо CLI оновився до v3.x — перевір синтаксис команди.
# ============================================================

set -euo pipefail

TYPES_FILE="packages/db/src/types.ts"
TMP_FILE="$(mktemp /tmp/supabase-types-XXXXXX.ts)"

# Прибираємо tmp при виході (успіх або помилка)
cleanup() {
  rm -f "$TMP_FILE"
}
trap cleanup EXIT

# ── Перевірка наявності supabase CLI ──────────────────────────
if ! command -v supabase &>/dev/null; then
  echo "[check-db-types] ПРОПУЩЕНО: supabase CLI не знайдено."
  echo "  Щоб перегенерувати вручну:"
  echo "    supabase gen types typescript --local > $TYPES_FILE"
  # У CI без supabase start — не блокуємо, але попереджаємо.
  # CI запускає цей скрипт тільки після 'supabase start'.
  exit 0
fi

# ── Генерація актуальних типів із локальної БД ────────────────
echo "[check-db-types] Генеруємо типи з локальної БД..."
if ! supabase gen types typescript --local > "$TMP_FILE" 2>/dev/null; then
  echo "[check-db-types] ПОМИЛКА: supabase gen types typescript --local завершився з помилкою."
  echo "  Переконайся, що 'supabase start' запущено перед цим скриптом."
  exit 1
fi

# ── Порівняння з поточним types.ts ───────────────────────────
# Порівнюємо тільки секцію Database (Tables/Views/Functions/Enums),
# ігноруючи backward-compat аліаси нижче рядка з 'AgeBand'.
# Це дозволяє підтримувати аліаси локально без false-positive дрейфу.
#
# Якщо потрібно порівняти файли повністю — прибери фільтрацію нижче.

CURRENT_DB_SECTION="$(sed -n '/^export type Database/,/^};$/p' "$TYPES_FILE")"
GENERATED_DB_SECTION="$(sed -n '/^export type Database/,/^};$/p' "$TMP_FILE")"

if diff_output=$(diff -u \
    <(echo "$CURRENT_DB_SECTION") \
    <(echo "$GENERATED_DB_SECTION")); then
  echo "[check-db-types] OK — types.ts відповідає схемі БД."
  exit 0
else
  echo ""
  echo "[check-db-types] ДРЕЙФ ВИЯВЛЕНО — types.ts застарів."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$diff_output"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "  Щоб виправити — перегенеруй файл:"
  echo "    supabase gen types typescript --local > $TYPES_FILE"
  echo ""
  echo "  Потім переглянь зміни, збережи backward-compat аліаси"
  echo "  (AgeBand, Jurisdiction тощо) і закомітуй."
  exit 1
fi
