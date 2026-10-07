// Presentation adapter boundary. Workstream E's @aegis/browser/stage (puppets, lip-sync,
// cutscenes) will implement `Presenter`; until then StaticPresenter shows layered still images
// with simple CSS transitions. No competing animation engine lives here.
import type { Scarf, Species } from '@fluffy/game-core';
import { h } from './dom.js';
import type { Assets } from './assets.js';

export interface StageScene {
  location: string;
  title: string;
  cast: { id: string; name: string }[];
  avatar: { species: Species | null; scarf: Scarf | null; name: string };
  /** Stage-direction IDs since the last blocking step (e.g. bubbles). */
  stage: string[];
  comfort: boolean;
  reducedMotion: boolean;
}

export interface Presenter {
  readonly element: HTMLElement;
  show(scene: StageScene): void;
  /** The speaking character (null: narrator/none). Lip-sync attaches here once E delivers it. */
  speak(speaker: string | null, lineId: string | null): void;
  setPaused(paused: boolean): void;
  dispose(): void;
}

export class StaticPresenter implements Presenter {
  readonly element: HTMLElement;
  private background: HTMLImageElement;
  private castLayer: HTMLElement;
  private avatarLayer: HTMLElement;
  private effects: HTMLElement;
  private current: StageScene | null = null;

  constructor(private readonly assets: Assets) {
    this.background = h('img', { class: 'stage-bg', alt: '', draggable: 'false' });
    this.castLayer = h('div', { class: 'stage-cast' });
    this.avatarLayer = h('div', { class: 'stage-avatar' });
    this.effects = h('div', { class: 'stage-effects', 'aria-hidden': 'true' });
    this.element = h(
      'div',
      { class: 'stage', 'aria-hidden': 'true' },
      this.background,
      this.castLayer,
      this.avatarLayer,
      this.effects,
    );
  }

  show(scene: StageScene): void {
    const previous = this.current;
    this.current = scene;
    this.element.dataset.reducedMotion = String(scene.reducedMotion);
    this.element.classList.toggle('comfort', scene.comfort);
    if (!previous || previous.location !== scene.location || previous.title !== scene.title) {
      this.background.src = this.assets.background(scene.location, scene.title);
      this.element.dataset.location = scene.location;
      if (!scene.reducedMotion) {
        this.element.classList.remove('enter');
        void this.element.offsetWidth;
        this.element.classList.add('enter');
      }
    }
    const castKey = scene.cast.map((c) => c.id).join();
    if (!previous || previous.cast.map((c) => c.id).join() !== castKey) {
      this.castLayer.replaceChildren(
        ...scene.cast.map((member) =>
          h(
            'figure',
            { class: 'figure', dataset: { speaker: member.id } },
            h('img', { src: this.assets.character(member.id, member.name), alt: '' }),
          ),
        ),
      );
    }
    const avatar = this.assets.avatar(scene.avatar.species, scene.avatar.scarf);
    const avatarKey = `${scene.avatar.species}:${scene.avatar.scarf}`;
    if (this.avatarLayer.dataset.key !== avatarKey) {
      this.avatarLayer.dataset.key = avatarKey;
      this.avatarLayer.replaceChildren(
        h('figure', { class: 'figure avatar' }, h('img', { src: avatar.base, alt: '' })),
      );
    }
    this.effects.replaceChildren();
    if (scene.stage.some((id) => id.includes('bubble')) && !scene.reducedMotion) {
      for (let i = 0; i < 6; i++)
        this.effects.append(h('span', { class: 'bubble', style: `--i:${i}` }));
    }
  }

  speak(speaker: string | null): void {
    for (const figure of this.castLayer.querySelectorAll<HTMLElement>('.figure'))
      figure.classList.toggle('speaking', figure.dataset.speaker === speaker);
  }

  setPaused(paused: boolean): void {
    this.element.classList.toggle('paused', paused);
  }

  dispose(): void {
    this.element.remove();
  }
}
