// Offline installation and update (Q03, Q43) via @aegis/browser/offline. Packs install in priority
// order: the shell, the prologue and case 1 first — then the worker is registered and the game is
// playable offline — and the later cases in the background. The worker pins exact revisions, never
// skips waiting and never reloads a running case; a newly installed build takes over on the next
// launch. While online, media of a case still downloading streams from the same site.
import {
  createInstallationRequest,
  OfflinePackStore,
  type OfflinePack,
} from '@aegis/browser/offline';
import { registerOfflineWorker } from '@aegis/browser/offline/worker';

export interface OfflineIndex {
  format: 'fluffy-offline-index/1';
  buildId: string;
  packs: { id: string; revision: string; bytes: number; files: number }[];
}

/** Packs that make the game usable offline; the worker only activates once these are stored. */
export const CORE_PACKS = ['shell', 'prologue', 'case01'] as const;

export type OfflineStatus =
  | { state: 'unsupported'; reason: string }
  | { state: 'checking' }
  | { state: 'missing' }
  | { state: 'installing'; pack: string; done: number; total: number }
  | {
      state: 'ready';
      buildId: string;
      update: 'none' | 'installed-next-launch';
      /** Later cases still downloading in the background (null when everything is stored). */
      background: { pack: string; done: number; total: number } | null;
    }
  | { state: 'failed'; reason: string };

export const NAMESPACE = 'fluffy-bureau';

function priority(id: string): number {
  const core = (CORE_PACKS as readonly string[]).indexOf(id);
  return core >= 0 ? core : CORE_PACKS.length;
}

export class Offline {
  private store: OfflinePackStore | null = null;
  private listeners = new Set<(status: OfflineStatus) => void>();
  private busy = false;
  private again = false;
  private installing: Promise<void> | null = null;
  /** Offline packs of the running build that are stored (by pack ID). */
  readonly installed = new Set<string>();
  /** All offline packs of the running build, in install order. */
  packs: { id: string; bytes: number }[] = [];
  status: OfflineStatus = { state: 'checking' };

  constructor(
    private readonly baseUrl: string,
    private readonly buildId: string,
  ) {
    const reason = this.unsupportedReason();
    if (reason) this.set({ state: 'unsupported', reason });
    // Eight parallel requests: the release has thousands of small files.
    else this.store = new OfflinePackStore({ namespace: NAMESPACE, baseUrl, maxRequests: 8 });
  }

  private unsupportedReason(): string | null {
    if (!window.isSecureContext) return 'Нужен защищённый адрес (HTTPS или localhost).';
    if (!('serviceWorker' in navigator)) return 'Браузер не поддерживает работу без сети.';
    if (!('caches' in window) || !('locks' in navigator) || !crypto.subtle)
      return 'Браузер не поддерживает установку без сети.';
    return null;
  }

