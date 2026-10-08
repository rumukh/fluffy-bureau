import { describe, expect, it } from 'vitest';
import { requireValue } from '@aegis/runtime';
import { packs } from '@fluffy/content';
import { createGame, PackLibrary, type FluffyPack } from '../src/index.js';

/** The real prologue with a T25-style cutscene placed before the first reward of P3. */
function withCutscene(): FluffyPack[] {
  const prologue = structuredClone(packs.prologue!) as FluffyPack;
  const p3 = prologue.scenes.find((s) => s.id === 'P3')!;
  const firstReward = p3.steps.findIndex((s) => s.t === 'reward');
  (p3.steps as unknown[]).splice(firstReward, 0, { t: 'cutscene', cutscene: 'test-letter' });
  (prologue.cutscenes as unknown[]) = [
    {
      id: 'test-letter',
      scene: 'P3',
      summary: 'test',
      document: {
        format: 'aegis-cutscene/1',
        id: 'test-letter',
        revision: '1',
        advance: 'input',
        cast: {},
        steps: [],
      },
    },
  ];
  prologue.revision = 'prologue-cutscene-test';
  return [packs.shared!, prologue];
}

async function toCutscene() {
  const game = createGame(new PackLibrary(withCutscene()));
  const { autoplay } = await import('../src/index.js');
  await autoplay(game.host, game.rules, 'prologue', {
    stopWhen: (view) => view.run?.step?.kind === 'cutscene' && !view.run.queue,
  });
  return game;
}

describe('cutscene steps (T25)', () => {
  it('block the story, keep the last marker across save/restore and grant nothing by themselves', async () => {
    const game = await toCutscene();
    const before = game.host.getView();
    expect(before.run?.step).toMatchObject({ kind: 'cutscene', id: 'test-letter', marker: null });
    expect((await game.host.dispatch({ type: 'next' })).ok).toBe(false);
    requireValue(await game.host.dispatch({ type: 'cutscene-marker', marker: 'letter-open' }));
    const saved = JSON.parse(JSON.stringify(game.host.snapshot()));
    const restored = createGame(new PackLibrary(withCutscene()));
    requireValue(await restored.host.restore(saved));
    expect(restored.host.getView().run?.step).toMatchObject({
      kind: 'cutscene',
      marker: 'letter-open',
    });
    expect(restored.host.getView().buttons).toBe(before.buttons);
    requireValue(await restored.host.dispatch({ type: 'cutscene', outcome: 'skipped' }));
    const after = restored.host.getView();
    expect(after.run?.step?.kind).not.toBe('cutscene');
    // The rewards are ordinary steps after the cutscene: granted once, whether watched or skipped.
    expect(after.buttons).toBe(5);
  });

  it('is not shown again when its scene is re-entered', async () => {
    const game = await toCutscene();
    requireValue(await game.host.dispatch({ type: 'cutscene', outcome: 'completed' }));
    const state = JSON.parse(JSON.stringify(game.host.snapshot()));
    const updated = withCutscene();
    updated[1]!.revision = 'prologue-cutscene-test-2';
    const { migrateProfileJson } = await import('../src/index.js');
    const fresh = createGame(new PackLibrary(updated));
    const migrated = migrateProfileJson(
      state.world.resources['aegis.runtime.state'],
      fresh.rules,
      fresh.content.data,
    );
    requireValue(await fresh.host.dispatch({ type: 'import', state: migrated as never }));
    expect(fresh.host.getView().run?.scene.id).toBe('P3');
    expect(fresh.host.getView().run?.step?.kind).not.toBe('cutscene');
  });
});
