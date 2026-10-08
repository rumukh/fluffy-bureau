import { describe, expect, it } from 'vitest';
import { MemorySaveStorage } from '@aegis/browser/save';
import { requireValue } from '@aegis/runtime';
import { autoplay, PackLibrary, type FluffyPack, type GameAction } from '@fluffy/game-core';
import {
  acquireProfileLock,
  deleteProfileData,
  deviceStore,
  importBackup,
  openProfile,
  prefsStore,
  type LockManagerLike,
  type ProfileSession,
} from '../src/index.js';
import { packs } from '@fluffy/content';

const sharedPack = packs.shared!;
const prologuePack = packs.prologue!;

const library = () => new PackLibrary([sharedPack, prologuePack]);
const options = (storage: MemorySaveStorage, profileId: string, lib = library()) => ({
  storage,
  profileId,
  library: lib,
  engineRevision: 'test',
});

async function open(storage: MemorySaveStorage, profileId: string, lib = library()) {
  const session = await openProfile(options(storage, profileId, lib));
  if (session.kind !== 'session') throw new Error('Expected a session');
  return session;
}

async function run(session: ProfileSession, actions: GameAction[]) {
  for (const action of actions) requireValue(await session.dispatch(action));
  await session.saves.flush();
}

async function toMinigame(session: ProfileSession, name = 'Мила') {
  await autoplay(session.game.host, session.game.rules, 'prologue', {
    stopWhen: (view) => view.run?.step?.kind === 'minigame' && !view.run.queue,
  });
  void name;
  await session.saves.flush();
}

