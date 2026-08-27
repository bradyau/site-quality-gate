import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import config from '../site-quality.config.json' with { type: 'json' };

const reportDirectory = resolve('reports/performance');

function reportName(route) {
  return route === '/' ? 'home' : route.replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9]+/gi, '-');
}

for (const route of config.routes) {
  test(`${route} stays within performance budgets`, async ({ page }) => {
    await page.addInitScript(() => {
      window.__qualityMetrics = {
        cumulativeLayoutShift: 0,
        largestContentfulPaintMs: 0
      };

      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries.at(-1);
        if (lastEntry) {
          window.__qualityMetrics.largestContentfulPaintMs = lastEntry.startTime;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__qualityMetrics.cumulativeLayoutShift += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    const response = await page.goto(route, { waitUntil: 'networkidle' });
    expect(response?.ok()).toBe(true);
    await page.waitForTimeout(500);

    const metrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const navigation = performance.getEntriesByType('navigation');
      const transferBytes = [...navigation, ...resources]
        .reduce((total, entry) => total + (entry.transferSize || 0), 0);

      return {
        cumulativeLayoutShift: window.__qualityMetrics.cumulativeLayoutShift,
        domNodes: document.getElementsByTagName('*').length,
        largestContentfulPaintMs: window.__qualityMetrics.largestContentfulPaintMs,
        requests: navigation.length + resources.length,
        transferBytes
      };
    });

    mkdirSync(reportDirectory, { recursive: true });
    writeFileSync(
      resolve(reportDirectory, `${reportName(route)}.json`),
      `${JSON.stringify({ route, metrics, budgets: config.performanceBudgets }, null, 2)}\n`
    );

    expect(metrics.largestContentfulPaintMs).toBeGreaterThan(0);
    expect(metrics.largestContentfulPaintMs).toBeLessThanOrEqual(config.performanceBudgets.largestContentfulPaintMs);
    expect(metrics.cumulativeLayoutShift).toBeLessThanOrEqual(config.performanceBudgets.cumulativeLayoutShift);
    expect(metrics.requests).toBeLessThanOrEqual(config.performanceBudgets.requests);
    expect(metrics.transferBytes).toBeLessThanOrEqual(config.performanceBudgets.transferBytes);
    expect(metrics.domNodes).toBeLessThanOrEqual(config.performanceBudgets.domNodes);
  });
}
