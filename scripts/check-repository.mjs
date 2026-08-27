import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const root = new URL('../', import.meta.url);
const rootPath = root.pathname;
const textExtensions = new Set(['.cjs', '.css', '.html', '.js', '.json', '.md', '.mjs', '.txt', '.yml', '.yaml']);
const ignoredDirectories = new Set(['.git', '.lighthouseci', 'node_modules', 'reports']);

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return ignoredDirectories.has(entry) ? [] : walk(path);
    }
    return [relative(rootPath, path).split(sep).join('/')];
  });
}

function repositoryFiles() {
  if (existsSync(join(rootPath, '.git'))) {
    return execFileSync('git', ['ls-files'], { cwd: rootPath, encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);
  }
  return walk(rootPath);
}

const files = repositoryFiles();
const failures = [];
const blockedBasenames = new Set(['.DS_Store', '.env']);
const publicCopyRoots = ['README.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md', 'RELEASE.md', '.github/', 'fixtures/', 'tests/'];
const blockedToolNames = [
  ['chat', 'gpt'].join(''),
  ['co', 'dex'].join(''),
  ['clau', 'de'].join(''),
  ['gem', 'ini'].join('')
];
const patterns = [
  { label: 'assistant or model product name', expression: new RegExp(`\\b(?:${blockedToolNames.join('|')})\\b`, 'i') },
  { label: 'generated-by marker', expression: /generated[- ]by/i },
  { label: 'co-author tag', expression: /co-authored-by:/i },
  { label: 'private conversation reference', expression: /\b(?:private chat|chat transcript|prompt log)\b/i },
  { label: 'local absolute path', expression: /(?:\/Users\/|[A-Z]:\\Users\\)/ },
  { label: 'file URL', expression: /file:\/\//i },
  { label: 'GitHub credential', expression: /(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}/ },
  { label: 'private key', expression: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ }
];

for (const file of files) {
  const basename = file.split('/').at(-1);
  if (blockedBasenames.has(basename) || file.endsWith('.log')) {
    failures.push(`${file}: development artifact is not allowed`);
  }

  if (!textExtensions.has(extname(file)) || file === 'scripts/check-repository.mjs') {
    continue;
  }

  const content = readFileSync(join(rootPath, file), 'utf8');
  if (file.endsWith('.md') && content.includes('\u2014')) {
    failures.push(`${file}: em dash character is not allowed in public documentation`);
  }

  if (publicCopyRoots.some((path) => file === path || file.startsWith(path))) {
    for (const pattern of patterns) {
      if (pattern.expression.test(content)) {
        failures.push(`${file}: ${pattern.label}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error('Repository hygiene checks failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Repository hygiene checks passed for ${files.length} files.`);
}