describe('profile sessions', () => {
  it('autosaves every action and resumes mid-minigame with the same notebook', async () => {
    const storage = new MemorySaveStorage();
    const first = await open(storage, 'p-aaaa');
    await toMinigame(first);
    const before = first.game.host.getView();
    expect(first.saves.status().status).toBe('saved');
    await first.dispose();
    const second = await open(storage, 'p-aaaa');
    expect(second.migrated).toBe(false);
    expect(second.game.host.getView()).toEqual(before);
    expect(second.game.host.getView().run?.step).toMatchObject({ kind: 'minigame' });
    await second.dispose();
  });

  it('keeps four profiles isolated', async () => {
    const storage = new MemorySaveStorage();
    const ids = ['p-aaaa', 'p-bbbb', 'p-cccc', 'p-dddd'];
    for (const [i, id] of ids.entries()) {
      const session = await open(storage, id);
      requireValue(await session.dispatch({ type: 'start', pack: 'prologue' }));
      requireValue(await session.dispatch({ type: 'cutscene', outcome: 'skipped' }));
      while (session.game.host.getView().run?.step?.kind === 'line')
        requireValue(await session.dispatch({ type: 'next' }));
      requireValue(await session.dispatch({ type: 'avatar.species', value: 'mouse' }));
      if (i % 2) requireValue(await session.dispatch({ type: 'avatar.name', value: 'Мила' }));
      await session.saves.flush();
      await session.dispose();
    }
    for (const [i, id] of ids.entries()) {
      const session = await open(storage, id);
      expect(session.game.host.getView().avatar.species).toBe('mouse');
      expect(session.game.host.getView().avatar.name).toBe(i % 2 ? 'Мила' : 'Стажёр');
      await session.dispose();
    }
    await deleteProfileData(storage, 'p-bbbb');
    const fresh = await open(storage, 'p-bbbb');
    expect(fresh.game.host.getView().run).toBeNull();
    const other = await open(storage, 'p-cccc');
    expect(other.game.host.getView().run).not.toBeNull();
  });

  it('a second window cannot silently overwrite progress (CAS conflict)', async () => {
    const storage = new MemorySaveStorage();
    const seed = await open(storage, 'p-aaaa');
    await run(seed, [{ type: 'start', pack: 'prologue' }]);
    await seed.dispose();
    const a = await open(storage, 'p-aaaa');
    const b = await open(storage, 'p-aaaa');
    await run(a, [{ type: 'cutscene', outcome: 'skipped' }]);
    const outcome = await b.dispatch({ type: 'cutscene', outcome: 'skipped' });
    expect(outcome.ok).toBe(false);
    expect(b.saves.status().status).toBe('conflict');
    const reopened = await open(storage, 'p-aaaa');
    expect(reopened.game.host.getView()).toEqual(a.game.host.getView());
  });

  it('migrates a save across a content update to the start of the same scene', async () => {
    const storage = new MemorySaveStorage();
    const first = await open(storage, 'p-aaaa');
    await toMinigame(first);
    await first.dispose();
    const updated: FluffyPack = { ...prologuePack, revision: 'prologue-r2' };
    const session = await open(storage, 'p-aaaa', new PackLibrary([sharedPack, updated]));
    expect(session.migrated).toBe(true);
    const view = session.game.host.getView();
    expect(view.avatar.name).toBe('Ася');
    expect(view.run?.scene.id).toBe('P1');
    expect(view.run?.step).not.toBeNull();
    await session.saves.flush();
    await session.dispose();
    const again = await open(storage, 'p-aaaa', new PackLibrary([sharedPack, updated]));
    expect(again.migrated).toBe(false);
  });

  it('exports and imports a backup into another profile', async () => {
    const storage = new MemorySaveStorage();
    const first = await open(storage, 'p-aaaa');
    await toMinigame(first);
    const backup = await first.exportBackup();
    await first.dispose();
    await importBackup(options(storage, 'p-eeee'), backup);
    const copy = await open(storage, 'p-eeee');
    expect(copy.game.host.getView().avatar.name).toBe('Ася');
    expect(copy.game.host.getView().run?.scene.id).toBe('P1');
  });

  it('offers recovery instead of a new game when the record is corrupt', async () => {
    const storage = new MemorySaveStorage();
    const first = await open(storage, 'p-aaaa');
    await run(first, [
      { type: 'start', pack: 'prologue' },
      { type: 'cutscene', outcome: 'skipped' },
    ]);
    while (first.game.host.getView().run?.step?.kind === 'line')
      await run(first, [{ type: 'next' }]);
    await run(first, [{ type: 'avatar.species', value: 'mouse' }]);
    await first.dispose();
    const key = { gameId: 'fluffy-bureau', profileId: 'p-aaaa' };
    const history = await storage.read(key);
    await storage.compareAndSwap(key, history.current!.revision, {
      revision: history.current!.revision + 1,
      payload: '{"broken":',
    });
    const result = await openProfile(options(storage, 'p-aaaa'));
    expect(result.kind).toBe('recovery');
    if (result.kind !== 'recovery') return;
    expect(result.original).toBe('{"broken":');
    await result.usePrevious();
    const restored = await open(storage, 'p-aaaa');
    expect(restored.game.host.getView().avatar.species).toBe('mouse');
  });

  it('stores device settings and per-profile preferences with CAS retry', async () => {
    const storage = new MemorySaveStorage();
    const one = deviceStore(storage);
    const two = deviceStore(storage);
    await one.load();
    await two.load();
    await one.update((d) => {
      d.profiles.push({ id: 'p-aaaa', name: 'Мила', species: 'mouse', scarf: 'rose' });
    });
    await two.update((d) => {
      d.breakMinutes = 20;
    });
    const merged = await deviceStore(storage).load();
    expect(merged.profiles).toHaveLength(1);
    expect(merged.breakMinutes).toBe(20);
    const prefs = prefsStore(storage, 'p-aaaa');
    await prefs.load();
    await prefs.update((p) => {
      p.textScale = 2;
    });
    expect((await prefsStore(storage, 'p-aaaa').load()).textScale).toBe(2);
    await expect(prefs.update((p) => ({ ...p, textScale: 3 }))).rejects.toThrow();
  });

  it('gives one window the profile lock and lets another take it over', async () => {
    const holders = new Map<string, () => void>();
    const locks: LockManagerLike = {
      request(name, opts, callback) {
        if (holders.has(name) && !opts.steal) return callback(null);
        if (opts.steal) holders.get(name)?.();
        return new Promise((resolve, reject) => {
          holders.set(name, () => reject(new Error('AbortError')));
          void callback({}).then(resolve);
        });
      },
    };
    let lost = false;
    const first = await acquireProfileLock(locks, 'p-aaaa', { onLost: () => (lost = true) });
    expect(first).not.toBeNull();
    expect(await acquireProfileLock(locks, 'p-aaaa', { onLost: () => {} })).toBeNull();
    const stolen = await acquireProfileLock(locks, 'p-aaaa', { steal: true, onLost: () => {} });
    expect(stolen).not.toBeNull();
    await Promise.resolve();
    expect(lost).toBe(true);
  });
});
