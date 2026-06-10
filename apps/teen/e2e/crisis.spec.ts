// e2e/crisis.spec.ts — кризовий флоу (quality-gate §3 S3).
//
// Перевіряє:
//   1. Тригер повідомлення → {type:'crisis'} → CrisisModal з hotlines
//   2. Grounding 5-4-3-2-1 проходиться до кінця
//   3. Post-crisis стан стрічки (повернення до розмови)
//   4. Back-link з /crisis повертає у сесію (НЕ /chat — це пофікшено,
//      але поточний crisis/page.tsx:29 має href="/chat". Тест документує
//      БАЖАНУ поведінку (повернення у сесію). Якщо back-link ще не виправлено,
//      тест FAIL і це коректно — він ловить реальний баг.)
//
// CAVEAT: back-link тест написаний проти ПРАВИЛЬНОЇ поведінки (/crisis → сесія).
// crisis/page.tsx:29 наразі містить href="/chat" (неіснуючий маршрут).
// Тест помічено як фіксація бажаної поведінки.

import { test, expect } from '@playwright/test';
import {
  mockSessions,
  mockMessages,
  mockChat,
  FIXTURE_CRISIS,
  FIXTURE_CHAT_SIMPLE,
} from './helpers/sse';

const SESSION_ID = 'aabbccdd-0000-1111-2222-333344445555';

async function goToChat(page: import('@playwright/test').Page) {
  const sid = await mockSessions(page, SESSION_ID);
  await mockMessages(page);
  await page.goto(`/${sid}`);
  await expect(page.getByText('розкажи, як ти зараз?')).toBeVisible({ timeout: 8000 });
  return sid;
}

