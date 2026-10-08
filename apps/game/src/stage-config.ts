// Camera presets and particle effects named by C's cutscene documents (T25 contract).
// Interim copy: replaced by an import of `EFFECTS`/`CAMERA_PRESETS` from C's
// `packages/content/src/stage.ts` once that lands with A's fx atlas.
import type { EffectDefinition } from '@aegis/browser/stage';

export const CAMERA_PRESETS = {
  'close-left': { x: 900, y: 950, zoom: 1.4 },
  'close-center': { x: 1280, y: 950, zoom: 1.4 },
  'close-right': { x: 1660, y: 950, zoom: 1.4 },
  sky: { x: 1280, y: 500, zoom: 1.2 },
};

export const EFFECTS: Record<string, EffectDefinition> = {
  bubbles: { frame: 'fx.bubble#bubble', count: 10, life: 2.4, spread: 220, rise: 420, scale: 0.6 },
  sparkles: {
    frame: 'fx.sparkle#sparkle',
    count: 16,
    life: 1.2,
    spread: 260,
    rise: 120,
    scale: 0.5,
  },
  steam: { frame: 'fx.bubble#bubble', count: 8, life: 2, spread: 120, rise: 300, scale: 0.35 },
};
