// Asset resolution: A's manifest (copied by the build) with generated SVG placeholders as fallback.
import type { Scarf, Species } from '@fluffy/game-core';

export interface HotspotRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BackgroundLayer extends HotspotRect {
  asset: string;
  url: string;
  target?: string;
  levels?: number[];
}

export interface AssetManifest {
  format: 'fluffy-asset-index';
  assets: Record<string, { url: string; kind: string; width?: number; height?: number }>;
  backgrounds: Record<
    string,
    {
      location: string;
      url: string;
      hotspots: Record<string, HotspotRect>;
      layers: BackgroundLayer[];
    }
  >;
  voice: Record<string, { url: string; cues: string | null; durationMs: number }>;
  characters: Record<string, { base: string; puppet: PuppetDocuments | null }>;
  avatar: Record<
    string,
    { base: string; scarfMask: string | null; puppet: PuppetDocuments | null }
  >;
  music: Record<string, string>;
  sfx: Record<string, string>;
  /** Sound clues (Q31) by sample ID: silent-form wave and icons; the audio is sfx `clue.<id>`. */
  soundClues?: Record<string, SoundClue>;
  /** Files referenced by name inside documents (atlas images). */
  files: Record<string, string>;
  /** Animation documents by document ID: asset ID, format and (for rigs) atlas IDs. */
  documents: Record<string, { asset: string; format: string; atlases: string[] }>;
}

export interface PuppetDocuments {
  rigId: string;
  documents: string[];
  /** Accessory slots the rig offers (avatar: hat, scarf pattern). */
  slots?: string[];
}

export const EMPTY_MANIFEST: AssetManifest = {
  format: 'fluffy-asset-index',
  assets: {},
  backgrounds: {},
  voice: {},
  characters: {},
  avatar: {},
  music: {},
  sfx: {},
  files: {},
  documents: {},
};

export interface SoundClue {
  wave: string | null;
  night: boolean;
  icons: {
    loud: 'quiet' | 'medium' | 'loud';
    pitch: 'low' | 'middle' | 'high';
    length: 'short' | 'long';
  } | null;
  rhythm: 'steady' | 'uneven' | 'continuous' | null;
}

export const LOGICAL = { width: 2560, height: 1600 } as const;
export const SAFE = { x: 230, y: 80, width: 2100, height: 1440 } as const;

export const SCARF_COLORS: Record<Scarf, string> = {
  honey: '#e8a93b',
  sage: '#8fae7f',
  rose: '#d98c97',
  sky: '#7fb2d9',
  berry: '#5a5fa8',
  mint: '#6cc4ad',
};

const SPECIES_COLORS: Record<
  Species,
  { fur: string; ear: 'round' | 'pointy' | 'big' | 'tuft' | 'floppy' }
> = {
  kitten: { fur: '#f2b36b', ear: 'pointy' },
  fox: { fur: '#e2793e', ear: 'pointy' },
  mouse: { fur: '#b9b2ab', ear: 'big' },
  squirrel: { fur: '#c06a3c', ear: 'tuft' },
  puppy: { fur: '#d8b48a', ear: 'floppy' },
};

const CHARACTER_COLORS: Record<string, string> = {
  khvosts: '#8d8a86',
  watsony: '#9b6b45',
  pudding: '#e8b45a',
  tyopa: '#7d7f88',
  kartofan: '#5b4636',
  stella: '#3a4150',
  fitilyok: '#f3d35c',
  mouse: '#b8aea4',
  damka: '#8a5a3a',
  pukhlik: '#c9b8a0',
  narrator: '#cccccc',
};

function svgUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function hue(text: string): number {
  let value = 0;
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) % 360;
  return value;
}

