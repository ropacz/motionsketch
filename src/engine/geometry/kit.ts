// The engine kit: the parts a drawing instantiates with `use` (wheel, window, eye, wing...) and the named materials.
// Each part fits in ~20 units, at the origin; its layers without a color inherit the user's color (or the part's `color`).
import type { Layer } from './schema.ts';

/** Named materials: prop shortcuts (`"material": "shine"`); the layer's own props win over the shortcut's. */
export const NAMED_MATERIALS = {
  /** white core that fades into the color: star, galaxy core, light bulb */
  shine: { material: 'glow', core: '#FFFFFF' },
  /** translucent volume with a light outline: bubble, cell, glass */
  glass: { material: 'volume', opacity: 0.55, outline: '#FFFFFF', lineWidth: 0.6, texture: 'glare' },
  /** metal-gray volume: satellite, machine part, coin */
  metal: { material: 'volume', color: '#C9CED6', texture: 'brushed' },
} satisfies Record<string, Partial<Layer>>;

export type Part = { color: string; layers: Layer[] };
const part = (color: string, layers: Layer[]): Part => ({ color, layers });

export const PARTS = {
  /** tire, metal rim and three spokes; spins by itself */
  wheel: part('#2B2F3A', [
    { shape: 'group', animate: [{ type: 'spin', speed: 220 }], children: [
      { shape: 'circle', r: 10, material: 'volume' },
      { shape: 'circle', r: 5.5, material: 'metal' },
      { shape: 'rectangle', w: 1.6, h: 10, color: '#8A909A', repeat: { n: 3, step: { rot: 60 } } },
      { shape: 'circle', r: 1.6, color: '#8A909A' },
    ] },
  ]),
  /** frame (the color), gradient glass and the cross */
  window: part('#FFFFFF', [
    { shape: 'rectangle', w: 14, h: 14, radius: 1.5 },
    { shape: 'rectangle', w: 11, h: 11, color: '#CFEAFB', material: 'gradient', to: '#7FB8F0', angle: 160 },
    { shape: 'rectangle', w: 11, h: 1.4 }, { shape: 'rectangle', w: 1.4, h: 11 },
  ]),
  /** wooden door (the color) with a knob */
  door: part('#9C6B4A', [
    { shape: 'rectangle', w: 12, h: 20, radius: 1.5, material: 'gradient' },
    { shape: 'circle', x: 3.4, y: 1.5, r: 1.1, color: '#F4C04E' },
  ]),
  /** white, pupil (the color) with a glint; blinks */
  eye: part('#1F2430', [
    { shape: 'group', animate: [{ type: 'blink', period: 3.2 }], children: [
      { shape: 'circle', r: 5, color: '#FFFFFF' }, { shape: 'circle', x: 1, y: 0.4, r: 2.8 }, { shape: 'circle', x: 1.9, y: -0.6, r: 0.9, color: '#FFFFFF' },
    ] },
  ]),
  /** wing with feathers on the trailing edge and light coverts; base at the origin, tip up: turn it with `rot` and flap it with `sway` */
  wing: part('#FFFFFF', [
    { shape: 'curve', points: [[-3, 1], [-7, -7], [-8, -16], [-5, -24], [0, -28], [2, -23], [5, -24], [5, -18], [8, -17], [6, -10], [8, -8], [4, -1]], material: 'volume' },
    { shape: 'curve', points: [[-3, 0], [-6, -7], [-5, -13], [0, -12], [4, -2]], color: '#FFFFFF', opacity: 0.3 },
  ]),
  /** clock hand: from the origin upward (−18), spins around it */
  'clock-hand': part('#1F2430', [{ shape: 'rectangle', y: -8, w: 2.4, h: 20, radius: 1.2 }]),
  /** flickering flame: orange outside, yellow core; tip up, ball at the origin */
  flame: part('#FF9F1C', [
    { shape: 'drop', r: 7, h: 20, material: 'glow', core: '#FFE36E', animate: [{ type: 'pulse', amplitude: 0.12, period: 0.25 }] },
    { shape: 'drop', y: 1.5, r: 4, h: 12, color: '#FFF1BF', animate: [{ type: 'pulse', amplitude: 0.15, period: 0.2, phase: 0.5 }] },
  ]),
  /** fin (base at the origin) */
  fin: part('#F4C04E', [{ shape: 'leaf', w: 9, h: 12, bend: -0.3, material: 'volume' }]),
  /** leaf with a vein, base at the origin */
  'tree-leaf': part('green', [
    { shape: 'leaf', w: 9, h: 16, bend: 0.15, material: 'volume' },
    { shape: 'curve', points: [[0, 0], [0.6, -7], [1.3, -13]], closed: false, color: '#FFFFFF', lineWidth: 0.5, opacity: 0.6 },
  ]),
} satisfies Record<string, Part>;
