# Content pack contract (C → G, C → A)

**Owner:** workstream C. **Version:** schema 1 (`fluffy-content-pack`), manifest schema 1
(`fluffy-voice-manifest`). Types: `packages/content/src/schema.ts` (authoritative).

## Files

| Path | What |
|---|---|
| `content/` | Authored sources (TypeScript, type-checked). Never edited by other workstreams. |
| `tools/content/build.ts` | Compiler + validator. `node tools/content/build.ts` writes outputs; `--check` also fails when committed outputs are stale. Exit code 1 on any validation error. |
| `packages/content/packs/<id>.json` | Compiled packs: `shared`, `prologue`, `case01-l1`, `case01-l2`, `case01-l3`; preparatory `case02-l1` … `case08-l3` (C2) once added. |
| `packages/content/src/index.ts` | `@fluffy/content`: types, `packs`, `PACK_IDS` (Stage 1), `PREVIEW_PACK_IDS` (C2, not for production before «дальше»). |
| `packages/content/voice-manifest.json` | Voice and label manifest for Stage 1 (A). |
| `docs/content/scripts/<pack>.md` | Explicit per-variant scripts for PM review (generated). |
| `docs/content/CHANGELOG_RU.md` | Every textual change: before → after, reason, R/T/D reference (generated from sources). |
| `docs/content/VALIDATION_REPORT.md` | Validation report (generated). |
| `docs/content/ID_PATTERNS.md` | ID rules. |

## Pack

Every pack is **fully explicit**: no «без изменений» inheritance. Case packs `require: ["shared"]`; a
line ID is looked up in the case pack first, then in `shared`.

| Field | Meaning |
|---|---|
| `format`, `schema`, `id`, `revision` | `revision` = sha256 of the pack body. Any change to any array changes it (G amendment 2). |
| `kind`, `title`, `case` | `prologue` or `case` (`{number, level}`); `shared` holds speakers, skills, UI labels, rewards. |
| `start` | First scene. |
| `lines[]` | `id`, `rev`, `kind`, `speaker`, `text` (may contain `{имя}`), optional `tts`, `voiced`, `delivery`, `note`. |
| `scenes[]` | `id`, `title`, `location` (background id; `map` = town map), `cast`, `presentation` (`dialogue`, `cutscene`, `hub`, `minigame`), `steps[]`. |
| `logic` | Axes with labelled values, `intended`, `clues[]` (predicate, `required`, `requires`), `version` (`button`, `available`, `onSolved`), `wrongVersion`, `redHerrings`. |
| `deduction` | `@aegis/narrative` `DeductionCase` schema 1 (required clues only); validated with `validateDeduction` at build time. |
| `notebookHelp` | D03: `mode` `suggest` (levels 1–2, propose sticker + reason line) or `point` (level 3, pointer line per clue). `marks[]` cite the clues that prove each mark. |
| `hints` | `klubok` (3 per run, exact) and `shell` (unlimited; exact on level 1, vague on level 2; `null` on level 3). |
| `minigames[]` | `id`, `skill`, `config` by `kind` (below). |
| `facts`, `glossary`, `rewards`, `collections`, `activities`, `comfort`, `cutscenes` | Catalogs. Rewards carry `claimKey` (once per profile, Q38/Q40). |

### Steps

| Step | Runtime behaviour |
|---|---|
| `line` | Show and narrate the line. |
| `dir` | Stage direction / animation cue (`id` stable). Never shown as dialogue, never voiced. |
| `skill` | `[НАВЫК]`: play `first` when the profile lacks the skill, else `known`; then mark it learned (profile-level). |
| `minigame` | Run the minigame; continue when complete. |
| `clue` | Reveal the clue in the notebook (idempotent). |
| `set` | Set a case-run flag (idempotent). |
| `reward` | Grant once per `claimKey`. |
| `if` | Evaluate `when` and run `then` or `else`. |
| `menu` | Decision screen. Show options whose `when` holds (or is `null`) and whose `hideWhen` does not hold; at most `pageSize` (≤ 3) per page. `back` is the service «Назад» target (not counted as an option). Selecting goes to `to`. In a `hub` scene with `location: "map"` the menu is the town map. |
| `await` | Block until the child performs `avatar.species`, `avatar.name`, `avatar.scarf`, `lamp.on`, `lamp.off`, `replay`, `notebook.open`, `pause` or `office.place`. |
| `goto` | Continue in another scene. |
| `end` | Pack complete. |

