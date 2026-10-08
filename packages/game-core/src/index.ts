import { createRuntimeHost, type CheckpointWriter } from '@aegis/runtime';
import { PackLibrary, type FluffyPack } from './content.js';
import { contentPackFor, createGameAdapter, createRules } from './rules.js';

export * from './content.js';
export * from './state.js';
export * from './interpreter.js';
export * from './minigames.js';
export * from './rules.js';
export * from './view.js';

/** One authoritative runtime host per profile. */
export function createGame(
  packs: PackLibrary | readonly FluffyPack[],
  options: { checkpoint?: CheckpointWriter; seed?: string } = {},
) {
  const library = packs instanceof PackLibrary ? packs : new PackLibrary(packs);
  const rules = createRules(library);
  const content = contentPackFor(library);
  const adapter = createGameAdapter(rules, content.data);
  const host = createRuntimeHost({
    adapter,
    content,
    seed: options.seed ?? 'fluffy-bureau',
    checkpoint: options.checkpoint,
  });
  return { host, rules, content, adapter };
}
export type Game = ReturnType<typeof createGame>;
export * from './autoplay.js';
