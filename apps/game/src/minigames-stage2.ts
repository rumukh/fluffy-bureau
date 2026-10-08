import { glyphArt, glyphDescription } from './glyph.js';
import type { LineView, RunView, StepView } from '@fluffy/game-core';
import type { App } from './app.js';
import { append, button, h } from './dom.js';

type Json = Record<string, unknown>;
type MinigameStep = Extract<StepView, { kind: 'minigame' }>;

type Glyph = {
  id: string;
  letter: string;
  colour: string;
  holes: number;
  shape: string;
  label: string;
};

type Choice = { id: string; label: string; off?: boolean; tried?: boolean };

function t(app: App, key: string): string {
  return app.labels(key).text;
}

function lineFrom(app: App, id: string | null): LineView | null {
  if (!id || !app.session) return null;
  for (const ref of app.session.game.content.data.packs) {
    const pack = app.session.game.rules.library.get(ref);
    const line = pack.lines.get(id);
    if (!line) continue;
    return {
      id: line.id,
      speaker: line.speaker,
      speakerName: '',
      text: line.text.replaceAll('{имя}', app.view()?.avatar.name ?? ''),
      voiced: line.voiced,
      kind: line.kind,
    };
  }
  return null;
}

function text(app: App, id: unknown): string {
  return lineFrom(app, typeof id === 'string' ? id : null)?.text ?? String(id ?? '');
}

function move(app: App, value: unknown) {
  app.voice.stop();
  return app.act({ type: 'move', value: value as never });
}

function pageItems<T>(app: App, key: string, items: readonly T[], size = 3): readonly T[] {
  const page = Number(app.ui[key] ?? 0);
  const max = Math.max(0, Math.ceil(items.length / size) - 1);
  const safe = Math.min(Math.max(0, page), max);
  app.ui[key] = safe;
  return items.slice(safe * size, safe * size + size);
}

function moreButton(app: App, key: string, count: number, size = 3): HTMLButtonElement | null {
  if (count <= size) return null;
  return button({ label: t(app, 'hud.more'), key: `${key}-more`, icon: '…' }, () => {
    const max = Math.ceil(count / size);
    app.ui[key] = (Number(app.ui[key] ?? 0) + 1) % max;
    app.render();
  });
}

function glyphNode(app: App, glyph: Glyph, revealed = true): HTMLElement {
  const label = text(app, glyph.label);
  return h(
    'span',
    { class: `glyph glyph-${glyph.shape}`, 'aria-label': label },
    glyphArt(app, glyph),
    h('span', { class: 'glyph-colour' }, glyphDescription(glyph)),
    h('span', { class: 'glyph-letter' }, revealed ? glyph.letter : '·'),
  );
}

function patternText(pattern: readonly unknown[]): string {
  return pattern.map((s) => (s === 'dash' ? 'тире' : 'точка')).join(', ');
}

function patternNode(pattern: readonly unknown[]): HTMLElement {
  return h(
    'span',
    { class: 'light-pattern', 'aria-label': patternText(pattern) },
    ...pattern.map((s) => h('span', { 'aria-hidden': 'true' }, s === 'dash' ? '▬' : '●')),
  );
}

function safeAsset(app: App, id: string): string | null {
  try {
    return app.assets.resolve(id);
  } catch {
    return null;
  }
}

function currentPack(app: App, run: RunView | null) {
  if (!app.session || !run) return null;
  const ref = app.session.game.content.data.packs.find((p) => p.id === run.pack);
  return ref ? app.session.game.rules.library.get(ref).pack : null;
}

function cipherTable(app: App, run: RunView | null, cipherId: string): Glyph[] {
  const pack = currentPack(app, run);
  const game = pack?.minigames.find((m) => m.id === cipherId && m.config.kind === 'cipher');
  return game?.config.kind === 'cipher' ? (game.config.table as Glyph[]) : [];
}

function axisValues(app: App, axisId: string | null): { id: string; label: LineView }[] {
  const axes = app.view()?.run?.notebook?.axes ?? [];
  return axes.find((axis) => axis.id === axisId)?.values ?? [];
}

