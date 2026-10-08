// Narration via @aegis/browser/audio. Every child-facing line with a recorded voice file plays
// automatically when shown, stops when the child moves on, never auto-advances, and can be
// replayed. Missing recordings degrade to text-only with an explicit status (no fake success).
import { createNarration, type NarrationState } from '@aegis/browser/audio';
import type { FluffyPack } from '@fluffy/game-core';
import type { Assets } from './assets.js';

export type VoiceStatus = 'idle' | 'playing' | 'paused' | 'text-only' | 'blocked' | 'failed';

export class Voice {
  private readonly narration;
  private readonly lineToPack = new Map<string, string>();
  private status: VoiceStatus = 'idle';
  private listeners = new Set<(status: VoiceStatus) => void>();
  private sequence: string[] = [];
  private current: string | null = null;
  private unlocked = false;

  constructor(
    private readonly assets: Assets,
    baseUrl: string,
  ) {
    this.narration = createNarration({
      baseUrl,
      onState: (state) => this.onState(state),
      onComplete: () => this.playNextInSequence(),
    });
  }

  registerPacks(packs: readonly FluffyPack[]): void {
    for (const pack of packs) {
      const lines = pack.lines.filter((line) => line.voiced && this.assets.voice(line.id));
      if (!lines.length) continue;
      this.narration.registerPack({
        id: pack.id,
        revision: pack.revision,
        assets: lines.map((line) => ({ id: line.id, src: this.assets.voice(line.id)!.url })),
        lines: lines.map((line) => ({
          id: line.id,
          asset: line.id,
          caption: line.text,
          speaker: line.speaker,
          // Lip-sync track, resolved by the stage through Assets.resolve('cues:<id>').
          ...(this.assets.hasCues(line.id) ? { cues: `cues:${line.id}` } : {}),
        })),
      });
      for (const line of lines)
        if (!this.lineToPack.has(line.id)) this.lineToPack.set(line.id, pack.id);
    }
  }

  subscribe(listener: (status: VoiceStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private set(status: VoiceStatus): void {
    if (status === this.status) return;
    this.status = status;
    for (const listener of this.listeners) listener(status);
  }

  private onState(state: NarrationState): void {
    if (state.status === 'playing' || state.status === 'loading') this.set('playing');
    else if (state.status === 'paused') this.set('paused');
    else if (state.status === 'blocked') this.set('blocked');
    else if (state.status === 'failed') this.set('failed');
    else this.set('idle');
  }

  /** Call from a trusted gesture (first tap/key) so iPadOS Safari allows audio. */
  async unlock(): Promise<void> {
    if (this.unlocked && this.status !== 'blocked') return;
    const first = !this.unlocked;
    this.unlocked = true;
    await this.narration.unlock().catch(() => this.set('blocked'));
    if (first && this.wantedMusic) {
      const track = this.wantedMusic;
      this.wantedMusic = null;
      this.music(track, false);
    }
  }

  hasVoice(lineId: string): boolean {
    return this.lineToPack.has(lineId);
  }

  /** The narration controller, shared with the animation stage for lip-sync. */
  get controller() {
    return this.narration;
  }

  packOf(lineId: string): string | null {
    return this.lineToPack.get(lineId) ?? null;
  }

  /**
   * Plays one line (replacing whatever is playing), then optional follow-up lines in order.
   * `start` lets the stage start the line itself (puppet speech with lip-sync).
   */
  say(
    lineId: string | null,
    then: readonly string[] = [],
    start?: (packId: string, lineId: string) => Promise<void>,
  ): void {
    this.sequence = [...then];
    this.current = lineId;
    this.narration.stop();
    if (!lineId) {
      this.set('idle');
      return;
    }
    const pack = this.lineToPack.get(lineId);
    if (!pack) {
      this.set('text-only');
      this.playNextInSequence();
      return;
    }
    void (start ? start(pack, lineId) : this.narration.playLine(pack, lineId)).catch(() =>
      this.set('failed'),
    );
  }

  private playNextInSequence(): void {
    const next = this.sequence.shift();
    if (!next) return;
    const pack = this.lineToPack.get(next);
    if (pack) void this.narration.playLine(pack, next).catch(() => this.set('failed'));
    else this.playNextInSequence();
  }

  replay(): void {
    if (this.current && this.lineToPack.has(this.current)) {
      this.sequence = [];
      void this.narration.replay().catch(() => this.say(this.current));
    }
  }

  /** Ear button: speak a label without touching the current line state. */
  label(lineId: string | null): void {
    if (!lineId || !this.lineToPack.has(lineId)) return;
    this.sequence = [];
    this.narration.stop();
    void this.narration
      .playLine(this.lineToPack.get(lineId)!, lineId)
      .catch(() => this.set('failed'));
  }

  stop(): void {
    this.sequence = [];
    this.narration.stop();
  }

  pause(): void {
    this.narration.pause();
  }

  resume(): void {
    void this.narration.resume().catch(() => {});
  }

  clear(): void {
    this.sequence = [];
    this.current = null;
    this.narration.clear();
  }

  setVolumes(volumes: { narration: number; music: number; effects: number }): void {
    this.narration.setVolume('narration', volumes.narration);
    this.narration.setVolume('music', volumes.music);
    this.narration.setVolume('effects', volumes.effects);
  }

  private audioPack: { music: Set<string>; sfx: Set<string> } | null = null;
  private wantedMusic: string | null = null;

  /** Registers A's music loops and sound effects as one audio pack. */
  registerAudio(): void {
    const music = Object.keys(this.assets.manifest.music);
    const sfx = Object.keys(this.assets.manifest.sfx);
    if (!music.length && !sfx.length) return;
    this.narration.registerPack({
      id: 'fluffy-audio',
      revision: 'assets',
      assets: [
        ...music.map((name) => ({ id: `music:${name}`, src: this.assets.music(name)! })),
        ...sfx.map((name) => ({ id: `sfx:${name}`, src: this.assets.sfx(name)! })),
      ],
      lines: [],
    });
    this.audioPack = { music: new Set(music), sfx: new Set(sfx) };
  }

  /** Selects the background loop; the comfort lamp uses the warm variant (Q22). */
  music(name: string | null, warm: boolean): void {
    const pack = this.audioPack;
    let track = name;
    if (track && warm && pack?.music.has(`${track}-warm`)) track = `${track}-warm`;
    if (track && !pack?.music.has(track)) track = null;
    if (track === this.wantedMusic) return;
    this.wantedMusic = track;
    if (!this.unlocked) return;
    void this.narration
      .setAtmosphere(
        track ? { packId: 'fluffy-audio', asset: `music:${track}`, fadeSeconds: 1.5 } : null,
      )
      .catch(() => {});
  }

  effect(name: string): void {
    if (!this.unlocked || !this.audioPack?.sfx.has(name)) return;
    void this.narration.playEffect('fluffy-audio', `sfx:${name}`).catch(() => {});
  }

  getStatus(): VoiceStatus {
    return this.status;
  }
}
