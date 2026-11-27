// Objects and animals: parametric shapes, `anchor` instead of coordinates, parts with `use`
// and `clip`. Each one has up to ~30 lines; the parts kit is in geometry/kit.ts.
import type { Drawing } from '../../engine/geometry/schema.ts';

export const house: Drawing = {
  purpose: 'house with smoke from the chimney', grade: 'B', note: 'flat walls, no roof shadow',
  groundShadow: true,
  layers: [
    { id: 'wall', shape: 'rectangle', y: 12, w: 52, h: 36, color: '#F3E3C8', material: 'volume' },
    { id: 'roof', shape: 'triangle', w: 66, h: 28, color: '#E5484D', material: 'gradient', anchor: { to: 'wall', side: 'top', gap: -2 } },
    { id: 'chimney', shape: 'rectangle', x: 16, w: 7, h: 16, color: '#9C5B43', z: -1, anchor: { to: 'roof', side: 'inside-top', gap: 3 } },
    { use: 'door', anchor: { to: 'wall', side: 'inside-bottom' } },
    { use: 'window', x: -15, y: -3, anchor: { to: 'wall', side: 'center' } },
    { use: 'window', x: 15, y: -3, anchor: { to: 'wall', side: 'center' } },
    { shape: 'particles', n: 7, radius: 1.5, rot: 14, size: [2.4, 3.6], color: '#B9BEC8', anchor: { to: 'chimney', side: 'top', gap: 1 }, animate: [{ type: 'rise', distance: 26, period: 3.5 }] },
  ],
};

export const car: Drawing = {
  purpose: 'car driving (wheels spinning)', grade: 'A', note: 'body in 3 tones, reflection and ground shadow',
  groundShadow: true,
  layers: [
    { id: 'shell', shape: 'group', animate: [{ type: 'sway', amplitude: 1.2, period: 0.9 }, { type: 'float', amplitude: 0.5, period: 0.7 }], children: [
      { id: 'body', shape: 'rectangle', y: 6, w: 80, h: 20, radius: 7, color: 'red', material: 'volume' },
      { id: 'cabin', shape: 'trapezoid', x: -4, top: 34, bottom: 52, h: 17, color: 'red', material: 'volume', anchor: { to: 'body', side: 'top', gap: -2 } },
      { shape: 'trapezoid', top: 27, bottom: 42, h: 11, color: '#CFEAFB', material: 'gradient', to: '#7FB8F0', anchor: { to: 'cabin', side: 'center' }, y: 1.5 },
      { shape: 'rectangle', w: 1.8, h: 12, color: 'red', anchor: { to: 'cabin', side: 'center' }, y: 1.5 },
      { shape: 'circle', x: -2, r: 2.6, color: 'accent', material: 'shine', anchor: { to: 'body', side: 'inside-top', gap: 3 }, z: 1 },
    ] },
    { use: 'wheel', x: -24, anchor: { to: 'shell', side: 'inside-bottom', gap: -8 } },
    { use: 'wheel', x: 24, anchor: { to: 'shell', side: 'inside-bottom', gap: -8 } },
  ],
};

export const tree: Drawing = {
  purpose: 'tree swaying in the wind', grade: 'B', note: 'canopy without inner light and shadow',
  groundShadow: true,
  layers: [
    { id: 'trunk', shape: 'trapezoid', y: 24, top: 7, bottom: 12, h: 32, color: '#8A5A3C', material: 'volume' },
    { shape: 'group', animate: [{ type: 'sway', amplitude: 3, period: 4, center: [0, 40] }], children: [
      { shape: 'cloud', x: 3, y: -10, w: 70, h: 50, n: 8, seed: 4, color: '#2E8B57', z: -1 },
      { shape: 'cloud', y: -14, w: 62, h: 44, n: 7, seed: 9, color: 'green', material: 'volume' },
      { shape: 'circle', x: -12, y: -6, r: 2.6, color: 'red', material: 'volume', repeat: { n: 3, step: { x: 13, y: -7 } } },
    ] },
    { use: 'tree-leaf', x: 22, y: 2, scale: 0.8, animate: [{ type: 'rise', distance: -34, period: 4.5 }, { type: 'sway', amplitude: 40, period: 1.5 }] },
  ],
};

export const lightbulb: Drawing = {
  purpose: 'light bulb turning on (idea)', grade: 'A', note: 'glass, glow and rays',
  layers: [
    { shape: 'circle', y: -10, r: 46, color: '#FFD15C', material: 'shine', opacity: 0.55, z: -2, animate: [{ type: 'enter', delay: 0.9 }, { type: 'pulse', amplitude: 0.05, period: 2 }] },
    { shape: 'group', y: -10, animate: [{ type: 'enter', delay: 1.1 }], children: [{ shape: 'rectangle', y: -38, w: 2.6, h: 8, radius: 1.3, color: '#F4C04E', repeat: { n: 7, step: { rot: 51.4 } }, animate: [{ type: 'twinkle' }] }] },
    { id: 'bulb', shape: 'circle', y: -10, r: 24, color: '#FFF1BF', material: 'glass', opacity: 0.8, outline: '#E8C65A' },
    { id: 'neck', shape: 'trapezoid', top: 22, bottom: 15, h: 10, color: '#FFF1BF', material: 'glass', opacity: 0.8, lineWidth: 0, anchor: { to: 'bulb', side: 'bottom', gap: -4 } },
    { id: 'screw', shape: 'rectangle', w: 16, h: 13, radius: 2, material: 'metal', anchor: { to: 'neck', side: 'bottom', gap: -1 } },
    { shape: 'rectangle', w: 17, h: 1.3, color: '#8A909A', y: -3, anchor: { to: 'screw', side: 'center' }, repeat: { n: 3, step: { y: 3 } } },
    { shape: 'curve', y: -4, points: [[-7, 14], [-6, 0], [-3, -4], [0, 0], [3, -4], [6, 0], [7, 14]], closed: false, color: '#8A909A', lineWidth: 1.3, animate: [{ type: 'color', to: '#FF9F1C', at: 0.8 }] },
  ],
};

export const waterGlass: Drawing = {
  purpose: 'glass of water with a wave', grade: 'B', note: 'good glass; water without a surface',
  groundShadow: true,
  layers: [
    { id: 'glass', shape: 'trapezoid', top: 46, bottom: 34, h: 62, color: '#DCEFFB', material: 'glass' },
    { shape: 'curve', y: -4, points: [[-34, 0], [-17, -3.5], [0, 0], [17, 3.5], [34, 0], [34, 40], [-34, 40]], color: '#7FC8F8', material: 'gradient', to: '#2F7FD0', opacity: 0.92, clip: 'glass', animate: [{ type: 'sway', amplitude: 5, period: 3 }, { type: 'float', amplitude: 1.2, period: 2.4 }] },
    { shape: 'particles', y: 18, n: 6, radius: 10, size: [0.8, 1.6], color: '#FFFFFF', opacity: 0.8, clip: 'glass', animate: [{ type: 'rise', distance: 22, period: 2.6 }] },
    { shape: 'rectangle', x: -15, w: 3, h: 46, radius: 1.5, rot: 7, color: '#FFFFFF', opacity: 0.55, clip: 'glass' },
    { shape: 'ellipse', rx: 23, ry: 2.6, material: 'stroke', color: '#FFFFFF', lineWidth: 1.2, anchor: { to: 'glass', side: 'inside-top', gap: -2.6 } },
  ],
};
