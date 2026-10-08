// Cutscene checks (T25): E's headless validator from the vendored SDK plus Fluffy rules.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { validateCutscene, type CutsceneFile, type RigFile } from '@aegis/browser/animation';
import type { Cutscene } from '../../packages/content/src/schema.ts';
import { CAMERA_PRESET_IDS, EFFECTS } from '../../packages/content/src/stage.ts';
import type { AuthoredLine, VariantSource } from './dsl.ts';
import type { Issue } from './flow.ts';

const ASSETS = join(import.meta.dirname, '..', '..', 'assets');
/** Cutscenes allowed without the player's avatar (T25: only the wordless intro). */
export const NO_AVATAR = new Set(['intro']);
/** G loads a cutscene's backgrounds at its start under a 128 MiB budget; one 2560×1600 background is 16 MiB. */
export const MAX_BACKGROUNDS = 4;

export interface AnimationAssets {
  available: boolean;
  rigs: Map<string, RigFile>;
  clips: Set<string>;
  assetIds: Set<string>;
}

let cached: AnimationAssets | undefined;

/** Rigs and clips from A's assets/ tree, and every asset ID in assets/manifest.json. */
export function loadAnimationAssets(): AnimationAssets {
  if (cached) return cached;
  const rigs = new Map<string, RigFile>();
  const clips = new Set<string>();
  const assetIds = new Set<string>();
  const manifest = join(ASSETS, 'manifest.json');
  if (!existsSync(manifest)) return (cached = { available: false, rigs, clips, assetIds });
  const m = JSON.parse(readFileSync(manifest, 'utf8')) as { assets?: { id: string }[] };
  for (const a of m.assets ?? []) assetIds.add(a.id);
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) { if (name !== 'voice') walk(p); continue; }
      if (!name.endsWith('.json') || name === 'manifest.json') continue;
      let doc: { format?: string; id?: string };
      try { doc = JSON.parse(readFileSync(p, 'utf8')) as { format?: string; id?: string }; } catch { continue; }
      if (doc.format === 'aegis-rig/1' && doc.id) rigs.set(doc.id, doc as unknown as RigFile);
      if (doc.format === 'aegis-clip/1' && doc.id) clips.add(doc.id);
    }
  };
  walk(ASSETS);
  return (cached = { available: true, rigs, clips, assetIds });
}

export function cutsceneLines(doc: CutsceneFile): { actor?: string; line: string; advance?: string }[] {
  return doc.steps.flatMap((s) => (s.op === 'line' ? [{ actor: s.actor, line: s.line, advance: s.advance }] : []));
}

