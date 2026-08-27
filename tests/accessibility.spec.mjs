import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import config from '../site-quality.config.json' with { type: 'json' };

const reportDirectory = resolve('reports/accessibility');

function reportName(route) {
  return route === '/' ? 'home' : route.replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9]+/gi, '-');
}

for (const route of config.routes) {
  test(`${route} has no blocking accessibility violations`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: 'networkidle' });
    expect(response?.ok(), `Expected a successful response for ${route}`).toBe(true);
    await expect(page).toHaveTitle(/\S+/);
    await expect(page.locator('html')).toHaveAttribute('lang', /\S+/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S+/);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1:visible')).toHaveCount(1);

    const results = await new AxeBuilder({ page })
      .withTags(config.axeTags)
      .analyze();
    const blockingViolations = results.violations.filter((violation) =>
      config.blockedAxeImpacts.includes(violation.impact)
    );

    mkdirSync(reportDirectory, { recursive: true });
    writeFileSync(
      resolve(reportDirectory, `${reportName(route)}.json`),
      `${JSON.stringify({
        route,
        url: results.url,
        testedAt: results.timestamp,
        blockedImpacts: config.blockedAxeImpacts,
        blockingViolations,
        allViolations: results.violations
      }, null, 2)}\n`
    );

    expect(blockingViolations, JSON.stringify(blockingViolations, null, 2)).toEqual([]);
  });
}
