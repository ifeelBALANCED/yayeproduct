// useFocusTrap.ts — локальний хук для WCAG 2.1.2 focus-trap.
// Використовується тільки в CrisisModal.
// Споживач один — хук винесено у lib/ за правилом компонентного файлу.

import { useEffect, type RefObject } from 'react';

// Селектор усіх інтерактивних елементів, що можуть отримувати фокус
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Встановлює focus-trap всередині containerRef:
 *  - при mount: фокус переходить на перший focusable-елемент;
 *  - Tab / Shift+Tab циклюються всередині контейнера;
 *  - при unmount: фокус повертається на елемент, що був активний до відкриття.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Зберігаємо елемент, що мав фокус до відкриття модалки
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Фокусуємо перший focusable-елемент
    const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();

    function getFocusable(): HTMLElement[] {
      return Array.from(container!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.closest('[hidden]') && el.offsetParent !== null,
      );
    }

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key !== 'Tab') return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;

      if (e.shiftKey) {
        // Shift+Tab: якщо фокус на першому — перескакуємо на останній
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: якщо фокус на останньому — перескакуємо на перший
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Повертаємо фокус після закриття
      previouslyFocused?.focus();
    };
  }, [containerRef]);
}
