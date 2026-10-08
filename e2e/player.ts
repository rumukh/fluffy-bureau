// UI-driven player for end-to-end tests. It reads only the DOM plus the shipped content packs
// (to know the right answers), never game internals.
import { expect, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type InputMode = 'mouse' | 'touch' | 'keyboard';

const distDir = join(process.cwd(), 'apps', 'game', 'dist');

interface Pack {
  id: string;
  minigames: { id: string; config: Record<string, unknown> & { kind: string } }[];
  logic: { axes: { id: string }[]; intended: Record<string, string> } | null;
}

export function loadPack(id: string): Pack {
  const index = JSON.parse(readFileSync(join(distDir, 'content', 'index.json'), 'utf8')) as {
    packs: { id: string; url: string }[];
  };
  const entry = index.packs.find((p) => p.id === id);
  if (!entry) throw new Error(`No pack ${id}`);
  return JSON.parse(readFileSync(join(distDir, entry.url), 'utf8')) as Pack;
}

export class Player {
  steps = 0;
  private chosen = new Set<string>();
  constructor(
    readonly page: Page,
    readonly mode: InputMode = 'mouse',
    /** Watch cutscenes line by line («Дальше»); otherwise they are skipped («Пропустить ролик»). */
    readonly watchCutscenes = false,
  ) {}

  async activate(target: Locator): Promise<void> {
    await expect(target).toBeVisible({ timeout: 15_000 });
    await expect(target).toBeEnabled({ timeout: 15_000 });
    this.steps++;
    if (this.mode === 'mouse') await target.click();
    else if (this.mode === 'touch') await target.tap();
    else await this.keyboardActivate(target);
    // Wait until the command finished (the action button clears aria-busy) before looking again.
    await this.page.waitForFunction(() => !document.querySelector('#app [aria-busy="true"]'));
  }

  private async keyboardActivate(target: Locator): Promise<void> {
    // Keyboard only: Tab to the control (bounded), then Enter.
    for (let i = 0; i < 80; i++) {
      if (await target.evaluate((node) => node === document.activeElement)) {
        await this.page.keyboard.press('Enter');
        return;
      }
      await this.page.keyboard.press('Tab');
    }
    const where = await this.page.evaluate(() => {
      const a = document.activeElement as HTMLElement | null;
      return `${a?.tagName}.${a?.dataset?.key ?? ''}`;
    });
    throw new Error(
      `Not reachable by keyboard: ${await target.getAttribute('data-key')} (focus ${where})`,
    );
  }

  key(key: string): Locator {
    return this.page.locator(`#app [data-key="${key}"]`).first();
  }

  async createProfile(): Promise<void> {
    await this.activate(this.key('profile-new'));
  }

  async stepKind(): Promise<string> {
    return (await this.page.locator('.game.run').getAttribute('data-step')) ?? 'none';
  }

  /** Plays the current pack to its end screen using the right answers. */
  async playToEnd(packId: string, options: { stopAt?: (p: Player) => Promise<boolean> } = {}) {
    const pack = loadPack(packId);
    for (let guard = 0; guard < 1500; guard++) {
      if (options.stopAt && (await options.stopAt(this))) return;
      const page = this.page;
      await page.waitForFunction(() => !document.querySelector('#app')?.getAttribute('aria-busy'));
      if (await page.locator('.case-end').count()) return;
      const next = this.key('next');
      if ((await this.stepKind()) === 'cutscene') {
        if (!this.watchCutscenes) {
          const skip = this.key('cutscene-skip');
          if (await skip.isVisible().catch(() => false)) await this.activate(skip);
          else await page.waitForTimeout(200);
        } else if (await next.isEnabled().catch(() => false)) await this.activate(next);
        else await page.waitForTimeout(250);
        continue;
      }
      if (await next.isVisible().catch(() => false)) {
        await this.activate(next);
        continue;
      }
      const kind = await this.stepKind();
      if (kind === 'line') {
        await this.activate(next);
        continue;
      }
      if (kind === 'await') {
        await this.handleAwait();
        continue;
      }
      if (kind === 'menu') {
        const version = this.key('open-version');
        const keys = await page
          .locator('#app .menu .choice')
          .evaluateAll((nodes) => nodes.map((n) => (n as HTMLElement).dataset.key ?? ''));
        const fresh = keys.find((k) => !this.chosen.has(`${packId}:${k}`));
        if (fresh) {
          this.chosen.add(`${packId}:${fresh}`);
          await this.activate(this.key(fresh));
        } else if (await version.count()) {
          await this.activate(version);
          await this.submitVersion(pack);
        } else if (keys[0]) await this.activate(this.key(keys[0]));
        else throw new Error('Menu without options or version');
        continue;
      }
      if (kind === 'minigame') {
        await this.playMinigame(pack);
        continue;
      }
      throw new Error(`Unexpected step ${kind}`);
    }
    throw new Error('Too many steps');
  }

  async handleAwait(): Promise<void> {
    const page = this.page;
    await page.waitForTimeout(100);
    if ((await this.stepKind()) !== 'await') return;
    if (await this.key('species-fox').count()) return this.activate(this.key('species-fox'));
    if (await this.key('name-input').count()) {
      const input = this.key('name-input');
      if (this.mode === 'touch') await input.tap();
      else await input.focus();
      await page.keyboard.type('Ася');
      return this.activate(this.key('name-done'));
    }
    if (await this.key('scarf-sage').count()) return this.activate(this.key('scarf-sage'));
    if (await this.key('await-lamp').count()) return this.activate(this.key('await-lamp'));
    if (await this.key('await-replay').count()) return this.activate(this.key('await-replay'));
    if (await this.key('await-notebook').count()) {
      await this.activate(this.key('await-notebook'));
      return this.activate(this.key('overlay-close'));
    }
    if (await this.key('await-pause').count()) {
      await this.activate(this.key('await-pause'));
      return this.activate(this.key('p-continue'));
    }
    const slot = page.locator('#app [data-key^="slot-"]').first();
    if (await slot.count()) return this.activate(slot);
    throw new Error('Unknown await');
  }

  async submitVersion(pack: Pack): Promise<void> {
    for (const axis of pack.logic!.axes)
      await this.activate(this.key(`pick-${axis.id}-${pack.logic!.intended[axis.id]}`));
    await this.activate(this.key('version-submit'));
  }

  async playMinigame(pack: Pack): Promise<void> {
    const page = this.page;
    const id = await page.locator('#app .minigame').getAttribute('data-minigame');
    const game = pack.minigames.find((m) => m.id === id)!;
    const config = game.config as Record<string, unknown>;
    switch (game.config.kind) {
      case 'magnifier': {
        const spot = page.locator('#app .hotspot.glow').first();
        await this.activate(spot);
        return;
      }
      case 'cocoa': {
        const round = Number(
          ((await page.locator('#app .minigame .progress').textContent()) ?? '1').match(
            /(\d+)/,
          )![1],
        );
        const options = (
          config.rounds as unknown as { options: { id: string; correct: boolean }[] }[]
        )[round - 1]!.options;
        await this.activate(this.key(`mg-${options.find((o) => o.correct)!.id}`));
        return;
      }
      case 'tracks':
      case 'scent-pairs': {
        type Step = { options: { id: string; correct: boolean }[] };
        const question = config.question as Step | null | undefined;
        const steps: Step[] = [
          ...(game.config.kind === 'tracks' ? (config.steps as unknown as Step[]) : []),
          ...(question ? [question] : []),
        ];
        const choices = page.locator('#app .minigame .choice');
        if (await choices.count()) {
          for (const step of steps) {
            const correct = step.options.find((o) => o.correct)!;
            const target = this.key(`mg-${correct.id}`);
            if (await target.count()) {
              await this.activate(target);
              return;
            }
          }
          throw new Error('No correct option on screen');
        }
        // Pairs: open a hidden card, then its partner.
        const fields = config.fields as unknown as { cards: { id: string; pair: string }[] }[];
        const hidden = page.locator('#app .scent:not(.matched):not(.open)');
        const open = page.locator('#app .scent.open');
        if ((await open.count()) === 1) {
          const openId = (await open.first().getAttribute('data-key'))!.replace('scent-', '');
          const field = fields.find((f) => f.cards.some((c) => c.id === openId))!;
          const pair = field.cards.find((c) => c.id === openId)!.pair;
          const partner = field.cards.find((c) => c.pair === pair && c.id !== openId)!;
          await this.activate(this.key(`scent-${partner.id}`));
        } else await this.activate(hidden.first());
        return;
      }
      case 'timeline': {
        const solution = config.solution as unknown as string[];
        for (let i = 0; i < solution.length; i++) {
          const slot = this.key(`slot-${i}`);
          if ((await slot.getAttribute('class'))?.includes('filled')) continue;
          await this.activate(this.key(`card-${solution[i]}`));
          await this.activate(this.key(`slot-${i}`));
          return;
        }
        await this.activate(this.key('timeline-submit'));
        return;
      }
      case 'baker': {
        const steps = config.steps as unknown as {
          prompt: string;
          ideal: string[];
          target: number;
        }[];
        const measures = config.measures as unknown as { id: string; units: number }[];
        const filled = await page.locator('#app .unit.full').count();
        const total = await page.locator('#app .unit').count();
        const step = steps.find((s) => s.target === total) ?? steps[0]!;
        const pick = measures
          .filter((m) => step.ideal.includes(m.id) && m.units <= total - filled)
          .sort((a, b) => b.units - a.units)[0]!;
        await this.activate(this.key(`measure-${pick.id}`));
        return;
      }
    }
    throw new Error(`Cannot play ${game.config.kind}`);
  }
}
