// Shared static-site assembly for the dev server and the release build.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { importRhubarb } from '@aegis/browser/animation';
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

const CONTENT_PACKS_DIR = join(repoRoot, 'packages', 'content', 'packs');

/**
 * Content packs (rules, text) always ship in `shell`: they are small, and a profile must open
 * offline even when a later case's media pack is still downloading. Media stays per case.
 */
export function offlinePackForContent(id) {
  void id;
  return 'shell';
}

async function fixturePacks() {
  const result = await build({
    absWorkingDir: repoRoot,
    entryPoints: [join(repoRoot, 'packages', 'game-core', 'test', 'fixtures', 'mini-pack.ts')],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
  });
  const module = await import(
    'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
  );
  return [module.sharedPack, module.prologuePack];
}

/**
 * Writes compiled content packs (from @fluffy/content) into their offline packs plus
 * content/index.json. Without C's packs, llowFixture uses the rule-test fixture (dev only).
 */
export async function writeContent(out, { allowFixture, production = false }) {
  let packs;
  if (existsSync(CONTENT_PACKS_DIR)) {
    // Released packs (PACK_IDS) only, unless `production` adds the stage in production
    // (PRODUCTION_PACK_IDS; T30: unreleased cases never reach the published site). Preview packs never.
    const list = readFileSync(join(repoRoot, 'packages', 'content', 'src', 'packs.ts'), 'utf8');
    const listed = (name) =>
      JSON.parse(new RegExp(`\\b${name} = (\\[[^\\]]*\\])`).exec(list)?.[1] ?? '[]');
    const ids = [...listed('PACK_IDS'), ...(production ? listed('PRODUCTION_PACK_IDS') : [])];
    packs = readdirSync(CONTENT_PACKS_DIR)
      .filter((name) => ids.includes(name.replace(/\.json$/, '')))
      .map((name) => JSON.parse(readFileSync(join(CONTENT_PACKS_DIR, name), 'utf8')))
      .filter((pack) => pack.format === 'fluffy-content-pack');
  }
  if (!packs?.length) {
    if (!allowFixture) throw new Error('No content packs in packages/content/packs');
    packs = await fixturePacks();
  }
  const entries = [];
  for (const pack of packs.sort((a, b) => a.id.localeCompare(b.id))) {
    const offline = offlinePackForContent(pack.id);
    const path =
      offline === 'shell' ? `content/${pack.id}.json` : `packs/${offline}/content/${pack.id}.json`;
    mkdirSync(dirname(join(out, path)), { recursive: true });
    writeFileSync(join(out, path), JSON.stringify(pack));
    entries.push({ id: pack.id, revision: pack.revision, url: path, offlinePack: offline });
  }
  mkdirSync(join(out, 'content'), { recursive: true });
  writeFileSync(
    join(out, 'content', 'index.json'),
    JSON.stringify({ format: 'fluffy-content-index/1', packs: entries }, null, 1) + '\n',
  );
  return entries;
}

