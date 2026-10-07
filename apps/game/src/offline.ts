// Offline installation and update (Q03, Q43) via @aegis/browser/offline. Packs are installed
// incrementally (shell, prologue, case01, …); the worker pins exact revisions, never skips waiting
// and never reloads a running case. A newly installed build takes over on the next launch.
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

export type OfflineStatus =
  | { state: 'unsupported'; reason: string }
  | { state: 'checking' }
  | { state: 'missing' }
  | { state: 'installing'; pack: string; done: number; total: number }
  | { state: 'ready'; buildId: string; update: 'none' | 'installed-next-launch' }
  | { state: 'failed'; reason: string };

export const NAMESPACE = 'fluffy-bureau';

export class Offline {
  private store: OfflinePackStore | null = null;
  private listeners = new Set<(status: OfflineStatus) => void>();
  status: OfflineStatus = { state: 'checking' };

  constructor(
    private readonly baseUrl: string,
    private readonly buildId: string,
  ) {
    const reason = this.unsupportedReason();
    if (reason) this.set({ state: 'unsupported', reason });
    else this.store = new OfflinePackStore({ namespace: NAMESPACE, baseUrl });
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
    for (const listener of this.listeners) listener(status);
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const response = await fetch(createInstallationRequest(path, this.baseUrl));
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return (await response.json()) as T;
  }

  /** Is every pack of this running build installed and verified? */
  async check(): Promise<boolean> {
    if (!this.store) return false;
    try {
      const installed = await this.store.list();
      const index = await this.localIndex();
      // Offline the index is not reachable (it is not part of any pack): trust verified packs.
      const ok = index
        ? index.packs.every((p) =>
            installed.some((i) => i.id === p.id && i.revision === p.revision),
          )
        : installed.some((p) => p.id === 'shell') && navigator.serviceWorker.controller !== null;
      this.set(
        ok ? { state: 'ready', buildId: this.buildId, update: 'none' } : { state: 'missing' },
      );
      return ok;
    } catch (error) {
      this.set({ state: 'failed', reason: String(error) });
      return false;
    }
  }

  private async localIndex(): Promise<OfflineIndex | null> {
    try {
      const index = await this.fetchJson<OfflineIndex>('offline/index.json');
      return index.buildId === this.buildId ? index : null;
    } catch {
      return null;
    }
  }

  /**
   * Installs every pack of the published build (the running one, or a newer update),
   * then registers its worker. Requires the network; never interrupts the running case.
   */
  async install(): Promise<void> {
    if (!this.store) return;
    const store = this.store;
    try {
      const index = await this.fetchJson<OfflineIndex>('offline/index.json');
      const installed = await store.list();
      let done = 0;
      for (const ref of index.packs) {
        this.set({ state: 'installing', pack: ref.id, done, total: index.packs.length });
        if (!installed.some((i) => i.id === ref.id && i.revision === ref.revision)) {
          const pack = await this.fetchJson<OfflinePack>(`offline/${ref.id}.json`);
          if (pack.id !== ref.id || pack.revision !== ref.revision)
            throw new Error(`Pack ${ref.id} does not match the index`);
          await store.install(pack);
        }
        done++;
      }
      await registerOfflineWorker('worker.js', this.baseUrl);
      this.set({
        state: 'ready',
        buildId: index.buildId,
        update: index.buildId === this.buildId ? 'none' : 'installed-next-launch',
      });
    } catch (error) {
      this.set({ state: 'failed', reason: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
