// Profiles (T03), per-profile saves with strict checkpoints, content migration (Q43),
// recovery, backup export/import and cross-tab ownership. Storage and locks are injected so the
// same code runs headlessly (MemorySaveStorage) and in browsers (IndexedDbSaveStorage, Web Locks).
import { createSaveCheckpoint } from '@aegis/browser/checkpoint';
import {
  exportSave,
  importSave,
  SaveService,
  type SaveEnvelope,
  type SavePolicy,
  type SaveStorage,
} from '@aegis/browser/save';
import { isRecord, isRuntimeSnapshot, type RuntimeSnapshot } from '@aegis/runtime';
import {
  createGame,
  GAME_ID,
  migrateProfileJson,
  PackLibrary,
  SCARVES,
  SPECIES,
  STATE_VERSION,
  type Game,
  type GameAction,
  type Scarf,
  type Species,
} from '@fluffy/game-core';

export const MAX_PROFILES = 4;
export const ENGINE_ID = 'aegis-runtime';
export const RUNTIME_STATE_RESOURCE = 'aegis.runtime.state';

// ---------------------------------------------------------------- device registry

export interface ProfileEntry {
  id: string;
  name: string;
  species: Species | null;
  scarf: Scarf | null;
}

export type BreakMinutes = 0 | 15 | 20 | 30 | 45;

export interface DeviceState {
  v: 1;
  profiles: ProfileEntry[];
  volumes: { narration: number; music: number; effects: number };
  breakMinutes: BreakMinutes;
}

export const DEFAULT_DEVICE: DeviceState = {
  v: 1,
  profiles: [],
  volumes: { narration: 1, music: 0.5, effects: 0.8 },
  breakMinutes: 0,
};

const unit = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;

export function isDeviceState(value: unknown): value is DeviceState {
  if (!isRecord(value) || value.v !== 1 || !Array.isArray(value.profiles)) return false;
  if (value.profiles.length > MAX_PROFILES) return false;
  const volumes = value.volumes;
  if (
    !isRecord(volumes) ||
    !unit(volumes.narration) ||
    !unit(volumes.music) ||
    !unit(volumes.effects)
  )
    return false;
  if (![0, 15, 20, 30, 45].includes(value.breakMinutes as number)) return false;
  const ids = new Set<string>();
  return value.profiles.every((p) => {
    if (!isRecord(p) || typeof p.id !== 'string' || !/^p-[a-z0-9]{4,32}$/.test(p.id)) return false;
    if (ids.has(p.id)) return false;
    ids.add(p.id);
    return (
      typeof p.name === 'string' &&
      p.name.length <= 40 &&
      (p.species === null || SPECIES.includes(p.species as Species)) &&
      (p.scarf === null || SCARVES.includes(p.scarf as Scarf))
    );
  });
}

function recordPolicy<T>(
  gameId: string,
  profileId: string,
  guard: (value: unknown) => value is T,
): SavePolicy<T, null> {
  return {
    gameId,
    profileId,
    schemaVersion: 1,
    engineId: 'fluffy-record',
    engineSnapshotVersion: 1,
    acceptsContent: (revision) => revision === 'record-1',
    validateState: guard,
    isCurrentState: guard,
    validateResume: (value): value is null => value === null,
  };
}

/** A small CAS-protected JSON record that re-reads and reapplies on cross-tab conflicts. */
export class RecordStore<T> {
  private service: SaveService<T, null>;
  private value: T | undefined;
  constructor(
    private readonly storage: SaveStorage,
    private readonly policy: SavePolicy<T, null>,
    private readonly fallback: T,
  ) {
    this.service = new SaveService(storage, policy);
  }

  async load(): Promise<T> {
    this.service = new SaveService(this.storage, this.policy);
    const saved = await this.service.load();
    this.value = saved ? saved.state : structuredClone(this.fallback);
    return structuredClone(this.value);
  }

  current(): T {
    if (this.value === undefined) throw new Error('Record not loaded');
    return structuredClone(this.value);
  }

  async update(change: (draft: T) => T | void): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (this.value === undefined || attempt > 0) await this.load();
      const draft = structuredClone(this.value as T);
      const next = (change(draft) ?? draft) as T;
      if (!this.policy.validateState(next, 1)) throw new Error('Invalid record update');
      try {
        await this.service.save({
          format: 'aegis.save',
          formatVersion: 1,
          gameId: this.policy.gameId,
          profileId: this.policy.profileId,
          contentRevision: 'record-1',
          schemaVersion: 1,
          engine: { id: 'fluffy-record', snapshotVersion: 1, revision: 'record-1' },
          state: next,
          resume: null,
        });
        this.value = next;
        return structuredClone(next);
      } catch (error) {
        if (this.service.status().status !== 'conflict') throw error;
      }
    }
    throw new Error('The record keeps changing in another window');
  }

  async reset(): Promise<void> {
    await this.load();
    const history = await this.storage.read(this.policy);
    if (history.current || history.previous)
      await this.service.reset({ gameId: this.policy.gameId, profileId: this.policy.profileId });
    this.value = structuredClone(this.fallback);
  }
}

