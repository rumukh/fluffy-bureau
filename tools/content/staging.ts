// Stage directions as stage actions (U10), the "tap the window" hotspot beat (U11) and the asset
// policy: Stage 1 packs are strict; Stage 2 production packs report missing A assets as requests
// until A delivers them (docs/content/ASSET_REQUESTS.md); preview packs skip asset checks.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { validateCutscene, type CutsceneFile, type CutsceneStep } from '@aegis/browser/animation';
import type { Scene, Step } from '../../packages/content/src/schema.ts';
import { CAMERA_PRESET_IDS, EFFECTS } from '../../packages/content/src/stage.ts';
import { loadAnimationAssets } from './cutscenes.ts';
import type { VariantSource } from './dsl.ts';
import type { Issue } from './flow.ts';

export type AssetTier = 'strict' | 'pending' | 'skip';

export interface AssetRequest {
  pack: string;
  kind: 'rig' | 'clip' | 'expression' | 'emote' | 'background' | 'hotspot' | 'audio' | 'image' | 'sfx' | 'music' | 'other';
  id: string;
  where: string;
}

/** Collects asset requests across the build; one entry per (kind, id), with every place it is used. */
export class AssetLedger {
  readonly requests: AssetRequest[] = [];
  add(r: AssetRequest): void {
    if (!this.requests.some((x) => x.kind === r.kind && x.id === r.id && x.pack === r.pack && x.where === r.where)) this.requests.push(r);
  }
}

/** Reports a missing asset according to the pack's tier. Returns true when the reference is fine. */
export function missing(tier: AssetTier, ledger: AssetLedger, issues: Issue[], r: AssetRequest, code: string, message: string): void {
  if (tier === 'skip') return;
  ledger.add(r);
  issues.push({ level: tier === 'strict' ? 'error' : 'warning', code: tier === 'strict' ? code : 'ASSET-PENDING', where: `${r.pack}: ${r.where}`, message });
}

interface BackgroundHotspots { hotspots?: Record<string, unknown> }
let hotspotCache: Map<string, Set<string>> | undefined;
/** Background ID → hotspot IDs from A's assets/manifest.json (`backgrounds`). */
export function backgroundHotspots(): Map<string, Set<string>> {
  if (hotspotCache) return hotspotCache;
  hotspotCache = new Map();
  const f = join(import.meta.dirname, '..', '..', 'assets', 'manifest.json');
  if (!existsSync(f)) return hotspotCache;
  const m = JSON.parse(readFileSync(f, 'utf8')) as { backgrounds?: Record<string, BackgroundHotspots> };
  for (const [id, b] of Object.entries(m.backgrounds ?? {})) hotspotCache.set(id, new Set(Object.keys(b.hotspots ?? {})));
  return hotspotCache;
}

let locationCache: Map<string, string> | undefined;
/** Location ID → its default background ID (A's manifest `backgrounds[id].location`). */
export function locationBackground(location: string): string | undefined {
  if (!locationCache) {
    locationCache = new Map();
    const f = join(import.meta.dirname, '..', '..', 'assets', 'manifest.json');
    if (existsSync(f)) {
      const m = JSON.parse(readFileSync(f, 'utf8')) as { backgrounds?: Record<string, { location?: string }> };
      for (const [id, b] of Object.entries(m.backgrounds ?? {})) if (b.location && !locationCache.has(b.location)) locationCache.set(b.location, id);
    }
  }
  return locationCache.get(location);
}

let soundCache: Set<string> | undefined;
/** Sample IDs in A's assets/sound-clues/index.json (array of {id} or an object keyed by ID). */
export function soundClueIds(): Set<string> {
  if (soundCache) return soundCache;
  soundCache = new Set();
  const f = join(import.meta.dirname, '..', '..', 'assets', 'sound-clues', 'index.json');
  if (!existsSync(f)) return soundCache;
  const j = JSON.parse(readFileSync(f, 'utf8')) as unknown;
  const list = Array.isArray(j) ? j : (j as { samples?: unknown; clues?: unknown }).samples ?? (j as { clues?: unknown }).clues ?? j;
  if (Array.isArray(list)) for (const x of list) { if (x && typeof x === 'object' && typeof (x as { id?: unknown }).id === 'string') soundCache.add((x as { id: string }).id); }
  else if (list && typeof list === 'object') for (const k of Object.keys(list)) soundCache.add(k);
  return soundCache;
}
/** Classifies an engine diagnostic about a missing reference (rig, clip, expression, emote). */
export function referenceKind(message: string): AssetRequest['kind'] | null {
  if (/Unknown rig/u.test(message)) return 'rig';
  if (/Unknown clip/u.test(message)) return 'clip';
  if (/has no expression/u.test(message)) return 'expression';
  if (/has no emote/u.test(message)) return 'emote';
  return null;
}

const quoted = (message: string) => [...message.matchAll(/"([^"]+)"/gu)].map((m) => m[1]!);

/**
 * Runs E's validator on a document and routes missing-reference diagnostics through the asset tier.
 * Structural diagnostics are always errors.
 */