export function checkCutscenes(
  v: VariantSource,
  lineIndex: Map<string, AuthoredLine>,
  packLineIds: Set<string>,
  issues: Issue[],
): void {
  const err = (code: string, where: string, message: string) => issues.push({ level: 'error', code, where: `${v.pack}: ${where}`, message });
  const assets = loadAnimationAssets();
  if (!assets.available && v.cutscenes.length) err('CUTSCENE-ASSETS', 'assets/manifest.json', 'asset manifest not found; cutscenes cannot be validated');
  const voiced = new Set([...packLineIds].filter((id) => lineIndex.get(id)?.voiced));
  const ids = new Set<string>();
  const used = new Map<string, string[]>();
  for (const sc of v.scenes) {
    const walk = (steps: VariantSource['scenes'][number]['steps']) => steps.forEach((s) => {
      if (s.t === 'cutscene') used.set(s.cutscene, [...(used.get(s.cutscene) ?? []), sc.id]);
      if (s.t === 'skill') { walk(s.first); walk(s.known); }
      if (s.t === 'if') { walk(s.then); walk(s.else); }
    });
    walk(sc.steps);
  }
  for (const [id, scenes] of used) if (!v.cutscenes.some((c) => c.id === id)) err('REF-CUTSCENE', scenes.join(','), `unknown cutscene ${id}`);

  for (const c of v.cutscenes as Cutscene[]) {
    const where = `cutscene ${c.id}`;
    const d = c.document;
    if (ids.has(c.id)) err('ID-DUPLICATE', where, 'cutscene ID twice');
    ids.add(c.id);
    if (!d) { err('CUTSCENE-DOCUMENT', where, 'missing document'); continue; }
    if (d.id !== c.id) err('CUTSCENE-ID', where, `document id ${d.id} ≠ ${c.id}`);
    const scenes = used.get(c.id) ?? [];
    if (scenes.length === 0) err('CUTSCENE-UNUSED', where, 'never played by a step');
    else if (!scenes.includes(c.scene)) err('CUTSCENE-SCENE', where, `declared scene ${c.scene} but played in ${scenes.join(', ')}`);
    if (d.advance !== 'input') err('CUTSCENE-ADVANCE', where, 'advance must be "input" (Q29)');

    // Avatar role (T25)
    const avatars = Object.entries(d.cast).filter(([, e]) => e.role === 'avatar');
    if (!NO_AVATAR.has(c.id) && avatars.length !== 1) err('CUTSCENE-AVATAR', where, `needs exactly one cast entry with role "avatar" (found ${avatars.length})`);
    if (NO_AVATAR.has(c.id) && avatars.length) err('CUTSCENE-AVATAR', where, 'the wordless intro has no avatar');
    const avatarKeys = new Set(avatars.map(([k]) => k));

    // Lines: existing, voiced, in this pack, spoken by their speaker, waiting for input (no new spoken text)
    const ls = cutsceneLines(d);
    if (NO_AVATAR.has(c.id) && ls.length) err('CUTSCENE-WORDLESS', where, 'the intro must be wordless');
    for (const l of ls) {
      const line = lineIndex.get(l.line);
      if (!line) { err('CUTSCENE-LINE', where, `unknown line ID ${l.line}`); continue; }
      if (!voiced.has(l.line)) err('CUTSCENE-LINE', where, `line ${l.line} is not a voiced line of this pack`);
      if (line.kind !== 'dialogue') err('CUTSCENE-LINE', where, `line ${l.line} is ${line.kind}, not dialogue`);
      if (l.advance && l.advance !== 'input') err('CUTSCENE-ADVANCE', where, `line ${l.line} must wait for «Дальше»`);
      const speaker = line.speaker === 'narrator' ? undefined : line.speaker;
      if (l.actor !== speaker) err('CUTSCENE-SPEAKER', where, `line ${l.line} is spoken by ${line.speaker} but actor is ${l.actor ?? 'narrator'}`);
      if (l.actor && avatarKeys.has(l.actor)) err('CUTSCENE-SPEAKER', where, `the avatar never speaks (${l.line})`);
      if (l.actor && d.cast[l.actor]?.rig !== l.actor) err('CUTSCENE-SPEAKER', where, `actor ${l.actor} must use rig ${l.actor}`);
    }
    if (new Set(ls.map((l) => l.line)).size !== ls.length) err('CUTSCENE-LINE', where, 'a line is spoken twice');

    // Markers (restore points)
    const markers = d.steps.flatMap((s) => (s.op === 'marker' ? [s.id] : []));
    if (markers.length === 0) err('CUTSCENE-MARKER', where, 'needs markers after major beats');
    if (new Set(markers).size !== markers.length) err('CUTSCENE-MARKER', where, 'duplicate marker');

    // Asset IDs (backgrounds, music, sfx, including comfort variants)
    const backgrounds = new Set<string>();
    for (const s of d.steps) if (s.op === 'background') for (const a of [s.asset, s.comfort?.['asset']]) if (typeof a === 'string') backgrounds.add(a);
    if (backgrounds.size > MAX_BACKGROUNDS) err('CUTSCENE-BUDGET', where, `${backgrounds.size} distinct backgrounds (max ${MAX_BACKGROUNDS}: G loads them together under a 128 MiB image budget)`);
    if (assets.available) {
      for (const s of d.steps) {
        const refs: unknown[] = [];
        if (s.op === 'background' || s.op === 'music' || s.op === 'atmosphere' || s.op === 'sfx') refs.push(s.asset, s.comfort?.['asset']);
        for (const a of refs) if (typeof a === 'string' && !assets.assetIds.has(a)) err('CUTSCENE-ASSET', where, `unknown asset ${a}`);
      }
      for (const [k, e] of Object.entries(d.cast)) if (e.rig && !assets.rigs.has(e.rig)) err('CUTSCENE-RIG', where, `cast ${k}: unknown rig ${e.rig}`);
    }

    // E's validator (SDK 711ec45)
    const result = validateCutscene(d, {
      source: `${v.pack}/${c.id}`,
      rigs: assets.rigs,
      clips: assets.clips,
      lines: voiced,
      cameraPresets: new Set(CAMERA_PRESET_IDS),
      effects: new Set(EFFECTS),
    });
    for (const x of result.diagnostics) {
      issues.push({ level: x.severity === 'error' ? 'error' : 'warning', code: `E:${x.code}`, where: `${v.pack}: ${where} ${x.path}`, message: x.message });
    }
  }
}
