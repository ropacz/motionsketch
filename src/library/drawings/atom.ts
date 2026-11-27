// Atom: a nucleus of little balls with volume that vibrate, 3 orbits with depth and electrons with trails, each at
// its own speed, passing behind the nucleus on the back half.
import type { Layer, Drawing } from '../../engine/geometry/schema.ts';

const P = 'red';
const N = '#F4C04E';
// nucleus ball: from back (edge) to front (center), vibrating slightly, each in its own phase
const b = (x: number, y: number, color: string, r: number, phase: number): Layer => ({ shape: 'circle', x, y, r, color, material: 'volume', animate: [{ type: 'float', amplitude: 0.5, period: 0.9, phase }] });
// electron: aura and body, on the orbit at angle `rot`
const electron = (rot: number, period: number, direction: number, phase: number): Layer => ({
  shape: 'group', trail: true, color: 'blue',
  animate: [{ type: 'orbit', rx: 46, ry: 16.5, rot, period, direction, phase }],
  children: [{ shape: 'circle', r: 12, color: 'blue', material: 'glow', opacity: 0.7 }, { shape: 'circle', r: 4.6, color: 'blue', material: 'volume' }, { shape: 'circle', r: 4.2, color: '#FFFFFF', material: 'glow' }],
});
const orbit = (rot: number): Layer => ({ shape: 'orbit', rx: 46, ry: 16.5, rot, color: 'blue', lineWidth: 1.1, opacity: 0.65, depth: true });

export const atom: Drawing = {
  purpose: 'atom with orbiting electrons', grade: 'A', note: 'vibrating nucleus with volume, electrons with trails and depth',
  layers: [
    { shape: 'circle', r: 50, color: 'blue', material: 'glow', opacity: 0.16, z: -1 },
    orbit(-60), orbit(0), orbit(60),
    { shape: 'circle', r: 23, color: '#FFB070', material: 'glow', opacity: 0.35 },
    {
      shape: 'group',
      children: [b(3.2, 10.3, P, 4.5, 0.1), b(4.3, -9.3, N, 4.5, 0.5), b(-9, 3.7, P, 4.6, 0.8), b(8.7, 3.2, N, 4.6, 0.3), b(-4, -7.7, N, 4.7, 0.6), b(-2.1, 7.8, P, 4.7, 0.2),
        b(6.3, -4, P, 4.8, 0.9), b(-6.6, -1.2, N, 4.8, 0.4), b(3.6, 4.7, N, 4.9, 0.7), b(0.4, -5, P, 4.9, 0), b(-2.9, 2.6, N, 5, 0.55), b(2.2, 0, P, 5, 0.25)],
    },
    electron(-60, 2.6, 1, 0), electron(0, 3.4, -1, 0.33), electron(60, 4.6, 1, 0.66),
  ],
};
