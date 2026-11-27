// Everyday objects: coin, phone, battery, clock and book. Parametric shapes, `anchor`,
// `use` (kit in geometry/kit.ts), `clip` and `repeat`; one living layer in each.
import type { Drawing } from '../../engine/geometry/schema.ts';

/** Spins edge-on: the group lying down (rot 90) closes its height, which on screen is the width; the inner one undoes the turn. */
export const coin: Drawing = {
  purpose: 'coin spinning edge-on with a glint', grade: 'A', note: 'spins edge-on with a reflection',
  groundShadow: true,
  layers: [
    { shape: 'group', rot: 90, animate: [{ type: 'blink', period: 2.8, duration: 1.4 }], children: [{ shape: 'group', rot: -90, children: [
      { id: 'face', shape: 'circle', r: 34, color: '#F4C04E', material: 'volume', outline: '#C98A1A', lineWidth: 1.6 },
      { shape: 'ring', r: 27, thickness: 2, color: '#C98A1A', opacity: 0.55 },
      { shape: 'text', text: '$', size: 36, color: '#B07612' },
      { shape: 'rectangle', x: -20, w: 9, h: 100, rot: 25, color: '#FFFFFF', opacity: 0.45, clip: 'face', animate: [{ type: 'float', amplitude: 28, period: 2.8 }] },
    ] }] },
    { shape: 'star', x: 24, y: -28, r: 8, tips: 4, inner: 0.22, color: '#FFFFFF', material: 'shine', animate: [{ type: 'pulse', amplitude: 0.35, period: 1.4 }, { type: 'twinkle', period: 1.4 }] },
  ],
};

export const phone: Drawing = {
  purpose: 'phone with a pulsing notification', grade: 'A', note: 'screen with icons and notification',
  layers: [
    { id: 'body', shape: 'rectangle', w: 46, h: 88, radius: 8, color: '#2B2F3A', material: 'volume' },
    { id: 'screen', shape: 'rectangle', w: 40, h: 78, radius: 5, color: 'blue', material: 'gradient', to: '#7B5CD6', angle: 160, anchor: { to: 'body', side: 'center' } },
    { shape: 'rectangle', w: 10, h: 2.4, radius: 1.2, color: '#2B2F3A', anchor: { to: 'screen', side: 'inside-top', gap: 2 } },
    { shape: 'group', y: 4, repeat: { n: 3, step: { y: 11 } }, children: [{ shape: 'rectangle', x: -13.5, w: 7.5, h: 7.5, radius: 2, color: '#FFFFFF', opacity: 0.3, repeat: { n: 4, step: { x: 9 } } }] },
    { shape: 'rectangle', w: 14, h: 1.6, radius: 0.8, color: '#FFFFFF', opacity: 0.5, anchor: { to: 'screen', side: 'inside-bottom', gap: 2.5 } },
    { shape: 'group', y: -22, animate: [{ type: 'enter', delay: 0.6 }, { type: 'pulse', amplitude: 0.05, period: 1.4 }], children: [
      { shape: 'rectangle', w: 34, h: 13, radius: 3.5, color: '#FFFFFF', opacity: 0.95 },
      { shape: 'circle', x: -11, r: 3.6, color: 'green', material: 'volume' },
      { shape: 'rectangle', x: 3, y: -2.2, w: 17, h: 2.2, radius: 1.1, color: '#1F2430', opacity: 0.6 },
      { shape: 'rectangle', x: 1, y: 2.2, w: 13, h: 2.2, radius: 1.1, color: '#1F2430', opacity: 0.3 },
    ] },
    { shape: 'ring', x: 21, y: -42, r: 7, thickness: 1.2, color: 'red', animate: [{ type: 'ripple', period: 1.4 }] },
    { shape: 'circle', x: 21, y: -42, r: 5, color: 'red', material: 'volume', animate: [{ type: 'pulse', amplitude: 0.15, period: 1.4 }] },
  ],
};

