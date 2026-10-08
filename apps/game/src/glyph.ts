// Postal button cipher glyphs (D17, R01): A's button art when present, and always the shape, the
// number of holes and the colour as text, so colour is never the only cue.
import type { App } from './app.js';
import { h } from './dom.js';

export interface GlyphLike {
  letter: string;
  colour: string;
  holes: number;
  shape: string;
}

const COLOUR_NAMES: Record<string, string> = {
  honey: 'медовая',
  blue: 'синяя',
  rose: 'розовая',
  green: 'зелёная',
};
const SHAPE_NAMES: Record<string, string> = {
  circle: 'круглая',
  square: 'квадратная',
  flower: 'цветок',
  heart: 'сердечко',
};
const SHAPE_ICONS: Record<string, string> = { circle: '●', square: '■', flower: '✿', heart: '♥' };

export function colourName(colour: string): string {
  return COLOUR_NAMES[colour] ?? colour;
}

export function glyphDescription(glyph: GlyphLike): string {
  return `${colourName(glyph.colour)}, ${SHAPE_NAMES[glyph.shape] ?? glyph.shape}, дырочек: ${glyph.holes}`;
}

/** The button picture: A's SVG for this colour, hole count and shape, else a drawn fallback. */
export function glyphArt(app: App, glyph: GlyphLike): HTMLElement {
  const id = `case02.cipher.button-${glyph.colour}-${glyph.holes}-${glyph.shape}`;
  const url = app.assets.manifest.assets[id]?.url;
  if (url)
    return h('img', {
      class: 'glyph-art',
      src: app.assets.url(url),
      alt: '',
      'aria-hidden': 'true',
    });
  return h(
    'span',
    { class: 'glyph-art fallback', 'aria-hidden': 'true' },
    h('span', { class: 'glyph-shape' }, SHAPE_ICONS[glyph.shape] ?? '●'),
    h('span', { class: 'glyph-holes' }, '∘'.repeat(glyph.holes)),
  );
}
