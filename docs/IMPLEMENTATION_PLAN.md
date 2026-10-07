# Fluffy Bureau implementation plan

**Version:** 1.0, 2026-10-08  
**Coordinator:** session `1f4d26d8-9b2c-42d8-b7f1-bc4781eb8679`
("Game feasibility assessment", branch `rumukh-game-feasibility-assessment`)

## 1. Outcome and stage gate

Build «Пушистое бюро расследований» as a Russian-language, offline-installable
progressive web app on the AEGIS SDK. The players are a girl aged 8–9 playing
alone, and families of 2–4 sharing one device.

**Current target: Stage 1** (T01 in `docs/DECISIONS_RU.md`):

- the prologue «Первый день стажёра»;
- case 1 «Пирог, которого не было» at difficulty levels 1, 2 and 3;
- all Stage 1 systems listed in T01.

When Stage 1 is complete, every workstream reports to the coordinator and
stops. Stage 2 starts only after the user or PM says «дальше» (Q45).
Preparatory work for later stages is allowed: normalizing and validating cases
2–8, engine capabilities, and architecture for eight cases and family modes.
Producing art or voices for cases 2–8 is not.

## 2. Sources of truth, in priority order

1. `docs/pm/2026-10-07/PM_ANSWERS_RU.md`: PM answers Q01–Q48 and decisions
   D01–D25.
2. `docs/DECISIONS_RU.md`: team assumptions T01–T24 and required script
   corrections R01–R09.
3. `docs/pm/2026-10-07/SCRIPT_*.md` and `SCRIPT_INDEX_RU.md`: approved scripts
   (D01). Treat these as read-only. Corrections live in normalized content with a
   change log.
4. `docs/pm/TZ_ORIGINAL_RU.txt`: the original brief. Its instructions to an AI
   chat host ("work in stages in chat", "be the game host") are superseded by Q01.
5. `AEGIS_ENGINE_EXTENSION_SPEC.md` v1.3: the engine contract. Section 23 is the
   Fluffy Bureau delta.
6. Engine reality: `rumukh/aegis-engine` `main`, its `docs/api/*.md` and
   `docs/extension-acceptance.md`. Recheck the latest `main` before relying on it.

If sources conflict, follow the higher one. If no source covers a decision,
choose the conservative option consistent with the brief, record it (section 7)
and tell the coordinator. Never silently drop a requirement.

## 3. Engine baseline (verified 2026-10-08)

- `main` is `0abd61b5a679020bfb66bf4db24888df9e339d4d` (PR #16, merged
  2026-10-06).
- Spec v1.1 was implemented in commit `dea1d70`: `@aegis/runtime`,
  `@aegis/narrative`, `@aegis/browser` (save, IndexedDB, narration, UI,
  offline), reproducible SDK packing (`npm run pack:sdk`), a standalone-consumer
  test, and the `storybook-lab` and `turn-kitchen-lab` reference apps. The
  complete local gate passed on Windows Chromium: 171 files, 2,480 tests.
- **Missing for this game:** 2D layered-puppet animation, lip-sync, cutscene
  timelines and runtime avatar composition (PM decisions Q26–Q27). Open issues
  #8, #9, #13, #14, #15 and #17 also matter here.
- The engine claims no WebKit, Firefox or physical-device acceptance.

## 4. Workstreams

| ID | Workstream | Repository | Owns | Main outputs |
|---|---|---|---|---|
| E | AEGIS 2D animation and fixes | `rumukh/aegis-engine` | Engine packages and docs | Spec section 23: animation stage, rigs, clips, lip-sync, cutscenes, preview tooling, narration clock, profile and compatibility fixes, SDK artifact sets |
| C | Content and logic | `rumukh/fluffy-bureau` | `content/`, `packages/content/`, `tools/content/`, `docs/content/` | Normalized, validated content packs; voice and label manifest; change log; logic validation for all 24 variants |
| A | Art, animation assets and audio | `rumukh/fluffy-bureau` | `assets/`, `tools/assets/`, `docs/art/`, `docs/audio/` | Art bible, puppets, avatar parts, backgrounds, UI and minigame art, voices with mouth cues, music, sound effects, provenance |
| G | Game runtime and Stage 1 integration | `rumukh/fluffy-bureau` | Root configuration, `apps/`, `vendor/aegis/`, `packages/game-*`, `docs/architecture/`, `docs/qa/` | Playable Stage 1 PWA, tests, acceptance report |

