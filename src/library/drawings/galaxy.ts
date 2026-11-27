// Spiral galaxy: two arms of stars seen edge-on (the inner ones spin faster), pink clouds
// in the arms, a bulge of stars and a core of light.
import type { Layer, Drawing } from '../../engine/geometry/schema.ts';

const SPIRAL: Layer = { shape: 'spiral', arms: 2, turns: 1.15, radius: 47, flatten: 0.5, rot: -16, spread: 0.07, depth: true };

export const galaxy: Drawing = {
  purpose: 'spinning spiral galaxy with a bright core', grade: 'B', note: 'readable on both backgrounds; stroke arms look like beads',
  layers: [
    { shape: 'ellipse', rx: 50, ry: 27, rot: -16, color: '#4B37C8', material: 'glow', opacity: 0.5 },
    { ...SPIRAL, material: 'stroke', color: '#5B45D6', lineWidth: 2.6, opacity: 0.26 },
    { ...SPIRAL, n: 420, colors: ['#FFFFFF', '#9DB4FF', '#5B6CFF', '#D063C8'], size: [0.5, 1.6], animate: [{ type: 'twinkle', period: 1.8 }] },
    { ...SPIRAL, n: 36, seed: 3, colors: ['#E0559E', '#8B4BFF'], size: [2.5, 5], material: 'glow', opacity: 0.6 },
    { shape: 'particles', distribution: 'cloud', n: 60, radius: 16, flatten: 0.6, rot: -16, colors: ['#FFE6B0', '#FFFFFF'], size: [0.3, 0.9] },
    { shape: 'ellipse', rx: 17, ry: 10, rot: -16, color: '#FFC98A', material: 'shine', animate: [{ type: 'pulse', amplitude: 0.04, period: 3 }] },
  ],
};
