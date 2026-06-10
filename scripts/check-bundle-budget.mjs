#!/usr/bin/env node
// ============================================================
// S7 gate: перевірка бандл-бюджету клієнтського роуту chat
//
// Використання:
//   node scripts/check-bundle-budget.mjs             — перевірка
//   node scripts/check-bundle-budget.mjs --update-baseline
//                                                    — оновити базлайн
//
// Вихідний код:
//   0 — бюджет витримано
//   1 — бюджет перевищено або маніфест відсутній
//
// Протокол оновлення базлайну (аналогічно visual baselines, quality-gate §3 S4):
//   1. Запусти: node scripts/check-bundle-budget.mjs --update-baseline
//   2. Закомітуй apps/teen/bundle-budget.json окремим комітом.
//   3. У PR поясни причину зростання (нова залежність, новий чанк тощо).
//   Ніколи не оновлюй базлайн у тому ж коміті, що і зміни коду.
//
// Docs: quality-gate §3 S7
// ============================================================

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Шляхи до файлів ──────────────────────────────────────────
const MANIFEST_PATH = join(ROOT, 'apps/teen/.next/app-build-manifest.json');
const BUDGET_PATH = join(ROOT, 'apps/teen/bundle-budget.json');

// ── Ключ роуту chat у маніфесті ──────────────────────────────
// Шукаємо за патерном: ключ містить [sessionId]/page
const CHAT_ROUTE_PATTERN = /\[sessionId\]\/page$/;

// ── Прапорець --update-baseline ──────────────────────────────
const UPDATE_BASELINE = process.argv.includes('--update-baseline');

// ── Перевірка наявності маніфесту ────────────────────────────
if (!existsSync(MANIFEST_PATH)) {
  console.error('[bundle-budget] ПОМИЛКА: маніфест відсутній.');
  console.error('  Спочатку виконай: cd apps/teen && pnpm build');
  process.exit(1);
}

// ── Зчитуємо маніфест і бюджет ───────────────────────────────
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const budget = JSON.parse(readFileSync(BUDGET_PATH, 'utf8'));

const { capBytes, gzipBytes: baseline } = budget.chat;

// ── Знаходимо chat-роут ──────────────────────────────────────
const chatKey = Object.keys(manifest.pages).find((k) => CHAT_ROUTE_PATTERN.test(k));
if (!chatKey) {
  console.error('[bundle-budget] ПОМИЛКА: chat-роут не знайдено у маніфесті.');
  console.error('  Очікується ключ що відповідає патерну: [sessionId]/page');
  process.exit(1);
}

const assets = manifest.pages[chatKey];

// ── Вимірюємо gzip (level 9) кожного ассету ─────────────────
const COL_FILE = 58;
const COL_SIZE = 9;

console.log('');
console.log('[bundle-budget] Роут: ' + chatKey);
console.log('─'.repeat(COL_FILE + COL_SIZE + 3));

let total = 0;
for (const asset of assets) {
  const filePath = join(ROOT, 'apps/teen/.next', asset);
  if (!existsSync(filePath)) {
    console.error('[bundle-budget] ПОМИЛКА: файл не знайдено: ' + asset);
    process.exit(1);
  }
  const raw = readFileSync(filePath);
  const gz = gzipSync(raw, { level: 9 }).length;
  total += gz;
  // Таблиця: назва файлу → gz-розмір
  console.log(asset.padEnd(COL_FILE) + ' ' + String(gz).padStart(COL_SIZE) + ' B');
}

console.log('─'.repeat(COL_FILE + COL_SIZE + 3));

// ── Підсумкова таблиця ───────────────────────────────────────
const deltaVsCap = total - capBytes;
const deltaVsBaseline = baseline !== null ? total - baseline : null;
const pctVsBaseline =
  baseline !== null ? (((total - baseline) / baseline) * 100).toFixed(1) : 'н/д';

console.log('');
console.log('  Сума gz (level 9) : ' + total.toLocaleString() + ' B');
console.log('  Ліміт (capBytes)  : ' + capBytes.toLocaleString() + ' B');
console.log(
  '  Дельта до ліміту  : ' + (deltaVsCap >= 0 ? '+' : '') + deltaVsCap.toLocaleString() + ' B',
);

if (baseline !== null) {
  console.log('  Базлайн           : ' + baseline.toLocaleString() + ' B');
  console.log(
    '  Дельта до базлайну: ' +
      (deltaVsBaseline >= 0 ? '+' : '') +
      deltaVsBaseline.toLocaleString() +
      ' B  (' +
      pctVsBaseline +
      '%)',
  );
} else {
  console.log('  Базлайн           : не встановлено (перший прогін)');
}

console.log('');

// ── Перевірки ────────────────────────────────────────────────
let failed = false;

// Жорсткий ліміт
if (total > capBytes) {
  console.error(
    '[bundle-budget] FAIL: сума ' +
      total +
      ' B > ліміт ' +
      capBytes +
      ' B (' +
      (capBytes / 1024).toFixed(0) +
      ' kB gz)',
  );
  failed = true;
}

// Дрейф від базлайну > +5%
if (baseline !== null && total > baseline * 1.05) {
  console.error(
    '[bundle-budget] FAIL: дрейф +' +
      pctVsBaseline +
      '% від базлайну ' +
      baseline +
      ' B (поріг: +5%). Перевір нові залежності або оновлюй базлайн окремим комітом.',
  );
  failed = true;
}

// Попередження: усадка > -5% (можна оновити базлайн)
if (!failed && baseline !== null && total < baseline * 0.95) {
  console.warn(
    '[bundle-budget] ПОПЕРЕДЖЕННЯ: бандл зменшився на ' +
      Math.abs(Number(pctVsBaseline)) +
      '% від базлайну. Розглянь оновлення базлайну:\n' +
      '  node scripts/check-bundle-budget.mjs --update-baseline',
  );
}

// ── --update-baseline ────────────────────────────────────────
if (UPDATE_BASELINE) {
  budget.chat.gzipBytes = total;
  writeFileSync(BUDGET_PATH, JSON.stringify(budget, null, 2) + '\n');
  console.log('[bundle-budget] Базлайн оновлено: ' + total + ' B → ' + BUDGET_PATH);
  console.log('  Закомітуй apps/teen/bundle-budget.json окремим комітом із поясненням у PR.');
}

if (failed) {
  process.exit(1);
}

console.log('[bundle-budget] OK — бюджет витримано.');
