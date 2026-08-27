import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const configPath = fileURLToPath(new URL('../../site-quality.config.json', import.meta.url));

export function loadConfig() {
  return JSON.parse(readFileSync(configPath, 'utf8'));
}

export function validateConfig(config) {
  const errors = [];

  if (!Number.isInteger(config.fixturePort) || config.fixturePort < 1 || config.fixturePort > 65535) {
    errors.push('fixturePort must be an integer between 1 and 65535.');
  }

  if (!Array.isArray(config.routes) || config.routes.length === 0) {
    errors.push('routes must contain at least one path.');
  } else {
    const uniqueRoutes = new Set();
    for (const route of config.routes) {
      if (typeof route !== 'string' || !route.startsWith('/') || route.startsWith('//')) {
        errors.push(`Route must be a same-origin path beginning with one slash: ${String(route)}`);
      }
      if (uniqueRoutes.has(route)) {
        errors.push(`Duplicate route: ${route}`);
      }
      uniqueRoutes.add(route);
    }
  }

  const allowedImpacts = new Set(['minor', 'moderate', 'serious', 'critical']);
  if (!Array.isArray(config.blockedAxeImpacts) || config.blockedAxeImpacts.length === 0) {
    errors.push('blockedAxeImpacts must contain at least one axe impact level.');
  } else {
    for (const impact of config.blockedAxeImpacts) {
      if (!allowedImpacts.has(impact)) {
        errors.push(`Unsupported axe impact level: ${impact}`);
      }
    }
  }

  const budgets = config.performanceBudgets;
  for (const metric of ['largestContentfulPaintMs', 'cumulativeLayoutShift', 'requests', 'transferBytes', 'domNodes']) {
    const value = budgets?.[metric];
    if (typeof value !== 'number' || value < 0) {
      errors.push(`Performance budget ${metric} must be a non-negative number.`);
    }
  }

  if (!Array.isArray(config.viewports) || config.viewports.length === 0) {
    errors.push('viewports must contain at least one browser size.');
  } else {
    for (const viewport of config.viewports) {
      if (!viewport.name || !Number.isInteger(viewport.width) || !Number.isInteger(viewport.height)) {
        errors.push('Each viewport requires a name and integer width and height.');
      }
    }
  }

  return errors;
}
