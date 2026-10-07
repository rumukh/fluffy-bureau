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
        lines: lines.map((line) => ({ id: line.id, asset: line.id, caption: line.text })),
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
    this.unlocked = true;
    await this.narration.unlock().catch(() => this.set('blocked'));
  }

  hasVoice(lineId: string): boolean {
    return this.lineToPack.has(lineId);
  }

  /** Plays one line (replacing whatever is playing), then optional follow-up lines in order. */
  say(lineId: string | null, then: readonly string[] = []): void {
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
    void this.narration.playLine(pack, lineId).catch(() => this.set('failed'));
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

  getStatus(): VoiceStatus {
    return this.status;
  }
}
