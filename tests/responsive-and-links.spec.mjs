import { expect, test } from '@playwright/test';
import config from '../site-quality.config.json' with { type: 'json' };

for (const route of config.routes) {
  for (const viewport of config.viewports) {
    test(`${route} has no horizontal overflow at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const response = await page.goto(route, { waitUntil: 'networkidle' });
      expect(response?.ok()).toBe(true);
      const dimensions = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth
      }));
      expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
    });
  }

  test(`${route} has healthy same-origin links`, async ({ page, request, baseURL }) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    const links = await page.locator('a[href]').evaluateAll((anchors) =>
      [...new Set(anchors.map((anchor) => anchor.href))]
    );
    const origin = new URL(baseURL).origin;
    const internalLinks = links.filter((href) => {
      const url = new URL(href);
      return url.origin === origin && ['http:', 'https:'].includes(url.protocol);
    });

    for (const href of internalLinks) {
      const response = await request.get(href);
      expect(response.ok(), `${href} returned ${response.status()}`).toBe(true);
    }
  });
}

test('the first tab stop is a working skip link', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toHaveAttribute('href', /^#/);
  const targetSelector = await focused.getAttribute('href');
  await page.keyboard.press('Enter');
  await expect(page.locator(targetSelector)).toBeFocused();
});