export function placeholderBackground(location: string, title: string): string {
  const h = hue(location);
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2560 1600">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${h},55%,88%)"/><stop offset="1" stop-color="hsl(${(h + 40) % 360},45%,75%)"/></linearGradient></defs>
<rect width="2560" height="1600" fill="url(#g)"/>
<ellipse cx="1280" cy="1600" rx="1700" ry="420" fill="hsl(${(h + 80) % 360},35%,62%)"/>
<circle cx="2200" cy="260" r="140" fill="#fff6d8" opacity=".8"/>
<rect x="230" y="80" width="2100" height="1440" rx="40" fill="none" stroke="#ffffff" stroke-opacity=".25" stroke-width="6" stroke-dasharray="30 30"/>
<text x="1280" y="230" text-anchor="middle" font-family="Nunito, sans-serif" font-size="96" font-weight="800" fill="#5a3f2a" opacity=".55">${escapeXml(title)}</text>
</svg>`);
}

export function placeholderCharacter(speaker: string, name: string): string {
  const fur = CHARACTER_COLORS[speaker] ?? `hsl(${hue(speaker)},35%,55%)`;
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">
<ellipse cx="200" cy="430" rx="150" ry="160" fill="${fur}"/>
<circle cx="200" cy="230" r="120" fill="${fur}"/>
<circle cx="110" cy="130" r="40" fill="${fur}"/><circle cx="290" cy="130" r="40" fill="${fur}"/>
<circle cx="160" cy="220" r="16" fill="#2b1d14"/><circle cx="240" cy="220" r="16" fill="#2b1d14"/>
<circle cx="166" cy="214" r="5" fill="#fff"/><circle cx="246" cy="214" r="5" fill="#fff"/>
<ellipse cx="200" cy="265" rx="20" ry="13" fill="#3a2a20"/>
<path d="M175 290q25 20 50 0" stroke="#3a2a20" stroke-width="8" fill="none" stroke-linecap="round"/>
<text x="200" y="590" text-anchor="middle" font-family="Nunito, sans-serif" font-size="40" font-weight="800" fill="#3b2a1e">${escapeXml(name)}</text>
</svg>`);
}