export function deviceStore(storage: SaveStorage) {
  return new RecordStore(
    storage,
    recordPolicy(`${GAME_ID}.device`, 'device', isDeviceState),
    DEFAULT_DEVICE,
  );
}

// ---------------------------------------------------------------- per-profile preferences

export type MotionPreference = 'system' | 'calm' | 'full';
export interface ProfilePrefs {
  v: 1;
  textScale: number;
  readable: boolean;
  motion: MotionPreference;
  readChoices: boolean;
}
export const DEFAULT_PREFS: ProfilePrefs = {
  v: 1,
  textScale: 1,
  readable: false,
  motion: 'system',
  readChoices: false,
};
export function isProfilePrefs(value: unknown): value is ProfilePrefs {
  return (
    isRecord(value) &&
    value.v === 1 &&
    typeof value.textScale === 'number' &&
    value.textScale >= 1 &&
    value.textScale <= 2 &&
    typeof value.readable === 'boolean' &&
    ['system', 'calm', 'full'].includes(value.motion as string) &&
    typeof value.readChoices === 'boolean'
  );
}
export function prefsStore(storage: SaveStorage, profileId: string) {
  return new RecordStore(
    storage,
    recordPolicy(`${GAME_ID}.prefs`, profileId, isProfilePrefs),
    DEFAULT_PREFS,
  );
}

// ---------------------------------------------------------------- game saves

export function gamePolicy(profileId: string): SavePolicy<RuntimeSnapshot, null> {
  return {
    gameId: GAME_ID,
    profileId,
    schemaVersion: STATE_VERSION,
    engineId: ENGINE_ID,
    engineSnapshotVersion: 1,
    // Any content revision is accepted at the envelope level; the session migrates explicitly.
    acceptsContent: () => true,
    validateState: (value): value is RuntimeSnapshot => isRuntimeSnapshot(value),
    isCurrentState: (value): value is RuntimeSnapshot => isRuntimeSnapshot(value),
    validateResume: (value): value is null => value === null,
  };
}

/** The consumer state stored inside a runtime snapshot. */
export function profileStateOf(snapshot: RuntimeSnapshot): unknown {
  const resource = snapshot.world.resources[RUNTIME_STATE_RESOURCE];
  if (resource === undefined) throw new Error('Snapshot has no game state');
  return resource;
}

export interface Recovery {
  kind: 'recovery';
  error: unknown;
  /** Exact stored bytes of the unreadable record, for export. */
  original: string | undefined;
  previous: string | undefined;
  usePrevious(): Promise<void>;
  reset(): Promise<void>;
}

export interface ProfileSession {
  kind: 'session';
  profileId: string;
  game: Game;
  saves: SaveService<RuntimeSnapshot, null>;
  migrated: boolean;
  dispatch(action: GameAction, expectedRevision?: number): ReturnType<Game['host']['dispatch']>;
  exportBackup(): Promise<string>;
  dispose(): Promise<void>;
}

export interface SessionOptions {
  storage: SaveStorage;
  profileId: string;
  library: PackLibrary;
  engineRevision: string;
}

function metadata(profileId: string, engineRevision: string) {
  return (checkpoint: { snapshot: RuntimeSnapshot }) => ({
    format: 'aegis.save' as const,
    formatVersion: 1 as const,
    gameId: GAME_ID,
    profileId,
    contentRevision: checkpoint.snapshot.content.revision,
    schemaVersion: STATE_VERSION,
    engine: { id: ENGINE_ID, snapshotVersion: 1, revision: engineRevision },
    resume: null,
  });
}

async function adopt(
  game: Game,
  saved: SaveEnvelope<RuntimeSnapshot, null>,
): Promise<{ migrated: boolean }> {
  const snapshot = saved.state;
  if (
    snapshot.content.revision === game.content.revision &&
    snapshot.stateVersion === STATE_VERSION
  ) {
    const restored = await game.host.restore(snapshot, { durableRevision: snapshot.revision });
    if (restored.ok) return { migrated: false };
    throw new Error(`Saved progress could not be restored: ${restored.error.code}`);
  }
  const state = migrateProfileJson(profileStateOf(snapshot), game.rules, game.content.data);
  const imported = await game.host.dispatch({ type: 'import', state: state as never });
  if (!imported.ok) throw new Error(`Saved progress could not be migrated: ${imported.error.code}`);
  return { migrated: true };
}

