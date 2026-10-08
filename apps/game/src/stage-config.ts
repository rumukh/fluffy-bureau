// Camera presets and particle effects that C's cutscene documents may name (T25). The names are
// C's (`@fluffy/content`); frames and tuning are A's effects table for fx.atlas
// (docs/art/STAGING_RU.md §6, tools/assets/art/preview_manifest.py).
import type { EffectDefinition } from '@aegis/browser/stage';
import { CAMERA_PRESETS as CONTENT_PRESETS, EFFECTS as EFFECT_NAMES } from '@fluffy/content';

export const CAMERA_PRESETS: Record<string, { x: number; y: number; zoom: number }> = {
  ...CONTENT_PRESETS,
};

const FRAMES: Record<(typeof EFFECT_NAMES)[number], EffectDefinition> = {
  bubbles: { frame: 'fx.atlas#bubble', count: 10, life: 2.4, spread: 160, rise: 320 },
  sparkles: { frame: 'fx.atlas#sparkle', count: 14, life: 1.2 },
  fireflies: { frame: 'fx.atlas#firefly', count: 12, life: 3.0, spread: 600, rise: 120 },
  confetti: { frame: 'fx.atlas#petal.rose', count: 24, life: 2.0, spread: 900, rise: -200 },
  steam: { frame: 'fx.atlas#steam', count: 8, life: 2.0, spread: 80, rise: 260 },
  glow: { frame: 'fx.atlas#glow', count: 1, life: 2.0, spread: 0, rise: 0, scale: 3 },
};

export const EFFECTS: Record<string, EffectDefinition> = {
  ...FRAMES,
  hearts: { frame: 'fx.atlas#heart', count: 8, life: 1.6 },
};
