// Presentation adapter boundary: StagePresenter on E's @aegis/browser/stage (puppets, lip-sync,
// cutscenes), StaticPresenter (layered still images) as the fallback. No animation engine lives here.
import type { Scarf, Species } from '@fluffy/game-core';
import { h } from './dom.js';
import {
  createStage,
  type CutsceneController,
  type EffectDefinition,
  type Stage,
  type StagePuppet,
} from '@aegis/browser/stage';
import type { CutsceneFile } from '@aegis/browser/animation';
import { CAMERA_PRESETS, EFFECTS } from './stage-config.js';
import { SCARF_COLORS, type Assets } from './assets.js';
import type { Voice } from './audio.js';

export interface StageScene {
  location: string;
  title: string;
  cast: { id: string; name: string }[];
  avatar: { species: Species | null; scarf: Scarf | null; name: string };
  /** Stage-direction IDs since the last blocking step (e.g. bubbles). */
  stage: { id: string; text: string }[];
  comfort: boolean;
  reducedMotion: boolean;
  /** Difficulty level of the case (background prop layers may depend on it). */
  level: number | null;
  /** Background asset that overrides the location's default for this moment. */
  background?: string | null;
}

export interface Presenter {
  readonly element: HTMLElement;
  show(scene: StageScene): void;
  /** The speaking character (null: narrator/none): highlight only, no audio. */
  speak(speaker: string | null, lineId: string | null): void;
  /** Starts a voiced line; a puppet on stage lip-syncs it, otherwise plain narration plays. */
  speakLine(speaker: string, packId: string, lineId: string): Promise<void>;
  setPaused(paused: boolean): void;
  setSearching?(searching: boolean): void;
  /** Plays (or keeps playing) a T25 cutscene; idempotent for the same request key. */
  playCutscene(request: CutsceneRequest): CutsceneControls;
  dispose(): void;
}

export type CutsceneUiEvent =
  | { type: 'line'; line: string; actor?: string }
  | { type: 'awaiting-input' }
  | { type: 'playing' }
  | { type: 'marker'; id: string }
  | { type: 'completed' }
  | { type: 'skipped' };

export interface CutsceneRequest {
  key: string;
  document: CutsceneFile;
  packId: string;
  avatar: { species: Species | null; scarf: Scarf | null };
  from: string | null;
  onEvent(event: CutsceneUiEvent): void;
}

export interface CutsceneControls {
  next(): void;
  skip(): void;
  replay(): void;
}

/**
 * Text-only cutscene player for the still-image fallback: walks the document's `line` steps,
 * waiting for «Дальше» after each, honouring markers. Motion is not shown.
 */
class LineCutscene implements CutsceneControls {
  private index = 0;
  private done = false;
  constructor(private readonly request: CutsceneRequest) {
    const steps = request.document.steps;
    if (request.from) {
      const at = steps.findIndex(
        (s) => s.op === 'marker' && (s as { id: string }).id === request.from,
      );
      if (at >= 0) this.index = at + 1;
    }
    queueMicrotask(() => this.advance());
  }
  private advance(): void {
    const steps = this.request.document.steps;
    while (this.index < steps.length) {
      const step = steps[this.index++]! as {
        op: string;
        line?: string;
        actor?: string;
        id?: string;
      };
      if (step.op === 'marker') this.request.onEvent({ type: 'marker', id: step.id! });
      if (step.op === 'line') {
        this.request.onEvent({ type: 'line', line: step.line!, actor: step.actor });
        this.request.onEvent({ type: 'awaiting-input' });
        return;
      }
    }
    if (!this.done) {
      this.done = true;
      this.request.onEvent({ type: 'completed' });
    }
  }
  next(): void {
    this.request.onEvent({ type: 'playing' });
    this.advance();
  }
  skip(): void {
    if (this.done) return;
    this.done = true;
    this.request.onEvent({ type: 'skipped' });
  }
  replay(): void {
    this.index = 0;
    this.done = false;
    this.advance();
  }
}

