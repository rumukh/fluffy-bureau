// Release build: node scripts/build.mjs [--out <dir>] [--base /path/]
import { build } from 'esbuild';
import { rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  appRoot,
  assertFresh,
  bundleOptions,
  copyStatic,
  finalizeSite,
  writeAssets,
  writeContent,
} from './site.mjs';

const args = process.argv.slice(2);
let out = join(appRoot, 'dist');
let base = '/';
let replace = true;
let allowFixture = false;
let testCutscene = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') {
    out = resolve(args[++i]);
    replace = false;
  } else if (args[i] === '--base') base = args[++i];
  else if (args[i] === '--fixture-content') allowFixture = true;
  else if (args[i] === '--test-cutscene') testCutscene = true;
  else throw new Error(`Unknown option ${args[i]}`);
}
if (replace) rmSync(out, { recursive: true, force: true });
else assertFresh(out);
copyStatic(out);
const content = await writeContent(out, { allowFixture, testCutscene });
writeAssets(out);
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
      content: content.map((c) => ({ id: c.id, revision: c.revision })),
      inputs: Object.keys(result.metafile.inputs).length,
    },
    null,
    1,
  ) + '\n',
);
console.log(
  `Built ${out} (build ${site.buildId}, packs: ${site.packs.map((p) => p.id).join(', ')})`,
);