The coordinator owns `docs/DECISIONS_RU.md`, this plan,
`AEGIS_ENGINE_EXTENSION_SPEC.md` (until E imports it into the engine repository)
and `docs/pm/` (read-only imports).

## 5. Contracts between workstreams

Each contract has an owner who proposes it early and messages the consumers.
Change a published contract only with a versioned note to every consumer.

### 5.1 SDK artifacts (E → G)

- G vendors complete tarball sets produced by `npm run pack:sdk` from a pinned
  `rumukh/aegis-engine` commit. Store them in `vendor/aegis/<version>/` with
  `artifacts.json`, and install all four tarballs in one `npm install` call, as
  described in the engine's `docs/api/standalone-consumers.md`.
- Never use source aliases, workspace links or deep imports into an engine
  checkout.
- Start from the latest `main`. Switch to E's artifact sets as E delivers them.
  E messages G with the revision, path and digest of each set.

### 5.2 Content packs (C → G)

- Authored sources live in `content/`. Compiled, schema-validated JSON packs:
  `prologue`, `case01-l1`, `case01-l2`, `case01-l3`, then later cases.
- Use `@aegis/narrative` structures (`NarrativeGraph`, deduction, minigame
  configurations, child-profile validation) where they fit. Fluffy-specific data
  goes in a typed layer exported from `packages/content`: notebook help rules
  (D03), hints, wrong-version explanations, red-herring explanations,
  comfort-lamp lines, first-encounter tutorials, rewards (T11), facts, glossary,
  collections, minigame data and cutscene scripts.
- **Stable IDs:** keep the original script line IDs. A changed line keeps its ID
  and increments its revision. New lines follow a pattern documented in
  `docs/content/`.
- C publishes the schema and a sample pack before the full content.

### 5.3 Voice and label manifest (C → A)

One JSON entry per spoken item:

- `id` and `revision`;
- `speaker`;
- `displayText`;
- `ttsText`: `{имя}` replaced by «пушинка» (Q28), plus stress or pronunciation
  hints;
- context or emotion note;
- pack membership.

The manifest covers dialogue, hints, facts, glossary entries, tutorials,
minigame instructions, choice labels and every child-facing interface label
(Q29, R06). The parent corner is text-only. The content compiler regenerates the
manifest.

### 5.4 Voice assets (A → G)

- One audio file per item, keyed by `id` and a hash of `ttsText` plus the voice
  configuration, so changed text triggers resynthesis.
- One mouth-cue track per spoken item: time-stamped mouth shapes. Until E
  specifies otherwise, use the Rhubarb A–H plus X set.
- An index JSON listing duration, loudness and provenance.
- Defaults until G and E agree otherwise: MP3, mono, 44.1 kHz, about 96 kbit/s.
  Voice is loudness-normalized consistently. Everything must play in Chrome and
  Edge on Windows, iPadOS Safari 17+ and Android Chrome.

### 5.5 Puppet, clip and cutscene formats (E defines; A produces; G consumes)

- E publishes versioned formats with validators and a preview route (ANIM-02..07).
- Until then, A keeps character art separable: body and poses, head, eyes (open,
  half, closed), brows, 6–9 mouth shapes, arms and accessories. Use consistent
  canvas sizes per character and record pivot notes.
- The avatar is composed at runtime: species base, scarf (tint mask) and hat
  (T05).

### 5.6 Visual stage conventions (A, E, G)

- Backgrounds are 2560×1600 (16:10). Keep interactive and story-critical content
  inside the centered 2100×1440 safe area. That area stays visible on 4:3
  (iPad) and 16:9 (Windows) screens.
- Maximum texture size is 4096 px. Use WebP for raster runtime assets and SVG for
  icons and simple UI shapes.
- Text over art sits on panels that preserve contrast (at least 4.5:1).

