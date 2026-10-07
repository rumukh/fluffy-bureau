// Read-only loopback static server for a built site: node scripts/preview.mjs [--dir dist] [--port 4320]
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { appRoot } from './site.mjs';

export const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
};

export function serveStatic(dir, { port, base = '/' }) {
  const root = resolve(dir);
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (!url.pathname.startsWith(base)) {
      response.writeHead(404).end();
      return;
    }
    let path = normalize(join(root, decodeURIComponent(url.pathname.slice(base.length))));
    if (!path.startsWith(root)) {
      response.writeHead(403).end();
      return;
    }
    if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
    if (!existsSync(path) || path.split(sep).includes('..')) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      'content-type': MIME[extname(path)] ?? 'application/octet-stream',
      'cache-control': 'no-cache',
      'x-content-type-options': 'nosniff',
    });
    createReadStream(path).pipe(response);
  });
  return new Promise((done) => server.listen(port, '127.0.0.1', () => done(server)));
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(appRoot, 'scripts', 'preview.mjs')) {
  const args = process.argv.slice(2);
  let dir = join(appRoot, 'dist');
  let port = 4320;
  let base = '/';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir') dir = args[++i];
    else if (args[i] === '--port') port = Number(args[++i]);
    else if (args[i] === '--base') base = args[++i];
    else throw new Error(`Unknown option ${args[i]}`);
  }
  await serveStatic(dir, { port, base });
  console.log(`Preview: http://127.0.0.1:${port}${base}`);
}
