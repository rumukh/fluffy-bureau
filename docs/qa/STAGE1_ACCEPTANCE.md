# Stage 1 acceptance report

**Compiled by:** workstream G, 2026-10-08. **Scope:** prologue «Первый день стажёра» and case 1
«Пирог, которого не было», levels 1–3 (T01). **Build:** `rumukh-fluffy-game-runtime`, AEGIS SDK
`0abd61b5a679`, content from C (`rumukh-fluffy-content-and-logic`, eb6b971).

## Verdict

| Area | Status |
|---|---|
| Logic, rules, saves, offline, privacy, accessibility (automated) | **Technically ready** — evidence below |
| Narration (recorded voices) | **Pending A** — every line is narration-ready; no recordings shipped yet, the UI says «Без голоса: читай текст» |
| Art | **Pending A** — generated SVG placeholders behind the asset manifest |
| Animation, lip-sync, cutscenes with the avatar | **Pending E** — static presenter behind the `Presenter` adapter |
| Human playtest with a child (Q44, T15) | **Pending the family** — protocol: `docs/qa/T15_PLAYTEST_PROTOCOL_RU.md` |
| Physical iPad / Android tablet | **Pending the family** — only Chromium and WebKit automation on Windows so far |

Stage 1 is therefore **not accepted** under Q44: it is technically complete for the systems G owns and
blocked on voices, art, animation and the human checks above.

## How to reproduce

```powershell
npm ci
npx playwright install chromium webkit
npm run verify          # content check, typecheck, lint, unit tests, release build, E2E (both browsers)
npm run preview         # http://127.0.0.1:4320/ — local static preview of apps/game/dist
```

Last full run (2026-10-08, Windows, Node 25.6.0): content check 0 errors; **49 unit tests** passed
(game-core 15 incl. scenario traces, game-session 8, content tools 26); release build OK; **24 E2E tests**
passed (12 Chromium + 12 WebKit, serial, 6.4 min).

## 1. Brief checklist (TZ section 15), per variant

| # | Item | Prologue | L1 | L2 | L3 | Evidence |
|---|---|---|---|---|---|---|
| 1 | Sentences ≤ 10 words; everything voiced | ✅ text / ⏳ audio | ✅ / ⏳ | ✅ / ⏳ | ✅ / ⏳ | C validator: max 8 words, 531 manifest entries; recordings pending A |
| 2 | Clues lead to exactly one solution; red herrings explained | ✅ | ✅ | ✅ | ✅ | C validator (own solver + `validateDeduction`); `scenarios.test.ts` |
| 3 | A wrong version is not a loss | ✅ | ✅ | ✅ | ✅ | traces submit every wrong value: each explained, rewards unchanged |
| 4 | No timers, ads, purchases, scary scenes | ✅ | ✅ | ✅ | ✅ | no timer code paths; no network/payments; content review by C |
| 5 | Exactly 3 facts, ≤ 3 glossary words | n/a | ✅ | ✅ | ✅ | C validator; traces assert 3 facts |
| 6 | Culprit confesses and helps | n/a | ✅ | ✅ | ✅ | content (C1-7, C1-8); played in E2E |
| 7 | Comfort lamp and autosave work | ✅ | ✅ | ✅ | ✅ | `a11y-saves.spec.ts`; checkpoint after every command |
| 8 | Name and avatar used | ✅ | ✅ | ✅ | ✅ | `{имя}` substituted (unit test); avatar on stage in every scene (static) |

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
| Complete play without sound | all E2E playthroughs run with no audio files (text-only) | real-speaker check pending voices |
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
| Narration for every child-facing line and label (Q29) | runtime ready (`Voice`: auto-play, stop on advance, replay, ear buttons, optional reading of choices); **no recordings yet (A)** |
| Lip-sync on every spoken line | **pending E** (ANIM stack) and A (mouth cues) |
| Cutscenes including the player's avatar | **pending E**; avatar shown in every scene by the static presenter |

## 7. Offline and privacy

| Requirement | Evidence |
|---|---|
| Install, then cold start with the network blocked | `offline.spec.ts`: auto-install of `shell`, `prologue`, `case01` packs; browser closed; server stopped; offline relaunch resumes mid-minigame and completes the prologue (Chromium, WebKit) |
| No outbound requests | keyboard playthrough and offline run record zero non-local requests; CSP `connect-src 'self'` |
| No telemetry, links, debug globals | no analytics code; parent corner has no links (asserted); `window` has no game/aegis globals (asserted); `assertChildSafeView` on every release render |
| Update does not restart an active case (Q43) | worker never skips waiting; new build takes over next launch; saves migrate | **not exercised end-to-end yet** |

## 8. Performance (T02: 60 fps target, 30 fps floor)

Animated office scene (bubbles, breathing avatar, speaking character), 1280×800, 3 s of
`requestAnimationFrame` sampling; «Дальше» latency to the next line on screen.

| Browser | CPU | Mean fps | p95 frame | Worst frame | «Дальше» latency |
|---|---|---|---|---|---|
| Chromium (Windows) | 4× throttled (iPad 9 proxy) | 60.2 | 16.7 ms | 16.8 ms | 137–180 ms |
| WebKit (Windows port, headless) | unthrottled | 48.2 (39–57 across runs) | 34 ms | 49 ms | 181–265 ms |

Within target on Chromium; WebKit stays above the 30 fps floor but below 60. Playwright's WebKit on
Windows is not Safari on iPadOS, so the iPad number remains **pending a physical check (T15)**. Puppet
animation (E) will need re-measurement.

## 9. Browsers

Automated: Chromium (Windows) and WebKit (Playwright's Windows build). **Not tested:** Safari on iPadOS,
Chrome on Android tablets, Edge (Chromium-based, expected equivalent), Firefox (optional, T02).

## Known gaps and follow-ups

1. Voices and mouth cues (A), art and asset manifest (A): the build already copies `assets/manifest.json`
   files into their offline packs and fails on missing provenance.
2. Puppets, lip-sync and cutscenes (E): swap `StaticPresenter` for E's stage behind `Presenter`.
3. Update flow and break reminder are implemented but not covered by E2E yet.
4. Stage directions (`dir`) reach the presenter with their text; the static presenter only renders bubbles.
5. Human playtest and device checks (T15), pie card bake (T10).
