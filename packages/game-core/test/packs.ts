import { PACK_IDS, packs } from '@fluffy/content';
import { createGame, PackLibrary, type FluffyPack } from '../src/index.js';

export const PRODUCTION_PACK_IDS = [
  'case02-l1',
  'case02-l2',
  'case02-l3',
  'case03-l1',
  'case03-l2',
  'case03-l3',
  'case04-l1',
  'case04-l2',
  'case04-l3',
  'cozy',
] as const;

export const stagePacks: FluffyPack[] = PACK_IDS.map((id) => packs[id]!);
export const productionPacks: FluffyPack[] = PRODUCTION_PACK_IDS.filter((id) => id in packs).map(
  (id) => packs[id]!,
);
export const library = (includeProduction = false) =>
  new PackLibrary(includeProduction ? [...stagePacks, ...productionPacks] : stagePacks);
export const newGame = (includeProduction = false) => createGame(library(includeProduction));
