// Shared static-site assembly for the dev server and the release build.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const repoRoot = resolve(appRoot, '..', '..');

const FONT_FILES = [
  ['nunito', 'nunito-cyrillic-400-normal.woff2'],
  ['nunito', 'nunito-latin-400-normal.woff2'],
  ['nunito', 'nunito-cyrillic-800-normal.woff2'],
  ['nunito', 'nunito-latin-800-normal.woff2'],
  ['andika', 'andika-cyrillic-400-normal.woff2'],
  ['andika', 'andika-latin-400-normal.woff2'],
  ['andika', 'andika-cyrillic-700-normal.woff2'],
  ['andika', 'andika-latin-700-normal.woff2'],
];

const KINDS = {
  html: 'shell',
  js: 'script',
  css: 'style',
  svg: 'image',
  webp: 'image',
  png: 'image',
  woff2: 'font',
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  json: 'data',
  webmanifest: 'data',
  txt: 'data',
};

export function validateBase(base) {
  if (!/^\/(?:[a-zA-Z0-9_.-]+\/)*$/.test(base))
    throw new Error('Base must be an absolute directory path such as / or /fluffy/.');
  return base;
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

/** Copy static inputs (HTML, CSS, fonts, licences, content and asset packs) into `out`. */
export function copyStatic(out) {
  mkdirSync(out, { recursive: true });
  cpSync(join(appRoot, 'public'), out, { recursive: true });
  const fonts = join(out, 'fonts');
  mkdirSync(fonts, { recursive: true });
  for (const [family, file] of FONT_FILES) {
    cpSync(join(repoRoot, 'node_modules', '@fontsource', family, 'files', file), join(fonts, file));
  }
  cpSync(
    join(repoRoot, 'node_modules', '@fontsource', 'nunito', 'LICENSE'),
    join(out, 'licenses', 'Nunito-OFL.txt'),
  );
  cpSync(
    join(repoRoot, 'node_modules', '@fontsource', 'andika', 'LICENSE'),
    join(out, 'licenses', 'Andika-OFL.txt'),
  );
  for (const name of ['core', 'runtime', 'narrative', 'browser']) {
    cpSync(
      join(repoRoot, 'node_modules', '@aegis', name, 'LICENSE'),
      join(out, 'licenses', `aegis-${name}-MIT.txt`),
    );
  }
}

export const bundleOptions = (out, extra = {}) => ({
  absWorkingDir: repoRoot,
  entryPoints: { app: join(appRoot, 'src', 'main.ts') },
  outdir: out,
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: ['es2022', 'safari16.4'],
  metafile: true,
  legalComments: 'none',
  ...extra,
});

/** Offline pack membership: files under `packs/<id>/` form pack `<id>`, everything else `shell`. */
export function packOf(path) {
  const match = /^packs\/([a-z0-9-]+)\//.exec(path);
  return match ? match[1] : 'shell';
}

export function resourceGraphs(out, base) {
  const graphs = new Map();
  for (const file of walk(out)) {
    const path = relative(out, file).split(sep).join('/');
    if (path.startsWith('offline/') || path === 'worker.js' || path === 'build-report.json')
      continue;
    const data = readFileSync(file);
    const extension = path.split('.').pop() ?? '';
    const pack = packOf(path);
    const resources = graphs.get(pack) ?? [];
    resources.push({
      id: 'r-' + createHash('sha256').update(path).digest('hex').slice(0, 24),
      src: base + path,
      sha256: createHash('sha256').update(data).digest('hex'),
      bytes: data.length,
      kind: KINDS[extension] ?? 'data',
    });
    graphs.set(pack, resources);
  }
  return [...graphs.entries()]
    .sort(([a], [b]) => (a === 'shell' ? -1 : b === 'shell' ? 1 : a.localeCompare(b)))
    .map(([id, resources]) => {
      resources.sort((a, b) => a.src.localeCompare(b.src));
      const revision = createHash('sha256')
        .update(JSON.stringify(resources))
        .digest('hex')
        .slice(0, 24);
      return { id, revision, resources };
    });
}

export async function buildWorker(out, packs, minify) {
  await build({
    absWorkingDir: repoRoot,
    stdin: {
      resolveDir: appRoot,
      sourcefile: 'worker.ts',
      loader: 'ts',
      contents: `import { OfflinePackStore } from '@aegis/browser/offline';
import { attachOfflineWorker } from '@aegis/browser/offline/worker';
declare const self: ServiceWorkerGlobalScope;
const store = new OfflinePackStore({ namespace: 'fluffy-bureau', baseUrl: self.registration.scope });
attachOfflineWorker(self, store, {
  packs: ${JSON.stringify(packs.map(({ id, revision }) => ({ id, revision })))},
  shell: 'index.html',
  onError() {
    void self.clients.matchAll().then((clients) => {
      for (const client of clients) client.postMessage({ type: 'fluffy-offline-error' });
    });
  },
});`,
    },
    outfile: join(out, 'worker.js'),
    bundle: true,
    platform: 'browser',
    format: 'esm',
    target: ['es2022', 'safari16.4'],
    minify,
  });
}

/**
 * Finalise a site directory: substitute the build identity into index.html, emit one
 * resource graph per offline pack, and bundle the service worker that pins them.
 */
export async function finalizeSite(out, { base, minify, channel }) {
  validateBase(base);
  const indexPath = join(out, 'index.html');
  const template = readFileSync(indexPath, 'utf8');
  const provisional = resourceGraphs(out, base);
  const buildId = createHash('sha256')
    .update(JSON.stringify(provisional.map((pack) => [pack.id, pack.revision])))
    .digest('hex')
    .slice(0, 16);
  writeFileSync(
    indexPath,
    template
      .replaceAll('%BASE%', base)
      .replaceAll('%BUILD_ID%', buildId)
      .replaceAll('%CHANNEL%', channel),
  );
  const packs = resourceGraphs(out, base);
  mkdirSync(join(out, 'offline'), { recursive: true });
  for (const pack of packs) {
    writeFileSync(join(out, 'offline', `${pack.id}.json`), JSON.stringify(pack, null, 1) + '\n');
  }
  writeFileSync(
    join(out, 'offline', 'index.json'),
    JSON.stringify(
      {
        format: 'fluffy-offline-index/1',
        buildId,
        packs: packs.map(({ id, revision, resources }) => ({
          id,
          revision,
          bytes: resources.reduce((sum, item) => sum + item.bytes, 0),
          files: resources.length,
        })),
      },
      null,
      1,
    ) + '\n',
  );
  await buildWorker(out, packs, minify);
  return { buildId, packs };
}

export function assertFresh(out) {
  if (existsSync(out)) throw new Error(`Refusing to overwrite existing output: ${out}`);
}