  subscribe(listener: (status: OfflineStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private set(status: OfflineStatus): void {
    this.status = status;
    // A plain status hook for the parent corner's styling and end-to-end tests (no globals).
    document.documentElement.dataset.offline =
      status.state === 'ready'
        ? `ready:${status.update}${status.background ? ':background' : ''}`
        : status.state;
    for (const listener of this.listeners) listener(status);
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const response = await fetch(createInstallationRequest(path, this.baseUrl));
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return (await response.json()) as T;
  }

  /** Is a case's media stored for offline play? (`case02-l1` → offline pack `case02`.) */
  isAvailableOffline(packId: string): boolean {
    const media = /^(case\d\d)-l[123]$/.exec(packId)?.[1] ?? packId;
    return this.installed.has(media) || !this.packs.some((p) => p.id === media);
  }

  /** Are the core packs of this running build stored and the worker in charge? */
  async check(): Promise<boolean> {
    if (!this.store) return false;
    try {
      const stored = await this.store.list();
      const index = await this.localIndex();
      this.installed.clear();
      if (index) {
        this.packs = [...index.packs]
          .sort((a, b) => priority(a.id) - priority(b.id))
          .map(({ id, bytes }) => ({ id, bytes }));
        for (const p of index.packs)
          if (stored.some((i) => i.id === p.id && i.revision === p.revision))
            this.installed.add(p.id);
      } else {
        // Offline the index is not reachable (it is not part of any pack): trust stored packs.
        for (const p of stored) this.installed.add(p.id);
      }
      const ok =
        CORE_PACKS.every((id) => this.installed.has(id)) &&
        (index !== null || navigator.serviceWorker.controller !== null);
      const complete = index ? index.packs.every((p) => this.installed.has(p.id)) : true;
      this.set(
        ok
          ? {
              state: 'ready',
              buildId: this.buildId,
              update: 'none',
              background: complete
                ? null
                : { pack: '', done: this.installed.size, total: this.packs.length },
            }
          : { state: 'missing' },
      );
      return ok && complete;
    } catch (error) {
      this.set({ state: 'failed', reason: String(error) });
      return false;
    }
  }

  /** The running build's pack index: from the site, else the copy kept on this device (offline). */
  private async localIndex(): Promise<OfflineIndex | null> {
    const key = `${NAMESPACE}.offline-index`;
    try {
      const index = await this.fetchJson<OfflineIndex>('offline/index.json');
      if (index.buildId !== this.buildId) return null;
      localStorage.setItem(key, JSON.stringify(index));
      return index;
    } catch {
      try {
        const kept = JSON.parse(localStorage.getItem(key) ?? 'null') as OfflineIndex | null;
        return kept?.buildId === this.buildId ? kept : null;
      } catch {
        return null;
      }
    }
  }

  /**
   * Looks for a newer published build and installs it in the background (Q43). The running case is
   * never reloaded; the new worker waits and takes over on the next launch. Quiet on failure.
   */
  async update(): Promise<void> {
    if (!this.store || !navigator.onLine) return;
    // A request while a check or install is running is remembered, never dropped (the next
    // periodic check would otherwise be half an hour away).
    if (this.busy || this.installing) {
      this.again = true;
      return;
    }
    if (this.status.state === 'ready' && this.status.update === 'installed-next-launch') return;
    this.busy = true;
    try {
      const index = await this.fetchJson<OfflineIndex>('offline/index.json');
      if (index.buildId !== this.buildId) await this.install();
      // Same build with cases still missing (an interrupted download): resume them.
      else if (this.packs.some((p) => !this.installed.has(p.id))) await this.install();
    } catch {
      // Offline or a partial publish: try again later.
    } finally {
      this.busy = false;
      this.retryLater();
    }
  }

  private retryLater(): void {
    if (this.again && !this.busy && !this.installing) {
      this.again = false;
      void this.update();
    }
  }

  /**
   * Installs every pack of the published build (the running one, or a newer update) in priority
   * order. The worker is registered as soon as the core packs are stored; later cases continue in
   * the background. Requires the network; never interrupts the running case.
   */
  install(): Promise<void> {
    this.installing ??= this.installNow().finally(() => {
      this.installing = null;
      this.retryLater();
    });
    return this.installing;
  }

  private async installNow(): Promise<void> {
    if (!this.store) return;
    const store = this.store;
    try {
      const index = await this.fetchJson<OfflineIndex>('offline/index.json');
      const update = index.buildId === this.buildId ? 'none' : 'installed-next-launch';
      const ordered = [...index.packs].sort((a, b) => priority(a.id) - priority(b.id));
      const stored = await store.list();
      const has = (ref: { id: string; revision: string }) =>
        stored.some((i) => i.id === ref.id && i.revision === ref.revision);
      let registered = false;
      const register = async () => {
        if (registered) return;
        registered = true;
        const registration = await registerOfflineWorker('worker.js', this.baseUrl);
        // Re-registering the same script URL does not look for a new worker; ask explicitly. The new
        // worker installs and waits; it takes over when no page of the old build remains open.
        if (update !== 'none') await registration.update();
      };
      let done = 0;
      for (const ref of ordered) {
        const core = priority(ref.id) < CORE_PACKS.length;
        if (registered)
          this.set({
            state: 'ready',
            buildId: index.buildId,
            update,
            background: { pack: ref.id, done, total: ordered.length },
          });
        else this.set({ state: 'installing', pack: ref.id, done, total: ordered.length });
        if (!has(ref)) {
          const pack = await this.fetchJson<OfflinePack>(`offline/${ref.id}.json`);
          if (pack.id !== ref.id || pack.revision !== ref.revision)
            throw new Error(`Pack ${ref.id} does not match the index`);
          await store.install(pack);
        }
        if (update === 'none') this.installed.add(ref.id);
        done++;
        const next = ordered[done];
        if (!core || !next || priority(next.id) >= CORE_PACKS.length) await register();
      }
      await register();
      this.set({ state: 'ready', buildId: index.buildId, update, background: null });
    } catch (error) {
      // A failed download (network gone, or a newer build published meanwhile) is looked at again:
      // the update check either finds the new build or resumes the missing packs.
      if (navigator.onLine) window.setTimeout(() => void this.update(), 30_000);
      // After the core is ready a background failure only pauses the later cases.
      if (this.status.state === 'ready') this.set({ ...this.status, background: null });
      else
        this.set({
          state: 'failed',
          reason: error instanceof Error ? error.message : String(error),
        });
      throw error;
    }
  }
}
