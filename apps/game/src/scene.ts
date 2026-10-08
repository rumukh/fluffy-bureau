// Game screen: stage, HUD, dialogue, choices, map hub, minigames, version check and notebook.
import type { GameView, LineView, RunView, StepView } from '@fluffy/game-core';
import { OFFICE_SLOTS, SCARVES, SPECIES, isValidName } from '@fluffy/game-core';
import type { App } from './app.js';
import { rewardIcon } from './app.js';
import { fallbackHotspots, LOGICAL, SCARF_COLORS, type HotspotRect } from './assets.js';
import { append, button, focusFirst, h } from './dom.js';

type Json = Record<string, unknown>;

export function renderGame(app: App): HTMLElement {
  const view = app.view()!;
  if (app.ui.resting) return renderRest(app);
  if (!view.run) return renderOffice(app, view);
  return renderRun(app, view, view.run);
}

function t(app: App, key: string): string {
  return app.labels(key).text;
}

function renderRest(app: App): HTMLElement {
  return h(
    'section',
    { class: 'rest-screen' },
    h('p', null, t(app, 'break.resting')),
    button(
      { label: t(app, 'pause.continue'), key: 'rest-continue', class: 'primary', icon: '▶' },
      () => {
        app.ui.resting = false;
        app.session?.game.host.resume('break');
        app.render();
      },
    ),
  );
}

// ---------------------------------------------------------------- office (home between cases)

const MUSIC_BY_LOCATION: Record<string, string> = {
  office: 'title-office',
  'office-desk': 'title-office',
  map: 'gentle-mystery',
  shed: 'heartfelt',
  bakery: 'celebration-baking',
};

function playMusic(app: App, location: string, lamp: boolean): void {
  app.voice.music(MUSIC_BY_LOCATION[location] ?? 'investigation', lamp);
}

/** One-shot sounds for reward changes, derived from consecutive projections. */
function rewardSounds(app: App, view: GameView): void {
  const last = app.ui.wallet as { buttons: number; hearts: number } | undefined;
  if (last && view.hearts > last.hearts) app.voice.effect('heart');
  if (last && view.buttons > last.buttons) app.voice.effect('button-coin');
  app.ui.wallet = { buttons: view.buttons, hearts: view.hearts };
}

function renderOffice(app: App, view: GameView): HTMLElement {
  const presenter = app.presenter!;
  playMusic(app, 'office', view.lamp);
  rewardSounds(app, view);
  presenter.show({
    location: 'office',
    title: t(app, 'office.title'),
    cast: [],
    avatar: { species: view.avatar.species, scarf: view.avatar.scarf, name: view.avatar.name },
    stage: [],
    comfort: view.lamp,
    reducedMotion: app.reducedMotion(),
    level: null,
  });
  const decorItems = view.rewards.filter((r) => r.kind === 'decor');
  const unplaced = decorItems.filter((item) => !view.decor.some((d) => d.item === item.id));
  const slots = h(
    'div',
    { class: 'office-slots' },
    ...OFFICE_SLOTS.map((slot) => {
      const placed = view.decor.find((d) => d.slot === slot);
      const item = placed ? decorItems.find((r) => r.id === placed.item) : undefined;
      const pending = unplaced[0];
      return h(
        'div',
        { class: `office-slot slot-${slot}` },
        item
          ? h(
              'span',
              { class: 'decor', title: item.label.text },
              rewardIcon('decor'),
              h('span', { class: 'label' }, item.label.text),
            )
          : pending
            ? button(
                {
                  label: `${t(app, 'office.place')}: ${t(app, `office.slot.${slot}`)}`,
                  key: `slot-${slot}`,
                  icon: '＋',
                },
                () => app.act({ type: 'decor', item: pending.id, slot }),
              )
            : h('span', { class: 'empty-slot' }, t(app, `office.slot.${slot}`)),
      );
    }),
  );
  const prologue = view.packs.find((p) => p.id === 'prologue');
  const actions = h(
    'nav',
    { class: 'office-actions' },
    prologue && !prologue.completed
      ? button(
          { label: t(app, 'case.prologue'), key: 'start-prologue', class: 'primary', icon: '▶' },
          () => app.act({ type: 'start', pack: 'prologue' }),
        )
      : button(
          { label: t(app, 'office.cases'), key: 'open-cases', class: 'primary', icon: '🔎' },
          () => app.setOverlay('cases'),
        ),
    button({ label: t(app, 'pause.encyclopedia'), key: 'office-ency', icon: '📖' }, () =>
      app.setOverlay('encyclopedia'),
    ),
    button({ label: t(app, 'pause.album'), key: 'office-album', icon: '⭐' }, () =>
      app.setOverlay('album'),
    ),
  );
  const node = h(
    'section',
    { class: 'game office' },
    h(
      'div',
      { class: 'stage-frame' },
      h('div', { class: 'stage-canvas' }, presenter.element, slots),
    ),
    renderHud(app, view, null),
    h(
      'section',
      { class: 'panel office-panel' },
      h('h1', null, t(app, 'office.title')),
      h(
        'p',
        { class: 'wallet' },
        `${view.avatar.name} · ${t(app, view.rank)} · 🔘 ${view.buttons} · 💗 ${view.hearts}`,
      ),
      actions,
    ),
  );
  app.narrate('office', null);
  queueMicrotask(() => {
    if (!document.activeElement || document.activeElement === document.body)
      focusFirst(node, '.primary');
  });
  return node;
}