export class StaticPresenter implements Presenter {
  readonly element: HTMLElement;
  private background: HTMLImageElement;
  private castLayer: HTMLElement;
  private avatarLayer: HTMLElement;
  private effects: HTMLElement;
  private props: HTMLElement;
  private current: StageScene | null = null;

  constructor(private readonly assets: Assets) {
    this.background = h('img', { class: 'stage-bg', alt: '', draggable: 'false' });
    this.castLayer = h('div', { class: 'stage-cast' });
    this.avatarLayer = h('div', { class: 'stage-avatar' });
    this.effects = h('div', { class: 'stage-effects', 'aria-hidden': 'true' });
    this.props = h('div', { class: 'stage-props' });
    this.element = h(
      'div',
      { class: 'stage', 'aria-hidden': 'true' },
      this.background,
      this.props,
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
    if (
      !previous ||
      previous.location !== scene.location ||
      previous.title !== scene.title ||
      previous.background !== scene.background
    ) {
      this.background.src = scene.background
        ? this.assets.resolve(scene.background)
        : this.assets.background(scene.location, scene.title);
      this.element.dataset.location = scene.location;
      if (!scene.reducedMotion) {
        this.element.classList.remove('enter');
        void this.element.offsetWidth;
        this.element.classList.add('enter');
      }
    }
    const propsKey = `${scene.location}:${scene.level}`;
    if (this.props.dataset.key !== propsKey) {
      this.props.dataset.key = propsKey;
      this.props.replaceChildren(
        ...this.assets.layers(scene.location, scene.level).map((layer) => {
          const img = h('img', { src: layer.src, alt: '', class: 'prop' });
          img.style.left = `${(layer.x / 2560) * 100}%`;
          img.style.top = `${(layer.y / 1600) * 100}%`;
          img.style.width = `${(layer.w / 2560) * 100}%`;
          img.style.height = `${(layer.h / 1600) * 100}%`;
          return img;
        }),
      );
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
      // Before the child picks an animal there is no avatar on stage yet.
      this.avatarLayer.replaceChildren(
        ...(scene.avatar.species ? [avatarFigure(avatar, scene.avatar.scarf)] : []),
      );
    }
    this.effects.replaceChildren();
    if (
      scene.stage.some((cue) => /пузыр|bubble/i.test(cue.text + cue.id)) &&
      !scene.reducedMotion
    ) {
      for (let i = 0; i < 3; i++)
        this.effects.append(h('span', { class: 'bubble', style: `--i:${i}` }));
    }
  }

  constructor_narration: Voice | null = null;

  speakLine(_speaker: string, packId: string, lineId: string): Promise<void> {
    return this.constructor_narration
      ? this.constructor_narration.controller.playLine(packId, lineId)
      : Promise.resolve();
  }

  private cutscene: { key: string; controls: CutsceneControls } | null = null;

  playCutscene(request: CutsceneRequest): CutsceneControls {
    if (this.cutscene?.key !== request.key)
      this.cutscene = { key: request.key, controls: new LineCutscene(request) };
    return this.cutscene.controls;
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

/** The avatar composed at runtime: species base plus a scarf tinted through its mask (T05). */
export function avatarFigure(
  avatar: { base: string; mask: string | null },
  scarf: Scarf | null,
): HTMLElement {
  const figure = h('figure', { class: 'figure avatar' }, h('img', { src: avatar.base, alt: '' }));
  if (avatar.mask && scarf) {
    const tint = h('span', { class: 'scarf-tint' });
    tint.style.backgroundColor = SCARF_COLORS[scarf];
    tint.style.setProperty('mask-image', `url("${avatar.mask}")`);
    tint.style.setProperty('-webkit-mask-image', `url("${avatar.mask}")`);
    figure.append(tint);
  }
  return figure;
}

// ---------------------------------------------------------------- E's 2D puppet stage

const CAST_X = [1250, 1650, 2050, 2350, 950, 1450];
const STAGE_FLOOR = 1520;

/**
 * Presenter on `@aegis/browser/stage`: A's backgrounds, prop layers and rigged puppets (cast and the
 * player's avatar with a runtime-tinted scarf), breathing and blinking, and lip-sync driven by the
 * narration clock from A's cue tracks. Falls back to still images if the stage cannot load.
 */
export class StagePresenter implements Presenter {
  readonly element: HTMLElement;
  private readonly stage: Stage;
  private readonly puppets = new Map<string, StagePuppet>();
  private loaded = new Set<string>();
  private current: StageScene | null = null;
  private generation = 0;
  private searching = false;
  readonly fallback: StaticPresenter;
  private readonly effectDefinitions: Record<string, EffectDefinition> = EFFECTS;
  private failed = false;
  private stopSpeechWatch: (() => void) | null = null;

  /** Mirrors the speaking puppet's lip-sync mode on the (aria-hidden) stage element for acceptance checks. */
  private watchSpeech(puppet: StagePuppet): void {
    this.stopSpeechWatch?.();
    const report = (speech: { mode: string; synchronized: boolean }) => {
      this.element.dataset.speech = `${speech.mode}${speech.synchronized ? ':synchronized' : ''}`;
    };
    report(puppet.speech());
    this.stopSpeechWatch = puppet.onSpeech(report);
  }
  /** Resolves when the current scene's puppets are on stage. */
  private ready: Promise<void> = Promise.resolve();

  constructor(
    private readonly assets: Assets,
    private readonly voice: Voice,
    baseUrl: string,
  ) {
    this.fallback = new StaticPresenter(assets);
    this.fallback.constructor_narration = voice;
    this.element = h('div', { class: 'stage stage-live', 'aria-hidden': 'true' });
    this.stage = createStage({
      host: this.element,
      baseUrl,
      resolve: (id) => assets.resolve(id),
      narration: voice.controller,
      reducedMotion: 'system',
      comfort: { brightness: 1.12, warmth: 0.6 },
      maxDevicePixelRatio: 2,
      // Camera framings and particle effects named by C's cutscene documents (T25 contract).
      cameraPresets: CAMERA_PRESETS,
      effects: this.effectDefinitions,
      // Cutscene music and sounds go through the game's audio pack (A's `music.*`/`sfx.*` IDs).
      audio: {
        music: (asset) =>
          voice.music(asset ? asset.replace(/^music\./, '') : null, this.current?.comfort ?? false),
        sfx: (asset) => voice.effect(asset.replace(/^sfx\./, '')),
      },
    });
  }

  private async ensure(documents: string[], images: string[]): Promise<boolean> {
    const docs = documents.filter((id) => !this.loaded.has(id));
    const imgs = images.filter((id) => !this.loaded.has(id));
    if (!docs.length && !imgs.length) return true;
    const result = await this.stage.load({ documents: docs, images: imgs });
    if (!result.ok) return false;
    for (const id of [...docs, ...imgs]) this.loaded.add(id);
    return true;
  }

  show(scene: StageScene): void {
    const previous = this.current;
    this.current = scene;
    this.stage.setReducedMotion(scene.reducedMotion);
    this.stage.setComfort(scene.comfort);
    this.element.classList.toggle('comfort', scene.comfort);
    if (this.failed) return this.fallback.show(scene);
    // A playing cutscene owns the stage; the scene is rebuilt when it ends.
    if (this.cutscene) {
      this.current = null;
      return;
    }
    const key = (s: StageScene | null) =>
      s
        ? JSON.stringify([
            s.location,
            s.level,
            s.cast.map((c) => c.id),
            s.avatar.species,
            s.avatar.scarf,
          ])
        : '';
    if (key(previous) === key(scene)) return;
    this.ready = this.build(scene, ++this.generation).catch(() => {});
  }

  private async build(scene: StageScene, generation: number): Promise<void> {
    const background = scene.background ?? this.assets.backgroundId(scene.location);
    const layers = scene.background ? [] : this.assets.rawLayers(scene.location, scene.level);
    const castDocs = scene.cast.map((c) => this.assets.puppet(c.id));
    const avatarDocs = scene.avatar.species ? this.assets.avatarPuppet(scene.avatar.species) : null;
    const ok = await this.ensure(
      [...castDocs, avatarDocs].flatMap((d) => d?.documents ?? []),
      [...(background ? [background] : []), ...layers.map((l) => l.asset)],
    ).catch(() => false);
    if (generation !== this.generation) return;
    if (!ok || !background) {
      this.failed = !ok;
      this.element.replaceChildren(this.fallback.element);
      this.fallback.show(scene);
      return;
    }
    this.stage.clearScene();
    this.puppets.clear();
    this.stage.setBackground(background, {
      type: scene.reducedMotion ? 'cut' : 'crossfade',
      duration: 0.5,
    });
    for (const layer of layers) {
      const size = this.assets.assetSize(layer.asset);
      this.stage.addSprite({
        layer: 'midground',
        image: layer.asset,
        at: { x: layer.x + layer.w / 2, y: layer.y + layer.h / 2 },
        scale: size ? Math.min(layer.w / size.width, layer.h / size.height) : 1,
      });
    }
    scene.cast.forEach((member, index) => {
      const docs = castDocs[index];
      if (!docs) return;
      const puppet = this.stage.puppet({
        id: member.id,
        rig: docs.rigId,
        at: { x: CAST_X[index % CAST_X.length]!, y: STAGE_FLOOR },
        scale: 1.25,
        facing: 'left',
        behaviours: { breathe: {}, blink: {} },
      });
      this.puppets.set(member.id, puppet);
    });
    if (avatarDocs && scene.avatar.scarf) {
      const avatar = this.stage.puppet({
        id: 'avatar',
        rig: avatarDocs.rigId,
        tints: { scarf: SCARF_COLORS[scene.avatar.scarf] },
        at: { x: 520, y: STAGE_FLOOR },
        scale: 1.15,
        facing: 'right',
        behaviours: { breathe: {}, blink: {} },
      });
      this.puppets.set('avatar', avatar);
    }
    this.applySearching();
  }

  /** While searching with the magnifier, characters step aside so every object is visible. */
  setSearching(searching: boolean): void {
    this.searching = searching;
    this.applySearching();
  }

  private applySearching(): void {
    for (const [id, puppet] of this.puppets)
      if (id !== 'avatar') puppet.setVisible(!this.searching);
  }

  speak(): void {}

  async speakLine(speaker: string, packId: string, lineId: string): Promise<void> {
    await this.ready;
    const puppet = this.puppets.get(speaker);
    if (puppet && !this.failed) {
      for (const other of this.puppets.values()) if (other !== puppet) other.silence();
      this.watchSpeech(puppet);
      await puppet.speak({ packId, lineId }, { unheard: 'subtle' });
      return;
    }
    await this.voice.controller.playLine(packId, lineId);
  }

  private cutscene: {
    key: string;
    controller: CutsceneController | null;
    fallback: CutsceneControls | null;
  } | null = null;

  playCutscene(request: CutsceneRequest): CutsceneControls {
    if (this.cutscene?.key === request.key) return this.controlsFor(this.cutscene);
    this.cutscene?.controller?.dispose();
    const entry: {
      key: string;
      controller: CutsceneController | null;
      fallback: CutsceneControls | null;
    } = { key: request.key, controller: null, fallback: null };
    this.cutscene = entry;
    void this.startCutscene(request, entry);
    return this.controlsFor(entry);
  }

  private controlsFor(entry: {
    controller: CutsceneController | null;
    fallback: CutsceneControls | null;
  }): CutsceneControls {
    return {
      next: () => (entry.controller ? void entry.controller.next() : entry.fallback?.next()),
      skip: () => (entry.controller ? entry.controller.skip() : entry.fallback?.skip()),
      replay: () => (entry.controller ? entry.controller.replay() : entry.fallback?.replay()),
    };
  }

  private async startCutscene(
    request: CutsceneRequest,
    entry: {
      key: string;
      controller: CutsceneController | null;
      fallback: CutsceneControls | null;
    },
  ): Promise<void> {
    const document = request.document;
    const rigs = Object.values(document.cast)
      .map((cast) => (cast as { rig?: string }).rig)
      .filter((rig): rig is string => Boolean(rig));
    const docs = [
      ...rigs.flatMap((rig) => this.assets.rigDocuments(rig)),
      // Clips (poses, emotes) are small JSON: load them all. Atlases only for the cast and effects,
      // to stay inside the stage's decoded-image budget.
      ...this.assets.documentAssets('clip'),
      ...this.effectAtlases(),
    ];
    const species = request.avatar.species;
    const avatarDocs = species ? this.assets.avatarPuppet(species) : null;
    if (avatarDocs) docs.push(...avatarDocs.documents);
    const images = [
      ...new Set(
        document.steps.flatMap((step) => {
          const record = step as { op: string; asset?: string; comfort?: { asset?: string } };
          return record.op === 'background'
            ? [record.asset, record.comfort?.asset].filter((a): a is string => Boolean(a))
            : [];
        }),
      ),
    ];
    const ok = await this.ensure(
      [...new Set(docs)].filter((id) => this.assetExists(id)),
      images,
    ).catch(() => false);
    if (this.cutscene !== entry) return;
    if (!ok || this.failed) {
      entry.fallback = new LineCutscene(request);
      return;
    }
    // The cutscene owns the stage until it ends; the scene is rebuilt afterwards.
    this.stage.clearScene();
    this.puppets.clear();
    this.current = null;
    const controller = this.stage.cutscene(document, {
      packId: request.packId,
      avatar:
        avatarDocs && request.avatar.scarf
          ? { rig: avatarDocs.rigId, tints: { scarf: SCARF_COLORS[request.avatar.scarf] } }
          : undefined,
      onEvent: (event) => {
        if (event.type === 'line')
          request.onEvent({ type: 'line', line: event.line, actor: event.actor });
        else if (event.type === 'awaiting-input') request.onEvent({ type: 'awaiting-input' });
        else if (event.type === 'marker') request.onEvent({ type: 'marker', id: event.id });
        else if (event.type === 'completed' || event.type === 'skipped') {
          if (this.cutscene === entry) this.cutscene = null;
          request.onEvent({ type: event.type });
        } else if (event.type === 'step') request.onEvent({ type: 'playing' });
      },
    });
    entry.controller = controller;
    // Acceptance hooks on the aria-hidden stage element (no globals): which cutscene, avatar bound?
    const wantsAvatar = Object.values(document.cast).some(
      (cast) => (cast as { role?: string }).role === 'avatar',
    );
    this.element.dataset.cutscene = document.id;
    this.element.dataset.cutsceneAvatar = wantsAvatar && avatarDocs ? 'bound' : 'none';
    controller.play(request.from ? { from: request.from } : undefined);
  }

  private assetExists(id: string): boolean {
    try {
      this.assets.resolve(id);
      return true;
    } catch {
      return false;
    }
  }

  /** Atlas assets named by the registered particle effects (`atlas#frame`). */
  private effectAtlases(): string[] {
    return Object.values(this.effectDefinitions)
      .map(
        (effect) =>
          this.assets.manifest.documents[effect.frame.split('#')[0]!]?.asset ??
          `${effect.frame.split('#')[0]}.atlas`,
      )
      .filter((id) => this.assetExists(id));
  }

  setPaused(paused: boolean): void {
    if (paused) this.cutscene?.controller?.pause('user');
    else this.cutscene?.controller?.resume('user');
    this.element.classList.toggle('paused', paused);
    if (paused) this.stage.pause('user');
    else this.stage.resume('user');
  }

  dispose(): void {
    this.stopSpeechWatch?.();
    void this.stage.dispose();
    this.element.remove();
  }
}

export function createPresenter(assets: Assets, voice: Voice, baseUrl: string): Presenter {
  // E's stage needs puppet documents from A; without them the still-image presenter is used.
  const hasPuppets = Object.values(assets.manifest.characters).some((c) => c.puppet);
  if (!hasPuppets) {
    const still = new StaticPresenter(assets);
    still.constructor_narration = voice;
    return still;
  }
  return new StagePresenter(assets, voice, baseUrl);
}
