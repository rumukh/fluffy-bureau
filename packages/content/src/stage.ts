// Stage vocabulary that cutscene documents may reference (T25). G registers exactly these
// camera presets and effects on the stage; the content validator rejects any other name.

/** Camera presets in logical stage pixels (2560×1600). `wide` is built into the engine. */
export const CAMERA_PRESETS = {
  'close-left': { x: 900, y: 950, zoom: 1.4 },
  'close-center': { x: 1280, y: 950, zoom: 1.4 },
  'close-right': { x: 1660, y: 950, zoom: 1.4 },
  sky: { x: 1280, y: 500, zoom: 1.2 },
} as const;

/** Effect names; G registers each from A's fx.atlas. */
export const EFFECTS = ['bubbles', 'sparkles', 'fireflies', 'confetti', 'steam', 'glow'] as const;

export const CAMERA_PRESET_IDS: readonly string[] = ['wide', ...Object.keys(CAMERA_PRESETS)];
