// Application controller: profiles, session lifecycle, overlays, settings and the child-safe shell.
import { IndexedDbSaveStorage } from '@aegis/browser/indexeddb';
import {
  applyPresentationPreferences,
  assertChildSafeView,
  bindVisibilityPause,
  openDialog,
  rememberFocus,
} from '@aegis/browser/ui';
import type { SaveStorage } from '@aegis/browser/save';
import {
  MAX_PROFILES,
  acquireProfileLock,
  deleteProfileData,
  deviceStore,
  openProfile,
  prefsStore,
  type DeviceState,
  type ProfileLock,
  type ProfilePrefs,
  type ProfileSession,
  type RecordStore,
  type Recovery,
} from '@fluffy/game-session';
import type { FluffyPack, GameAction, GameView, LineView, PackLibrary } from '@fluffy/game-core';
import { Assets } from './assets.js';
import { Voice } from './audio.js';
import { button, focusFirst, h, setErrorSink } from './dom.js';
import { createLabels, type Label, type LabelLookup } from './labels.js';
import { Offline } from './offline.js';
import { StaticPresenter, type Presenter } from './presenter.js';
import { renderGame, renderNotebook } from './scene.js';
import { renderParentCorner, renderParentGate } from './parent.js';

export interface AppOptions {
  root: HTMLElement;
  baseUrl: string;
  buildId: string;
  channel: string;
  library: PackLibrary;
  packs: FluffyPack[];
  assets: Assets;
  storage?: SaveStorage;
}

export type Overlay =
  | 'pause'
  | 'settings'
  | 'notebook'
  | 'encyclopedia'
  | 'glossary'
  | 'album'
  | 'cases'
  | 'restart'
  | 'break'
  | 'parent-gate'
  | 'parent'
  | null;

export class App {
  readonly root: HTMLElement;
  readonly labels: LabelLookup;
  readonly voice: Voice;
  readonly offline: Offline;
  readonly storage: SaveStorage;
  readonly assets: Assets;
  readonly library: PackLibrary;
  device!: DeviceState;
  prefs: ProfilePrefs | null = null;
  session: ProfileSession | null = null;
  presenter: Presenter | null = null;
  overlay: Overlay = null;
  /** Transient UI state (never authoritative). */
  ui: Record<string, unknown> = {};
  saveStatus: string = 'idle';
  private deviceRecord: RecordStore<DeviceState>;
  private prefsRecord: RecordStore<ProfilePrefs> | null = null;
  private lock: ProfileLock | null = null;
  private screenNode: HTMLElement;
  private overlayNode: HTMLDialogElement;
  private liveNode: HTMLElement;
  private statusNode: HTMLElement;
  private unbind: (() => void)[] = [];
  private spokenKey = '';
  private playStartedAt = 0;
  private playedMs = 0;
  private breakDue = false;
  private closeOverlay: (() => void) | null = null;
  private focusBookmark: ReturnType<typeof rememberFocus> | null = null;
  private blocked: { profileId: string } | null = null;
  private recovery: Recovery | null = null;

  constructor(private readonly options: AppOptions) {
    this.root = options.root;
    this.assets = options.assets;
    this.library = options.library;
    this.storage = options.storage ?? new IndexedDbSaveStorage('fluffy-bureau');
    this.deviceRecord = deviceStore(this.storage);
    const shared = options.packs.find((p) => p.id === 'shared');
    const sharedLines = new Map<string, LineView>(
      (shared?.lines ?? []).map((line) => [
        line.id,
        {
          id: line.id,
          speaker: line.speaker,
          speakerName: '',
          text: line.text,
          voiced: line.voiced,
          kind: line.kind,
        },
      ]),
    );
    this.labels = createLabels(sharedLines);
    this.voice = new Voice(options.assets, options.baseUrl);
    this.voice.registerPacks(options.packs);
    this.offline = new Offline(options.baseUrl, options.buildId);
    this.screenNode = h('main', { class: 'screen', id: 'screen' });
    this.overlayNode = h('dialog', { class: 'overlay' });
    this.overlayNode.addEventListener('cancel', (event) => {
      event.preventDefault();
      if (this.overlay !== 'break') void this.setOverlay(null);
    });
    this.liveNode = h('p', { class: 'visually-hidden', role: 'status', 'aria-live': 'polite' });
    this.statusNode = h('p', { class: 'save-status', 'aria-hidden': 'true' });
    setErrorSink((error) => this.reportError(error));
  }