function renderChoices(
  app: App,
  key: string,
  options: readonly Choice[],
  action: (id: string) => void | Promise<unknown>,
  pageSize = 3,
): HTMLElement {
  const shown = pageItems(app, key, options, pageSize);
  return h(
    'div',
    { class: 'choices' },
    ...shown.map((option, index) => {
      const node = button(
        {
          label: text(app, option.label),
          key: `mg-${option.id}`,
          class: `choice ${option.off ? 'off' : ''} ${option.tried ? 'tried' : ''}`,
          disabled: option.off,
        },
        () => action(option.id),
      );
      if (index === 0) node.dataset.primary = '';
      return h(
        'div',
        { class: 'choice-row' },
        node,
        app.earButton(lineFrom(app, option.label), `ear-${option.id}`),
      );
    }),
    moreButton(app, key, options.length, pageSize),
  );
}

export function renderStage2Minigame(app: App, step: MinigameStep): HTMLElement | null {
  const run = app.view()?.run ?? null;
  const v = step.view as Json;
  const container = h('div', {
    class: `minigame minigame-${step.game} minigame-stage2`,
    dataset: { minigame: step.id },
  });
  switch (step.game) {
    case 'cipher':
      renderCipher(app, step, v, container);
      return container;
    case 'postman':
      renderPostman(app, run, step, v, container);
      return container;
    case 'sound-match':
      renderSoundMatch(app, step, v, container);
      return container;
    case 'light-signals':
      renderLightSignals(app, v, container);
      return container;
    case 'read-blink':
      renderReadBlink(app, v, container);
      return container;
    case 'dream-keeper':
      renderDreamKeeper(app, v, container);
      return container;
    case 'equal-share':
      renderEqualShare(app, v, container);
      return container;
    case 'compare':
      renderCompare(app, step, v, container);
      return container;
    default:
      return null;
  }
}

function renderCipher(app: App, step: MinigameStep, v: Json, container: HTMLElement): void {
  container.dataset.word = String(v.word ?? 0);
  container.dataset.slot = String(v.slot ?? 0);
  const words = v.words as {
    id: string;
    slots: { glyph: Glyph; filled: boolean }[];
  }[];
  const current = v.current as { word: string; slot: number } | null;
  append(
    container,
    h('p', { class: 'progress' }, `🔐 ${Number(v.word) + 1} / ${words.length}`),
    h(
      'div',
      { class: 'cipher-words' },
      ...words.map((word) =>
        h(
          'div',
          { class: `cipher-word ${current?.word === word.id ? 'current' : ''}` },
          ...word.slots.map((slot, index) =>
            h(
              'span',
              {
                class: `cipher-slot ${slot.filled ? 'filled' : ''} ${current?.word === word.id && current.slot === index ? 'active' : ''}`,
              },
              glyphNode(app, slot.glyph, slot.filled),
            ),
          ),
        ),
      ),
    ),
    h(
      'div',
      { class: 'choices glyph-choices' },
      ...(v.options as Glyph[]).map((glyph, index) => {
        const node = button(
          {
            label: text(app, glyph.label),
            key: `mg-${glyph.id}`,
            class: 'choice glyph-choice',
            content: glyphNode(app, glyph, true),
          },
          () => move(app, { option: glyph.id }),
        );
        if (index === 0) node.dataset.primary = '';
        return node;
      }),
    ),
  );
  void step;
}

function renderPostman(
  app: App,
  run: RunView | null,
  step: MinigameStep,
  v: Json,
  container: HTMLElement,
): void {
  container.dataset.letter = String(v.letter ?? 0);
  container.dataset.phase = String(v.phase ?? '');
  const current = v.current as {
    id: string;
    label: string;
    buttons: string[];
    cipher: string;
  } | null;
  if (!current) return;
  const table = cipherTable(app, run, current.cipher);
  const byId = new Map(table.map((g) => [g.id, g]));
  append(
    container,
    h('p', { class: 'line-text' }, text(app, current.label)),
    h(
      'div',
      { class: 'post-buttons', 'aria-label': 'Пуговицы на письме' },
      ...current.buttons.map((id) => {
        const glyph = byId.get(id);
        return glyph ? glyphNode(app, glyph, true) : h('span', { class: 'glyph' }, id);
      }),
    ),
  );
  if (v.phase === 'street') {
    const options = v.options as { id: string; label: string }[];
    append(
      container,
      h(
        'div',
        { class: 'choices' },
        ...options.map((option, index) => {
          const icon = option.id.includes('leaf') ? '🍃' : '🍯';
          const node = button(
            { label: text(app, option.label), key: `street-${option.id}`, icon, class: 'choice' },
            () => move(app, { street: option.id }),
          );
          if (index === 0) node.dataset.primary = '';
          return node;
        }),
      ),
    );
  } else {
    const labels = new Map(
      (v.houseLabels as { number: number; label: string }[]).map((entry) => [
        entry.number,
        entry.label,
      ]),
    );
    append(
      container,
      h(
        'div',
        { class: 'choices' },
        ...(v.options as { house: number }[]).map((option, index) => {
          const label = labels.get(option.house);
          const node = button(
            {
              label: label ? text(app, label) : String(option.house),
              key: `house-${option.house}`,
              class: 'choice',
              icon: '🏠',
            },
            () => move(app, { house: option.house }),
          );
          if (index === 0) node.dataset.primary = '';
          return node;
        }),
      ),
    );
  }
  void step;
}

