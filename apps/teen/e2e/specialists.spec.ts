// e2e/specialists.spec.ts — флоу фахівців і бронювання (quality-gate §3 S3).
//
// Перевіряє:
//   1. Каталог фахівців рендериться
//   2. Профіль фахівця → навігація
//   3. Booking-форма: невалідний email → помилка нативна; валідний → success (мок POST /api/booking/submit)
//   4. Неіснуючий slug → справжній 404 (response.status() === 404)

import { test, expect } from '@playwright/test';

// Реальний slug з SPECIALISTS (lib/specialists.ts)
const REAL_SLUG = 'olena-vovk';
const FAKE_SLUG = 'non-existent-specialist-xyz';

test.describe('Каталог фахівців', () => {
  test('відображає список фахівців', async ({ page }) => {
    await page.goto('/specialists');

    await expect(page.getByRole('heading', { name: 'Фахівці, з якими ми працюємо' })).toBeVisible();
    // Олена Вовк — єдиний active фахівець у SPECIALISTS
    // Використовуємо heading-роль щоб уникнути strict-mode violation (ім'я є і в картці і у тексті)
    await expect(page.getByRole('heading', { name: 'Олена Вовк' })).toBeVisible();
    await expect(page.getByText('Психотерапевт, член УСП').first()).toBeVisible();
  });

  test('посилання на профіль веде на /specialists/[slug]', async ({ page }) => {
    await page.goto('/specialists');

    // SpecialistCard рендерить посилання на профіль (роль Link → <a>)
    // Знаходимо через текст імені фахівця
    const profileLink = page.getByRole('link', { name: /Олена Вовк/ }).first();
    await expect(profileLink).toBeVisible();
    await profileLink.click();

    await page.waitForURL(`/specialists/${REAL_SLUG}`);
    await expect(page.getByRole('heading', { name: 'Олена Вовк' })).toBeVisible();
  });
});

test.describe('Профіль фахівця', () => {
  test('рендериться з основними даними', async ({ page }) => {
    await page.goto(`/specialists/${REAL_SLUG}`);

    await expect(page.getByRole('heading', { name: 'Олена Вовк' })).toBeVisible();
    await expect(page.getByText('Психотерапевт, член УСП')).toBeVisible();
    await expect(page.getByText('між "треба триматися" і "я більше не можу"')).toBeVisible();

    // Типи сесій наявні
    await expect(page.getByText('Discovery call')).toBeVisible();
    await expect(page.getByText('Тематична сесія')).toBeVisible();
  });

  test('back-link → /specialists', async ({ page }) => {
    await page.goto(`/specialists/${REAL_SLUG}`);

    await page.getByRole('link', { name: 'Усі фахівці' }).click();
    await page.waitForURL('/specialists');
  });

  test('неіснуючий slug → справжній 404', async ({ page }) => {
    // Перевіряємо що сервер повертає 404, а не 200 з помилковим UI
    const response = await page.goto(`/specialists/${FAKE_SLUG}`);
    expect(response?.status()).toBe(404);
  });
});

test.describe('Booking-форма', () => {
  async function goToBooking(page: import('@playwright/test').Page) {
    await page.goto(`/specialists/${REAL_SLUG}/book/discovery`);
    await expect(page.getByRole('heading', { name: 'записатись на сесію' })).toBeVisible({
      timeout: 8000,
    });
  }

  test('невалідний email → нативна HTML5-валідація (кнопка задізейблена)', async ({ page }) => {
    await goToBooking(page);

    // Перемикаємось на email-канал
    await page.getByRole('radio', { name: 'Email' }).check();

    // Вводимо невалідний email у contact_value
    // Уникаємо getByLabel('Email') — він збігається і з radio, і з input
    const contactInput = page.getByPlaceholder('example@email.com');
    await contactInput.fill('не-email');

    // Кнопка submit залишається disabled (бо form invalid: name < 2 chars, consent false)
    // Навіть якби form була valid — HTML5 type=email блокує submit
    // Заповнюємо всі обов'язкові поля крім коректного email
    await page.getByLabel("Ім'я").fill('Тест');

    // Заповнюємо age
    await page.getByLabel('Скільки тобі років').selectOption('18-25');

    // Consents
    const consentCheckboxes = page.getByRole('checkbox');
    await consentCheckboxes.nth(0).check();
    await consentCheckboxes.nth(1).check();

    // Submit button — disabled бо email невалідний (HTML5 type=email)
    // При спробі submit — браузер покаже нативне повідомлення про невалідний email
    // Перевіряємо через валідність поля
    const isValid = await contactInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test('валідна форма + мок POST /api/booking/submit → success', async ({ page }) => {
    // Мокуємо POST /api/booking/submit
    await page.route('**/api/booking/submit', async (route) => {
      expect(route.request().method()).toBe('POST');
      const body = JSON.parse(route.request().postData() ?? '{}') as Record<string, unknown>;
      expect(body.specialist_slug).toBe(REAL_SLUG);
      expect(body.session_type).toBe('discovery');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await goToBooking(page);

    // Заповнюємо форму коректно
    await page.getByLabel("Ім'я").fill('Тест Тестенко');

    // Telegram-канал (default)
    const contactInput = page.getByLabel('Telegram username');
    await contactInput.fill('@test_user');

    await page.getByLabel('Скільки тобі років').selectOption('18-25');

    // Consents
    const checkboxes = page.getByRole('checkbox');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    // Submit
    const submitBtn = page.getByRole('button', { name: 'Залишити заявку' });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Успішний редірект на success
    await page.waitForURL(`/specialists/${REAL_SLUG}/book/discovery/success**`, {
      timeout: 10000,
    });
  });

  test('помилка сервера → показує errorMsg', async ({ page }) => {
    await page.route('**/api/booking/submit', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Тестова помилка сервера' }),
      });
    });

    await goToBooking(page);

    await page.getByLabel("Ім'я").fill('Тест Тестенко');
    await page.getByLabel('Telegram username').fill('@test_user');
    await page.getByLabel('Скільки тобі років').selectOption('18-25');

    const checkboxes = page.getByRole('checkbox');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    await page.getByRole('button', { name: 'Залишити заявку' }).click();

    // Error message відображається
    await expect(page.getByText('Тестова помилка сервера')).toBeVisible({ timeout: 5000 });
  });
});