  // ------------------------------------------------------------ boot

  async start(): Promise<void> {
    this.root.classList.add('aegis-child', 'fluffy');
    this.root.replaceChildren(
      h(
        'div',
        { class: 'rotate', role: 'alert' },
        h('span', { class: 'rotate-icon', 'aria-hidden': 'true' }, '📱↻'),
        h('p', null, this.labels('rotate').text),
      ),
      this.screenNode,
      this.overlayNode,
      this.liveNode,
      this.statusNode,
    );
    this.root.removeAttribute('aria-busy');
    const unlock = () => {
      void this.voice.unlock();
      // A child's tap proves the page is visible: never leave the game stuck in a visibility pause.
      this.session?.game.host.resume('visibility');
    };
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
    try {
      this.device = await this.deviceRecord.load();
    } catch {
      this.device = await this.deviceRecord.load().catch(() =>
        structuredClone({
          v: 1 as const,
          profiles: [],
          volumes: { narration: 1, music: 0.5, effects: 0.8 },
          breakMinutes: 0 as const,
        }),
      );
    }
    this.voice.setVolumes(this.device.volumes);
    this.applyPrefs();
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () =>
      this.applyPrefs(),
    );
    setInterval(() => this.tickBreak(), 15_000);
    this.render();
    void this.offline.check().then((ready) => {
      if (!ready && navigator.onLine) void this.offline.install().catch(() => {});
    });
  }

  reportError(error: unknown): void {
    this.liveNode.textContent = this.labels('save.failed').text;
    if (this.options.channel === 'dev') console.error(error);
  }

  // ------------------------------------------------------------ preferences

  reducedMotion(): boolean {
    const motion = this.prefs?.motion ?? 'system';
    if (motion === 'calm') return true;
    if (motion === 'full') return false;
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  applyPrefs(): void {
    const prefs = this.prefs;
    applyPresentationPreferences(this.root, {
      locale: 'ru',
      textScale: prefs?.textScale ?? 1,
      reducedMotion: this.reducedMotion(),
      comfort: this.view()?.lamp ?? false,
      hideSpoilers: false,
      volumes: this.device?.volumes ?? { narration: 1, music: 0.5, effects: 0.8 },
    });
    this.root.style.setProperty('--text-scale', String(prefs?.textScale ?? 1));
    this.root.classList.toggle('readable', prefs?.readable ?? false);
    this.root.dataset.reducedMotion = String(this.reducedMotion());
  }

  async updatePrefs(change: (prefs: ProfilePrefs) => void): Promise<void> {
    if (!this.prefsRecord) return;
    this.prefs = await this.prefsRecord.update(change);
    this.applyPrefs();
    this.render();
  }

  async updateDevice(change: (device: DeviceState) => void, rerender = true): Promise<void> {
    this.device = await this.deviceRecord.update(change);
    this.voice.setVolumes(this.device.volumes);
    // Background bookkeeping must not rebuild the screen under the child's finger.
    if (rerender) this.render();
  }

  // ------------------------------------------------------------ profiles and sessions

  view(): GameView | null {
    return this.session?.game.host.getView() ?? null;
  }

  async createProfile(): Promise<void> {
    if (this.device.profiles.length >= MAX_PROFILES) return;
    const id = `p-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
    await this.updateDevice((device) => {
      device.profiles.push({ id, name: '', species: null, scarf: null });
    });
    await this.openSession(id);
    if (this.session && !this.view()?.run) await this.act({ type: 'start', pack: 'prologue' });
  }

  async openSession(profileId: string, steal = false): Promise<void> {
    await this.closeSession();
    this.blocked = null;
    this.recovery = null;
    if ('locks' in navigator) {
      this.lock = await acquireProfileLock(navigator.locks as never, profileId, {
        steal,
        onLost: () => void this.lostLock(profileId),
      });
      if (!this.lock) {
        this.blocked = { profileId };
        this.render();
        return;
      }
    }
    const result = await openProfile({
      storage: this.storage,
      profileId,
      library: this.library,
      engineRevision: '0abd61b5a679',
    });
    if (result.kind === 'recovery') {
      this.recovery = result;
      this.ui.recoveryProfile = profileId;
      this.render();
      return;
    }
    this.session = result;
    this.prefsRecord = prefsStore(this.storage, profileId);
    this.prefs = await this.prefsRecord.load().catch(() => this.prefsRecord!.current());
    const host = result.game.host;
    this.unbind.push(
      host.subscribe((_view, reason) => {
        if (reason === 'restore') this.ui = {};
        this.syncProfileEntry();
        this.render();
      }),
      result.saves.subscribe((status) => {
        this.saveStatus = status.status;
        this.renderStatus();
        if (status.status === 'conflict') {
          this.blocked = { profileId };
          this.render();
        }
      }),
      bindVisibilityPause(
        document,
        (reason) => {
          host.pause(reason);
          this.voice.pause();
          this.pauseClock();
        },
        (reason) => {
          host.resume(reason);
          if (!this.overlay) this.voice.resume();
          this.resumeClock();
        },
      ),
    );
    this.presenter = new StaticPresenter(this.assets);
    this.playedMs = 0;
    this.resumeClock();
    this.applyPrefs();
    this.render();
  }

  private async lostLock(profileId: string): Promise<void> {
    if (this.session?.profileId !== profileId) return;
    await this.closeSession(false);
    this.blocked = { profileId };
    this.render();
  }

  async closeSession(release = true): Promise<void> {
    for (const unbind of this.unbind.splice(0)) unbind();
    this.voice.clear();
    if (this.session) {
      await this.session.saves.flush().catch(() => {});
      await this.session.dispose();
    }
    this.session = null;
    this.prefs = null;
    this.prefsRecord = null;
    this.presenter?.dispose();
    this.presenter = null;
    this.overlay = null;
    this.ui = {};
    this.spokenKey = '';
    if (release) this.lock?.release();
    this.lock = null;
    this.applyPrefs();
  }

  private syncProfileEntry(): void {
    const view = this.view();
    const session = this.session;
    if (!view || !session) return;
    const entry = this.device.profiles.find((p) => p.id === session.profileId);
    const name = view.avatar.name;
    if (
      entry &&
      (entry.name !== name ||
        entry.species !== view.avatar.species ||
        entry.scarf !== view.avatar.scarf)
    ) {
      void this.updateDevice((device) => {
        const target = device.profiles.find((p) => p.id === session.profileId);
        if (target)
          Object.assign(target, { name, species: view.avatar.species, scarf: view.avatar.scarf });
      }, false).catch(() => {});
    }
  }

  async deleteProfile(profileId: string): Promise<void> {
    if (this.session?.profileId === profileId) await this.closeSession();
    await deleteProfileData(this.storage, profileId);
    await this.updateDevice((device) => {
      device.profiles = device.profiles.filter((p) => p.id !== profileId);
    });
  }

  async resetProfile(profileId: string): Promise<void> {
    if (this.session?.profileId === profileId) await this.closeSession();
    await deleteProfileData(this.storage, profileId);
    await this.updateDevice((device) => {
      const entry = device.profiles.find((p) => p.id === profileId);
      if (entry) Object.assign(entry, { name: '', species: null, scarf: null });
    });
  }

  // ------------------------------------------------------------ commands

  /** Dispatch a game command bound to the revision the UI was rendered from. */
  act(action: GameAction): Promise<boolean> {
    // Commands are serialized: a tap during a pending save waits instead of being dropped.
    const rendered = this.session?.game.host.getStatus().revision;
    const run = this.actions.then(() => this.actNow(action, rendered));
    this.actions = run.catch(() => false);
    return run;
  }

  private actions: Promise<unknown> = Promise.resolve();

  private async actNow(action: GameAction, rendered: number | undefined): Promise<boolean> {
    const session = this.session;
    if (!session) return false;
    const host = session.game.host;
    if (host.getStatus().checkpoint === 'pending') await host.flush();
    const status = host.getStatus();
    if (status.checkpoint === 'failed') {
      await this.retrySave();
      return false;
    }
    // Bound to the revision the child saw: a stale double tap is rejected, never applied twice.
    const outcome = await session.dispatch(action, rendered ?? status.revision);
    if (!outcome.ok) {
      if (outcome.progress.accepted) this.saveStatus = 'failed';
      this.renderStatus();
      return false;
    }
    if (this.breakDue) this.showBreakIfSafe();
    return true;
  }

  async retrySave(): Promise<void> {
    const host = this.session?.game.host;
    if (!host) return;
    const retried = await host.retryCheckpoint();
    if (retried.ok && host.getStatus().pendingAction !== null) await host.continuePending();
    this.renderStatus();
  }

  // ------------------------------------------------------------ narration

  /** Speaks the line that is newly on screen. Called by the scene renderer. */
  narrate(key: string, line: LineView | null, follow: readonly string[] = []): void {
    if (key === this.spokenKey) return;
    this.spokenKey = key;
    if (this.overlay && this.overlay !== 'notebook') return;
    this.voice.say(line?.voiced ? line.id : null, this.prefs?.readChoices ? follow : []);
    this.presenter?.speak(line?.speaker ?? null, line?.id ?? null);
  }

  label(key: string): Label {
    return this.labels(key);
  }

  // ------------------------------------------------------------ overlays

  async setOverlay(overlay: Overlay): Promise<void> {
    const host = this.session?.game.host;
    if (overlay && !this.overlay) {
      this.focusBookmark = rememberFocus(document);
      if (overlay !== 'notebook') {
        host?.pause('user');
        this.voice.pause();
        this.presenter?.setPaused(true);
        this.pauseClock();
      }
    }
    if (!overlay && this.overlay) {
      host?.resume('user');
      this.presenter?.setPaused(false);
      this.voice.resume();
      this.resumeClock();
    }
    this.overlay = overlay;
    this.ui.overlayData = undefined;
    this.render();
    if (!overlay) {
      this.closeOverlay?.();
      this.closeOverlay = null;
      this.focusBookmark?.restore();
      this.focusBookmark = null;
    }
  }

  // ------------------------------------------------------------ break reminder (T16)

  private resumeClock(): void {
    if (!this.playStartedAt) this.playStartedAt = performance.now();
  }
  private pauseClock(): void {
    if (this.playStartedAt) this.playedMs += performance.now() - this.playStartedAt;
    this.playStartedAt = 0;
  }
  private tickBreak(): void {
    const minutes = this.device?.breakMinutes ?? 0;
    if (!minutes || !this.session || this.overlay) return;
    const played =
      this.playedMs + (this.playStartedAt ? performance.now() - this.playStartedAt : 0);
    if (played >= minutes * 60_000) {
      this.breakDue = true;
      this.showBreakIfSafe();
    }
  }
  private showBreakIfSafe(): void {
    const status = this.session?.game.host.getStatus();
    if (!status || status.busy || status.checkpoint !== 'idle' || this.overlay) return;
    if (status.durableRevision !== status.revision && status.revision !== 0) return;
    this.breakDue = false;
    this.pauseClock();
    this.playedMs = 0;
    this.playStartedAt = 0;
    void this.setOverlay('break');
  }

  // ------------------------------------------------------------ rendering

  renderStatus(): void {
    const key =
      this.saveStatus === 'saved'
        ? 'save.saved'
        : this.saveStatus === 'pending'
          ? 'save.saving'
          : this.saveStatus === 'failed' || this.saveStatus === 'unavailable'
            ? 'save.failed'
            : null;
    this.statusNode.textContent = key ? this.labels(key).text : '';
    this.statusNode.dataset.status = this.saveStatus;
    const failed = this.saveStatus === 'failed' || this.saveStatus === 'unavailable';
    if (failed) this.liveNode.textContent = this.labels('save.failed').text;
  }

  render(): void {
    const screen = this.renderScreen();
    this.screenNode.replaceChildren(screen);
    this.renderOverlay();
    this.renderStatus();
    if (this.options.channel === 'release') assertChildSafeView(this.root, this.options.baseUrl);
  }

  private renderScreen(): HTMLElement {
    if (this.blocked) return this.renderBlocked(this.blocked.profileId);
    if (this.recovery) return this.renderRecovery(this.recovery);
    if (!this.session) return this.renderTitle();
    return renderGame(this);
  }

  private renderTitle(): HTMLElement {
    const t = (key: string) => this.labels(key).text;
    const cards = this.device.profiles.map((profile) => {
      const avatar = this.assets.avatar(profile.species, profile.scarf);
      return button(
        {
          label: profile.name || t('profile.new'),
          class: 'profile-card',
          key: `profile-${profile.id}`,
          content: h(
            'span',
            { class: 'profile-card-body' },
            h('img', { src: avatar.base, alt: '', class: 'profile-avatar' }),
            h('span', { class: 'label' }, profile.name || '…'),
          ),
        },
        () => this.openSession(profile.id),
      );
    });
    if (this.device.profiles.length < MAX_PROFILES)
      cards.push(
        button(
          { label: t('profile.new'), icon: '＋', class: 'profile-card new', key: 'profile-new' },
          () => this.createProfile(),
        ),
      );
    const parent = button(
      { label: t('parent.enter'), class: 'parent-entry', key: 'parent-entry', icon: '🔒' },
      () => this.setOverlay('parent-gate'),
    );
    const node = h(
      'section',
      { class: 'title-screen' },
      h('h1', null, t('title.name')),
      h('h2', null, t('profile.choose')),
      h('div', { class: 'profiles' }, ...cards),
      parent,
    );
    queueMicrotask(() => {
      if (!this.root.contains(document.activeElement) || document.activeElement === document.body)
        focusFirst(node, '.profile-card');
    });
    return node;
  }

  private renderBlocked(profileId: string): HTMLElement {
    const t = (key: string) => this.labels(key).text;
    return h(
      'section',
      { class: 'blocked-screen', role: 'alert' },
      h('p', null, t('save.otherTab')),
      button({ label: t('save.useHere'), key: 'use-here', class: 'primary' }, () =>
        this.openSession(profileId, true),
      ),
      button({ label: t('pause.menu'), key: 'to-title' }, async () => {
        this.blocked = null;
        await this.closeSession();
        this.render();
      }),
    );
  }

  private renderRecovery(recovery: Recovery): HTMLElement {
    const profileId = String(this.ui.recoveryProfile);
    const done = async () => {
      this.recovery = null;
      await this.openSession(profileId);
    };
    return h(
      'section',
      { class: 'recovery-screen', role: 'alert', dataset: { testid: 'recovery' } },
      h('h1', null, 'Сохранение не открывается'),
      h(
        'p',
        null,
        'Прогресс этого профиля не удалось прочитать. Ничего не удалено. Позовите взрослого.',
      ),
      recovery.original !== undefined
        ? button({ label: 'Скачать файл сохранения как есть', key: 'rec-export' }, () =>
            downloadText(`fluffy-recovery-${profileId}.json`, recovery.original!),
          )
        : null,
      recovery.previous !== undefined
        ? button({ label: 'Вернуть предыдущее сохранение', key: 'rec-prev' }, async () => {
            await recovery.usePrevious();
            await done();
          })
        : null,
      button({ label: 'Начать профиль заново (прогресс пропадёт)', key: 'rec-reset' }, async () => {
        if (!confirm('Удалить прогресс этого профиля и начать заново?')) return;
        await recovery.reset();
        await done();
      }),
      button({ label: this.labels('pause.menu').text, key: 'rec-title' }, () => {
        this.recovery = null;
        this.lock?.release();
        this.lock = null;
        this.render();
      }),
    );
  }

  private renderOverlay(): void {
    const overlay = this.overlay;
    if (!overlay) {
      if (this.overlayNode.open) this.overlayNode.close();
      this.overlayNode.replaceChildren();
      return;
    }
    const body = this.overlayBody(overlay);
    this.overlayNode.className = `overlay overlay-${overlay}`;
    this.overlayNode.setAttribute('aria-label', body.title);
    const wasOpen = this.overlayNode.open;
    const active = document.activeElement as HTMLElement | null;
    const key = active && this.overlayNode.contains(active) ? active.dataset.key : undefined;
    this.overlayNode.replaceChildren(body.node);
    if (!wasOpen) {
      this.closeOverlay = openDialog(this.overlayNode);
      focusFirst(this.overlayNode);
    } else if (key) {
      this.overlayNode.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`)?.focus();
    } else if (!this.overlayNode.contains(document.activeElement)) {
      focusFirst(this.overlayNode);
    }
  }

  private overlayBody(overlay: NonNullable<Overlay>): { title: string; node: Node } {
    const t = (key: string) => this.labels(key).text;
    const close = (label = t('hud.close')) =>
      button({ label, key: 'overlay-close', class: 'close', icon: '✕' }, () =>
        this.setOverlay(null),
      );
    const view = this.view();
    switch (overlay) {
      case 'pause':
        return {
          title: t('pause.title'),
          node: h(
            'div',
            { class: 'menu-list' },
            h('h2', null, t('pause.title')),
            button(
              { label: t('pause.continue'), key: 'p-continue', class: 'primary', icon: '▶' },
              () => this.setOverlay(null),
            ),
            button({ label: t('pause.settings'), key: 'p-settings', icon: '⚙' }, () =>
              this.setOverlay('settings'),
            ),
            button({ label: t('pause.encyclopedia'), key: 'p-ency', icon: '📖' }, () =>
              this.setOverlay('encyclopedia'),
            ),
            button({ label: t('pause.glossary'), key: 'p-gloss', icon: '🔤' }, () =>
              this.setOverlay('glossary'),
            ),
            button({ label: t('pause.album'), key: 'p-album', icon: '⭐' }, () =>
              this.setOverlay('album'),
            ),
            view?.run && view.run.caseId !== 'prologue' && !view.run.ended
              ? button({ label: t('pause.restartCase'), key: 'p-restart', icon: '↺' }, () =>
                  this.setOverlay('restart'),
                )
              : null,
            button({ label: t('pause.menu'), key: 'p-menu', icon: '🏠' }, async () => {
              await this.setOverlay(null);
              await this.closeSession();
              this.render();
            }),
          ),
        };
      case 'restart': {
        const run = view?.run;
        return {
          title: t('pause.restartCase'),
          node: h(
            'div',
            { class: 'menu-list' },
            h('h2', null, t('pause.restartConfirm')),
            h(
              'div',
              { class: 'choices' },
              ...[1, 2, 3].map((level) =>
                button(
                  {
                    label: `${t('pause.yes')}: ${t(`difficulty.${level}`)}`,
                    key: `restart-${level}`,
                    pressed: run?.level === level,
                  },
                  async () => {
                    await this.setOverlay(null);
                    if (run) await this.act({ type: 'start', pack: `${run.caseId}-l${level}` });
                  },
                ),
              ),
            ),
            button({ label: t('pause.no'), key: 'restart-no', class: 'primary' }, () =>
              this.setOverlay('pause'),
            ),
          ),
        };
      }
      case 'settings':
        return { title: t('settings.title'), node: this.renderSettings(close) };
      case 'encyclopedia':
        return {
          title: t('pause.encyclopedia'),
          node: h(
            'div',
            { class: 'book' },
            close(),
            h('h2', null, t('pause.encyclopedia')),
            view?.facts.length
              ? h(
                  'ul',
                  { class: 'cards' },
                  ...view.facts.map((fact) =>
                    h(
                      'li',
                      { class: 'fact-card' },
                      h('span', { class: 'truth' }, 'Это правда'),
                      h('p', null, fact.line.text),
                      this.earButton(fact.line, `fact-${fact.id}`),
                    ),
                  ),
                )
              : h('p', null, t('encyclopedia.empty')),
            ...(view?.activities ?? []).map((activity) =>
              h(
                'section',
                { class: 'activity-card' },
                h(
                  'h3',
                  null,
                  '🥧 ',
                  activity.title.text,
                  this.earButton(activity.title, `act-${activity.id}`),
                ),
                h(
                  'ol',
                  null,
                  ...activity.steps.map((step) =>
                    h(
                      'li',
                      { class: step.adultOnly ? 'adult-only' : '' },
                      step.adultOnly ? h('strong', null, '👩 Только взрослый: ') : null,
                      step.line.text,
                    ),
                  ),
                ),
                ...activity.safety.map((line) => h('p', { class: 'safety' }, '⚠ ', line.text)),
                activity.allergens.length
                  ? h('p', { class: 'allergens' }, `Аллергены: ${activity.allergens.join(', ')}.`)
                  : null,
              ),
            ),
          ),
        };
      case 'glossary':
        return {
          title: t('pause.glossary'),
          node: h(
            'div',
            { class: 'book' },
            close(),
            h('h2', null, t('pause.glossary')),
            view?.glossary.length
              ? h(
                  'dl',
                  { class: 'glossary' },
                  ...view.glossary.flatMap((entry) => [
                    h('dt', null, entry.word),
                    h(
                      'dd',
                      null,
                      entry.definition.text,
                      this.earButton(entry.definition, `gl-${entry.id}`),
                    ),
                  ]),
                )
              : h('p', null, t('glossary.empty')),
          ),
        };
      case 'album':
        return {
          title: t('pause.album'),
          node: h(
            'div',
            { class: 'book' },
            close(),
            h('h2', null, t('pause.album')),
            h(
              'p',
              { class: 'wallet' },
              `${t('rewards.rank')}: ${t(view?.rank ?? 'rank.intern')} · ${t('rewards.buttons')}: ${view?.buttons ?? 0} · ${t('rewards.hearts')}: ${view?.hearts ?? 0}`,
            ),
            view?.rewards.length
              ? h(
                  'ul',
                  { class: 'cards' },
                  ...view.rewards.map((reward) =>
                    h(
                      'li',
                      { class: `reward-card reward-${reward.kind}` },
                      h(
                        'span',
                        { class: 'reward-icon', 'aria-hidden': 'true' },
                        rewardIcon(reward.kind),
                      ),
                      h('p', null, reward.label.text),
                    ),
                  ),
                )
              : h('p', null, t('album.empty')),
          ),
        };
      case 'cases':
        return { title: t('office.cases'), node: this.renderCases(close) };
      case 'break':
        return {
          title: t('break.title'),
          node: h(
            'div',
            { class: 'menu-list' },
            h('h2', null, t('break.title')),
            h('p', null, t('break.body')),
            button({ label: t('break.rest'), key: 'break-rest', class: 'primary' }, async () => {
              this.ui.resting = true;
              await this.setOverlay(null);
              this.session?.game.host.pause('break');
              this.pauseClock();
              this.render();
            }),
            button({ label: t('break.more'), key: 'break-more' }, () => this.setOverlay(null)),
          ),
        };
      case 'parent-gate':
        return { title: t('parent.enter'), node: renderParentGate(this, close) };
      case 'parent':
        return { title: 'Родительский уголок', node: renderParentCorner(this, close) };
      case 'notebook':
        return { title: t('hud.notebook'), node: renderNotebook(this, close) };
    }
  }

  earButton(line: LineView | null, key: string): HTMLButtonElement | null {
    if (!line?.voiced || !this.voice.hasVoice(line.id)) return null;
    return button(
      {
        label: `${this.labels('hud.ear').text}: ${line.text}`,
        content: '',
        icon: '👂',
        class: 'ear',
        key,
      },
      () => this.voice.label(line.id),
    );
  }

  private renderSettings(close: () => HTMLElement): HTMLElement {
    const t = (key: string) => this.labels(key).text;
    const prefs = this.prefs;
    const slider = (key: 'narration' | 'music' | 'effects', label: string) => {
      const input = h('input', {
        type: 'range',
        min: 0,
        max: 100,
        step: 10,
        value: Math.round(this.device.volumes[key] * 100),
        'data-key': `vol-${key}`,
      });
      input.addEventListener('change', () => {
        const value = Number(input.value) / 100;
        void this.updateDevice((device) => {
          device.volumes[key] = value;
        });
      });
      return h('label', { class: 'setting' }, h('span', null, label), input);
    };
    const toggle = (label: string, on: boolean, key: string, change: (p: ProfilePrefs) => void) =>
      button(
        {
          label,
          key,
          pressed: on,
          class: 'toggle',
          content: h('span', null, `${label}: ${on ? t('settings.on') : t('settings.off')}`),
        },
        () => this.updatePrefs(change),
      );
    const sizes = [1, 1.25, 1.5, 1.75, 2];
    return h(
      'div',
      { class: 'settings' },
      close(),
      h('h2', null, t('settings.title')),
      slider('narration', t('settings.voice')),
      slider('music', t('settings.music')),
      slider('effects', t('settings.effects')),
      prefs
        ? h(
            'div',
            { class: 'setting' },
            h('span', { id: 'text-size-label' }, t('settings.textSize')),
            h(
              'div',
              { class: 'segmented', role: 'group', 'aria-labelledby': 'text-size-label' },
              ...sizes.map((size) =>
                button(
                  {
                    label: `${Math.round(size * 100)}%`,
                    key: `size-${size}`,
                    pressed: prefs.textScale === size,
                  },
                  () => this.updatePrefs((p) => void (p.textScale = size)),
                ),
              ),
            ),
          )
        : null,
      prefs
        ? toggle(
            t('settings.readable'),
            prefs.readable,
            'pref-readable',
            (p) => void (p.readable = !p.readable),
          )
        : null,
      prefs
        ? h(
            'div',
            { class: 'setting' },
            h('span', { id: 'calm-label' }, t('settings.calm')),
            h(
              'div',
              { class: 'segmented', role: 'group', 'aria-labelledby': 'calm-label' },
              ...(['system', 'calm', 'full'] as const).map((motion) =>
                button(
                  {
                    label:
                      motion === 'system'
                        ? t('settings.system')
                        : motion === 'calm'
                          ? t('settings.on')
                          : t('settings.off'),
                    key: `motion-${motion}`,
                    pressed: prefs.motion === motion,
                  },
                  () => this.updatePrefs((p) => void (p.motion = motion)),
                ),
              ),
            ),
          )
        : null,
      prefs
        ? toggle(
            t('settings.readChoices'),
            prefs.readChoices,
            'pref-read',
            (p) => void (p.readChoices = !p.readChoices),
          )
        : null,
    );
  }

  private renderCases(close: () => HTMLElement): HTMLElement {
    const t = (key: string) => this.labels(key).text;
    const view = this.view();
    const selected = Number(this.ui.level ?? 1) as 1 | 2 | 3;
    const case01 = view?.packs.filter((p) => p.caseId === 'case01') ?? [];
    const unlocked = case01.some((p) => p.unlocked);
    return h(
      'div',
      { class: 'cases' },
      close(),
      h('h2', null, t('difficulty.title')),
      h('p', { class: 'case-title' }, t('case.case01')),
      h(
        'div',
        { class: 'choices', role: 'radiogroup', 'aria-label': t('difficulty.title') },
        ...([1, 2, 3] as const).map((level) => {
          const pack = case01.find((p) => p.level === level);
          return button(
            {
              label: `${t(`difficulty.${level}`)}. ${t(`difficulty.${level}.desc`)}`,
              key: `level-${level}`,
              pressed: selected === level,
              disabled: !pack?.unlocked,
              content: h(
                'span',
                { class: 'level' },
                h('strong', null, `${'★'.repeat(level)} ${t(`difficulty.${level}`)}`),
                h('span', null, t(`difficulty.${level}.desc`)),
                pack?.completed ? h('span', { class: 'done' }, '✔') : null,
              ),
            },
            () => {
              this.ui.level = level;
              this.render();
            },
          );
        }),
      ),
      button(
        { label: t('difficulty.start'), key: 'case-start', class: 'primary', disabled: !unlocked },
        async () => {
          await this.setOverlay(null);
          await this.act({ type: 'start', pack: `case01-l${selected}` });
        },
      ),
    );
  }
}

export function rewardIcon(kind: string): string {
  return (
    {
      badge: '🐾',
      sticker: '⭐',
      decor: '🧺',
      title: '🎖',
      activity: '🥧',
      buttons: '🔘',
      hearts: '💗',
    }[kind] ?? '⭐'
  );
}

export function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
