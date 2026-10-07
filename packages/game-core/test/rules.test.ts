import { describe, expect, it } from 'vitest';
import { requireValue } from '@aegis/runtime';
import { autoplay, createGame, type GameAction, type GameView } from '../src/index.js';
import { prologuePack, sharedPack } from './fixtures/mini-pack.js';

async function play(actions: GameAction[]) {
  const game = createGame([sharedPack, prologuePack]);
  for (const action of actions) requireValue(await game.host.dispatch(action));
  return game;
}

const intro: GameAction[] = [
  { type: 'start', pack: 'prologue' },
  { type: 'next' },
  { type: 'next' },
  { type: 'avatar.species', value: 'fox' },
  { type: 'avatar.name', value: 'Ася' },
  { type: 'avatar.scarf', value: 'sage' },
];

const step = (view: GameView) => view.run?.step;

describe('step interpreter', () => {
  it('walks lines, awaits and avatar input with name substitution', async () => {
    const game = await play(intro);
    const view = game.host.getView();
    expect(view.avatar).toEqual({ species: 'fox', name: 'Ася', scarf: 'sage', hat: null });
    expect(step(view)).toMatchObject({
      kind: 'line',
      line: { id: 'P0-05', text: 'Записала, Ася!' },
    });
  });

  it('rejects multi-word names (T04) and maps skip to «Стажёр»', async () => {
    const game = await play(intro.slice(0, 4));
    const bad = await game.host.dispatch({ type: 'avatar.name', value: 'Ася Петрова' });
    expect(bad.ok).toBe(false);
    requireValue(await game.host.dispatch({ type: 'avatar.name', value: null }));
    expect(game.host.getView().avatar.name).toBe('Стажёр');
  });

  it('runs skills once, minigame feedback, awaits and lamp', async () => {
    const game = await play([...intro, { type: 'next' }]);
    let view = game.host.getView();
    expect(view.run?.stage).toEqual(['bubbles']);
    expect(step(view)).toMatchObject({ kind: 'line', line: { id: 'P1-04' } });
    requireValue(await game.host.dispatch({ type: 'next' }));
    view = game.host.getView();
    expect(view.skills).toContain('inspect');
    expect(step(view)).toMatchObject({ kind: 'minigame', game: 'magnifier' });
    requireValue(await game.host.dispatch({ type: 'move', value: { target: 'loupe' } }));
    view = game.host.getView();
    expect(view.run?.queue?.line.id).toBe('P1-05');
    // Moves are blocked while a reply is being shown.
    expect((await game.host.dispatch({ type: 'move', value: { target: 'notebook' } })).ok).toBe(
      false,
    );
    requireValue(await game.host.dispatch({ type: 'next' }));
    requireValue(await game.host.dispatch({ type: 'move', value: { target: 'notebook' } }));
    requireValue(await game.host.dispatch({ type: 'next' }));
    view = game.host.getView();
    expect(step(view)).toMatchObject({ kind: 'line', line: { id: 'P1-10' } });
    requireValue(await game.host.dispatch({ type: 'next' }));
    expect(step(game.host.getView())).toEqual({ kind: 'await', action: 'lamp.on' });
    requireValue(await game.host.dispatch({ type: 'lamp', on: true }));
    view = game.host.getView();
    expect(view.lamp).toBe(true);
    expect(step(view)).toMatchObject({ kind: 'line', line: { id: 'P2-03' } });
  });

  const toGlasses: GameAction[] = [
    ...intro,
    { type: 'next' },
    { type: 'next' },
    { type: 'move', value: { target: 'loupe' } },
    { type: 'next' },
    { type: 'move', value: { target: 'notebook' } },
    { type: 'next' },
    { type: 'next' },
    { type: 'lamp', on: true },
    { type: 'next' },
  ];

  it('gives hints, never spends on review, and respects the klubok allowance', async () => {
    const game = await play(toGlasses);
    requireValue(await game.host.dispatch({ type: 'hint', channel: 'klubok' }));
    let view = game.host.getView();
    expect(view.run?.queue?.line.id).toBe('H-1');
    expect(view.run?.hints.klubok.remaining).toBe(0);
    requireValue(await game.host.dispatch({ type: 'next' }));
    requireValue(await game.host.dispatch({ type: 'hint', channel: 'klubok' }));
    view = game.host.getView();
    expect(view.run?.queue?.line.id).toBe('H-review');
    expect(view.run?.hints.klubok.remaining).toBe(0);
    requireValue(await game.host.dispatch({ type: 'next' }));
    requireValue(await game.host.dispatch({ type: 'hint', channel: 'shell' }));
    expect(game.host.getView().run?.queue?.line.id).toBe('H-1');
  });

  it('explains a wrong version without penalty and accepts the right one', async () => {
    const game = await play([
      ...toGlasses,
      { type: 'move', value: { target: 'shelf' } },
      { type: 'next' },
      { type: 'move', value: { target: 'mirror' } },
      { type: 'next' },
    ]);
    let view = game.host.getView();
    expect(step(view)).toMatchObject({ kind: 'version', available: true });
    requireValue(await game.host.dispatch({ type: 'version', selection: { where: 'shelf' } }));
    view = game.host.getView();
    expect(view.run?.queue?.line.id).toBe('P2-14');
    requireValue(await game.host.dispatch({ type: 'next' }));
    expect(game.host.getView().run?.queue?.line.id).toBe('P2-16');
    requireValue(await game.host.dispatch({ type: 'next' }));
    requireValue(await game.host.dispatch({ type: 'version', selection: { where: 'head' } }));
    view = game.host.getView();
    expect(step(view)).toMatchObject({ kind: 'line', line: { id: 'P2-11' } });
    expect(view.run?.versionAttempts).toBe(2);
    requireValue(await game.host.dispatch({ type: 'next' }));
    view = game.host.getView();
    expect(view.buttons).toBe(5);
    expect(view.rewards.map((r) => r.id)).toEqual(['badge']);
  });

  it('notebook help suggests but never places stickers; contradictions are allowed', async () => {
    const game = await play([
      ...toGlasses,
      { type: 'move', value: { target: 'mirror' } },
      { type: 'next' },
    ]);
    requireValue(
      await game.host.dispatch({ type: 'mark', axis: 'where', value: 'kettle', mark: 'confirmed' }),
    );
    requireValue(
      await game.host.dispatch({ type: 'mark', axis: 'where', value: 'head', mark: 'confirmed' }),
    );
    requireValue(await game.host.dispatch({ type: 'help' }));
    let view = game.host.getView();
    expect(view.run?.queue?.line.id).toBe('N-shelf');
    expect(view.run?.notebook?.suggestions).toHaveLength(1);
    expect(view.run?.notebook?.marks.some((m) => m.value === 'shelf')).toBe(false);
    requireValue(await game.host.dispatch({ type: 'next' }));
    requireValue(await game.host.dispatch({ type: 'accept', axis: 'where', value: 'shelf' }));
    view = game.host.getView();
    expect(view.run?.notebook?.marks).toContainEqual({
      axis: 'where',
      value: 'shelf',
      mark: 'excluded',
      source: 'evidence',
    });
    expect(view.run?.notebook?.marks.filter((m) => m.mark === 'confirmed')).toHaveLength(2);
    requireValue(
      await game.host.dispatch({ type: 'mark', axis: 'where', value: 'kettle', mark: 'none' }),
    );
    expect(game.host.getView().run?.notebook?.marks).toHaveLength(2);
  });

  it('finishes the pack once: map hub, end, facts and no double rewards on replay', async () => {
    const solve: GameAction[] = [
      ...toGlasses,
      { type: 'move', value: { target: 'mirror' } },
      { type: 'next' },
      { type: 'version', selection: { where: 'head' } },
      { type: 'next' },
    ];
    const game = await play(solve);
    let view = game.host.getView();
    expect(step(view)).toMatchObject({ kind: 'menu', hub: true, location: 'map' });
    expect(step(view)?.kind === 'menu' && step(view)).toMatchObject({
      options: [{ id: 'street' }],
    });
    requireValue(await game.host.dispatch({ type: 'choose', option: 'street' }));
    view = game.host.getView();
    expect(view.run?.ended).toBe(true);
    expect(view.facts.map((f) => f.id)).toEqual(['fact-1']);
    expect(view.packs.find((p) => p.id === 'prologue')?.completed).toBe(true);
    requireValue(await game.host.dispatch({ type: 'leave' }));
    // Replay: rewards are claimed once per profile (Q38, Q40).
    await autoplay(game.host, game.rules, 'prologue', { wrongFirst: true, wrongVersions: true });
    expect(game.host.getView().buttons).toBe(5);
  });

  it('restores to an identical view from a JSON snapshot at every node', async () => {
    const actions: GameAction[] = [
      ...toGlasses,
      { type: 'move', value: { target: 'shelf' } },
      { type: 'next' },
      { type: 'hint', channel: 'klubok' },
      { type: 'next' },
      { type: 'move', value: { target: 'mirror' } },
      { type: 'next' },
      { type: 'version', selection: { where: 'shelf' } },
      { type: 'next' },
      { type: 'next' },
      { type: 'version', selection: { where: 'head' } },
      { type: 'next' },
      { type: 'choose', option: 'street' },
    ];
    const game = createGame([sharedPack, prologuePack]);
    for (const action of actions) {
      requireValue(await game.host.dispatch(action));
      const saved = JSON.parse(JSON.stringify(game.host.snapshot()));
      const fresh = createGame([sharedPack, prologuePack]);
      requireValue(await fresh.host.restore(saved));
      expect(fresh.host.getView()).toEqual(game.host.getView());
      expect(fresh.host.hash()).toBe(game.host.hash());
      await fresh.host.dispose();
    }
  });
});
