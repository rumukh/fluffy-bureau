# Vendored AEGIS SDK

The game installs the AEGIS SDK (`@aegis/core`, `@aegis/runtime`, `@aegis/narrative`,
`@aegis/browser`) from a complete, pinned tarball set produced by the engine's
`npm run pack:sdk`. There are no registry packages, source aliases, workspace links or
deep imports into an engine checkout.

Previous sets: `0abd61b5a679` (public `main`, PR #16) and `711ec456e242` (E), both replaced on 2026-10-08.

| Directory | Engine revision | Source | Verification |
|---|---|---|---|
| `17ed4bebd329/` | `17ed4bebd329994d41aba3077926f080a15cc790` (E's branch `rumukh-fluffy-bureau-engine-extensions`; stage, animation, `puppet.onSpeech`, incremental claim ledgers) | artifact set delivered by E | E: full engine gate (2,588 tests) and `test:consumer` passed; G verified `artifacts.json` and tarball SHA-256 against E's message, then ran `npm run verify` |

`artifacts.json` in each directory records the version string, every tarball's SHA-256
and npm integrity, and the build inputs digest. `package-lock.json` pins the same integrity.

## Updating the pinned engine

1. Clone or update the engine **outside** this repository, e.g.
   `%USERPROFILE%\.copilot\cache\aegis-engine`, and check out the wanted commit
   (latest `main`, or a revision that workstream E delivered).
2. In the engine checkout:
   ```powershell
   npm ci
   npm run pack:sdk -- --revision <full-40-char-sha> --out <new empty dir>
   npm run test:consumer -- --artifacts <that dir>
   ```
   If E delivers a prepared set instead, verify its `artifacts.json` digests against the
   tarballs (`Get-FileHash -Algorithm SHA256`) and against the digest E sent.
3. Copy the four `.tgz` files and `artifacts.json` into `vendor/aegis/<first-12-of-sha>/`.
4. From the repository root, install **all four in one call**:
   ```powershell
   $v = 'vendor/aegis/<dir>'
   npm install --save-exact (Get-ChildItem $v -Filter *.tgz | % { "./$v/$($_.Name)" })
   ```
5. Run `npm run verify`. Save and content compatibility are governed by the game's own
   `stateVersion`/content revisions, not by the SDK version (see `docs/architecture/`).
6. Remove the superseded directory in the same commit and update the table above.
