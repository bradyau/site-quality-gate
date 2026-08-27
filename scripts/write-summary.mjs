import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const reportsDirectory = resolve(root, 'reports');
mkdirSync(reportsDirectory, { recursive: true });

function readJson(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

const stepReport = readJson(join(reportsDirectory, 'steps.json'), { target: process.env.SITE_URL || 'unknown', steps: [] });
const overall = stepReport.steps.length > 0 && stepReport.steps.every((step) => step.status === 'pass') ? 'PASS' : 'FAIL';
const lines = [
  '# Site Quality Gate Report',
  '',
  `**Overall result:** ${overall}`,
  '',
  `**Target:** ${stepReport.target}`,
  '',
  '## Gate results',
  '',
  '| Gate | Result |',
  '| --- | --- |',
  ...stepReport.steps.map((step) => `| ${step.name} | ${step.status === 'pass' ? 'Pass' : 'Fail'} |`)
];

const accessibilityDirectory = join(reportsDirectory, 'accessibility');
if (existsSync(accessibilityDirectory)) {
  const reports = readdirSync(accessibilityDirectory)
    .filter((file) => file.endsWith('.json'))
    .map((file) => readJson(join(accessibilityDirectory, file)))
    .filter(Boolean);
  const violations = reports.reduce((total, report) => total + report.blockingViolations.length, 0);
  lines.push('', '## Accessibility', '', `${reports.length} route reports, ${violations} blocking violations.`);
}

const performanceDirectory = join(reportsDirectory, 'performance');
if (existsSync(performanceDirectory)) {
  const reports = readdirSync(performanceDirectory)
    .filter((file) => file.endsWith('.json'))
    .map((file) => readJson(join(performanceDirectory, file)))
    .filter(Boolean);
  if (reports.length > 0) {
    lines.push('', '## Performance budgets', '', '| Route | LCP ms | CLS | Requests | Transfer KB | DOM nodes |', '| --- | ---: | ---: | ---: | ---: | ---: |');
    for (const report of reports) {
      lines.push(`| ${report.route} | ${Math.round(report.metrics.largestContentfulPaintMs)} | ${report.metrics.cumulativeLayoutShift.toFixed(3)} | ${report.metrics.requests} | ${Math.round(report.metrics.transferBytes / 1024)} | ${report.metrics.domNodes} |`);
    }
  }
}

lines.push('', 'A passing automated gate is one release signal. Human review and accountable approval remain required.', '');
const summary = lines.join('\n');
const summaryPath = join(reportsDirectory, 'quality-summary.md');
writeFileSync(summaryPath, summary);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}

console.log(`Quality summary written to ${summaryPath}`);