test.describe('Кризовий флоу', () => {
  test('тригер → {type:crisis} → CrisisModal з hotlines', async ({ page }) => {
    await goToChat(page);
    await mockChat(page, FIXTURE_CRISIS);

    await page.getByRole('textbox', { name: 'напиши тут...' }).fill('мені дуже погано');
    await page.getByRole('button', { name: 'надіслати' }).click();

    // CrisisModal відкрився — перевіряємо aria-label
    await expect(page.getByRole('dialog', { name: 'Кризова підтримка' })).toBeVisible({
      timeout: 10000,
    });

    // Модалка містить hotlines (текст з UA_HOTLINES у chat page)
    await expect(page.getByText('дитяча лінія довіри')).toBeVisible();
    await expect(page.getByText('116 111')).toBeVisible();

    // Кнопка "повернутись до розмови" наявна
    await expect(page.getByRole('button', { name: 'повернутись до розмови' })).toBeVisible();
  });

  test('кнопка grounding у CrisisModal закриває модалку і входить у post-crisis', async ({
    page,
  }) => {
    // CrisisModal.onGrounding() — закриває модалку і встановлює postCrisisMode=true.
    // Grounding54321 НЕ відкривається всередині модалки — він з'являється у стрічці
    // після того як юзер натисне кнопку пропозиції вправи (postCrisisExercise=true).
    await goToChat(page);
    await mockChat(page, FIXTURE_CRISIS);

    await page.getByRole('textbox', { name: 'напиши тут...' }).fill('хочу зникнути');
    await page.getByRole('button', { name: 'надіслати' }).click();

    await expect(page.getByRole('dialog', { name: 'Кризова підтримка' })).toBeVisible({
      timeout: 10000,
    });

    // Натискаємо "вправа заземлення 5-4-3-2-1" у модалці → onGrounding()
    await page.getByRole('button', { name: 'вправа заземлення 5-4-3-2-1' }).click();

    // Модалка закрилась (onGrounding закриває modal і встановлює postCrisisMode)
    await expect(page.getByRole('dialog', { name: 'Кризова підтримка' })).not.toBeVisible({
      timeout: 3000,
    });

    // postCrisisMode=true — chat є активним (юзер повернувся до розмови)
    // Textarea знову доступна
    await expect(page.getByRole('textbox', { name: 'напиши тут...' })).toBeEnabled();
  });

  test('post-crisis стан стрічки — пропозиція вправи після закриття модалки', async ({ page }) => {
    await goToChat(page);
    await mockChat(page, FIXTURE_CRISIS);

    await page.getByRole('textbox', { name: 'напиши тут...' }).fill('мені зараз дуже важко');
    await page.getByRole('button', { name: 'надіслати' }).click();

    await expect(page.getByRole('dialog', { name: 'Кризова підтримка' })).toBeVisible({
      timeout: 10000,
    });

    // Закриваємо модалку через "повернутись до розмови"
    await page.getByRole('button', { name: 'повернутись до розмови' }).click();

    // Модалка зникла
    await expect(page.getByRole('dialog', { name: 'Кризова підтримка' })).not.toBeVisible();

    // Post-crisis повідомлення з'явились у стрічці
    await expect(page.getByText('ти повернувся. я тут.')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/є вправа заземлення/)).toBeVisible();

    // Кнопка пропозиції вправи наявна
    await expect(page.getByText('заземлення · 5-4-3-2-1')).toBeVisible();
  });

  test('grounding у post-crisis стрічці проходиться і додає фінальний бабл', async ({ page }) => {
    await goToChat(page);
    await mockChat(page, FIXTURE_CRISIS);

    await page.getByRole('textbox', { name: 'напиши тут...' }).fill('важко');
    await page.getByRole('button', { name: 'надіслати' }).click();

    await expect(page.getByRole('dialog', { name: 'Кризова підтримка' })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole('button', { name: 'повернутись до розмови' }).click();

    // Відкриваємо grounding у стрічці
    await page.getByText('заземлення · 5-4-3-2-1').click();

    await expect(page.getByText('назви 5 речей, які ти зараз бачиш')).toBeVisible({
      timeout: 5000,
    });

    // Проходимо 5 кроків
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: /далі|завершити/ }).click();
    }

    // "ти тут." — завершення грандингу
    await expect(page.getByText('ти тут.')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'повернутись' }).click();

    // Після повернення — фінальний AI-бабл
    await expect(page.getByText('ти тут. як зараз?')).toBeVisible({ timeout: 5000 });
  });

  test('back-link з /crisis?sessionId= повертає у сесію', async ({ page }) => {
    // crisis/page.tsx читає sessionId з query-параметра через useSearchParams().
    // SOS inline-посилання у chat/[sessionId]/page.tsx:564 передає
    // href={`/crisis?sessionId=${sessionId}`} — тому back-link коректно веде назад у сесію.
    // SOS у header layout.tsx:18 — без sessionId, back-link веде на '/'.
    //
    // Тест перевіряє: /crisis?sessionId=... → back-link href = /${sessionId}.

    await mockMessages(page);
    // Переходимо напряму на /crisis з sessionId у query-параметрі
    await page.goto(`/crisis?sessionId=${SESSION_ID}`);
    await expect(page.getByText('підтримка зараз')).toBeVisible({ timeout: 5000 });

    const backLink = page.getByRole('link', { name: 'назад' });
    await expect(backLink).toBeVisible();

    const href = await backLink.getAttribute('href');
    // Бажана поведінка: href містить sessionId (back до сесії)
    expect(href).toContain(SESSION_ID);
  });

  test('back-link з /crisis (без sessionId) → веде на головну', async ({ page }) => {
    // Коли SOS натиснутий з header layout (без sessionId у URL) — back-link → '/'
    await page.goto('/crisis');
    await expect(page.getByText('підтримка зараз')).toBeVisible({ timeout: 5000 });

    const backLink = page.getByRole('link', { name: 'назад' });
    await expect(backLink).toBeVisible();

    const href = await backLink.getAttribute('href');
    expect(href).toBe('/');
  });

  test('/crisis рендериться без крашу і показує hotlines', async ({ page }) => {
    await page.goto('/crisis');

    // Заголовок присутній
    await expect(page.getByText('підтримка зараз')).toBeVisible();

    // Hotlines з method-пакету відображаються
    await expect(page.getByText('живі люди готові слухати')).toBeVisible();

    // Grounding-вправа доступна
    await expect(page.getByText('вправа 5-4-3-2-1')).toBeVisible();
  });
});