export function placeholderAvatar(species: Species | null, scarf: Scarf | null): string {
  const look = SPECIES_COLORS[species ?? 'kitten'];
  const scarfColor = scarf ? SCARF_COLORS[scarf] : '#ffffff';
  const ears = {
    pointy: '<path d="M90 150L120 40L170 120Z"/><path d="M310 150L280 40L230 120Z"/>',
    big: '<circle cx="95" cy="110" r="70"/><circle cx="305" cy="110" r="70"/>',
    tuft: '<path d="M95 150L110 30L165 120Z"/><path d="M305 150L290 30L235 120Z"/>',
    floppy:
      '<ellipse cx="85" cy="200" rx="40" ry="90"/><ellipse cx="315" cy="200" rx="40" ry="90"/>',
    round: '<circle cx="110" cy="120" r="40"/><circle cx="290" cy="120" r="40"/>',
  }[look.ear];
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">
<g fill="${look.fur}">${ears}<ellipse cx="200" cy="440" rx="140" ry="150"/><circle cx="200" cy="220" r="125"/></g>
${species === 'fox' ? '<path d="M200 230l-90 40q90 70 180 0z" fill="#fff4e6"/>' : ''}
<circle cx="155" cy="210" r="17" fill="#2b1d14"/><circle cx="245" cy="210" r="17" fill="#2b1d14"/>
<circle cx="161" cy="204" r="6" fill="#fff"/><circle cx="251" cy="204" r="6" fill="#fff"/>
<ellipse cx="200" cy="258" rx="16" ry="11" fill="#3a2a20"/>
<path d="M178 282q22 18 44 0" stroke="#3a2a20" stroke-width="8" fill="none" stroke-linecap="round"/>
<path d="M90 335q110 60 220 0l10 50q-120 60-240 0z" fill="${scarfColor}" stroke="#3b2a1e" stroke-opacity=".25" stroke-width="4"/>
<path d="M260 360l40 120l-55 -10z" fill="${scarfColor}"/>
</svg>`);
}

function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export class Assets {
  constructor(
    readonly manifest: AssetManifest,
    readonly baseUrl: string,
  ) {}

  url(path: string): string {
    return new URL(path, this.baseUrl).href;
  }

  /** Several backgrounds may share a location (the shed): prefer the interior, else the first. */
  private backgroundEntry(location: string) {
    const matches = Object.entries(this.manifest.backgrounds).filter(
      ([, bg]) => bg.location === location,
    );
    return (matches.find(([id]) => id.endsWith('-interior')) ?? matches[0])?.[1];
  }

  background(location: string, title: string): string {
    const entry = this.backgroundEntry(location);
    return entry ? this.url(entry.url) : placeholderBackground(location, title);
  }

  layers(location: string, level: number | null): (BackgroundLayer & { src: string })[] {
    const entry = this.backgroundEntry(location);
    return (entry?.layers ?? [])
      .filter((layer) => !layer.levels || layer.levels.includes(level ?? 1))
      .map((layer) => ({ ...layer, src: this.url(layer.url) }));
  }

  hotspots(location: string): Record<string, HotspotRect> {
    const all: Record<string, HotspotRect> = {};
    for (const bg of Object.values(this.manifest.backgrounds))
      if (bg.location === location) Object.assign(all, bg.hotspots);
    return all;
  }

  /** A named hotspot of a background (U11), falling back to the location's backgrounds. */
  backgroundHotspot(
    background: string | null,
    location: string,
    id: string,
  ): HotspotRect | undefined {
    const own = background ? this.manifest.backgrounds[background]?.hotspots?.[id] : undefined;
    return own ?? this.hotspots(location)[id];
  }

  /** Hotspot for a menu option: exact ID, else a key that extends it (pirogovaya → pirogovaya-street). */
  hotspotFor(location: string, id: string): HotspotRect | undefined {
    const spots = this.hotspots(location);
    return spots[id] ?? Object.entries(spots).find(([key]) => key.startsWith(`${id}-`))?.[1];
  }

  /** Resolves an asset ID (or a file name used inside documents, or `cues:<lineId>`) to a URL. */
  resolve(id: string): string {
    if (id.startsWith('cues:')) {
      const cues = this.manifest.voice[id.slice(5)]?.cues;
      if (cues) return this.url(cues);
    }
    const asset = this.manifest.assets[id]?.url ?? this.manifest.files[id];
    if (!asset) throw new Error(`Unknown asset ${id}`);
    return this.url(asset);
  }

  backgroundId(location: string): string | null {
    const matches = Object.keys(this.manifest.backgrounds).filter(
      (id) => this.manifest.backgrounds[id]!.location === location,
    );
    return matches.find((id) => id.endsWith('-interior')) ?? matches[0] ?? null;
  }

  rawLayers(location: string, level: number | null) {
    const id = this.backgroundId(location);
    return (id ? this.manifest.backgrounds[id]!.layers : []).filter(
      (layer) => !layer.levels || layer.levels.includes(level ?? 1),
    );
  }

  assetSize(id: string): { width: number; height: number } | null {
    const asset = this.manifest.assets[id];
    return asset?.width && asset.height ? { width: asset.width, height: asset.height } : null;
  }

  /** Asset IDs to load for a rig: its atlases first, then the rig. */
  rigDocuments(rigId: string): string[] {
    const rig = this.manifest.documents[rigId];
    if (!rig) return [];
    const atlases = rig.atlases
      .map((id) => this.manifest.documents[id]?.asset)
      .filter((id): id is string => Boolean(id));
    return [...atlases, rig.asset];
  }

  /** Every clip and atlas document (small JSON), for cutscenes that pose and emote. */
  documentAssets(kind: 'clip' | 'atlas'): string[] {
    return Object.values(this.manifest.documents)
      .filter((d) => d.format.startsWith(`aegis-${kind}/`))
      .map((d) => d.asset);
  }

  puppet(speaker: string): PuppetDocuments | null {
    return this.manifest.characters[speaker]?.puppet ?? null;
  }

  avatarPuppet(species: string): PuppetDocuments | null {
    return this.manifest.avatar[species]?.puppet ?? null;
  }

  /**
   * The accessory drawing a shop scarf pattern on one species. Null (nothing drawn) until A's
   * overlays exist.
   */
  scarfPattern(species: string, asset: string): { slot: string; rig: string } | null {
    // A's contract: shop `scarf.pattern.<name>` → rig `acc.scarf.<name>.<species>` in the avatar's
    // `scarfPattern` slot (above the tinted scarf, own colours, never tinted).
    const name = asset.split('.').pop() ?? asset;
    const slot = this.avatarPuppet(species)?.slots?.find((s) => s === 'scarfPattern');
    const rig = `acc.scarf.${name}.${species}`;
    return slot && this.manifest.documents[rig] ? { slot, rig } : null;
  }

  music(name: string): string | null {
    const url = this.manifest.music[name];
    return url ? this.url(url) : null;
  }

  sfx(name: string): string | null {
    const url = this.manifest.sfx[name];
    return url ? this.url(url) : null;
  }

  character(speaker: string, name: string): string {
    const entry = this.manifest.characters[speaker];
    return entry ? this.url(entry.base) : placeholderCharacter(speaker, name);
  }

  avatar(species: Species | null, scarf: Scarf | null): { base: string; mask: string | null } {
    const entry = species ? this.manifest.avatar[species] : undefined;
    if (!entry) return { base: placeholderAvatar(species, scarf), mask: null };
    return { base: this.url(entry.base), mask: entry.scarfMask ? this.url(entry.scarfMask) : null };
  }

  voice(lineId: string) {
    return this.manifest.voice[lineId] ?? null;
  }
}

/** Placeholder hotspot layout: spreads targets across the safe area when A has no rectangles. */
export function fallbackHotspots(ids: readonly string[]): Record<string, HotspotRect> {
  const result: Record<string, HotspotRect> = {};
  const columns = Math.min(4, Math.max(1, ids.length));
  ids.forEach((id, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const seed = hue(id);
    result[id] = {
      x: SAFE.x + 120 + column * (SAFE.width / columns) + (seed % 120),
      y: SAFE.y + 380 + row * 420 + (seed % 90),
      w: 300,
      h: 260,
    };
  });
  return result;
}
