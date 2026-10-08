import { packs } from '@fluffy/content';
import { createGame, PackLibrary, type FluffyPack } from '../src/index.js';

export const stagePacks: FluffyPack[] = [
  'shared',
  'prologue',
  'case01-l1',
  'case01-l2',
  'case01-l3',
].map((id) => packs[id]!);
export const library = () => new PackLibrary(stagePacks);
export const newGame = () => createGame(library());