// ---------------------------------------------------------------- run

function renderRun(app: App, view: GameView, run: RunView): HTMLElement {
  const presenter = app.presenter!;
  playMusic(app, run.scene.location, view.lamp);
  rewardSounds(app, view);
  const cast = run.scene.cast.map((id) => ({ id, name: speakerName(app, id) }));
  presenter.show({
    location: run.scene.location,
    title: run.scene.location,
    cast,
    avatar: { species: view.avatar.species, scarf: view.avatar.scarf, name: view.avatar.name },
    stage: run.stage,
    comfort: view.lamp,
    reducedMotion: app.reducedMotion(),
    level: run.level,
  });
  const step = run.step;
  // While searching with the magnifier the characters step back so every object is visible.
  presenter.element.classList.toggle(
    'searching',
    step?.kind === 'minigame' && step.game === 'magnifier',
  );
  const overlayLayer = h('div', { class: 'stage-hotspots' });
  const panel = h('section', { class: 'panel', 'aria-live': 'off' });
  const beat = beatKey(app, run);
  let spoken: LineView | null = null;
  let follow: string[] = [];
  if (run.queue) {
    spoken = run.queue.line;
    panel.append(renderDialogue(app, run.queue.line, run.queue.source));
    if (step?.kind === 'minigame') overlayLayer.append(...minigameStage(app, run, step, true));
  } else if (step) {
    switch (step.kind) {
      case 'line':
        spoken = step.line;
        panel.append(renderDialogue(app, step.line, null));
        break;
      case 'menu': {
        if (app.ui.versionOpen && run.version?.available) {
          panel.append(renderVersion(app, run));
          break;
        }
        spoken = step.prompt;
        const { node, labels } = renderMenu(app, run, step, overlayLayer);
        follow = labels;
        panel.append(node);
        break;
      }
      case 'minigame':
        overlayLayer.append(...minigameStage(app, run, step, false));
        panel.append(renderMinigame(app, step));
        spoken = minigamePrompt(app, step);
        break;
      case 'await':
        panel.append(renderAwait(app, view, step.action));
        break;
      case 'end':
        panel.append(renderEnd(app, view, run));
        break;
    }
  }
  app.narrate(beat, spoken, follow);
  const node = h(
    'section',
    {
      class: `game run presentation-${run.scene.presentation}`,
      dataset: { scene: run.scene.id, step: step?.kind ?? 'none' },
    },
    h(
      'div',
      { class: 'stage-frame' },
      h('div', { class: 'stage-canvas' }, presenter.element, overlayLayer),
    ),
    renderHud(app, view, run),
    panel,
  );
  const isNewBeat = app.ui.beat !== beat;
  app.ui.beat = beat;
  if (isNewBeat && !app.overlay)
    queueMicrotask(() => focusFirst(node.querySelector('.panel') ?? node));
  return node;
}

function beatKey(app: App, run: RunView): string {
  const state = app.session?.game.host.inspect().state.run;
  return JSON.stringify([
    run.pack,
    run.scene.id,
    state?.cursor,
    state?.queue.length,
    run.queue?.line.id,
    state?.minigame?.revision ?? null,
  ]);
}

function speakerName(app: App, id: string): string {
  for (const pack of app.library.index().packs) {
    const found = app.library.get(pack).pack.speakers.find((s) => s.id === id);
    if (found) return found.name;
  }
  return id;
}

// ---------------------------------------------------------------- HUD

