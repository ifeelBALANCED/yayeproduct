// parseModeLabel.ts — витягує mode-лейбл з першого рядка відповіді AI.
//
// Системний промт змушує модель починати відповідь тегом виду [0N · НАЗВА],
// наприклад: [01 · ПІДТРИМУЮ], [02 · ПОРУЧ], [03 · ОБЕРЕЖНО], [04 · ПАУЗА].
// (docs/system-prompt-canonical.md §4.1–4.4)
//
// Якщо тег відсутній — фолбек на DEFAULT_MODE_LABEL.

export const DEFAULT_MODE_LABEL = '[01 · підтримую]';

// Регекс відповідає тегу [0N · СЛОВО] на початку рядка (case-insensitive).
// Захоплює весь тег включно з дужками.
const MODE_LABEL_RE = /^\[0[1-4]\s*·\s*[^\]]+\]/i;

/**
 * Витягує mode-лейбл з тексту відповіді AI.
 * @returns знайдений лейбл (у нижньому регістрі) або DEFAULT_MODE_LABEL.
 */
export function parseModeLabel(responseText: string): string {
  const trimmed = responseText.trimStart();
  const match = MODE_LABEL_RE.exec(trimmed);
  if (match?.[0]) {
    return match[0].toLowerCase();
  }
  return DEFAULT_MODE_LABEL;
}

/**
 * Видаляє mode-лейбл з початку тексту відповіді (щоб не рендерити двічі).
 */
export function stripModeLabel(responseText: string): string {
  const trimmed = responseText.trimStart();
  return trimmed.replace(MODE_LABEL_RE, '').trimStart();
}
