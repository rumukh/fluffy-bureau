// Scenario traces for the prologue and every case 1 variant, driven by C's content packs:
// the solution path, every wrong version and wrong minigame answer, hint exhaustion and notebook
// help, and save/restore at every node (including mid-minigame).
import { describe, expect, it } from 'vitest';
import { requireValue } from '@aegis/runtime';
import { autoplay, createGame, type AutoplayPolicy, type GameAction } from '../src/index.js';
import { library, newGame } from './packs.js';

const variants = ['case01-l1', 'case01-l2', 'case01-l3'] as const;

async function withPrologue(policy: AutoplayPolicy = {}) {
  const game = newGame();
  await autoplay(game.host, game.rules, 'prologue', policy);
  requireValue(await game.host.dispatch({ type: 'leave' }));
  return game;
}

describe('scenario traces', () => {
  it('prologue: straight and with wrong guesses', async () => {
    const straight = newGame();
    const plain = await autoplay(straight.host, straight.rules, 'prologue');
    expect(plain.view.run?.ended).toBe(true);
    expect(plain.view.packs.find((p) => p.id === 'prologue')?.completed).toBe(true);
    expect(plain.view.buttons).toBe(5);
    const wrong = newGame();
    const result = await autoplay(wrong.host, wrong.rules, 'prologue', {
      wrongFirst: true,
      wrongVersions: true,
      useHelp: true,
    });
    expect(result.view.run?.versionAttempts).toBeGreaterThan(1);
    expect(result.view.buttons).toBe(5);
  });

  for (const pack of variants) {
    describe(pack, () => {
      it('solution path completes with rewards, facts and glossary', async () => {
        const game = await withPrologue();
        const { view } = await autoplay(game.host, game.rules, pack);
        expect(view.run?.ended).toBe(true);
        expect(view.run?.versionAttempts).toBe(1);
        expect(view.facts).toHaveLength(3);
        expect(view.glossary.length).toBeGreaterThanOrEqual(3);
        expect(view.hearts).toBeGreaterThanOrEqual(1);
        expect(view.buttons).toBe(5 + { 'case01-l1': 10, 'case01-l2': 15, 'case01-l3': 20 }[pack]);
        expect(view.decor.map((d) => d.item)).toContain('rw-c1-decor-basket');
      });

      it('every wrong version and wrong answer is explained and never punitive', async () => {
        const game = await withPrologue();
        const explanations: string[] = [];
        const { view } = await autoplay(game.host, game.rules, pack, {
          wrongFirst: true,
          wrongVersions: true,
          after: (action, current) => {
            if (action.type === 'version' && current.run?.queue)
              explanations.push(current.run.queue.line.id);
          },
        });
        const logic = game.rules.library.current(pack)!.logic!;
        const wrongValues = logic.axes.reduce((n, axis) => n + axis.values.length - 1, 0);
        expect(view.run?.versionAttempts).toBe(wrongValues + 1);
        expect(explanations).toHaveLength(wrongValues);
        expect(view.run?.ended).toBe(true);
        expect(view.buttons).toBe(5 + { 'case01-l1': 10, 'case01-l2': 15, 'case01-l3': 20 }[pack]);
      });

      it('hint exhaustion and notebook help never block the case', async () => {
        const game = await withPrologue();
        const hintLines: string[] = [];
        const { view } = await autoplay(game.host, game.rules, pack, {
          exhaustHints: true,
          useHelp: true,
          after: (action, current) => {
            if (action.type === 'hint' && current.run?.queue)
              hintLines.push(current.run.queue.line.id);
          },
        });
        expect(view.run?.ended).toBe(true);
        expect(hintLines.length).toBeGreaterThan(0);
        const klubok = game.rules.library.current(pack)!.hints!.klubok;
        expect(view.run?.hints.klubok.remaining).toBeGreaterThanOrEqual(0);
        expect(hintLines).toContain(klubok.review);
      });

      it('save and restore at every node gives the same view and hash', async () => {
        const game = await withPrologue();
        let checked = 0;
        let midMinigame = 0;
        await autoplay(game.host, game.rules, pack, {
          wrongFirst: true,
          after: async () => {
            const saved = JSON.parse(JSON.stringify(game.host.snapshot()));
            const fresh = createGame(library());
            requireValue(await fresh.host.restore(saved));
            expect(fresh.host.getView()).toEqual(game.host.getView());
            expect(fresh.host.hash()).toBe(game.host.hash());
            if (fresh.host.getView().run?.step?.kind === 'minigame') midMinigame++;
            checked++;
            await fresh.host.dispose();
          },
        });
        expect(checked).toBeGreaterThan(50);
        expect(midMinigame).toBeGreaterThan(5);
      });
    });
  }

  it('replaying a level grants no second rewards (Q38)', async () => {
    const game = await withPrologue();
    await autoplay(game.host, game.rules, 'case01-l1');
    requireValue(await game.host.dispatch({ type: 'leave' }));
    const before = game.host.getView();
    await autoplay(game.host, game.rules, 'case01-l1');
    const after = game.host.getView();
    expect(after.buttons).toBe(before.buttons);
    expect(after.hearts).toBe(before.hearts);
  });

  it('restart within a case keeps profile progress and switches difficulty (D02)', async () => {
    const game = await withPrologue();
    await autoplay(game.host, game.rules, 'case01-l1', {
      stopWhen: (view) => (view.run?.notebook?.clues.length ?? 0) >= 1,
    });
    const restart: GameAction = { type: 'start', pack: 'case01-l2' };
    requireValue(await game.host.dispatch(restart));
    const view = game.host.getView();
    expect(view.run?.pack).toBe('case01-l2');
    expect(view.run?.notebook?.clues).toEqual([]);
    expect(view.avatar.name).toBe('Ася');
  });
});