function renderHud(app: App, view: GameView, run: RunView | null): HTMLElement {
  const busy = Boolean(run?.queue);
  // Mechanics appear once their first-encounter tutorial taught them (R09).
  const knows = (skill: string) => view.skills.includes(skill) || run?.caseId !== 'prologue';
  const hud = h(
    'header',
    { class: 'hud' },
    button({ label: t(app, 'hud.pause'), key: 'hud-pause', icon: '⏸', class: 'hud-btn' }, () =>
      app.setOverlay('pause'),
    ),
    run?.notebook && knows('notebook')
      ? button(
          { label: t(app, 'hud.notebook'), key: 'hud-notebook', icon: '📒', class: 'hud-btn' },
          async () => {
            await app.setOverlay('notebook');
            const step = run.step;
            if (step?.kind === 'await' && step.action === 'notebook.open')
              await app.act({ type: 'await', action: 'notebook.open' });
          },
        )
      : null,
    run && !knows('lamp')
      ? null
      : button(
          {
            label: t(app, 'hud.lamp'),
            key: 'hud-lamp',
            icon: '💡',
            class: 'hud-btn lamp',
            pressed: view.lamp,
          },
          () => {
            app.voice.effect(view.lamp ? 'lamp-off' : 'lamp-on');
            return app.act({ type: 'lamp', on: !view.lamp }).then(() => app.applyPrefs());
          },
        ),
    run?.hints.klubok.available && knows('klubki')
      ? button(
          {
            label: `${t(app, 'hud.klubok')}${run.hints.klubok.remaining === null ? '' : `: ${run.hints.klubok.remaining}`}`,
            key: 'hud-klubok',
            icon: '🧶',
            class: 'hud-btn',
            disabled: busy,
            content: h(
              'span',
              { class: 'label' },
              run.hints.klubok.remaining === null
                ? t(app, 'hud.klubok')
                : `${t(app, 'hud.klubok')} ×${run.hints.klubok.remaining}`,
            ),
          },
          () => app.act({ type: 'hint', channel: 'klubok' }),
        )
      : null,
    run?.hints.shell.available && knows('shell')
      ? button(
          {
            label: t(app, 'hud.shell'),
            key: 'hud-shell',
            icon: '🐚',
            class: 'hud-btn',
            disabled: busy,
          },
          () => app.act({ type: 'hint', channel: 'shell' }),
        )
      : null,
  );
  return hud;
}

// ---------------------------------------------------------------- dialogue

function renderDialogue(app: App, line: LineView, source: string | null): HTMLElement {
  const voiceless = !app.voice.hasVoice(line.id);
  return h(
    'div',
    { class: `dialogue ${source ? `source-${source}` : ''}`, dataset: { line: line.id } },
    line.speakerName ? h('p', { class: 'speaker' }, line.speakerName) : null,
    h('p', { class: 'line-text', id: 'line-text' }, line.text),
    h(
      'div',
      { class: 'dialogue-actions' },
      button(
        {
          label: t(app, 'hud.replay'),
          key: 'replay',
          icon: '👂',
          class: 'replay',
          disabled: voiceless,
        },
        async () => {
          app.voice.replay();
          const step = app.view()?.run?.step;
          if (step?.kind === 'await' && step.action === 'replay')
            await app.act({ type: 'await', action: 'replay' });
        },
      ),
      button(
        {
          label: t(app, 'hud.next'),
          key: 'next',
          icon: '➜',
          class: 'primary next',
          describedBy: 'line-text',
        },
        () => {
          app.voice.stop();
          return app.act({ type: 'next' });
        },
      ),
    ),
    voiceless ? h('p', { class: 'voice-note' }, t(app, 'voice.textOnly')) : null,
  );
}

// ---------------------------------------------------------------- menus and the town map