/** The charge is a wide rectangle that rises and falls (float), clipped by the core. */
export const battery: Drawing = {
  purpose: 'battery charging (charge rising)', grade: 'B', note: 'flat casing, good charge',
  layers: [
    { id: 'casing', shape: 'rectangle', y: 4, w: 42, h: 76, radius: 7, color: '#2B2F3A', material: 'volume' },
    { shape: 'rectangle', w: 16, h: 7, radius: 2.5, color: '#2B2F3A', anchor: { to: 'casing', side: 'top', gap: -2 } },
    { id: 'core', shape: 'rectangle', w: 33, h: 67, radius: 4, color: '#1F2430', anchor: { to: 'casing', side: 'center' } },
    { shape: 'rectangle', y: 41, w: 100, h: 70, color: '#8BE38F', material: 'gradient', to: '#2E9E5B', clip: 'core', animate: [{ type: 'float', amplitude: 30, period: 5, phase: 0.25 }] },
    { shape: 'rectangle', y: -12, w: 33, h: 1.6, color: '#2B2F3A', repeat: { n: 3, step: { y: 16 } } },
    { shape: 'bolt', w: 16, h: 28, color: '#FFFFFF', opacity: 0.9, anchor: { to: 'core', side: 'center' }, animate: [{ type: 'twinkle', period: 1 }] },
  ],
};

export const clock: Drawing = {
  purpose: 'clock with spinning hands', grade: 'A', note: 'rim with volume, spinning hands',
  layers: [
    { shape: 'rectangle', y: -45, w: 9, h: 6, radius: 2, color: 'red', material: 'volume' },
    { shape: 'circle', r: 41, color: 'red', material: 'volume' },
    { shape: 'circle', r: 35, color: '#FBF7EF', material: 'volume' },
    { shape: 'rectangle', y: -29, w: 2.2, h: 6, radius: 1.1, color: '#1F2430', repeat: { n: 12, step: { rot: 30 } } },
    { use: 'clock-hand', rot: 200, scale: 1.15, animate: [{ type: 'spin', speed: 15 }] },
    { use: 'clock-hand', scale: 1.4, animate: [{ type: 'spin', speed: 90 }] },
    { shape: 'circle', r: 3, color: 'red', material: 'volume' },
  ],
};

/** The turning page closes its width toward the spine (the same trick as the coin). */
export const book: Drawing = {
  purpose: 'open book with a turning page', grade: 'B', note: 'turning page hard to read',
  groundShadow: true,
  layers: [
    { shape: 'rectangle', y: 4, w: 84, h: 52, radius: 3, color: 'red', material: 'volume', z: -1 },
    { shape: 'polygon', points: [[-1, -20], [-20, -25], [-38, -22], [-38, 24], [-20, 21], [-1, 25]], color: '#FFFDF6' },
    { shape: 'polygon', points: [[1, -20], [20, -25], [38, -22], [38, 24], [20, 21], [1, 25]], color: '#F6F1E4' },
    { shape: 'rectangle', x: -19, y: -13, w: 28, h: 1.6, radius: 0.8, color: '#1F2430', opacity: 0.22, repeat: { n: 6, step: { y: 6 } } },
    { shape: 'rectangle', x: 19, y: -13, w: 28, h: 1.6, radius: 0.8, color: '#1F2430', opacity: 0.22, repeat: { n: 6, step: { y: 6 } } },
    { shape: 'group', rot: 90, animate: [{ type: 'blink', period: 3, duration: 1.6 }], children: [{ shape: 'group', rot: -90, children: [
      { shape: 'polygon', points: [[1, -20], [20, -26], [38, -23], [38, 23], [20, 20], [1, 25]], color: '#FFFFFF', outline: '#E3DCCB', lineWidth: 0.6 },
      { shape: 'rectangle', x: 19, y: -13, w: 28, h: 1.6, radius: 0.8, color: '#1F2430', opacity: 0.22, repeat: { n: 6, step: { y: 6 } } },
    ] }] },
    { shape: 'rectangle', y: 2, w: 1.4, h: 46, color: '#D8CFBB' },
  ],
};