export function validateEngineDocument(doc: CutsceneFile, pack: string, where: string, tier: AssetTier, ledger: AssetLedger, issues: Issue[], lines: ReadonlySet<string>): void {
  const assets = loadAnimationAssets();
  const result = validateCutscene(doc, {
    source: `${pack}/${where}`,
    rigs: assets.rigs,
    clips: assets.clips,
    lines,
    cameraPresets: new Set(CAMERA_PRESET_IDS),
    effects: new Set(EFFECTS),
  });
  for (const d of result.diagnostics) {
    const kind = referenceKind(d.message);
    if (kind && d.code === 'AEG-ANIM-0051') {
      const ids = quoted(d.message);
      const id = kind === 'expression' || kind === 'emote' ? `${ids[0]}:${ids[1]}` : (ids[0] ?? d.message);
      missing(tier, ledger, issues, { pack, kind, id, where }, `E:${d.code}`, d.message);
      continue;
    }
    issues.push({ level: d.severity === 'error' ? 'error' : 'warning', code: `E:${d.code}`, where: `${pack}: ${where} ${d.path}`, message: d.message });
  }
}

/** Checks asset IDs used by steps (backgrounds, music, sfx) against the manifest. */
export function checkAssetId(id: string, kind: AssetRequest['kind'], pack: string, where: string, tier: AssetTier, ledger: AssetLedger, issues: Issue[]): void {
  const assets = loadAnimationAssets();
  if (!assets.available || assets.assetIds.has(id)) return;
  missing(tier, ledger, issues, { pack, kind, id, where }, 'ASSET', `unknown asset ${id}`);
}

const PLAYER = 'player';

/** Wraps a scene's dir actions in a synthetic cutscene so E's validator checks them (U10). */
export function checkStageActions(v: VariantSource, tier: AssetTier, ledger: AssetLedger, issues: Issue[]): void {
  const err = (where: string, message: string) => issues.push({ level: 'error', code: 'STAGE-ACTION', where: `${v.pack}: ${where}`, message });
  for (const sc of v.scenes) {
    const steps: CutsceneStep[] = [];
    const actors = new Set([...sc.cast, PLAYER, ...Object.keys(sc.props ?? {})]);
    const walk = (list: Step[]) => list.forEach((s) => {
      if (s.t === 'dir' && s.actions) for (const a of s.actions) {
        if ('actor' in a && !actors.has(a.actor)) err(`${sc.id} ${s.id}`, `actor ${a.actor} is not in the scene cast, the player or the scene props`);
        if (a.op === 'sfx') checkAssetId(a.asset, 'sfx', v.pack, `${sc.id} ${s.id}`, tier, ledger, issues);
        steps.push({ ...a } as CutsceneStep);
      }
      if (s.t === 'skill') { walk(s.first); walk(s.known); }
      if (s.t === 'if') { walk(s.then); walk(s.else); }
    });
    walk(sc.steps);
    if (!steps.length) continue;
    const cast: Record<string, { rig?: string; role?: 'avatar' }> = { [PLAYER]: { role: 'avatar' } };
    for (const c of sc.cast) cast[c] = { rig: c };
    for (const [k, rig] of Object.entries(sc.props ?? {})) cast[k] = { rig };
    // Actors must be on stage before they pose: the synthetic document enters everyone first.
    const intro: CutsceneStep[] = Object.keys(cast).map((k, i) => ({ op: 'enter', actor: k, from: 'left', to: { x: 400 + i * 200, y: 1450 }, duration: 0.1, wait: false }));
    validateEngineDocument({ format: 'aegis-cutscene/1', id: `stage.${sc.id}`, revision: '1', advance: 'input', cast, steps: [...intro, { op: 'join' }, ...steps] }, v.pack, `${sc.id} (stage actions)`, tier, ledger, issues, new Set());
  }
}

/** The background shown at each top-level step: latest dir.background, else scene.background, else the location. */
export function backgroundAt(sc: Scene, index: number, locationBackground: (location: string) => string | undefined): string | undefined {
  for (let i = index; i >= 0; i--) {
    const s = sc.steps[i];
    if (s?.t === 'dir' && s.background) return s.background;
  }
  return sc.background ?? locationBackground(sc.location);
}

/** U11: an `await hotspot` needs a hotspot ID that exists on the background shown at that point. */
export function checkHotspots(v: VariantSource, locationBackground: (location: string) => string | undefined, tier: AssetTier, ledger: AssetLedger, issues: Issue[]): void {
  const hotspots = backgroundHotspots();
  for (const sc of v.scenes) {
    const nested = (list: Step[], top: boolean, idx: number) => list.forEach((s, i) => {
      const at = top ? i : idx;
      if (s.t === 'await' && s.action === 'hotspot') {
        if (!s.hotspot) { issues.push({ level: 'error', code: 'HOTSPOT', where: `${v.pack}: ${sc.id}`, message: 'await hotspot needs a hotspot ID' }); return; }
        const bg = backgroundAt(sc, at, locationBackground);
        if (!bg) { issues.push({ level: 'error', code: 'HOTSPOT', where: `${v.pack}: ${sc.id}`, message: `no background known for hotspot ${s.hotspot}` }); return; }
        if (!hotspots.get(bg)?.has(s.hotspot)) missing(tier, ledger, issues, { pack: v.pack, kind: 'hotspot', id: `${bg}#${s.hotspot}`, where: sc.id }, 'HOTSPOT', `background ${bg} has no hotspot ${s.hotspot}`);
      } else if (s.t === 'await' && s.hotspot) {
        issues.push({ level: 'error', code: 'HOTSPOT', where: `${v.pack}: ${sc.id}`, message: `hotspot only applies to await action "hotspot"` });
      }
      if (s.t === 'skill') { nested(s.first, false, at); nested(s.known, false, at); }
      if (s.t === 'if') { nested(s.then, false, at); nested(s.else, false, at); }
    });
    nested(sc.steps, true, 0);
  }
}
