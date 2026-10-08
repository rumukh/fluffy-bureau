// Content and asset loading for the browser app.
import { PackLibrary, type FluffyPack } from '@fluffy/game-core';
import { EMPTY_MANIFEST, type AssetManifest } from './assets.js';

export interface ContentIndexFile {
  format: 'fluffy-content-index/1';
  packs: { id: string; revision: string; url: string; offlinePack: string }[];
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return (await response.json()) as T;
}

export async function loadContent(
  baseUrl: string,
): Promise<{ library: PackLibrary; packs: FluffyPack[] }> {
  const index = await getJson<ContentIndexFile>(new URL('content/index.json', baseUrl).href);
  const packs = await Promise.all(
    index.packs.map(async (ref) => {
      const pack = await getJson<FluffyPack>(new URL(ref.url, baseUrl).href);
      if (pack.id !== ref.id || pack.revision !== ref.revision)
        throw new Error(`Content pack ${ref.id} does not match its index entry`);
      return pack;
    }),
  );
  return { library: new PackLibrary(packs), packs };
}

export async function loadAssetManifest(baseUrl: string): Promise<AssetManifest> {
  try {
    return await getJson<AssetManifest>(new URL('assets/index.json', baseUrl).href);
  } catch {
    return EMPTY_MANIFEST;
  }
}