const LOUD = { quiet: 'тихо', medium: 'средне', loud: 'громко' } as const;
const PITCH = { low: 'низко', middle: 'средне', high: 'высоко' } as const;
const LENGTH = { short: 'коротко', long: 'долго' } as const;
const RHYTHM = { steady: 'ровно', uneven: 'неровно', continuous: 'без перерыва' } as const;

/**
 * A sound card (Q31). Listening and choosing are separate buttons, so the child can listen as often
 * as needed. The silent form — A's wave and icons with text — is always shown; the night card never
 * names its source.
 */
function soundCard(
  app: App,
  sample: string,
  label: string | null,
  key: string,
  choose?: () => void | Promise<unknown>,
): HTMLElement {
  const clue = app.assets.manifest.soundClues?.[sample];
  const icon = (id: string, caption: string) => {
    const url = app.assets.manifest.assets[`ui.icons.${id}`]?.url;
    return h(
      'span',
      { class: 'sound-trait' },
      url ? h('img', { src: app.assets.url(url), alt: '', 'aria-hidden': 'true' }) : null,
      h('span', null, caption),
    );
  };
  const traits = clue?.icons
    ? [
        icon(`sound-${clue.icons.loud}`, LOUD[clue.icons.loud]),
        icon(`pitch-${clue.icons.pitch}`, PITCH[clue.icons.pitch]),
        icon(`length-${clue.icons.length}`, LENGTH[clue.icons.length]),
        clue.rhythm ? icon(`rhythm-${clue.rhythm}`, RHYTHM[clue.rhythm]) : null,
      ]
    : [h('span', { class: 'sound-trait' }, 'Звуковая карточка')];
  const listen = button(
    {
      label: label ? `Послушать: ${label}` : 'Послушать ночной звук',
      key: `listen-${key}`,
      icon: '👂',
      class: 'listen',
    },
    () => app.voice.effect(`clue.${sample}`),
  );
  const pick = choose
    ? button({ label: `Это он: ${label ?? ''}`.trim(), key, class: 'choice', icon: '✔' }, choose)
    : null;
  return h(
    'div',
    { class: `sound-card ${choose ? 'option' : 'target'}`, dataset: { sample } },
    clue?.wave
      ? h('img', {
          class: 'sound-wave',
          src: app.assets.url(clue.wave),
          alt: '',
          'aria-hidden': 'true',
        })
      : h('div', { class: 'sound-wave placeholder', 'aria-hidden': 'true' }, '〰'),
    label ? h('p', { class: 'label' }, label) : null,
    h('p', { class: 'sound-traits' }, ...traits),
    h('div', { class: 'sound-actions' }, listen, pick),
  );
}

function renderSoundMatch(app: App, step: MinigameStep, v: Json, container: HTMLElement): void {
  const options = v.options as { id: string; label: string; sample: string; tried?: boolean }[];
  append(
    container,
    h('p', { class: 'progress' }, `👂 ${Number(v.round) + 1} / ${Number(v.rounds)}`),
    h('div', { class: 'sound-target' }, soundCard(app, String(v.target), null, 'sound-target')),
    h(
      'div',
      { class: 'choices sound-options' },
      ...options.map((option, index) => {
        const node = soundCard(app, option.sample, text(app, option.label), `mg-${option.id}`, () =>
          move(app, { option: option.id }),
        );
        const pick = node.querySelector<HTMLElement>(`[data-key="mg-${option.id}"]`);
        if (index === 0 && pick) pick.dataset.primary = '';
        if (option.tried) node.classList.add('tried');
        return node;
      }),
    ),
  );
  void step;
}

