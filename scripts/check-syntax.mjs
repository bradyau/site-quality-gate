import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const ignoredDirectories = new Set(['.git', 'node_modules', 'reports']);
const scriptExtensions = new Set(['.cjs', '.js', '.mjs']);

function findScripts(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return ignoredDirectories.has(entry) ? [] : findScripts(path);
    }
    return scriptExtensions.has(extname(entry)) ? [path] : [];
  });
}

const scripts = findScripts(root);
for (const script of scripts) {
  execFileSync(process.execPath, ['--check', script], { stdio: 'pipe' });
}

const displayPaths = scripts.map((path) => relative(root, path).split(sep).join('/'));
console.log(`JavaScript syntax checks passed for ${displayPaths.length} files.`);