function renderMenu(
  app: App,
  run: RunView,
  step: Extract<StepView, { kind: 'menu' }>,
  stageLayer: HTMLElement,
): { node: HTMLElement; labels: string[] } {
  const pageSize = Math.max(1, Math.min(3, step.pageSize));
  const pages = Math.max(1, Math.ceil(step.options.length / pageSize));
  const pageKey = `page:${run.scene.id}:${step.id}`;
  const page = Math.min(Number(app.ui[pageKey] ?? 0), pages - 1);
  const visible = step.options.slice(page * pageSize, page * pageSize + pageSize);
  const choose = (id: string) => {
    app.voice.stop();
    app.ui[pageKey] = 0;
    return app.act({ type: 'choose', option: id });
  };
  for (const option of step.options) {
    const rect = app.assets.hotspotFor(step.location, option.id);
    if (!rect) continue;
    stageLayer.append(
      positioned(
        button(
          {
            label: option.label.text,
            key: `hs-${option.id}`,
            class: 'hotspot glow',
            content: h('span', { class: 'label' }, option.label.text),
          },
          () => choose(option.id),
        ),
        rect,
      ),
    );
  }
  const node = h(
    'div',
    { class: `menu ${step.hub ? 'hub' : ''}` },
    step.prompt ? h('p', { class: 'line-text' }, step.prompt.text) : null,
    h(
      'div',
      { class: 'choices', role: 'group', 'aria-label': step.prompt?.text ?? '' },
      ...visible.map((option, index) => {
        const choice = button(
          {
            label: option.label.text,
            key: `opt-${option.id}`,
            class: `choice ${index === 0 ? '' : ''}`,
            icon: step.hub ? '📍' : undefined,
          },
          () => choose(option.id),
        );
        if (index === 0) choice.dataset.primary = '';
        const ear = app.earButton(option.label, `ear-${option.id}`);
        choice.addEventListener('focus', () => {
          if (choice.matches(':focus-visible')) app.voice.label(option.label.id);
        });
        return h('div', { class: 'choice-row' }, choice, ear);
      }),
    ),
    run.version?.available
      ? button(
          {
            label: run.version.button.text,
            key: 'open-version',
            class: 'primary version-open',
            icon: '🗣',
          },
          () => {
            app.voice.stop();
            app.ui.versionOpen = true;
            app.render();
          },
        )
      : null,
    step.back
      ? button({ label: t(app, 'hud.back'), key: 'menu-back', icon: '←', class: 'back' }, () =>
          app.act({ type: 'back' }),
        )
      : null,
    pages > 1
      ? button(
          {
            label: `${t(app, 'hud.more')} (${page + 1}/${pages})`,
            key: 'menu-more',
            icon: '⟳',
            class: 'more',
          },
          () => {
            app.ui[pageKey] = (page + 1) % pages;
            app.render();
          },
        )
      : null,
  );
  return { node, labels: visible.map((o) => o.label.id) };
}

function positioned(node: HTMLElement, rect: HotspotRect): HTMLElement {
  node.style.left = `${(rect.x / LOGICAL.width) * 100}%`;
  node.style.top = `${(rect.y / LOGICAL.height) * 100}%`;
  node.style.width = `${(rect.w / LOGICAL.width) * 100}%`;
  node.style.height = `${(rect.h / LOGICAL.height) * 100}%`;
  return node;
}

// ---------------------------------------------------------------- avatar (P0 awaits)

function renderAwait(app: App, view: GameView, action: string): HTMLElement {
  switch (action) {
    case 'avatar.species':
      return h(
        'div',
        { class: 'avatar-picker species' },
        ...SPECIES.map((species, index) => {
          const node = button(
            {
              label: t(app, `avatar.species.${species}`),
              key: `species-${species}`,
              class: 'avatar-card',
              pressed: view.avatar.species === species,
              content: h(
                'span',
                { class: 'avatar-card-body' },
                h('img', { src: app.assets.avatar(species, view.avatar.scarf).base, alt: '' }),
                h('span', { class: 'label' }, t(app, `avatar.species.${species}`)),
              ),
            },
            () => app.act({ type: 'avatar.species', value: species }),
          );
          if (index === 0) node.dataset.primary = '';
          return node;
        }),
      );
    case 'avatar.name': {
      const input = h('input', {
        type: 'text',
        id: 'avatar-name',
        maxlength: 13,
        autocomplete: 'off',
        autocapitalize: 'words',
        spellcheck: 'false',
        'data-key': 'name-input',
        'data-primary': '',
        value: view.avatar.name === 'Стажёр' ? '' : view.avatar.name,
      });
      const error = h('p', { class: 'field-error', id: 'name-error', role: 'alert' });
      const submit = async () => {
        const name = input.value.trim();
        if (!isValidName(name)) {
          error.textContent = t(app, 'avatar.name.invalid');
          input.setAttribute('aria-invalid', 'true');
          input.focus();
          return;
        }
        await app.act({ type: 'avatar.name', value: name });
      };
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') void submit();
      });
      return h(
        'div',
        { class: 'avatar-picker name' },
        h('label', { for: 'avatar-name' }, t(app, 'avatar.name.field')),
        input,
        error,
        h(
          'div',
          { class: 'choices' },
          button(
            { label: t(app, 'avatar.done'), key: 'name-done', class: 'primary', icon: '✔' },
            submit,
          ),
          button({ label: t(app, 'avatar.skip'), key: 'name-skip' }, () =>
            app.act({ type: 'avatar.name', value: null }),
          ),
        ),
      );
    }
    case 'avatar.scarf':
      return h(
        'div',
        { class: 'avatar-picker scarf' },
        ...SCARVES.map((scarf, index) => {
          const node = button(
            {
              label: t(app, `scarf.${scarf}`),
              key: `scarf-${scarf}`,
              class: 'swatch',
              pressed: view.avatar.scarf === scarf,
              content: h(
                'span',
                { class: 'swatch-body' },
                h('span', { class: 'swatch-color', style: `background:${SCARF_COLORS[scarf]}` }),
                h('span', { class: 'label' }, t(app, `scarf.${scarf}`)),
              ),
            },
            () => app.act({ type: 'avatar.scarf', value: scarf }),
          );
          if (index === 0) node.dataset.primary = '';
          return node;
        }),
      );
    case 'lamp.on':
    case 'lamp.off':
      return h(
        'div',
        { class: 'await' },
        button({ label: t(app, 'hud.lamp'), key: 'await-lamp', class: 'primary', icon: '💡' }, () =>
          app.act({ type: 'lamp', on: action === 'lamp.on' }).then(() => app.applyPrefs()),
        ),
      );
    case 'notebook.open':
      return h(
        'div',
        { class: 'await' },
        button(
          { label: t(app, 'hud.notebook'), key: 'await-notebook', class: 'primary', icon: '📒' },
          async () => {
            await app.setOverlay('notebook');
            await app.act({ type: 'await', action: 'notebook.open' });
          },
        ),
      );
    case 'pause':
      return h(
        'div',
        { class: 'await' },
        button(
          { label: t(app, 'hud.pause'), key: 'await-pause', class: 'primary', icon: '⏸' },
          async () => {
            await app.act({ type: 'await', action: 'pause' });
            await app.setOverlay('pause');
          },
        ),
      );
    case 'office.place': {
      const decor = view.rewards.filter((r) => r.kind === 'decor');
      const item = decor.find((r) => !view.decor.some((d) => d.item === r.id)) ?? decor[0];
      if (!item) return h('p', null, '…');
      return h(
        'div',
        { class: 'await office-place' },
        h('p', { class: 'line-text' }, `${rewardIcon('decor')} ${item.label.text}`),
        h(
          'div',
          { class: 'choices' },
          ...OFFICE_SLOTS.map((slot, index) => {
            const node = button(
              {
                label: `${t(app, 'office.place')}: ${t(app, `office.slot.${slot}`)}`,
                key: `slot-${slot}`,
                icon: '＋',
              },
              () => app.act({ type: 'decor', item: item.id, slot }),
            );
            if (index === 0) node.dataset.primary = '';
            return node;
          }),
        ),
      );
    }
    default:
      return h(
        'div',
        { class: 'await' },
        button(
          { label: t(app, 'hud.replay'), key: 'await-replay', class: 'primary', icon: '👂' },
          async () => {
            app.voice.replay();
            await app.act({ type: 'await', action: 'replay' });
          },
        ),
      );
  }
}

