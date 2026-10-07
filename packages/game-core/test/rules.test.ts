import { describe, expect, it } from 'vitest';
import { requireValue } from '@aegis/runtime';
import { autoplay, isValidName, type GameAction } from '../src/index.js';
import { newGame } from './packs.js';

async function play(actions: GameAction[]) {
  const game = newGame();
  for (const action of actions) requireValue(await game.host.dispatch(action));
  return game;
}

/** Advances through lines/queue until a non-line step. */
async function skipLines(game: ReturnType<typeof newGame>) {
  for (let i = 0; i < 200; i++) {
    const run = game.host.getView().run!;
    if (!run.queue && run.step?.kind !== 'line') return run;
    requireValue(await game.host.dispatch({ type: 'next' }));
  }
  throw new Error('Too many lines');
}

describe('rules', () => {
  it('validates one-word names (T04)', () => {
    expect(isValidName('Ася')).toBe(true);
    expect(isValidName('Анна-Мария')).toBe(true);
    expect(isValidName('Ann')).toBe(true);
    expect(isValidName('А')).toBe(false);
    expect(isValidName('Ася Петрова')).toBe(false);
    expect(isValidName('Абвгдеёжзийкл')).toBe(false);
    expect(isValidName('R2D2')).toBe(false);
  });

  it('case 1 is locked until the prologue is complete', async () => {
    const game = newGame();
    expect((await game.host.dispatch({ type: 'start', pack: 'case01-l1' })).ok).toBe(false);
    const view = game.host.getView();
    expect(view.packs.find((p) => p.id === 'prologue')?.unlocked).toBe(true);
  });

  it('prologue: avatar input, name substitution and the never-auto-advancing flow', async () => {
    const game = await play([{ type: 'start', pack: 'prologue' }]);
    let run = await skipLines(game);
    expect(run.step).toEqual({ kind: 'await', action: 'avatar.species' });
    requireValue(await game.host.dispatch({ type: 'avatar.species', value: 'fox' }));
    run = await skipLines(game);
    expect(run.step).toEqual({ kind: 'await', action: 'avatar.name' });
    expect((await game.host.dispatch({ type: 'avatar.name', value: 'Ася Петрова' })).ok).toBe(
      false,
    );
    requireValue(await game.host.dispatch({ type: 'avatar.name', value: 'Ася' }));
    run = game.host.getView().run!;
    const texts: string[] = [];
    for (let i = 0; i < 20 && (run.queue || run.step?.kind === 'line'); i++) {
      texts.push((run.queue?.line ?? (run.step as { line: { text: string } }).line).text);
      requireValue(await game.host.dispatch({ type: 'next' }));
      run = game.host.getView().run!;
    }
    expect(game.host.getView().avatar.name).toBe('Ася');
    expect(texts.join(' ')).not.toContain('{имя}');
  });

  it('notebook help proposes but never places a sticker; hub re-evaluates on ✔', async () => {
    const game = newGame();
    // Play the prologue up to the glasses hub.
    await autoplay(game.host, game.rules, 'prologue', {
      maxActions: 10_000,
      after: async () => {},
      stopWhen: (view) => view.run?.scene.id === 'P2-HUB' && view.run.step?.kind === 'menu',
    });
    requireValue(await game.host.dispatch({ type: 'choose', option: 'shelf' }));
    await skipLines(game);
    requireValue(await game.host.dispatch({ type: 'help' }));
    let view = game.host.getView();
    expect(view.run?.notebook?.suggestions.length).toBeGreaterThan(0);
    expect(view.run?.notebook?.marks).toEqual([]);
    await skipLines(game);
    requireValue(
      await game.host.dispatch({ type: 'mark', axis: 'where', value: 'teapot', mark: 'confirmed' }),
    );
    view = game.host.getView();
    // ✔ in «Где?» makes the guess available: the hub moved on to P2-GUESS.
    expect(view.run?.scene.id).toBe('P2-GUESS');
  });
});
