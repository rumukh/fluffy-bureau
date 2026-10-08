// «Уютный денёк»: shop with full refunds (T11, T29), wearing, decor, tea stories (T28), ranks (D12).
import { describe, expect, it } from 'vitest';
import { requireValue } from '@aegis/runtime';
import { packs } from '@fluffy/content';
import { autoplay, createGame, PackLibrary } from '../src/index.js';
import { stagePacks } from './packs.js';

async function cozyGame(levels = ['case01-l1']) {
  const game = createGame(new PackLibrary([...stagePacks, packs.cozy!]));
  for (const pack of ['prologue', ...levels]) {
    await autoplay(game.host, game.rules, pack);
    requireValue(await game.host.dispatch({ type: 'leave' }));
  }
  return game;
}

describe('cozy day', () => {
  it('buys, wears, returns for the full price and never goes below zero', async () => {
    const game = await cozyGame();
    const send = (action: Parameters<typeof game.host.dispatch>[0]) => game.host.dispatch(action);
    const before = game.host.getView();
    const cozy = before.cozy!;
    expect(cozy.shop.find((i) => i.id === 'hat-detective')!.onSale).toBe(false); // after case 4
    const hat = cozy.shop.find((i) => i.id === 'hat-acorn')!;
    expect(hat.onSale && hat.affordable).toBe(true);
    requireValue(await send({ type: 'buy', item: 'hat-acorn' }));
    let view = game.host.getView();
    expect(view.buttons).toBe(before.buttons - hat.price.amount);
    expect(view.cozy!.office?.line.id).toBe('CZ-BOUGHT');
    requireValue(await send({ type: 'office-next' }));
    requireValue(await send({ type: 'wear', item: 'hat-acorn', on: true }));
    expect(game.host.getView().avatar.hat).toBe('hat-acorn');
    requireValue(await send({ type: 'refund', item: 'hat-acorn' }));
    view = game.host.getView();
    expect(view.buttons).toBe(before.buttons);
    expect(view.avatar.hat).toBeNull();
    expect(view.cozy!.shop.find((i) => i.id === 'hat-acorn')!.owned).toBe(false);
    // Not enough: a gentle line, nothing changes.
    const pricey = view.cozy!.shop.filter((i) => i.onSale && !i.affordable)[0];
    if (pricey) {
      requireValue(await send({ type: 'buy', item: pricey.id }));
      const after = game.host.getView();
      expect(after.cozy!.office?.line.id).toBe('CZ-NOT-ENOUGH');
      expect(after.buttons).toBe(view.buttons);
      expect(after.hearts).toBe(view.hearts);
    }
  });

  it('decor from the shop goes on an office slot and leaves it when returned', async () => {
    // Decor costs 3–8 hearts (T11): earned across levels of case 1.
    const game = await cozyGame(['case01-l1', 'case01-l2', 'case01-l3']);
    const send = (action: Parameters<typeof game.host.dispatch>[0]) => game.host.dispatch(action);
    const decor = game.host.getView().cozy!.shop.find((i) => i.kind === 'decor' && i.affordable);
    expect(decor).toBeDefined();
    requireValue(await send({ type: 'buy', item: decor!.id }));
    requireValue(await send({ type: 'decor', item: decor!.id, slot: 'floor' }));
    expect(game.host.getView().decor).toContainEqual({ item: decor!.id, slot: 'floor' });
    requireValue(await send({ type: 'refund', item: decor!.id }));
    expect(game.host.getView().decor.some((d) => d.item === decor!.id)).toBe(false);
  });

  it('a tea party costs two hearts and tells the next story, then repeats', async () => {
    const game = await cozyGame();
    const send = (action: Parameters<typeof game.host.dispatch>[0]) => game.host.dispatch(action);
    const view = game.host.getView();
    const resident = view.cozy!.residents[0]!;
    expect(view.cozy!.residents.some((r) => r.speaker === 'damka')).toBe(false); // after case 3
    if (view.hearts < 2) return;
    requireValue(await send({ type: 'tea', speaker: resident.speaker }));
    const lines: string[] = [];
    for (let v = game.host.getView(); v.cozy!.office; v = game.host.getView()) {
      lines.push(v.cozy!.office.line.id);
      requireValue(await send({ type: 'office-next' }));
    }
    expect(lines.at(-1)).toBe('CZ-TEA-THANKS');
    expect(lines.length).toBeGreaterThanOrEqual(5);
    const after = game.host.getView();
    expect(after.hearts).toBe(view.hearts - 2);
    expect(after.cozy!.residents[0]!.told).toBe(1);
  });

  it('shop and tea are office-only; ranks come from the cozy pack', async () => {
    const game = await cozyGame();
    expect(game.host.getView().rankLine?.id).toBe('RANK-intern');
    expect(game.host.getView().newRank).toBeNull();
    requireValue(await game.host.dispatch({ type: 'start', pack: 'case01-l2' }));
    expect((await game.host.dispatch({ type: 'buy', item: 'hat-acorn' })).ok).toBe(false);
  });

  it('Stage 1 saves (no Stage 2 fields) still load', async () => {
    const game = await cozyGame();
    const state = structuredClone(
      game.host.snapshot().world.resources['aegis.runtime.state'] as Record<string, unknown>,
    );
    for (const key of ['owned', 'pattern', 'teas', 'signal', 'ranksSeen', 'office'])
      delete state[key];
    const fresh = createGame(new PackLibrary([...stagePacks, packs.cozy!]));
    requireValue(await fresh.host.dispatch({ type: 'import', state: state as never }));
    expect(fresh.host.getView().cozy!.shop.length).toBeGreaterThan(0);
  });
});