// ---------------------------------------------------------------- end of a case

function renderEnd(app: App, view: GameView, run: RunView): HTMLElement {
  return h(
    'div',
    { class: 'case-end' },
    h('h2', null, t(app, 'case.complete')),
    h('p', { class: 'wallet' }, `🔘 ${view.buttons} · 💗 ${view.hearts} · ${t(app, view.rank)}`),
    button({ label: t(app, 'office.title'), key: 'leave', class: 'primary', icon: '🏠' }, () =>
      app.act({ type: 'leave' }),
    ),
    run.caseId === 'prologue' ? null : null,
  );
}

// ---------------------------------------------------------------- minigames

function lineFrom(app: App, run: RunView | null, id: string | null): LineView | null {
  if (!id) return null;
  const session = app.session;
  if (!session) return null;
  for (const ref of session.game.content.data.packs) {
    const pack = session.game.rules.library.get(ref);
    const line = pack.lines.get(id);
    if (line)
      return {
        id: line.id,
        speaker: line.speaker,
        speakerName: speakerName(app, line.speaker),
        text: line.text.replaceAll('{имя}', app.view()?.avatar.name ?? ''),
        voiced: line.voiced,
        kind: line.kind,
      };
  }
  void run;
  return null;
}

function minigamePrompt(app: App, step: Extract<StepView, { kind: 'minigame' }>): LineView | null {
  const v = step.view as Json;
  return typeof v.prompt === 'string' ? lineFrom(app, null, v.prompt) : null;
}

function move(app: App, value: unknown) {
  app.voice.stop();
  return app.act({ type: 'move', value: value as never });
}

