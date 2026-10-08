// «Уютный денёк» in the office (T28, T29, D12, T26): the shop with returns, the tea party, rank
// news and the persistent notebook pages. Everything here is outside a case; nothing is timed.
import type { CozyView, GameView, LineView, NotebookPageView } from '@fluffy/game-core';
import type { App } from './app.js';
import { button, h } from './dom.js';

const PAGE = 3;

function t(app: App, key: string): string {
  return app.labels(key).text;
}

const SHAPES: Record<string, string> = { circle: '●', square: '■', flower: '✿', heart: '♥' };
const COLOURS: Record<string, string> = {
  honey: '#e9b44c',
  blue: '#6d9bd1',
  rose: '#e58fa6',
  green: '#7fb685',
};

/** A dot or a dash as a symbol with a text alternative (never colour or timing only). */
export function patternNode(pattern: readonly ('dot' | 'dash')[]): HTMLElement {
  const words = pattern.map((s) => (s === 'dot' ? 'точка' : 'тире')).join(', ');
  return h(
    'span',
    { class: 'signal-pattern', role: 'img', 'aria-label': words },
    ...pattern.map((s) =>
      h('span', { class: `signal-${s}`, 'aria-hidden': 'true' }, s === 'dot' ? '●' : '▬'),
    ),
  );
}

/** A dialogue line in the office with replay and «Дальше» (office lines never advance by themselves). */
function officeLine(app: App, line: LineView, onNext: () => Promise<unknown>): HTMLElement {
  const next = button(
    { label: t(app, 'hud.next'), key: 'next', icon: '➜', class: 'primary next' },
    () => {
      app.voice.stop();
      return onNext();
    },
  );
  next.dataset.primary = '';
  return h(
    'div',
    { class: 'dialogue office-line', dataset: { line: line.id } },
    line.speakerName ? h('p', { class: 'speaker' }, line.speakerName) : null,
    h('p', { class: 'line-text' }, line.text),
    h('div', { class: 'dialogue-actions' }, app.earButton(line, 'replay'), next),
  );
}

/**
 * The office panel while something is being told: the rank news (once) or a tea story / shop reply.
 * Returns null when the office is idle.
 */
export function renderOfficeTalk(app: App, view: GameView): HTMLElement | null {
  if (view.newRank) {
    const rank = view.newRank;
    const index = Number(app.ui.rankLine ?? 0);
    const line = rank.message[index];
    if (line) {
      app.narrate(`rank:${rank.id}:${index}`, line);
      return h(
        'div',
        { class: 'rank-news' },
        h('h2', null, `${t(app, 'rank.new')} ${rank.label.text}`),
        officeLine(app, line, async () => {
          app.ui.rankLine = index + 1;
          app.render();
        }),
      );
    }
    app.narrate(`rank:${rank.id}:done`, null);
    const done = button(
      { label: `🎉 ${rank.label.text}`, key: 'rank-ok', class: 'primary' },
      async () => {
        app.ui.rankLine = 0;
        await app.act({ type: 'rank-seen', rank: rank.id });
      },
    );
    done.dataset.primary = '';
    return h(
      'div',
      { class: 'rank-news' },
      h('h2', null, `${t(app, 'rank.new')} ${rank.label.text}`),
      done,
    );
  }
  const talk = view.cozy?.office;
  if (!talk) return null;
  app.narrate(`office:${talk.line.id}:${talk.remaining}`, talk.line);
  return officeLine(app, talk.line, () => app.act({ type: 'office-next' }));
}

type ShopTab = 'hat' | 'scarf-pattern' | 'decor' | 'tea';
const TABS: { id: ShopTab; label: string; icon: string }[] = [
  { id: 'hat', label: 'cozy.hats', icon: '🎩' },
  { id: 'scarf-pattern', label: 'cozy.scarves', icon: '🧣' },
  { id: 'decor', label: 'cozy.decor', icon: '🪴' },
  { id: 'tea', label: 'cozy.tea', icon: '🫖' },
];

function price(item: CozyView['shop'][number]): string {
  return `${item.price.amount} ${item.price.currency === 'buttons' ? '🔘' : '💗'}`;
}

function paged<T>(app: App, key: string, items: readonly T[]) {
  const pages = Math.max(1, Math.ceil(items.length / PAGE));
  const page = Math.min(Number(app.ui[key] ?? 0), pages - 1);
  const more =
    pages > 1
      ? button({ label: t(app, 'hud.more'), key: `${key}-more`, icon: '↻' }, () => {
          app.ui[key] = (page + 1) % pages;
          app.render();
        })
      : null;
  return { visible: items.slice(page * PAGE, page * PAGE + PAGE), more };
}

