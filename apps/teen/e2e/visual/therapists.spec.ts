// e2e/visual/therapists.spec.ts — S4 visual regression для Therapists app.
// quality-gate §3 S4: dashboard + referral detail
//
// CAVEAT: apps/therapists запускається на окремому порту (не :3000).
// Playwright webServer у playwright.config.ts запускає тільки apps/teen.
// Fix-forward: додати webServer entry для therapists (port 3002) або
// запускати через окремий playwright.config у apps/therapists.

import { test } from '@playwright/test';

const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 800 },
] as const;

for (const vp of VIEWPORTS) {
  test.describe(`Therapists · ${vp.name}px`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      locale: 'uk-UA',
      colorScheme: 'light',
      contextOptions: { reducedMotion: 'reduce' },
    });

    test(`therapists dashboard · ${vp.name}px`, async () => {
      test.fixme(
        true,
        'apps/therapists не в зоні поточного webServer (port 3000 = teen). ' +
          'Fix-forward: додати webServer entry для port 3002 у playwright.config.ts.',
      );
    });

    test(`therapists referral detail · ${vp.name}px`, async () => {
      test.fixme(true, 'Той самий caveat — therapists app поза поточним harness.');
    });
  });
}