function minigameStage(
  app: App,
  run: RunView,
  step: Extract<StepView, { kind: 'minigame' }>,
  locked: boolean,
): HTMLElement[] {
  if (step.game !== 'magnifier') return [];
  const v = step.view as {
    targets: { id: string; label: string; found: boolean }[];
    assist: string | null;
  };
  const authored = app.assets.hotspots(run.scene.location);
  const fallback = fallbackHotspots(v.targets.map((target) => target.id));
  const miss = h('button', {
    class: 'miss-layer',
    tabindex: '-1',
    'aria-hidden': 'true',
    disabled: locked,
  });
  miss.addEventListener('click', () => {
    app.voice.effect('magnifier-miss');
    void move(app, { miss: true });
  });
  return [
    miss,
    ...v.targets.map((target) => {
      const label = lineFrom(app, run, target.label)?.text ?? target.id;
      const spot = button(
        {
          label: target.found ? `${label} ✔` : label,
          key: `spot-${target.id}`,
          class: `hotspot ${target.found ? 'found' : 'glow'} ${v.assist === target.id ? 'assist' : ''}`,
          content: h('span', { class: 'label' }, target.found ? `✔ ${label}` : ''),
          disabled: locked,
        },
        () => {
          if (!target.found) app.voice.effect('magnifier-find');
          return move(app, { target: target.id });
        },
      );
      return positioned(spot, authored[target.id] ?? fallback[target.id]!);
    }),
  ];
}

function renderMinigame(app: App, step: Extract<StepView, { kind: 'minigame' }>): HTMLElement {
  const v = step.view as Json;
  const label = (id: unknown) => lineFrom(app, null, typeof id === 'string' ? id : null);
  const text = (id: unknown) => label(id)?.text ?? String(id ?? '');
  const container = h('div', {
    class: `minigame minigame-${step.game}`,
    dataset: { minigame: step.id },
  });
  switch (step.game) {
    case 'magnifier': {
      const targets = v.targets as { id: string; label: string; found: boolean }[];
      const showList = Boolean(app.ui.magnifierList);
      container.append(
        h(
          'p',
          { class: 'progress' },
          `🔍 ${targets.filter((t) => t.found).length} / ${targets.length}`,
        ),
        button({ label: t(app, 'hud.list'), key: 'mg-list', pressed: showList, icon: '☰' }, () => {
          app.ui.magnifierList = !showList;
          app.render();
        }),
      );
      if (showList)
        container.append(
          h(
            'ul',
            { class: 'object-list' },
            ...targets.map((target) =>
              h(
                'li',
                null,
                button(
                  {
                    label: `${text(target.label)}${target.found ? ' ✔' : ''}`,
                    key: `list-${target.id}`,
                  },
                  () => move(app, { target: target.id }),
                ),
              ),
            ),
          ),
        );
      break;
    }
    case 'cocoa':
    case 'tracks': {
      const options = v.options as { id: string; label: string; tried?: boolean; off?: boolean }[];
      if (step.game === 'cocoa')
        container.append(
          h('p', { class: 'progress' }, `☕ ${Number(v.round) + 1} / ${Number(v.rounds)}`),
        );
      if (v.prompt) container.append(h('p', { class: 'line-text' }, text(v.prompt)));
      container.append(
        h(
          'div',
          { class: 'choices' },
          ...options.map((option, index) => {
            const node = button(
              {
                label: text(option.label),
                key: `mg-${option.id}`,
                class: `choice ${option.tried ? 'tried' : ''} ${option.off ? 'off' : ''}`,
                disabled: option.off,
              },
              () => move(app, { option: option.id }),
            );
            if (index === 0) node.dataset.primary = '';
            return h(
              'div',
              { class: 'choice-row' },
              node,
              app.earButton(label(option.label), `ear-${option.id}`),
            );
          }),
        ),
      );
      break;
    }
    case 'timeline': {
      const slots = v.slots as (string | null)[];
      const items = v.items as { id: string; time: string; label: string; placed: boolean }[];
      const selected = typeof app.ui.timelineItem === 'string' ? app.ui.timelineItem : null;
      container.append(
        h(
          'ol',
          { class: 'timeline-slots' },
          ...slots.map((slot, index) => {
            const item = items.find((i) => i.id === slot);
            return h(
              'li',
              null,
              button(
                {
                  label: item
                    ? `${index + 1}. ${item.time} ${text(item.label)}`
                    : `${index + 1}. —`,
                  key: `slot-${index}`,
                  class: `slot ${item ? 'filled' : 'empty'}`,
                  content: h(
                    'span',
                    { class: 'label' },
                    item ? `🕗 ${item.time} · ${text(item.label)}` : `${index + 1}`,
                  ),
                },
                async () => {
                  if (selected) {
                    app.ui.timelineItem = null;
                    app.voice.effect('card-place');
                    await move(app, { place: selected, index });
                  } else if (item) await move(app, { remove: index });
                },
              ),
            );
          }),
        ),
        h(
          'div',
          { class: 'timeline-cards' },
          ...items
            .filter((i) => !i.placed)
            .map((item) =>
              button(
                {
                  label: `${item.time} ${text(item.label)}`,
                  key: `card-${item.id}`,
                  class: 'card',
                  pressed: selected === item.id,
                  content: h('span', { class: 'label' }, `🕗 ${item.time} · ${text(item.label)}`),
                },
                () => {
                  app.ui.timelineItem = selected === item.id ? null : item.id;
                  app.render();
                },
              ),
            ),
        ),
        button(
          {
            label: t(app, 'avatar.done'),
            key: 'timeline-submit',
            class: 'primary',
            disabled: slots.some((s) => s === null),
          },
          () => move(app, { submit: true }),
        ),
      );
      break;
    }
    case 'scent-pairs': {
      if (v.question) {
        const options = v.options as { id: string; label: string; off: boolean }[];
        append(
          container,
          h('p', { class: 'line-text' }, text(v.prompt)),
          h(
            'div',
            { class: 'choices' },
            ...options.map((option) =>
              button(
                {
                  label: text(option.label),
                  key: `mg-${option.id}`,
                  class: `choice ${option.off ? 'off' : ''}`,
                  disabled: option.off,
                },
                () => move(app, { option: option.id }),
              ),
            ),
          ),
        );
        break;
      }
      const cards = v.cards as {
        id: string;
        open: boolean;
        matched: boolean;
        label: string | null;
      }[];
      append(
        container,
        v.fieldLabel ? h('p', { class: 'progress' }, `👃 ${text(v.fieldLabel)}`) : null,
        h(
          'div',
          { class: 'pairs-grid' },
          ...cards.map((card, index) =>
            button(
              {
                label: card.label ? text(card.label) : `Карточка ${index + 1}`,
                key: `scent-${card.id}`,
                class: `scent ${card.open ? 'open' : ''} ${card.matched ? 'matched' : ''}`,
                disabled: card.matched,
                content: h('span', { class: 'label' }, card.label ? text(card.label) : '?'),
              },
              () => {
                app.voice.effect('card-flip');
                return move(app, { card: card.id });
              },
            ),
          ),
        ),
      );
      break;
    }
    case 'baker': {
      const measures = v.measures as { id: string; label: string; units: number }[];
      const target = Number(v.target);
      const poured = Number(v.poured);
      append(
        container,
        v.prompt ? h('p', { class: 'line-text' }, text(v.prompt)) : null,
        h(
          'div',
          { class: 'bowl', role: 'img', 'aria-label': `Насыпано ${poured} из ${target} частей` },
          ...Array.from({ length: target }, (_, i) =>
            h('span', { class: `unit ${i < poured ? 'full' : ''}` }),
          ),
        ),
        h(
          'div',
          { class: 'choices' },
          ...measures.map((measure, index) => {
            const node = button(
              {
                label: text(measure.label),
                key: `measure-${measure.id}`,
                icon: measure.units >= 8 ? '🥛' : measure.units >= 4 ? '🥃' : '🥄',
              },
              () => move(app, { measure: measure.id }),
            );
            if (index === 0) node.dataset.primary = '';
            return h(
              'div',
              { class: 'choice-row' },
              node,
              app.earButton(label(measure.label), `ear-${measure.id}`),
            );
          }),
        ),
      );
      break;
    }
  }
  return container;
}

