// Radio wave: a metal antenna tower (legs and braces with volume), a pulsing light at the top and arcs
// on both sides that are born at the tip, grow and fade, in a loop (three phase-shifted copies).
import type { Drawing } from '../../engine/geometry/schema.ts';

export const radioWave: Drawing = {
  purpose: 'antenna transmitting radio waves', grade: 'B', note: 'brushed metal tower; arcs with volume, but simple',
  groundShadow: true,
  layers: [
    { shape: 'rectangle', x: -7, y: 20, w: 3.4, h: 54, radius: 1.2, rot: 15, material: 'metal' },
    { shape: 'rectangle', x: 7, y: 20, w: 3.4, h: 54, radius: 1.2, rot: -15, material: 'metal' },
    { shape: 'rectangle', y: 16, w: 13, h: 2.2, radius: 1, material: 'metal', z: -1 },
    { shape: 'rectangle', y: 32, w: 21, h: 2.2, radius: 1, material: 'metal', z: -1 },
    { shape: 'rectangle', y: 24, w: 1.8, h: 22, radius: 0.9, rot: 45, color: '#8A93A0', material: 'volume', z: -1 },
    { shape: 'rectangle', y: 24, w: 1.8, h: 22, radius: 0.9, rot: -45, color: '#8A93A0', material: 'volume', z: -1 },
    { shape: 'rectangle', y: -3, w: 2.4, h: 10, radius: 1, material: 'metal' },
    { shape: 'rectangle', y: 47, w: 38, h: 5, radius: 2, color: '#5E6673', material: 'volume' },
    {
      shape: 'path', y: -8, d: 'M-38 -22A44 44 0 0 0 -38 22M38 -22A44 44 0 0 1 38 22', material: 'stroke', color: 'orange', lineWidth: 3,
      animate: [{ type: 'ripple', period: 2.4 }], repeat: { n: 3, phaseStep: 1 / 3 },
    },
    { shape: 'circle', y: -8, r: 10, color: 'accent', material: 'glow', opacity: 0.6, animate: [{ type: 'pulse', amplitude: 0.2, period: 0.8 }] },
    { shape: 'circle', y: -8, r: 3.6, color: 'red', material: 'volume' },
  ],
};
