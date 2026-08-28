import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('./check-repository.mjs', import.meta.url));
const fixtureRoot = mkdtempSync(join(tmpdir(), 'site quality gate '));
const fixtureScripts = join(fixtureRoot, 'scripts');
const fixtureCheck = join(fixtureScripts, 'check-repository.mjs');

function runFixture() {
  return spawnSync(process.execPath, [fixtureCheck], {
    cwd: fixtureRoot,
    encoding: 'utf8'
  });
}

try {
  mkdirSync(fixtureScripts, { recursive: true });
  copyFileSync(source, fixtureCheck);
  writeFileSync(join(fixtureRoot, 'README.md'), '# Clean fixture\n');

  const cleanResult = runFixture();
  assert.equal(cleanResult.status, 0, cleanResult.stderr);

  const generatedMarker = ['generated', 'by'].join('-');
  const localPath = ['file:', '///', 'Us', 'ers/example/private.txt'].join('');
  writeFileSync(join(fixtureScripts, 'residue-probe.txt'), `${generatedMarker}\n${localPath}\n`);

  const residueResult = runFixture();
  assert.notEqual(residueResult.status, 0, 'Repository residue outside documentation must fail the check.');
  assert.match(residueResult.stderr, /scripts\/residue-probe\.txt/);

  console.log('Repository hygiene self-test passed, including a path containing spaces.');
} finally {
  rmSync(fixtureRoot, { force: true, recursive: true });
}