// ---------------------------------------------------------------- version check («Приглашу на разговор»)

function renderVersion(app: App, run: RunView): HTMLElement {
  const version = run.version!;
  const notebook = run.notebook;
  if (!notebook) return h('p', null, '…');
  const key = `version:${run.pack}`;
  const selection = { ...((app.ui[key] as Record<string, string>) ?? {}) };
  for (const axis of notebook.axes) {
    if (selection[axis.id]) continue;
    const confirmed = notebook.marks.filter((m) => m.axis === axis.id && m.mark === 'confirmed');
    if (confirmed.length === 1) selection[axis.id] = confirmed[0]!.value;
  }
  const complete = notebook.axes.every((axis) => selection[axis.id]);
  return h(
    'div',
    { class: 'version' },
    button({ label: t(app, 'hud.back'), key: 'version-back', icon: '←', class: 'back' }, () => {
      app.ui.versionOpen = false;
      app.render();
    }),
    h('p', { class: 'line-text' }, t(app, 'notebook.pick')),
    h(
      'div',
      { class: 'columns' },
      ...notebook.axes.map((axis) =>
        h(
          'fieldset',
          { class: 'column' },
          h('legend', null, axis.title.text),
          ...axis.values.map((value) => {
            const mark = notebook.marks.find(
              (m) => m.axis === axis.id && m.value === value.id,
            )?.mark;
            return button(
              {
                label: value.label.text,
                key: `pick-${axis.id}-${value.id}`,
                pressed: selection[axis.id] === value.id,
                class: `pick ${mark ? `mark-${mark}` : ''}`,
                content: h('span', { class: 'label' }, `${stickerOf(mark)} ${value.label.text}`),
              },
              () => {
                app.ui[key] = { ...selection, [axis.id]: value.id };
                app.render();
              },
            );
          }),
        ),
      ),
    ),
    button(
      {
        label: version.button.text,
        key: 'version-submit',
        class: 'primary',
        icon: '🗣',
        disabled: !complete || !version.available,
      },
      async () => {
        app.voice.stop();
        if (await app.act({ type: 'version', selection })) app.ui.versionOpen = false;
      },
    ),
  );
}