function renderLightSignals(app: App, v: Json, container: HTMLElement): void {
  container.dataset.phase = String(v.phase ?? 'signals');
  container.dataset.signal = String(v.signal ?? 0);
  const input = (v.input as ('dot' | 'dash')[]) ?? [];
  const current = v.current as { id: string; label: string; patternLength: number } | null;
  append(
    container,
    h('p', { class: 'progress' }, current ? text(app, current.label) : 'Свой сигнал'),
    h(
      'div',
      { class: 'lantern static', 'aria-hidden': 'true' },
      input.at(-1) === 'dash' ? '🔦' : '💡',
    ),
    h('p', { class: 'line-text' }, input.length ? patternText(input) : 'Собери сигнал.'),
    patternNode(input),
    h(
      'div',
      { class: 'signal-controls' },
      button({ label: 'Точка', key: 'signal-dot', icon: '●' }, () => move(app, { symbol: 'dot' })),
      button({ label: 'Тире', key: 'signal-dash', icon: '▬' }, () => move(app, { symbol: 'dash' })),
      button(
        { label: 'Стереть', key: 'signal-erase', icon: '⌫', disabled: input.length === 0 },
        () => move(app, { erase: true }),
      ),
      button({ label: 'Отправить', key: 'signal-send', class: 'primary', icon: '✉' }, () =>
        move(app, { send: true }),
      ),
    ),
  );
}

function renderReadBlink(app: App, v: Json, container: HTMLElement): void {
  append(
    container,
    h('p', { class: 'line-text' }, 'Сравни рисунок с уроком.'),
    h('div', { class: 'blink-drawing' }, patternNode(v.drawing as unknown[])),
    renderChoices(app, 'read-blink-page', v.lessons as Choice[], (option) => move(app, { option })),
  );
}

function renderCompare(app: App, step: MinigameStep, v: Json, container: HTMLElement): void {
  const subject = v.subject as { label: string; image: string };
  const src = safeAsset(app, subject.image);
  append(
    container,
    h(
      'div',
      { class: 'compare-subject' },
      src
        ? h('img', { src, alt: text(app, subject.label) })
        : h('span', { class: 'placeholder' }, '🛒'),
      h('p', null, text(app, subject.label)),
    ),
    v.prompt ? h('p', { class: 'line-text' }, text(app, v.prompt)) : null,
    renderChoices(
      app,
      `compare-page-${step.id}-${String(v.step)}`,
      v.options as Choice[],
      (option) => move(app, { option }),
    ),
  );
}

function renderDreamKeeper(app: App, v: Json, container: HTMLElement): void {
  if (v.mode === 'select') {
    const familySetup = app.ui.dreamFamily as { count: number; players: string[] } | undefined;
    if (familySetup) return renderFamilySetup(app, v, container, familySetup);
    append(
      container,
      button({ label: app.labels('family.solo').text, key: 'dream-solo', class: 'primary' }, () =>
        move(app, { mode: 'solo' }),
      ),
      button({ label: app.labels('family.family').text, key: 'dream-family' }, () => {
        app.ui.dreamFamily = { count: 3, players: ['child'] };
        app.render();
      }),
    );
    return;
  }
  if (v.mode === 'solo') return renderDreamSolo(app, v, container);
  renderDreamFamily(app, v, container);
}