/** The cozy-day overlay: shop tabs (hats, scarves, decor) and the tea party. */
export function renderCozy(app: App, close: () => HTMLElement): HTMLElement {
  const view = app.view();
  const cozy = view?.cozy;
  if (!view || !cozy) return h('div', null, close());
  const tab = (app.ui.cozyTab as ShopTab | undefined) ?? 'hat';
  const closeAfter = async (action: Parameters<App['act']>[0]) => {
    // Buying, returning and tea always answer with lines, played in the office panel.
    if (await app.act(action)) await app.setOverlay(null);
  };
  let body: HTMLElement;
  if (tab === 'tea') {
    const { visible, more } = paged(app, 'cozy-tea-page', cozy.residents);
    body = h(
      'div',
      { class: 'cozy-list' },
      h('p', { class: 'wallet' }, `💗 ${view.hearts}`),
      h(
        'ul',
        { class: 'cards' },
        ...visible.map((r) =>
          h(
            'li',
            { class: 'cozy-card resident' },
            h('p', { class: 'cozy-name' }, r.name),
            button(
              {
                label: `${t(app, 'cozy.tea')}: ${r.name} (${r.price} 💗)`,
                key: `tea-${r.speaker}`,
                icon: '🫖',
              },
              () => closeAfter({ type: 'tea', speaker: r.speaker }),
            ),
          ),
        ),
      ),
      more,
    );
  } else {
    const items = cozy.shop.filter((i) => i.kind === tab && i.onSale);
    const { visible, more } = paged(app, `cozy-${tab}-page`, items);
    body = h(
      'div',
      { class: 'cozy-list' },
      h('p', { class: 'wallet' }, `🔘 ${view.buttons} · 💗 ${view.hearts}`),
      h(
        'ul',
        { class: 'cards' },
        ...visible.map((item) => {
          const actions: HTMLElement[] = [];
          if (!item.owned)
            actions.push(
              button(
                {
                  label: `${t(app, 'cozy.buy')}: ${item.label.text} (${price(item)})`,
                  key: `buy-${item.id}`,
                  icon: '🛍',
                },
                () => closeAfter({ type: 'buy', item: item.id }),
              ),
            );
          else {
            if (item.kind !== 'decor')
              actions.push(
                button(
                  {
                    label: `${t(app, 'cozy.wear')}: ${item.label.text}`,
                    key: `wear-${item.id}`,
                    pressed: item.worn,
                    icon: item.kind === 'hat' ? '🎩' : '🧣',
                  },
                  () => app.act({ type: 'wear', item: item.id, on: !item.worn }),
                ),
              );
            actions.push(
              button(
                {
                  label: `${t(app, 'cozy.return')}: ${item.label.text} (+${price(item)})`,
                  key: `return-${item.id}`,
                  icon: '↩',
                },
                () => closeAfter({ type: 'refund', item: item.id }),
              ),
            );
          }
          return h(
            'li',
            { class: `cozy-card ${item.owned ? 'owned' : ''}`, dataset: { item: item.id } },
            h('p', { class: 'cozy-name' }, item.label.text),
            h('p', { class: 'cozy-price' }, item.owned ? t(app, 'cozy.owned') : price(item)),
            ...actions,
          );
        }),
      ),
      more,
    );
  }
  return h(
    'div',
    { class: 'book cozy' },
    close(),
    h('h2', null, t(app, 'cozy.title')),
    h(
      'div',
      { class: 'segmented', role: 'group', 'aria-label': t(app, 'cozy.shop') },
      ...TABS.map((entry) =>
        button(
          {
            label: t(app, entry.label),
            key: `cozy-tab-${entry.id}`,
            pressed: tab === entry.id,
            icon: entry.icon,
          },
          () => {
            app.ui.cozyTab = entry.id;
            app.render();
          },
        ),
      ),
    ),
    body,
  );
}

function cipherPoster(page: Extract<NotebookPageView, { kind: 'cipher-poster' }>): HTMLElement {
  return h(
    'ul',
    { class: 'cipher-table' },
    ...page.table.map((cell) =>
      h(
        'li',
        { class: `glyph shape-${cell.shape}`, 'aria-label': cell.label.text },
        h(
          'span',
          {
            class: 'glyph-button',
            style: `--glyph: ${COLOURS[cell.colour] ?? '#ccc'}`,
            'aria-hidden': 'true',
          },
          h('span', { class: 'glyph-shape' }, SHAPES[cell.shape] ?? '●'),
          h('span', { class: 'glyph-holes' }, '∘'.repeat(cell.holes)),
        ),
        h('span', { class: 'glyph-letter' }, cell.letter),
      ),
    ),
  );
}

/** Notebook pages that stay with the profile (T26): the postal cipher poster and secret notes. */
export function renderPages(app: App, close: () => HTMLElement): HTMLElement {
  const view = app.view();
  const pages = view?.notebookPages ?? [];
  const current = pages.find((p) => p.id === app.ui.notebookPage) ?? pages[0];
  return h(
    'div',
    { class: 'book notebook-pages' },
    close(),
    h('h2', null, t(app, 'hud.notebook')),
    pages.length > 1
      ? h(
          'div',
          { class: 'segmented', role: 'group' },
          ...pages.map((page) =>
            button(
              { label: page.title.text, key: `page-${page.id}`, pressed: page === current },
              () => {
                app.ui.notebookPage = page.id;
                app.render();
              },
            ),
          ),
        )
      : null,
    current
      ? h(
          'section',
          { class: `page page-${current.kind}`, dataset: { page: current.id } },
          h('h3', null, current.title.text),
          current.kind === 'cipher-poster'
            ? cipherPoster(current)
            : current.kind === 'secret-notes' && view?.signal
              ? h(
                  'p',
                  { class: 'own-signal' },
                  `${t(app, 'notebook.ownSignal')} `,
                  patternNode(view.signal),
                )
              : null,
        )
      : h('p', null, t(app, 'notebook.nothing')),
  );
}