/** Copies A's runtime assets (assets/manifest.json) into their packs and writes assets/index.json. */
export function writeAssets(out) {
  const manifestPath = join(repoRoot, 'assets', 'manifest.json');
  const index = {
    format: 'fluffy-asset-index',
    assets: {},
    backgrounds: {},
    voice: {},
    characters: {},
    avatar: {},
    music: {},
    sfx: {},
    files: {},
    documents: {},
    soundClues: {},
  };
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    for (const asset of manifest.assets ?? []) {
      if (!asset.provenance || !asset.provenance.licence)
        throw new Error(`Asset ${asset.id} has no provenance/licence`);
      const source = join(repoRoot, 'assets', asset.path);
      if (!existsSync(source)) throw new Error(`Asset file missing: ${asset.path}`);
      const target =
        asset.pack === 'shell'
          ? `assets/${asset.path}`
          : `packs/${asset.pack}/assets/${asset.path}`;
      // A's Rhubarb cue files are only converted (below), never shipped: one bundle per pack instead.
      if (asset.kind !== 'cues') {
        mkdirSync(dirname(join(out, target)), { recursive: true });
        cpSync(source, join(out, target));
      }
      index.assets[asset.id] = {
        source,
        pack: asset.pack,
        url: target,
        kind: asset.kind,
        width: asset.width,
        height: asset.height,
      };
    }
    const url = (id, what) => {
      if (id === null || id === undefined) return null;
      const entry = index.assets[id];
      if (!entry) throw new Error(`${what} refers to unknown asset ${id}`);
      return entry.url;
    };
    for (const [id, bg] of Object.entries(manifest.backgrounds ?? {})) {
      index.backgrounds[id] = {
        location: bg.location,
        url: url(id, `background ${id}`),
        hotspots: bg.hotspots ?? {},
        layers: (bg.layers ?? []).map((layer) => ({
          ...layer,
          url: url(layer.asset, `layer of ${id}`),
        })),
      };
    }
    // Puppet documents: rig and atlas asset IDs plus the rig's own ID (E's stage loads them).
    const puppet = (entry, what) => {
      if (!entry.rig || !entry.atlas) return null;
      url(entry.rig, what);
      url(entry.atlas, what);
      url(entry.atlasImage, what);
      const rig = JSON.parse(readFileSync(join(out, index.assets[entry.rig].url), 'utf8'));
      const atlas = JSON.parse(readFileSync(join(out, index.assets[entry.atlas].url), 'utf8'));
      // Atlases name their image by file name; map it to the shipped asset.
      index.files[atlas.image] = index.assets[entry.atlasImage].url;
      return {
        rigId: rig.id,
        documents: [entry.atlas, entry.rig],
        // Accessory slots (hat, scarf pattern, …) the rig offers, for the shop's worn items.
        slots: Object.keys(rig.slots ?? {}),
      };
    };
    for (const [id, entry] of Object.entries(manifest.characters ?? {}))
      index.characters[id] = {
        base: url(entry.base, `character ${id}`),
        puppet: puppet(entry, `character ${id}`),
      };
    for (const [id, entry] of Object.entries(manifest.avatar ?? {}))
      index.avatar[id] = {
        base: url(entry.base, `avatar ${id}`),
        scarfMask: url(entry.scarfMask, `avatar ${id}`),
        puppet: puppet(entry, `avatar ${id}`),
      };
    // Mouth cues: A ships Rhubarb JSON; E's stage reads `aegis-cues/1`, converted here and bundled
    // per offline pack (one request per pack instead of one per line; the game serves each track
    // to the stage from memory).
    const bundles = new Map();
    for (const [id, entry] of Object.entries(manifest.voice ?? {})) {
      let bundle = null;
      if (entry.cues) {
        const cueAsset = index.assets[entry.cues];
        if (!cueAsset) throw new Error(`cues ${id} refers to unknown asset ${entry.cues}`);
        const rhubarb = JSON.parse(readFileSync(cueAsset.source, 'utf8'));
        const track = importRhubarb(rhubarb, {
          line: id,
          revision: String(entry.revision ?? 1),
          duration: (entry.durationMs ?? 0) / 1000 || undefined,
        });
        const pack = cueAsset.pack ?? 'shell';
        bundle =
          pack === 'shell'
            ? 'assets/voice/cues.bundle.json'
            : `packs/${pack}/assets/voice/cues.bundle.json`;
        if (!bundles.has(bundle)) bundles.set(bundle, {});
        bundles.get(bundle)[id] = track;
      }
      index.voice[id] = {
        url: url(entry.asset, `voice ${id}`),
        cues: bundle,
        durationMs: entry.durationMs ?? 0,
      };
    }
    for (const [path, tracks] of bundles) {
      mkdirSync(dirname(join(out, path)), { recursive: true });
      writeFileSync(join(out, path), JSON.stringify({ format: 'fluffy-cue-bundle/1', tracks }));
    }
    index.cueBundles = [...bundles.keys()].sort();
    // Converted: the Rhubarb sources are not part of the site.
    for (const [id, entry] of Object.entries(index.assets))
      if (entry.kind === 'cues') delete index.assets[id];
    // Animation documents by their own ID (rigs, atlases, clips), so cutscenes can load what they
    // name: rig -> its atlases, clip/atlas -> itself. Atlas images are mapped by file name.
    for (const asset of manifest.assets) {
      if (!asset.path.endsWith('.json') || asset.kind === 'cues' || asset.path.startsWith('voice/'))
        continue;
      let doc;
      try {
        doc = JSON.parse(readFileSync(join(out, index.assets[asset.id].url), 'utf8'));
      } catch {
        continue;
      }
      const format = typeof doc?.format === 'string' ? doc.format : '';
      if (!/^aegis-(rig|atlas|clip)\//.test(format) || typeof doc.id !== 'string') continue;
      index.documents[doc.id] = { asset: asset.id, format, atlases: doc.atlases ?? [] };
      if (format.startsWith('aegis-atlas/') && typeof doc.image === 'string') {
        const image = manifest.assets.find(
          (a) =>
            a.path === asset.path.replace(/[^/]+$/, doc.image) || a.path.endsWith(`/${doc.image}`),
        );
        if (image) index.files[doc.image] = index.assets[image.id].url;
      }
    }
    // Particle effects: E's stage draws particles from `atlas#frame`; A ships plain images, so
    // wrap each in a one-frame atlas.
    for (const [name, assetId] of [
      ['bubble', 'effect.bubble'],
      ['sparkle', 'effect.sparkle'],
    ]) {
      const asset = manifest.assets.find((a) => a.id === assetId);
      if (!asset) continue;
      const imageName = `fx-${name}${asset.path.slice(asset.path.lastIndexOf('.'))}`;
      index.files[imageName] = index.assets[assetId].url;
      const atlasPath = `assets/fx/fx.${name}.atlas.json`;
      mkdirSync(dirname(join(out, atlasPath)), { recursive: true });
      writeFileSync(
        join(out, atlasPath),
        JSON.stringify({
          format: 'aegis-atlas/1',
          id: `fx.${name}`,
          image: imageName,
          width: asset.width,
          height: asset.height,
          scale: 1,
          frames: { [name]: { x: 0, y: 0, w: asset.width, h: asset.height } },
        }),
      );
      index.assets[`fx.${name}.atlas`] = { url: atlasPath, kind: 'atlas' };
    }
    for (const kind of ['music', 'sfx'])
      for (const [name, id] of Object.entries(manifest[kind] ?? {}))
        index[kind][name] = url(id, `${kind} ${name}`);
    // Sound clues (Q31): A's index is the single source for the audio and its silent form. Each
    // sample plays as sound effect `clue.<id>`; the wave and icons come along for the silent card.
    const cluesPath = join(repoRoot, 'assets', 'sound-clues', 'index.json');
    if (existsSync(cluesPath)) {
      const clues = JSON.parse(readFileSync(cluesPath, 'utf8'));
      for (const [id, sample] of Object.entries(clues.samples ?? {})) {
        const audio = index.assets[`sound-clue.${id}`]?.url;
        if (!audio) continue;
        index.sfx[`clue.${id}`] = audio;
        index.soundClues[id] = {
          wave: index.assets[`sound-clue.${id}.wave`]?.url ?? null,
          night: Boolean(sample.night),
          icons: sample.icons ?? null,
          rhythm: sample.rhythm ?? null,
        };
      }
    }
  }
  // Build-only fields (local source paths) never reach the published index.
  for (const entry of Object.values(index.assets)) {
    delete entry.source;
    delete entry.pack;
  }
  mkdirSync(join(out, 'assets'), { recursive: true });
  writeFileSync(join(out, 'assets', 'index.json'), JSON.stringify(index) + '\n');
  return index;
}

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
const packs = ${JSON.stringify(packs.map(({ id, revision }) => ({ id, revision })))};
// The browser may fetch a newer worker.js on its own before the game has downloaded that build's
// packs. Refuse to install until the core packs (shell, prologue, case 1) are present, so the
// current build stays in charge; later cases install in the background.
const core = ['shell', 'prologue', 'case01'];
self.addEventListener('install', (event) => {
  event.waitUntil(
    store.list().then((installed) => {
      const missing = packs.filter((p) => core.includes(p.id) && !installed.some((i) => i.id === p.id && i.revision === p.revision));
      if (missing.length) throw new Error('Packs not installed: ' + missing.map((p) => p.id).join(', '));
    }),
  );
});
attachOfflineWorker(self, store, {
  packs,
  shell: 'index.html',
  // Media of a case still downloading streams from this same site while online (same-origin only;
  // other origins are refused by the handler).
  allowNetwork: true,
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