function renderFamilySetup(
  app: App,
  v: Json,
  container: HTMLElement,
  setup: { count: number; players: string[] },
): void {
  const players = v.players as { id: string; label: string }[];
  const pack = currentPack(app, app.view()?.run ?? null);
  const game = pack?.minigames.find((m) => m.config.kind === 'dream-keeper');
  const available = game?.config.kind === 'dream-keeper' ? game.config.family.players : [];
  const chosen = new Set(setup.players);
  const ready = chosen.size === setup.count && chosen.has('child');
  append(
    container,
    h('p', { class: 'line-text' }, app.labels('family.howMany').text),
    h(
      'div',
      { class: 'choices' },
      ...[2, 3, 4].map((count) =>
        button(
          { label: `${count}`, key: `family-count-${count}`, pressed: setup.count === count },
          () => {
            setup.count = count;
            setup.players = setup.players.slice(0, count);
            app.render();
          },
        ),
      ),
    ),
    h(
      'div',
      { class: 'choices family-players' },
      button(
        { label: app.view()?.avatar.name ?? 'child', key: 'family-player-child', pressed: true },
        () => {},
      ),
      ...available.map((player) =>
        button(
          {
            label: text(app, player.label),
            key: `family-player-${player.id}`,
            pressed: chosen.has(player.id),
            disabled: !chosen.has(player.id) && chosen.size >= setup.count,
          },
          () => {
            if (chosen.has(player.id)) setup.players = setup.players.filter((p) => p !== player.id);
            else setup.players.push(player.id);
            app.render();
          },
        ),
      ),
    ),
    button(
      { label: t(app, 'avatar.done'), key: 'family-start', class: 'primary', disabled: !ready },
      () => move(app, { mode: 'family', players: setup.players }),
    ),
  );
  void players;
}

function renderDreamSolo(app: App, v: Json, container: HTMLElement): void {
  container.dataset.round = String(v.round ?? 0);
  const solo = v.solo as { card: { id: string; image: string; label: string } | null };
  const card = solo.card;
  const axis = String(v.axis ?? '');
  const values = axisValues(app, axis);
  const key = `dream-axis-${axis}-${String(v.round)}`;
  const shown = pageItems(app, key, values);
  append(
    container,
    h('p', { class: 'progress' }, `💤 ${Number(v.round) + 1} / ${Number(v.rounds)}`),
    card ? dreamCard(app, card, true) : null,
    h(
      'div',
      { class: 'choices' },
      ...shown.map((value, index) => {
        const node = button(
          { label: value.label.text, key: `dream-value-${value.id}`, class: 'choice' },
          () => move(app, { value: value.id }),
        );
        if (index === 0) node.dataset.primary = '';
        return node;
      }),
      moreButton(app, key, values.length),
    ),
  );
}

function dreamCard(
  app: App,
  card: { id: string; image: string; label: string },
  showLabel: boolean,
): HTMLElement {
  const src = safeAsset(app, card.image);
  return h(
    'figure',
    { class: 'dream-card', dataset: { card: card.id } },
    src
      ? h('img', { src, alt: showLabel ? text(app, card.label) : '' })
      : h('div', { class: 'placeholder' }, '🌙'),
    showLabel ? h('figcaption', null, text(app, card.label)) : null,
  );
}