function stickerOf(mark: string | undefined): string {
  return mark === 'confirmed' ? '✔' : mark === 'excluded' ? '✖' : mark === 'unknown' ? '?' : '·';
}

// ---------------------------------------------------------------- notebook (overlay)

export function renderNotebook(app: App, close: () => HTMLElement): HTMLElement {
  const run = app.view()?.run;
  const notebook = run?.notebook;
  if (!run || !notebook) return h('div', null, close());
  const editing = app.ui.noteCell as { axis: string; value: string } | undefined;
  const busy = Boolean(run.queue);
  const cell = (axis: string, value: { id: string; label: LineView }) => {
    const mark = notebook.marks.find((m) => m.axis === axis && m.value === value.id)?.mark;
    const suggestion = notebook.suggestions.find((s) => s.axis === axis && s.value === value.id);
    const isEditing = editing?.axis === axis && editing.value === value.id;
    return h(
      'li',
      { class: `cell ${mark ? `mark-${mark}` : ''}` },
      button(
        {
          label: `${value.label.text}: ${mark ? t(app, `notebook.${mark}`) : '—'}`,
          key: `cell-${axis}-${value.id}`,
          pressed: isEditing,
          content: h(
            'span',
            { class: 'label' },
            h('span', { class: 'sticker', 'aria-hidden': 'true' }, stickerOf(mark)),
            ` ${value.label.text}`,
          ),
        },
        () => {
          app.ui.noteCell = isEditing ? undefined : { axis, value: value.id };
          app.render();
        },
      ),
      suggestion
        ? h(
            'span',
            { class: 'suggestion' },
            button(
              {
                label: `${stickerOf(suggestion.mark)} ${suggestion.line.text}`,
                key: `accept-${axis}-${value.id}`,
                class: 'ghost',
                content: h('span', { class: 'label' }, `${stickerOf(suggestion.mark)}?`),
              },
              () => app.act({ type: 'accept', axis, value: value.id }),
            ),
            app.earButton(suggestion.line, `ear-s-${axis}-${value.id}`),
          )
        : null,
      isEditing
        ? h(
            'span',
            { class: 'sticker-picker', role: 'group', 'aria-label': value.label.text },
            ...(['confirmed', 'excluded', 'unknown', 'none'] as const).map((sticker) =>
              button(
                {
                  label: t(app, sticker === 'none' ? 'notebook.clear' : `notebook.${sticker}`),
                  key: `stk-${axis}-${value.id}-${sticker}`,
                  content: h(
                    'span',
                    { class: 'label' },
                    sticker === 'none' ? '⌫' : stickerOf(sticker),
                  ),
                },
                async () => {
                  app.ui.noteCell = undefined;
                  await app.act({ type: 'mark', axis, value: value.id, mark: sticker });
                },
              ),
            ),
          )
        : null,
    );
  };
  return h(
    'div',
    { class: 'notebook' },
    close(),
    h('h2', null, t(app, 'hud.notebook')),
    run.queue ? h('p', { class: 'line-text helper' }, run.queue.line.text) : null,
    run.queue
      ? button({ label: t(app, 'hud.next'), key: 'nb-next' }, () => app.act({ type: 'next' }))
      : null,
    h(
      'div',
      { class: 'columns' },
      ...notebook.axes.map((axis) =>
        h(
          'section',
          { class: 'column' },
          h('h3', null, axis.title.text),
          h('ul', null, ...axis.values.map((v) => cell(axis.id, v))),
        ),
      ),
    ),
    h(
      'div',
      { class: 'row' },
      run.help
        ? button({ label: t(app, 'hud.help'), key: 'nb-help', icon: '🤝', disabled: busy }, () =>
            app.act({ type: 'help' }),
          )
        : null,
      run.version?.available
        ? button(
            { label: run.version.button.text, key: 'nb-version', icon: '🗣', class: 'primary' },
            async () => {
              app.ui.versionOpen = true;
              await app.setOverlay(null);
            },
          )
        : null,
    ),
    h('h3', null, t(app, 'notebook.clues')),
    h(
      'ul',
      { class: 'clues' },
      ...notebook.clues.map((clue) => h('li', null, '🔎 ', clue.title.text)),
    ),
  );
}
