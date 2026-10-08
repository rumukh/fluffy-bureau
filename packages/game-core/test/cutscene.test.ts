import { describe, expect, it } from 'vitest';
import { requireValue } from '@aegis/runtime';
import { packs } from '@fluffy/content';
import {
  autoplay,
  createGame,
  migrateProfileJson,
  PackLibrary,
  type FluffyPack,
} from '../src/index.js';

const library = (prologue: FluffyPack = packs.prologue!) =>
  new PackLibrary([packs.shared!, prologue]);

/** Plays the real prologue (C's T25 documents) up to the letter cutscene in P3. */
async function toLetter() {
  const game = createGame(library());
  await autoplay(game.host, game.rules, 'prologue', {
    stopWhen: (view) =>
      view.run?.step?.kind === 'cutscene' && view.run.step.id === 'p3.letter' && !view.run.queue,
  });
  return game;
}

describe('cutscene steps (T25)', () => {
  it('the wordless intro is the first step of a new profile and binds no avatar', async () => {
    const game = createGame(library());
    requireValue(await game.host.dispatch({ type: 'start', pack: 'prologue' }));
    const step = game.host.getView().run?.step;
    expect(step).toMatchObject({ kind: 'cutscene', id: 'intro' });
    const cast = Object.values(
      (step as unknown as { document: { cast: Record<string, { role?: string }> } }).document.cast,
    );
    expect(cast.some((c) => c.role === 'avatar')).toBe(false);
  });

  it('block the story, keep the last marker across save/restore and grant nothing by themselves', async () => {
    const game = await toLetter();
    const before = game.host.getView();
    expect(before.run?.step).toMatchObject({ kind: 'cutscene', id: 'p3.letter', marker: null });
    const cast = Object.values(
      (before.run!.step as unknown as { document: { cast: Record<string, { role?: string }> } })
        .document.cast,
    );
    expect(cast.some((c) => c.role === 'avatar')).toBe(true);
    expect((await game.host.dispatch({ type: 'next' })).ok).toBe(false);
    requireValue(await game.host.dispatch({ type: 'cutscene-marker', marker: 'letter-open' }));
    const saved = JSON.parse(JSON.stringify(game.host.snapshot()));
    const restored = createGame(library());
    requireValue(await restored.host.restore(saved));
    expect(restored.host.getView().run?.step).toMatchObject({
      kind: 'cutscene',
      marker: 'letter-open',
    });
    expect(restored.host.getView().buttons).toBe(before.buttons);
    requireValue(await restored.host.dispatch({ type: 'cutscene', outcome: 'skipped' }));
    expect(restored.host.getView().run?.step?.kind).not.toBe('cutscene');
    const { view } = await autoplay(restored.host, restored.rules, 'prologue');
    // Rewards are ordinary steps after the cutscene: granted once, whether watched or skipped.
    expect(view.buttons).toBe(5);
  });

  it('is not shown again when its scene is re-entered after a content update', async () => {
    const game = await toLetter();
    requireValue(await game.host.dispatch({ type: 'cutscene', outcome: 'completed' }));
    const state = JSON.parse(JSON.stringify(game.host.snapshot()));
    const updated = {
      ...structuredClone(packs.prologue!),
      revision: 'prologue-updated',
    } as FluffyPack;
    const fresh = createGame(library(updated));
    const migrated = migrateProfileJson(
      state.world.resources['aegis.runtime.state'],
      fresh.rules,
      fresh.content.data,
    );
    requireValue(await fresh.host.dispatch({ type: 'import', state: migrated as never }));
    expect(fresh.host.getView().run?.scene.id).toBe(game.host.getView().run?.scene.id);
    expect(fresh.host.getView().run?.step).not.toMatchObject({ kind: 'cutscene', id: 'p3.letter' });
  });
});