`menu`, `goto` and `end` are always the last step of their block. Hub scenes are re-evaluated every
time control returns to them, including after the notebook is closed.

**Restart safety (G amendment 1):** every scene can be re-entered from step 0. No `if` reads an effect
produced earlier in the same scene; all effects are idempotent. The validator enforces this.

### Conditions

`{clue}`, `{visited}` (scene entered at least once in this run), `{flag}`, `{skill}` (profile),
`{notebookConfirmed: axis}` (the player placed a ✔ in that column), `{all}`, `{any}`, `{not}`. Minigame
completion is expressed by the clue revealed at the end of its scene or by `visited` (G amendment 5).

### Version check

The notebook button `logic.version.button` is enabled while `logic.version.available` holds. A correct
selection goes to `onSolved`. A wrong one plays `wrongVersion.intro`, then the lines of the **first wrong
value by column order** (`byValue`, each with optional `when`), then `outro`; the case continues and
nothing is lost (Q16).

### Hints

For a request, pick the **first** rule whose `when` holds. Klubok spends one of `allowance` only when a
rule applies; otherwise it plays `review` for free (Q16). When the allowance is spent, play `exhausted`.
`cites` lists clues the hint talks about; the validator proves they are always revealed when `when`
holds, and that an exact klubok rule exists for every state where a required clue is missing.

### Notebook help (D03)

`suggest`: among `marks` whose clues are all revealed and whose sticker differs from the player's,
propose the first and speak its `line`; never place it. `point`: for the first such mark, speak the
`pointers` line of its first clue. Nothing applicable: `nothing`. You can cross-check marks with
`@aegis/narrative` `proposeNotebookMarks` on `deduction`.

### Minigame kinds

| `kind` | Config | Notes |
|---|---|---|
| `magnifier` | `targets[]` (`id`, `label`, `required`, `reply[]`), `afterFirst[]`, `afterFirstSkill`, `assistAfterMisses` | aegis `scene-selection`; A supplies hotspots keyed by target `id`. |
| `cocoa` | `rounds[]` of `options[]` (`label`, `correct`, `reply[]`) and `retry[]` | A wrong answer plays its replies and `retry`, then the round repeats. |
| `tracks` | `steps[]` (`options`, `pageSize`), `question` | A wrong card plays its reply and dims; continue until the correct card. |
| `timeline` | `items[]` (`time`, `label`), `solution[]`, `wrong[]` | aegis `ordering`. |
| `scent-pairs` | `fields[]` of `cards[]` (`pair`), `mismatch[]`, `question` | aegis `matching`; no timer. |
| `baker` | `measures[]` (`units` = eighths of a cup), `steps[]` (`prompt`, `target`, `ideal`, `afterWrong`), `tooMuch[]`, `tooLittle[]` | Sum > target: `tooMuch` (+`afterWrong`), undo the pick. Pick outside `ideal` with sum < target: `tooLittle` (+`afterWrong`). Sum = target: next step. |

## Voice and label manifest (C → A)

One entry per unique line ID across Stage 1 packs: `id`, `revision`, `kind`, `speaker`, `displayText`,
`ttsText` (`{имя}` → «пушинка», `tts` overrides for numbers and times), `ttsHash` (sha256 of `ttsText`),
`pronunciation` (lexicon hits; stress with U+0301), `delivery` (`neutral`, `cheerful`, `excited`,
`worried`, `sad`, `shy`, `thinking`, `whisper`, `warm`), `note`, `packs`, and `sameAudioAs` when an
earlier entry has the same speaker and `ttsText` (record once). `lexicon` is the stress authority.
Parent-corner text is not in the manifest (Q29).

## Change protocol

Schema changes are versioned and announced to G and A. Content changes keep IDs; any text change bumps
the line `rev` and `ttsHash`, and is recorded in `CHANGELOG_RU.md`.
