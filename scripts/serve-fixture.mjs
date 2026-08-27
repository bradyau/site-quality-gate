import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './lib/config.mjs';

const fixtureRoot = fileURLToPath(new URL('../fixtures/site/', import.meta.url));
const config = loadConfig();
const port = Number(process.env.FIXTURE_PORT || config.fixturePort);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl, `http://127.0.0.1:${port}`);
  const decodedPath = decodeURIComponent(url.pathname);
  const relativePath = decodedPath.endsWith('/') ? `${decodedPath}index.html` : decodedPath;
  const normalizedPath = normalize(relativePath).replace(/^[/\\]+/, '');
  const candidate = join(fixtureRoot, normalizedPath);

  if (!candidate.startsWith(fixtureRoot)) {
    return null;
  }

  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate;
  }

  return null;
}

const server = createServer((request, response) => {
  const file = resolveRequestPath(request.url || '/');

  if (!file) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'Cache-Control': 'public, max-age=300',
    'Content-Type': contentTypes[extname(file)] || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff'
  });
  createReadStream(file).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Fixture site running at http://127.0.0.1:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