function renderDreamFamily(app: App, v: Json, container: HTMLElement): void {
  const phase = String(v.phase);
  const players = (v.players as { id: string; label: string }[]).map((p) => p.id);
  const keeper = v.keeper as string | null;
  const handoffKey = `dream-handoff-${String(v.round)}-${phase}`;
  if ((phase === 'pick' || phase === 'ask') && app.ui[handoffKey] !== true) {
    app.voice.stop();
    append(
      container,
      h(
        'p',
        { class: 'line-text' },
        app.labels(phase === 'pick' ? 'family.passKeeper' : 'family.passOthers').text,
      ),
      button(
        { label: app.labels('family.itIsMe').text, key: `handoff-${phase}`, class: 'primary' },
        () => {
          app.ui[handoffKey] = true;
          app.render();
        },
      ),
    );
    return;
  }
  if (phase === 'keeper') {
    append(
      container,
      h('p', { class: 'line-text' }, app.labels('family.chooseKeeper').text),
      h(
        'div',
        { class: 'choices' },
        ...players.map((player, index) => {
          const node = button(
            { label: playerName(app, player), key: `keeper-${player}`, class: 'choice' },
            () => move(app, { keeper: player }),
          );
          if (index === 0) node.dataset.primary = '';
          return node;
        }),
      ),
    );
    return;
  }
  if (phase === 'pick') {
    const cards = (v.cards as { id: string; image: string; label: string }[]).slice(0, 3);
    append(
      container,
      h('p', { class: 'line-text' }, app.labels('family.passKeeper').text),
      h(
        'div',
        { class: 'dream-cards' },
        ...cards.map((card, index) => {
          const node = button(
            {
              label: text(app, card.label),
              key: `dream-card-${card.id}`,
              class: 'dream-card-button',
              content: dreamCard(app, card, true),
            },
            () => move(app, { pick: card.id }),
          );
          if (index === 0) node.dataset.primary = '';
          return node;
        }),
      ),
    );
    return;
  }
  if (phase === 'ask') {
    const asked = v.asked as { player: string; question: string; answer: boolean }[];
    const guesser = players.find((p) => p !== keeper && !asked.some((a) => a.player === p));
    const axis = String(v.axis ?? '');
    const values = axisValues(app, axis);
    const pack = currentPack(app, app.view()?.run ?? null);
    const game = pack?.minigames.find((m) => m.config.kind === 'dream-keeper');
    const questions = game?.config.kind === 'dream-keeper' ? game.config.family.questions : [];
    append(
      container,
      h(
        'div',
        { class: 'family-answers' },
        ...asked.map((answer) =>
          h(
            'p',
            null,
            `${playerName(app, answer.player)}: ${text(app, questions.find((q) => q.id === answer.question)?.label)} — ${app.labels(answer.answer ? 'family.yes' : 'family.no').text}`,
          ),
        ),
      ),
    );
    if (guesser) {
      append(
        container,
        h('p', { class: 'line-text' }, app.labels('family.ask').text),
        h(
          'div',
          { class: 'choices' },
          ...questions.map((q, index) => {
            const node = button(
              { label: text(app, q.label), key: `ask-${guesser}-${q.id}`, class: 'choice' },
              () => move(app, { ask: q.id, player: guesser }),
            );
            if (index === 0) node.dataset.primary = '';
            return node;
          }),
        ),
      );
      return;
    }
    const guesserId = players.find((p) => p !== keeper) ?? 'child';
    append(
      container,
      h('p', { class: 'line-text' }, app.labels('family.guess').text),
      h(
        'div',
        { class: 'choices' },
        ...pageItems(app, `dream-family-axis-${axis}`, values).map((value, index) => {
          const node = button(
            { label: value.label.text, key: `guess-${value.id}`, class: 'choice' },
            () => move(app, { guess: value.id, player: guesserId }),
          );
          if (index === 0) node.dataset.primary = '';
          return node;
        }),
        moreButton(app, `dream-family-axis-${axis}`, values.length),
      ),
    );
    return;
  }
  if (phase === 'done') {
    append(
      container,
      h('h3', null, app.labels('family.win').text),
      h(
        'ul',
        { class: 'family-titles' },
        ...(v.titles as { player: string; label: string }[]).map((title) =>
          h('li', null, `${playerName(app, title.player)} — ${text(app, title.label)}`),
        ),
      ),
    );
  }
}

function playerName(app: App, id: string): string {
  if (id === 'child') return app.view()?.avatar.name ?? 'Стажёр';
  const pack = currentPack(app, app.view()?.run ?? null);
  const game = pack?.minigames.find((m) => m.config.kind === 'dream-keeper');
  if (game?.config.kind !== 'dream-keeper') return id;
  const player = game.config.family.players.find((p) => p.id === id);
  return player ? text(app, player.label) : id;
}

function renderEqualShare(app: App, v: Json, container: HTMLElement): void {
  container.dataset.task = String(v.task ?? 0);
  const groups = v.groups as number[];
  append(
    container,
    v.prompt ? h('p', { class: 'line-text' }, text(app, v.prompt)) : null,
    h('p', { class: 'progress' }, `Осталось: ${Number(v.pool)} · запас: ${Number(v.reserve)}`),
    h(
      'div',
      { class: 'share-groups' },
      ...groups.map((count, index) =>
        h(
          'section',
          { class: 'share-group' },
          h('h3', null, `${text(app, v.groupLabel)} ${index + 1}`),
          h('p', null, `${'🟠'.repeat(count)} ${count}`),
          h(
            'div',
            { class: 'row' },
            button(
              {
                label: `Добавить в группу ${index + 1}`,
                key: `share-add-${index}`,
                disabled: Number(v.pool) <= 0,
              },
              () => move(app, { add: index }),
            ),
            button(
              {
                label: `Убрать из группы ${index + 1}`,
                key: `share-remove-${index}`,
                disabled: count <= 0,
              },
              () => move(app, { remove: index }),
            ),
          ),
        ),
      ),
    ),
    button({ label: 'Проверить', key: 'share-check', class: 'primary' }, () =>
      move(app, { check: true }),
    ),
  );
}