### 5.7 Asset manifest (A → G)

IDs, paths, dimensions, formats, pack membership, and per-file provenance and
licence. Missing provenance is a build failure, not a warning.

## 6. Repository conventions

- **Toolchain:** npm workspaces, Node 25.6 and npm 11.8, matching the engine.
  TypeScript strict mode, ES modules, LF line endings.
- **Root files** (`package.json`, `package-lock.json`, base `tsconfig`, lint and
  format configuration) belong to G. Others add dependencies only to their own
  workspace package. Resolve lockfile conflicts by rebasing and rerunning
  `npm install`.
- **Assets:** commit only optimized runtime files. Keep masters and generation
  drafts in `F:\AI\GameAssets\fluffy-bureau\` (T20).
- **No secrets** in the repository. Azure keys stay in local environment or skill
  configuration.
- **Branches and PRs:** each workstream works on its own branch from the baseline
  branch `rumukh-game-feasibility-assessment`. PRs target that branch and
  retarget to `master` when the baseline PR merges. To use a sibling's unmerged
  work, fetch and merge its branch locally. Never rewrite someone else's history.
  Do not merge PRs; the user merges.
- **No external actions** without explicit user approval: no deployment, no
  package publishing, no telemetry, no accounts.
- Where a skill matches a task (images, speech, music, film assessment), use it.

## 7. Coordination protocol

- Use direct session messages between workstreams for contracts and handoffs.
  The coordinator sends each session the roster of session IDs.
- Report to the coordinator only: milestone handoffs, blockers, decisions that
  need the user or PM, and Stage 1 completion. Do not send progress chatter.
- **Decisions:**
  - Content changes go to `docs/content/CHANGELOG_RU.md` (before → after,
    reason, R- or T-reference).
  - Other workstreams record decisions in their own `docs/` area.
  - Product-level decisions go to the coordinator, who updates
    `docs/DECISIONS_RU.md`.
- When a contract changes, message every affected workstream.

## 8. Stage 1 acceptance

G compiles `docs/qa/STAGE1_ACCEPTANCE.md`. Every workstream contributes evidence.

- **Brief checklist:** the brief's section 15 checklist for the prologue and every
  case 1 level.
- **Observable signs:** the four Q44 signs. The human playtest (T15) stays
  "pending" until the family completes it.
- **Logic:** each case 1 variant has exactly one solution. Every wrong value
  gets an explanation, and every red herring is explained. Hints follow D03.
  Nothing is punitive.
- **Save and resume:**
  - closing in the middle of every minigame resumes in the same place, with the
    same notebook, including offline;
  - four profiles stay isolated;
  - a second tab cannot silently overwrite progress.
- **Accessibility:**
  - complete play without sound;
  - keyboard-only and touch-only play (touch is emulated; the physical-device gap
    is recorded);
  - 200% text;
  - reduced motion;
  - comfort lamp;
  - pause everywhere.
- **Narration and animation:**
  - narration for every child-facing line and label in Q29 scope;
  - lip-sync on every spoken line;
  - cutscenes that include the player's avatar.
- **Offline and privacy:** installation followed by a cold start with the network
  blocked. No outbound requests, links or telemetry, and no debug globals.
- **Performance:** a 60 fps target and 30 fps floor for the iPad 9 class, measured
  under emulation and documented.
- **Browsers:** automated Chromium (Windows) and WebKit runs. Report gaps honestly.

## 9. Known risks and mitigations

| Risk | Mitigation |
|---|---|
| Generated art is inconsistent across puppet layers | Model sheets, reference-image generation, masked edits for mouths and eyes, an early single-character puppet test in E's preview |
| Few native Russian neural voices | SSML prosody, multilingual voices, early auditions; regeneration is cheap |
| No viseme data for Russian voices | Audio-derived cue tracks; the cue format is independent of how cues are produced |
| iPadOS Safari audio, IndexedDB and service-worker quirks | WebKit automation from the start; a physical check by the family (T15) |
| Repository size | Optimized assets only; propose Git LFS above about 200 MB |
| Parallel work collides | Path ownership (section 4), contracts (section 5), sibling-branch merges instead of shared edits |
