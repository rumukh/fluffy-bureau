# Workspace conventions

Owner: workstream G. Applies to every workstream working in `rumukh/fluffy-bureau`.

## Toolchain

- Node 25.6, npm 11.8, npm workspaces (`packages/*`, `apps/*`). One root `package-lock.json`.
- TypeScript 5.9 strict, ES modules, `moduleResolution: Bundler`, `noEmit` everywhere.
  Packages export **TypeScript source** (`"exports": {".": "./src/index.ts"}`); esbuild
  (app) and Vitest (tests) consume it directly. There is no per-package build step.
  Relative imports may use `.ts` or `.js` extensions (`allowImportingTsExtensions` is on, so
  Node 25 type stripping can run tools directly: `node tools/content/build.ts`).
- Lint: ESLint 10 + typescript-eslint; format: Prettier (single quotes, width 100, LF).
  Prettier ignores `*.md`, `content/`, `assets/`, `docs/pm/`, `vendor/`.
- Unit tests: Vitest 4, Node environment. Picked up from `packages/*/test/**/*.test.ts`,
  `apps/*/test/**/*.test.ts` and `tools/*/test/**/*.test.ts`.
- Browser tests: Playwright 1.64 (`e2e/`), Chromium and WebKit, against the static build.

## Commands (repository root)

| Command | Purpose |
|---|---|
| `npm ci` | Install exactly the lockfile, including the vendored AEGIS tarballs |
| `npm run typecheck` | `tsc` over all packages, apps, tools, tests |
| `npm run lint` | ESLint + Prettier check |
| `npm test` | Vitest unit tests |
| `npm run dev` | Dev server with rebuild on change: http://127.0.0.1:4321/ |
| `npm run build` | Static release build to `apps/game/dist` (`-- --out <dir> --base /sub/path/`) |
| `npm run preview` | Read-only loopback server for `apps/game/dist`: http://127.0.0.1:4320/ |
| `npm run test:e2e` | Playwright (needs `npm run build` first; `npx playwright install chromium webkit` once) |
| `npm run verify` | All of the above in order |
| `npm run build:pages` | Release build for GitHub Pages, base `/fluffy-bureau/` |
| `npm run test:e2e:pages` | Pages, smoke, offline and update specs served under `/fluffy-bureau/` (after `build:pages`) |
| `npx playwright test` with `FLUFFY_E2E_BASE=/sub/` | Any spec under a sub-path; `FLUFFY_E2E_PORT` moves the preview port for parallel runs |

## Ownership and where things go

| Path | Owner | Notes |
|---|---|---|
| root config, `package.json`, lockfile, `tsconfig*`, lint/format/test config | G | Others add dependencies only to their own workspace: `npm install -w @fluffy/content <pkg>` |
| `apps/game` (`@fluffy/game`) | G | Browser app, build scripts, PWA shell |
| `packages/game-*` (`@fluffy/game-core`, …) | G | DOM-free authoritative rules (deterministic: no `Date`, `Math.random`, DOM) |
| `vendor/aegis/` | G | Pinned SDK sets (see `vendor/aegis/README.md`) |
| `e2e/`, `docs/architecture/`, `docs/qa/` | G | |
| `content/`, `packages/content` (`@fluffy/content`), `tools/content/`, `docs/content/` | C | Authored sources, compiled packs, validators |
| `assets/`, `tools/assets/`, `docs/art/`, `docs/audio/` | A | Optimized runtime files + manifest + provenance |

`@aegis/*` packages are root dependencies; any workspace may import their public entry
points (never `dist/` paths). Do not redeclare them in workspace `package.json` files.

## How content and assets reach the build

The release build is an offline PWA made of **incremental offline packs**. Every file under
`dist/packs/<packId>/` belongs to pack `<packId>`; everything else is the `shell` pack.
Each pack gets its own digest-checked resource graph (`dist/offline/<packId>.json`).

- **Content (C):** `@fluffy/content` exports typed compiled packs (`shared`, `prologue`,
  `case01-l1`, `case01-l2`, `case01-l3`, later cases). The build writes each to
  `dist/packs/<offline pack>/content/<contentPackId>.json`. Offline packs:
  `shell` (shared), `prologue`, `case01` (all three levels), later `case02`…
- **Assets (A):** `assets/manifest.json` lists every runtime file with `id`, `path`
  (relative to `assets/`), `pack` (offline pack ID), dimensions/duration, format,
  provenance and licence. The build copies each to `dist/packs/<pack>/assets/<path>` (or the
  shell for `pack: "shell"`) and **fails** on missing files or missing provenance.
  Voice: `assets/voice/<speakerOrPack>/<lineId>.<hash>.mp3` + mouth cues, listed in the
  voice index per contract 5.4.

## Branches and PRs

Each workstream works on its own branch from `rumukh-game-feasibility-assessment` and opens
PRs against it. To use a sibling's unmerged work, fetch and merge its branch locally. Lockfile
conflicts: rebase/merge, then rerun `npm install` (never hand-edit the lockfile).

## Releases (T30)

The site https://rumukh.github.io/fluffy-bureau/ is published by `.github/workflows/pages.yml`
**only** for a pushed `v*` tag (v0.1.0 = Stage 1, v0.2.0 = Stage 2, …) or a manual
`workflow_dispatch` run, never for ordinary pushes. The workflow validates content, runs the unit
tests and scenario traces, builds with `--base /fluffy-bureau/` and deploys through
`upload-pages-artifact` and `deploy-pages` (one deployment at a time). Only released packs
(`PACK_IDS`) are built. Every PR's CI also boots the Pages build under the sub-path
(`e2e/pages.spec.ts`: worker scope, manifest `start_url`/`scope`, icons, every pack URL, no request
outside the base).

The site is unlisted (Q43): `<meta name="robots" content="noindex, nofollow, noarchive">` on the page
does the work. The bundled `robots.txt` disallows everything, but crawlers only read it at the domain
root (`rumukh.github.io/robots.txt`, not ours), so it is a courtesy, not a guarantee.

Before tagging, locally: `npm run verify`, then `npm run build:pages && npm run test:e2e:pages`, and
`npm run preview -- --base /fluffy-bureau/` for a look at http://127.0.0.1:4320/fluffy-bureau/.