export async function openProfile(options: SessionOptions): Promise<ProfileSession | Recovery> {
  const { storage, profileId, library, engineRevision } = options;
  const policy = gamePolicy(profileId);
  const saves = new SaveService(storage, policy);
  const recovery = async (error: unknown): Promise<Recovery> => {
    const history = await storage.read(policy);
    const revision = history.revision ?? history.current?.revision ?? 0;
    return {
      kind: 'recovery',
      error,
      original: history.current?.payload,
      previous: history.previous?.payload,
      async usePrevious() {
        if (!history.previous) throw new Error('No previous copy');
        const candidate = importSave(history.previous.payload, policy);
        const probe = createGame(library);
        try {
          await adopt(probe, candidate);
        } finally {
          await probe.host.dispose();
        }
        await storage.compareAndSwap(policy, revision, {
          revision: revision + 1,
          payload: exportSave({ ...candidate, revision: revision + 1 }, policy),
        });
      },
      async reset() {
        await storage.reset(policy, revision, { gameId: GAME_ID, profileId });
      },
    };
  };
  let saved: SaveEnvelope<RuntimeSnapshot, null> | undefined;
  try {
    saved = await saves.load();
  } catch (error) {
    return recovery(error);
  }
  const game = createGame(library, {
    checkpoint: createSaveCheckpoint(saves, metadata(profileId, engineRevision)),
    seed: profileId,
  });
  let migrated = false;
  if (saved) {
    try {
      migrated = (await adopt(game, saved)).migrated;
    } catch (error) {
      await game.host.dispose();
      return recovery(error);
    }
  }
  return {
    kind: 'session',
    profileId,
    game,
    saves,
    migrated,
    dispatch: (action, expectedRevision) =>
      game.host.dispatch(action, expectedRevision === undefined ? undefined : { expectedRevision }),
    async exportBackup() {
      await saves.flush();
      const history = await storage.read(policy);
      if (!history.current) throw new Error('Nothing saved yet');
      return history.current.payload;
    },
    dispose: () => game.host.dispose(),
  };
}

/**
 * Imports a backup file into a profile, replacing its progress. The backup may come from another
 * profile, device or content revision: only the game state is taken and migrated.
 */
export async function importBackup(options: SessionOptions, text: string): Promise<void> {
  const parsed = JSON.parse(text) as unknown;
  if (!isRecord(parsed) || parsed.gameId !== GAME_ID || typeof parsed.profileId !== 'string')
    throw new Error('Not a Fluffy Bureau backup');
  const envelope = importSave(text, gamePolicy(parsed.profileId));
  const state = profileStateOf(envelope.state);
  const policy = gamePolicy(options.profileId);
  const history = await options.storage.read(policy);
  const revision = history.revision ?? history.current?.revision ?? 0;
  if (history.current || history.previous)
    await options.storage.reset(policy, revision, {
      gameId: GAME_ID,
      profileId: options.profileId,
    });
  const session = await openProfile(options);
  if (session.kind !== 'session') throw new Error('Profile storage is unavailable');
  try {
    const migrated = migrateProfileJson(state, session.game.rules, session.game.content.data);
    const outcome = await session.dispatch({ type: 'import', state: migrated as never });
    if (!outcome.ok) throw new Error(`Backup rejected: ${outcome.error.code}`);
    await session.saves.flush();
  } finally {
    await session.dispose();
  }
}

export async function deleteProfileData(storage: SaveStorage, profileId: string): Promise<void> {
  for (const policy of [
    gamePolicy(profileId),
    recordPolicy(`${GAME_ID}.prefs`, profileId, isProfilePrefs),
  ]) {
    const history = await storage.read(policy);
    if (history.current || history.previous) {
      const revision = history.revision ?? history.current?.revision ?? 0;
      await storage.reset(policy, revision, { gameId: policy.gameId, profileId });
    }
  }
}

// ---------------------------------------------------------------- one active window per profile

export interface LockManagerLike {
  request(
    name: string,
    options: { ifAvailable?: boolean; steal?: boolean; mode?: 'exclusive' },
    callback: (lock: unknown) => Promise<void>,
  ): Promise<void>;
}

export interface ProfileLock {
  release(): void;
}

/**
 * Holds an exclusive Web Lock for a profile while it is open in this window.
 * Returns null if another window holds it (unless `steal`). `onLost` runs if stolen later.
 */
export async function acquireProfileLock(
  locks: LockManagerLike,
  profileId: string,
  options: { steal?: boolean; onLost: () => void },
): Promise<ProfileLock | null> {
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  let granted!: (value: boolean) => void;
  const decided = new Promise<boolean>((resolve) => (granted = resolve));
  let released = false;
  locks
    .request(
      `${GAME_ID}:profile:${profileId}`,
      options.steal ? { steal: true } : { ifAvailable: true },
      async (lock) => {
        if (lock === null) {
          granted(false);
          return;
        }
        granted(true);
        await held;
      },
    )
    .catch(() => {
      if (!released) options.onLost();
    });
  if (!(await decided)) return null;
  return {
    release() {
      released = true;
      release();
    },
  };
}
