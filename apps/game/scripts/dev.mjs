// Development server: rebuilds on change and serves on loopback. node scripts/dev.mjs [--port 4321]
import { context } from 'esbuild';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  appRoot,
  bundleOptions,
  copyStatic,
  finalizeSite,
  writeAssets,
  writeContent,
} from './site.mjs';
import { serveStatic } from './preview.mjs';

const args = process.argv.slice(2);
const port = args[0] === '--port' ? Number(args[1]) : 4321;
const out = join(appRoot, 'out', 'dev');
rmSync(out, { recursive: true, force: true });
copyStatic(out);
const ctx = await context(
  bundleOptions(out, {
    sourcemap: 'inline',
    define: { FLUFFY_DEV: 'true' },
    plugins: [
      {
        name: 'refresh-site',
        setup(build) {
          build.onEnd(async (result) => {
            if (result.errors.length) return;
            copyStatic(out);
            await writeContent(out, { allowFixture: true });
            writeAssets(out);
            await finalizeSite(out, { base: '/', minify: false, channel: 'dev' });
            console.log('rebuilt');
          });
        },
      },
    ],
  }),
);
await ctx.watch();
await serveStatic(out, { port });
console.log(`Dev server: http://127.0.0.1:${port}/`);
