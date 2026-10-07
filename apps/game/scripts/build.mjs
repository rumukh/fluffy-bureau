// Release build: node scripts/build.mjs [--out <dir>] [--base /path/]
import { build } from 'esbuild';
import { rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { appRoot, assertFresh, bundleOptions, copyStatic, finalizeSite } from './site.mjs';

const args = process.argv.slice(2);
let out = join(appRoot, 'dist');
let base = '/';
let replace = true;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') {
    out = resolve(args[++i]);
    replace = false;
  } else if (args[i] === '--base') base = args[++i];
  else throw new Error(`Unknown option ${args[i]}`);
}
if (replace) rmSync(out, { recursive: true, force: true });
else assertFresh(out);
copyStatic(out);
const result = await build(
  bundleOptions(out, { minify: true, sourcemap: false, define: { FLUFFY_DEV: 'false' } }),
);
const forbidden = Object.keys(result.metafile.inputs).filter((path) =>
  /render-three|node_modules\/three\/|node:/.test(path),
);
if (forbidden.length) throw new Error('Forbidden imports in release bundle: ' + forbidden);
const site = await finalizeSite(out, { base, minify: true, channel: 'release' });
writeFileSync(
  join(out, 'build-report.json'),
  JSON.stringify(
    {
      format: 'fluffy-build/1',
      base,
      buildId: site.buildId,
      packs: site.packs.map((p) => ({ id: p.id, revision: p.revision, files: p.resources.length })),
      inputs: Object.keys(result.metafile.inputs).length,
    },
    null,
    1,
  ) + '\n',
);
console.log(
  `Built ${out} (build ${site.buildId}, packs: ${site.packs.map((p) => p.id).join(', ')})`,
);
