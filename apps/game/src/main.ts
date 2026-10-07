import { applyPresentationPreferences } from '@aegis/browser/ui';
import { GAME_ID } from '@fluffy/game-core';

declare const FLUFFY_DEV: boolean;

function boot(): void {
  const root = document.querySelector<HTMLElement>('#app');
  if (!root) return;
  applyPresentationPreferences(document.documentElement, {
    locale: 'ru',
    textScale: 1,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    comfort: false,
    hideSpoilers: false,
    volumes: { narration: 1, music: 0.6, effects: 0.8 },
  });
  const title = document.createElement('h1');
  title.textContent = 'Пушистое бюро расследований';
  root.replaceChildren(title);
  root.dataset.game = GAME_ID;
  root.dataset.channel = FLUFFY_DEV ? 'dev' : 'release';
  root.removeAttribute('aria-busy');
}

boot();
