// Scenario traces for Stage 2 packs (cases 2–4), driven by the production content packs.
import { describe, expect, it } from 'vitest';
import { requireValue } from '@aegis/runtime';
import {
  autoplay,
  createGame,
  initialProfile,
  type AutoplayPolicy,
  type GameAction,
} from '../src/index.js';
import { library, newGame } from './packs.js';

const variants = [
  'case02-l1',
  'case02-l2',
  'case02-l3',
  'case03-l1',
  'case03-l2',
  'case03-l3',
  'case04-l1',
  'case04-l2',
  'case04-l3',
] as const;

function prerequisites(pack: string): string[] {
  const match = /^case(\d\d)-l([123])$/.exec(pack);
  const caseNumber = Number(match?.[1] ?? 0);
  const level = match?.[2] ?? '1';
  return [
    'prologue',
    ...Array.from(
      { length: Math.max(0, caseNumber - 1) },
      (_, index) => `case${String(index + 1).padStart(2, '0')}-l${level}`,
    ),
  ];
}

async function unlockedGame(pack: string) {
  const game = newGame(true);
  const profile = initialProfile();
  profile.completed = prerequisites(pack);
  requireValue(
    await game.host.dispatch({ type: 'import', state: JSON.parse(JSON.stringify(profile)) }),
  );
  return game;
}

async function runStage2(pack: string, policy: AutoplayPolicy = {}) {
  const game = await unlockedGame(pack);
  return { game, ...(await autoplay(game.host, game.rules, pack, policy)) };
}

describe('Stage 2 scenario traces', () => {
  for (const pack of variants) {
    describe(pack, () => {
      it('solution path completes with rewards, facts and glossary', async () => {
        const { view } = await runStage2(pack);
        expect(view.run?.ended).toBe(true);
        expect(view.run?.versionAttempts).toBe(1);
        expect(view.facts.length).toBeGreaterThan(0);
        expect(view.glossary.length).toBeGreaterThan(0);
        expect(view.buttons).toBeGreaterThan(0);
      });

      if (pack === 'case03-l3')
        it("keeps the child's own light signal in the profile (D22)", async () => {
          const { view } = await runStage2(pack);
          expect(view.signal?.length).toBeGreaterThanOrEqual(3);
        });

      if (pack.startsWith('case02') || pack.startsWith('case04'))
        it('reaching the rank shows the news once in the office (D12)', async () => {
          const { game } = await runStage2(pack);
          requireValue(await game.host.dispatch({ type: 'leave' }));
          const news = game.host.getView().newRank;
          expect(news?.id).toBe(pack.startsWith('case02') ? 'helper' : 'junior');
          requireValue(await game.host.dispatch({ type: 'rank-seen', rank: news!.id }));
          expect(game.host.getView().newRank).toBeNull();
          expect(game.host.getView().rankLine?.id).toBe(news!.label.id);
        });

      if (pack === 'case02-l1')
        it("unlocks the cipher poster page with the case's table (T26)", async () => {
          const { view } = await runStage2(pack);
          const poster = view.notebookPages.find((p) => p.kind === 'cipher-poster');
          expect(poster && 'table' in poster ? poster.table.length : 0).toBeGreaterThanOrEqual(8);
        });

      it('every wrong version and wrong answer is explained and never punitive', async () => {
        const explanations: string[] = [];
        const moves: GameAction[] = [];
        const { game, view } = await runStage2(pack, {
          wrongFirst: true,
          wrongVersions: true,
          after: (action, current) => {
            moves.push(action);
            if ((action.type === 'version' || action.type === 'move') && current.run?.queue)
              explanations.push(current.run.queue.line.id);
          },
        });
        const logic = game.rules.library.current(pack)!.logic!;
        const wrongValues = logic.axes.reduce((n, axis) => n + axis.values.length - 1, 0);
        expect(view.run?.versionAttempts).toBe(wrongValues + 1);
        expect(explanations.length).toBeGreaterThanOrEqual(wrongValues);
        expect(moves.filter((action) => action.type === 'move').length).toBeGreaterThan(0);
        expect(view.run?.ended).toBe(true);
      });

      it('hint exhaustion and notebook help never block the case', async () => {
        const hintLines: string[] = [];
        const { view } = await runStage2(pack, {
          exhaustHints: true,
          useHelp: true,
          after: (action, current) => {
            if (action.type === 'hint' && current.run?.queue)
              hintLines.push(current.run.queue.line.id);
          },
        });
        expect(view.run?.ended).toBe(true);
        expect(hintLines.length).toBeGreaterThan(0);
      });

      it('save and restore at every node and mid-minigame gives the same view and hash', async () => {
        const game = await unlockedGame(pack);
        let checked = 0;
        let midMinigame = 0;
        await autoplay(game.host, game.rules, pack, {
          wrongFirst: true,
          after: async () => {
            const saved = JSON.parse(JSON.stringify(game.host.snapshot()));
            const fresh = createGame(library(true));
            requireValue(await fresh.host.restore(saved));
            expect(fresh.host.getView()).toEqual(game.host.getView());
            expect(fresh.host.hash()).toBe(game.host.hash());
            if (fresh.host.getView().run?.step?.kind === 'minigame') midMinigame++;
            checked++;
            await fresh.host.dispose();
          },
        });
        expect(checked).toBeGreaterThan(40);
        expect(midMinigame).toBeGreaterThan(0);
      });
    });
  }

  it('case 4 family-mode answers come from card facts and every player gets a title', async () => {
    const game = await unlockedGame('case04-l3');
    const factsSeen: { card: string; question: string; answer: boolean }[] = [];
    const { view } = await autoplay(game.host, game.rules, 'case04-l3', {
      family: true,
      wrongFirst: true,
      after: (action, current) => {
        if (action.type !== 'move') return;
        const step = current.run?.step;
        if (step?.kind !== 'minigame' || step.game !== 'dream-keeper') return;
        const projected = step.view as unknown as {
          picked: string | null;
          asked: { question: string; answer: boolean }[];
        };
        const latest = projected.asked.at(-1);
        if (projected.picked && latest)
          factsSeen.push({
            card: projected.picked,
            question: latest.question,
            answer: latest.answer,
          });
      },
    });
    expect(view.run?.ended).toBe(true);
    expect(factsSeen.length).toBeGreaterThan(0);
    const dreams = game.rules.library
      .current('case04-l3')!
      .minigames.find((m) => m.config.kind === 'dream-keeper')!.config;
    if (dreams.kind !== 'dream-keeper') throw new Error('Expected dream-keeper');
    for (const seen of factsSeen) {
      const card = dreams.rounds.flatMap((round) => round.cards).find((c) => c.id === seen.card)!;
      expect(seen.answer).toBe(card.facts[seen.question] === true);
    }
    const step = view.run?.step;
    expect(step?.kind).toBe('end');
    const completedDream = game.host.inspect().state.run?.minigame;
    expect(completedDream).toBeNull();
    const rewards = view.rewards.map((reward) => reward.kind);
    expect(rewards).toContain('title');
  });
});
