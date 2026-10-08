# Stage 2 acceptance report

**Compiled by:** workstream G, 2026-10-08. **Scope:** T26 — cases 2–4 at three levels with their
new minigames, notebook pages, the family «Хранитель снов» (T31), the basic «Уютный денёк» (shop with
returns, decorations, tea party with residents' stories; T28, T29), ranks (D12), stage-direction
actions (U10) and the «нажми на окно» beat (U11). **Build:** `npm run build -- --production`
(PRODUCTION_PACK_IDS; the published site keeps only released packs until v0.2.0, T30). AEGIS SDK
`17ed4bebd329`; content from C (`rumukh-fluffy-content-stage2`); art and audio from A (Stage 1 set plus
the Stage 2 batches as they land).

## Verdict

| Area | Status |
|---|---|
| Rules, minigames, saves, privacy, accessibility (automated) | **Technically ready** — evidence below |
| Cases 2–4 content (C) | **Integrated** — 9 variants trace end to end |
| Case 2–4 art, voices, music (A) | **Partly pending** — runtime shows neutral placeholders and text for missing assets (C's `docs/content/ASSET_REQUESTS.md`); see gaps |
| Family mode with real players (T31) and child playtest (T15) | **Pending the family** |
| Physical iPad / Android tablet | **Pending the family** |

Stage 2 is **technically complete** in the runtime and **blocked** on A's remaining Stage 2 assets and
the human checks.

## How to reproduce

```powershell
npm ci
npx playwright install chromium webkit
npm run verify          # content, typecheck, lint, unit + traces, production build, E2E (both browsers)
npm run dev             # http://127.0.0.1:4321/ — dev build with the Stage 2 packs
```

## 1. Rules and scenario traces (unit, `packages/game-core/test`)

| Requirement | Evidence |
|---|---|
| Every Stage 2 variant completes | `scenarios-stage2.test.ts`: solution path for case02-l1 … case04-l3 (9 variants) with rewards, facts, glossary |
| Every wrong version and wrong answer is explained, never punitive | same file: wrong-first policy through every minigame and every wrong version |
| Hint exhaustion and notebook help never block | same file |
| Save/restore at every node and mid-minigame | same file: identical view and state hash after restore at every action, including inside each new minigame |
| Case N unlocks after case N−1 at any level (D02) | `isUnlocked`; traces start from one chosen level |
| Own light signal kept in the profile (D22) | case03-l3 trace asserts `signal` (3–5 symbols) |
| Ranks announced once, highest only (D12) | case02/case04 traces: «Помощник сыщика» / «Младший детектив» news once, then the rank in the wallet |
| Cipher poster page with the case's table (T26) | case02-l1 trace |
| Family dream keeper (T31): answers from card facts, every player gets a title | `scenarios-stage2.test.ts` family trace |
| Shop: buy, wear, return for the full price, «не хватает» never takes anything (T11, T29) | `cozy.test.ts` |
| Decorations from the shop on the five office slots, removed when returned | `cozy.test.ts` |
| Tea party: 2 hearts, the next untold story, then thanks (T28) | `cozy.test.ts` |
| Shop and tea only in the office, never during a case | `cozy.test.ts` |
| Stage 1 saves (v0.1.0) load without migration | `cozy.test.ts` (no Stage 2 fields → defaults) |
| U11 «нажми на окно» | case 1 traces tap `window`/`shed` before the close-up |

### New minigame kinds (`packages/game-core/src/minigames.ts`)

| Kind | Case | Move | Notes |
|---|---|---|---|
| `cipher` | 2 | `{option}` per slot | solved letters stay; shape + holes + colour name + letter (R01) |
| `postman` | 2 finale | `{street}`, `{house}` | house = sum of holes; level 3 street by shape icon |
| `sound-match` | 3 | `{option}` | samples by A's IDs; silent form from A's index (Q31); target never named |
| `light-signals` | 3 finale | `{symbol}`, `{erase}`, `{send}` | level 3 own signal (D22) |
| `read-blink` | 3 L3 | `{option}` | |
| `dream-keeper` | 4 | `{mode}`, `{value}` / family `{keeper}`, `{pick}`, `{ask}`, `{guess}` | solo with Пухлик; family 2–4 players |
| `equal-share` | 4 finale | `{add}`, `{remove}`, `{check}` | tap +/−, no drag-only, no timer |
| `compare` | 4 L3 | `{option}` | paged by `pageSize` like tracks |

## 2. Browser end-to-end (Chromium and WebKit)

| Requirement | Evidence |
|---|---|
| Case 2 level 1 keyboard only | `stage2.spec.ts` |
| Case 3 level 3 and case 4 level 2 with mouse / emulated touch | `stage2.spec.ts` (own signal composed in case 3 L3) |
| Family handoff privacy (T31) | `stage2.spec.ts`: on the others' screens the picked card's label text and image are **absent from the DOM**, not just hidden; narration stops on handoff |
| Cozy day: «не хватает», buy, wear, return (full price), tea story never auto-advances | `office.spec.ts` |
| U11 window tap and the live-stage background change | `office.spec.ts`: `bg.shed-exterior` → tap the glowing window → `bg.shed-window` on E's stage |
| U10 stage-direction actions acted on the live stage | `office.spec.ts` (`data-directed` > 0 after case 1) |
| Stage 1 regressions | the full Stage 1 suite runs on the production build (see `STAGE1_ACCEPTANCE.md`) |

## 3. Stage-direction actions (U10)

`dir.actions` (C's subset of E's cutscene ops: `pose`, `emote`, `sfx`, `effect`, `move`, `enter`,
`exit`) play on E's stage when the cursor reaches the direction and never block. Actors are the
scene's cast, `player` (the avatar) and `Scene.props` keys (props are spawned on their first
`enter`). After a reload only end states are applied (placement, entrances, exits); sounds,
particles and emotes are not replayed. Reduced motion turns movements into cuts and skips particles.
While fixing this, a Stage 1 defect was found and fixed: the live stage did not change backgrounds
inside a scene (`dir.background`), so the shed-window close-up only appeared with the static fallback.

## 4. Privacy and child safety

- Family mode: private card faces exist only on the Keeper's pick screen. Private lines
  (`line.private`) are never narrated outside it. Yes/no answers come from card facts, so the Keeper
  never has to answer (T31).
- The shop has no real money and nothing random (T29). Prices follow T11. «Не хватает» is a gentle
  line and nothing is taken.
- Still no telemetry, outbound requests or debug globals (Stage 1 checks run on the production build).

## Known gaps and follow-ups

1. **A's Stage 2 assets** are partly pending. Missing ones are shown as placeholders: dream cards
   show a neutral card with the text, missing voices show text with the «только текст» note, and
   unknown backgrounds use the location fallback. Count: C's `docs/content/ASSET_REQUESTS.md`.
2. **Scarf patterns** (shop) are owned, worn and returned in the rules, but the stage can't show
   them: the avatar rig has only a scarf tint. A pattern variant from A (or E support for a tinted
   pattern overlay) is needed. Hats are drawn (`acc.hat.*` in the avatar's hat slot).
3. Tea-party music (`tea-square`) uses the bakery celebration loop until A's loop lands.
4. Family mode needs a real family session (T15) to judge the handoff wording and timing.
5. Human playtest and device checks (T15) remain pending, as for Stage 1.
