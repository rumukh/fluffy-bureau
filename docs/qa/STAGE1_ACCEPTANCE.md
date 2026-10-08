# Stage 1 acceptance report

**Compiled by:** workstream G, 2026-10-08. **Scope:** prologue «Первый день стажёра» and case 1
«Пирог, которого не было», levels 1–3 (T01). **Build:** `rumukh-fluffy-game-runtime`, AEGIS SDK
`17ed4bebd329` (E's artifact set with the 2D stage), content from C (`rumukh-fluffy-content-and-logic`, eb6b971), art and audio from A
(`rumukh-fluffy-art-and-audio`, e403de8: 1,253 assets with provenance, 531 voice lines with mouth cues,
12 music loops, 30 sound effects).

## Verdict

| Area | Status |
|---|---|
| Logic, rules, saves, offline, privacy, accessibility (automated) | **Technically ready** — evidence below |
| Narration (recorded voices) | **Integrated** — every child-facing line and label has a recording; PM voice approval (Q30) is A's/PM's |
| Art, music, sound effects | **Integrated** — A's backgrounds, characters, avatar with runtime scarf tint, prop layers per level, music with warm comfort variants, SFX |
| Animated puppets and lip-sync | **Integrated** — E's stage with A's rigs; lip-sync from cue tracks, asserted in Chromium |
| Cutscenes with the avatar (T25) | **Integrated** — C's 11 documents (intro, P3 letter, shed, oven and reward per level) with A's staging kit, on E's player |
| Human playtest with a child (Q44, T15) | **Pending the family** — protocol: `docs/qa/T15_PLAYTEST_PROTOCOL_RU.md` |
| Physical iPad / Android tablet | **Pending the family** — only Chromium and WebKit automation on Windows so far |

Stage 1 is therefore **not accepted** under Q44: it is technically complete with content, art and voices, and
blocked only on the human checks above.

## How to reproduce

```powershell
npm ci
npx playwright install chromium webkit
npm run verify          # content check, typecheck, lint, unit tests, release build, E2E (both browsers)
npm run preview         # http://127.0.0.1:4320/ — local static preview of apps/game/dist
```

Last full run (2026-10-08, Windows, Node 25.6.0): content check 0 errors; **58 unit tests** passed
(game-core rules and scenario traces, game-session, C's content tools); release build OK; **34 E2E tests**
passed (17 Chromium + 17 WebKit, serial, 12.1 min).

## 1. Brief checklist (TZ section 15), per variant

| # | Item | Prologue | L1 | L2 | L3 | Evidence |
|---|---|---|---|---|---|---|
| 1 | Sentences ≤ 10 words; everything voiced | ✅ | ✅ | ✅ | ✅ | C validator: max 8 words; 531/531 lines recorded by A and registered with the narration service |
| 2 | Clues lead to exactly one solution; red herrings explained | ✅ | ✅ | ✅ | ✅ | C validator (own solver + `validateDeduction`); `scenarios.test.ts` |
| 3 | A wrong version is not a loss | ✅ | ✅ | ✅ | ✅ | traces submit every wrong value: each explained, rewards unchanged |
| 4 | No timers, ads, purchases, scary scenes | ✅ | ✅ | ✅ | ✅ | no timer code paths; no network/payments; content review by C |
| 5 | Exactly 3 facts, ≤ 3 glossary words | n/a | ✅ | ✅ | ✅ | C validator; traces assert 3 facts |
| 6 | Culprit confesses and helps | n/a | ✅ | ✅ | ✅ | content (C1-7, C1-8); played in E2E |
| 7 | Comfort lamp and autosave work | ✅ | ✅ | ✅ | ✅ | `a11y-saves.spec.ts`; checkpoint after every command |
| 8 | Name and avatar used | ✅ | ✅ | ✅ | ✅ | `{имя}` in text, «пушинка» in voice (C/A); avatar with tinted scarf in every scene (static until E) |

## 2. Q44 observable signs

| Sign | Automated proxy | Human status |
|---|---|---|
| 1. Understands what to do after the prologue | prologue teaches one mechanic at a time; HUD buttons appear only after their tutorial | **pending T15** |
| 2. Keeps the notebook (or uses «Помоги заполнить») | help proposes, never places (unit + traces) | **pending T15** |
| 3. Understands a wrong version and is not upset | every wrong value has an explanation line | **pending T15** |
| 4. Same place, same notebook after closing mid-minigame, offline | `offline.spec.ts` (both browsers), reload test, restore at every node | **pending T15 on a real tablet** |

## 3. Logic

- Each variant has exactly one solution after the required clues (C's report: candidates 3/27/64/100 →
  1; aegis `validateDeduction` agrees).
- `packages/game-core/test/scenarios.test.ts`, driven by C's packs through the real runtime:
  - solution path for prologue, L1, L2, L3 (rewards 5 + 10/15/20 buttons, 3 facts, ≥ 3 glossary words,
    heart for comforting Тёпа, basket placed in the office);
  - **every wrong version**: one submission per wrong value (L1 6, L2 9, L3 11 wrong values); each
    produced an explanation, the case continued, rewards unchanged;
  - wrong minigame answers first (cocoa, tracks + question, scent question, baker too much/too little);
  - hint exhaustion: klubok and shell asked at every hub until only `review` remains; klubok never
    spends on review; notebook help used at every hub and every suggestion accepted;
  - replaying a level grants no second rewards; restarting with another difficulty keeps the profile.
- Hints follow D03 (shell exact on L1, vague on L2, absent on L3; three klubki; help suggests on L1–L2,
  points on L3) — data from C, behaviour in `rules.ts`.

## 4. Save and resume

| Requirement | Evidence |
|---|---|
| Restore at every node gives the identical view and state hash | traces: save/restore after every action of each variant (> 50 nodes each, > 5 mid-minigame) |
| Close mid-minigame → same place, same notebook | unit (`session.test.ts`), browser reload (`a11y-saves.spec.ts`), cold start offline after closing the browser mid-«Лупа» (`offline.spec.ts`) |
| Four profiles isolated; delete/reset one leaves the others | `session.test.ts` |
| A second tab cannot silently overwrite | Web Lock per profile + IndexedDB CAS: `session.test.ts` (CAS conflict), `a11y-saves.spec.ts` (second window blocked, «Играть здесь» takes over, first window blocks) |
| Corrupt record → recovery, not a new game | `session.test.ts` (previous copy restored) |
| Content update keeps progress | `session.test.ts` (migration to start of the same scene) |
| Backup export/import | `session.test.ts`; parent-corner UI |

## 5. Accessibility

| Requirement | Evidence | Gap |
|---|---|---|
| Complete play without sound | every line is on screen as text; E2E playthroughs never depend on audio (headless, no audio output) | listening check pending T15 |
| Keyboard only | prologue + L1 completed using only Tab and Enter (Chromium, WebKit) | — |
| Touch only | L2 and L3 completed with emulated touch taps (both browsers) | physical touch pending T15 |
| 200 % text | text 44 px, no horizontal overflow, every visible button ≥ 48 px, prologue completed at 200 % | — |
| Readable font (T09) | Andika applied | — |
| Reduced motion | follows system by default; calm option; zero running animations asserted | — |
| Comfort lamp | warm overlay, pressed state; comfort line when the pack has one (D24) | — |
| Pause everywhere | HUD pause on every game screen; runtime pause + narration + stage stop | — |
| At most 3 primary choices | menus paged by 3 («Ещё варианты»); C validates every reachable state | — |
| Sound-equivalent clues (T19) | Stage 1 has no sound-only clues | applies from case 3 |
| Screen reader | not required (Q10); native buttons and labels used | not reviewed |

## 6. Narration and animation

| Requirement | Status |
|---|---|
| Narration for every child-facing line and label (Q29) | ✅ A's 531 recordings: auto-play, stop on advance, replay, ear buttons, optional reading of choices; music crossfades to warm variants under the lamp |
| Lip-sync on every spoken line | ✅ for characters on stage: `puppet.speak` binds A's cue track (converted to `aegis-cues/1`) to the narration clock; `stage.spec.ts` asserts `cues:synchronized` in Chromium. WebKit-Windows has no audio output in Playwright, so it shows the honest `unheard` neutral mouth. Narrator lines have no mouth. |
| Cutscenes including the player's avatar (T25) | ✅ `{t:'cutscene'}` steps block until committed completed/skipped; effects are separate steps, so skip/replay/restore never re-grant; markers persisted and used to restart after restore (E's policy). `cutscene.spec.ts` (Chromium + WebKit, C's real documents): the wordless intro plays first and binds **no** avatar; the P3 letter cutscene binds the avatar, captions every line and waits for «Дальше», pause, «Смотреть сначала», «Пропустить ролик», reload mid-cutscene resumes from the marker with rewards granted once, reduced motion completes. The keyboard playthrough watches every cutscene of the prologue and case 1 level 1 to the end (intro, P3, shed, oven, reward). |

## 7. Offline and privacy

| Requirement | Evidence |
|---|---|
| Install, then cold start with the network blocked | `offline.spec.ts`: auto-install of `shell`, `prologue`, `case01` packs; browser closed; server stopped; offline relaunch resumes mid-minigame and completes the prologue (Chromium, WebKit) |
| No outbound requests | keyboard playthrough and offline run record zero non-local requests; CSP `connect-src 'self'` |
| No telemetry, links, debug globals | no analytics code; parent corner has no links (asserted); `window` has no game/aegis globals (asserted); `assertChildSafeView` on every release render |
| Update does not restart an active case (Q43) | worker never skips waiting; new build takes over next launch; saves migrate | **not exercised end-to-end yet** |

## 8. Performance (T02: 60 fps target, 30 fps floor)

Animated scene with A's art (office background, three illustrated characters, bubbles, speaking motion),
1280×800, 3 s of `requestAnimationFrame` sampling; «Дальше» latency to the next line on screen.

| Browser | CPU | Mean fps | p95 frame | Worst frame | «Дальше» latency |
|---|---|---|---|---|---|
| Chromium (Windows) | 4× throttled (iPad 9 proxy) | 54.4 (WebGL stage, puppets breathing/blinking) | 33 ms | 133 ms | 198–224 ms |
| WebKit (Windows port, headless) | unthrottled | 21 (software rendering) | 49 ms | 64 ms | 321–378 ms |

With E's puppet stage Chromium stays near the 60 fps target with the CPU slowed 4× and is the asserted gate (≥ 30); with still images it measured 59–60. Playwright's
WebKit on Windows renders without GPU compositing and is recorded only. To get there with real art the
stage uses compositor-only motion (`will-change`), no box-shadow animation and three bubbles. The iPad
number remains **pending a physical check (T15)**; E's puppet animation will need re-measurement.

## 9. Browsers

Automated: Chromium (Windows) and WebKit (Playwright's Windows build). **Not tested:** Safari on iPadOS,
Chrome on Android tablets, Edge (Chromium-based, expected equivalent), Firefox (optional, T02).

## Known gaps and follow-ups

1. A's assets are integrated; three backgrounds share location `shed` and the runtime picks the
   interior — per-scene selection waits for E's stage or a content field.
2. T25 cutscenes are integrated; the stage releases backgrounds between scenes and uses a 128 MiB decoded-image budget (A repacked atlases to ~2 MiB).
3. Update flow and break reminder are implemented but not covered by E2E yet.
4. Stage directions (`dir`) reach the presenter with their text; the static presenter only renders bubbles.
5. Human playtest and device checks (T15), pie card bake (T10).
