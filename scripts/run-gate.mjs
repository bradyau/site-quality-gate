import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { loadConfig, validateConfig } from './lib/config.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = loadConfig();
const configErrors = validateConfig(config);

if (configErrors.length > 0) {
  console.error(configErrors.join('\n'));
  process.exit(1);
}

const urlArgumentIndex = process.argv.indexOf('--url');
const argumentUrl = urlArgumentIndex >= 0 ? process.argv[urlArgumentIndex + 1] : null;
if (urlArgumentIndex >= 0 && !argumentUrl) {
  console.error('--url requires an absolute http or https URL.');
  process.exit(1);
}

let baseUrl;
try {
  const fixturePort = Number(process.env.FIXTURE_PORT || config.fixturePort);
  baseUrl = new URL(argumentUrl || process.env.SITE_URL || `http://127.0.0.1:${fixturePort}`);
} catch {
  console.error('The target must be an absolute http or https URL.');
  process.exit(1);
}

if (!['http:', 'https:'].includes(baseUrl.protocol)) {
  console.error('The target must use http or https.');
  process.exit(1);
}

rmSync(resolve(root, 'reports'), { force: true, recursive: true });
mkdirSync(resolve(root, 'reports'), { recursive: true });

const environment = {
  ...process.env,
  SITE_URL: baseUrl.toString().replace(/\/$/, '')
};
let server = null;

async function waitForTarget(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // The local fixture may still be starting.
    }
    await delay(100);
  }
  throw new Error(`Target did not become ready: ${url}`);
}

if (!argumentUrl && !process.env.SITE_URL) {
  server = spawn(process.execPath, ['scripts/serve-fixture.mjs'], {
    cwd: root,
    env: environment,
    stdio: ['ignore', 'inherit', 'inherit']
  });
}

const steps = [
  { name: 'JavaScript syntax', command: process.execPath, arguments: ['scripts/check-syntax.mjs'] },
  { name: 'Repository hygiene', command: process.execPath, arguments: ['scripts/check-repository.mjs'] },
  { name: 'Configuration validation', command: process.execPath, arguments: ['scripts/validate-config.mjs'] },
  { name: 'Browser, accessibility, and performance', command: process.platform === 'win32' ? 'npx.cmd' : 'npx', arguments: ['playwright', 'test'] }
];
const results = [];

try {
  await waitForTarget(new URL(config.routes[0], baseUrl).toString());

  for (const step of steps) {
    console.log(`\n== ${step.name} ==`);
    const result = spawnSync(step.command, step.arguments, {
      cwd: root,
      env: environment,
      stdio: 'inherit'
    });
    results.push({
      name: step.name,
      status: result.status === 0 ? 'pass' : 'fail',
      exitCode: result.status ?? 1
    });
  }
} catch (error) {
  console.error(error.message);
  results.push({ name: 'Target availability', status: 'fail', exitCode: 1 });
} finally {
  if (server) {
    server.kill('SIGTERM');
  }
}

writeFileSync(resolve(root, 'reports/steps.json'), `${JSON.stringify({ target: baseUrl.toString(), steps: results }, null, 2)}\n`);
const summary = spawnSync(process.execPath, ['scripts/write-summary.mjs'], {
  cwd: root,
  env: environment,
  stdio: 'inherit'
});

const failed = results.some((result) => result.status !== 'pass') || summary.status !== 0;
process.exitCode = failed ? 1 : 0;
