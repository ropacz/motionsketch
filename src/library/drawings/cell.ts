// Cell: translucent cytoplasm, a wavy membrane (two irregular edges spinning in opposite directions
// and pulsing), a nucleus with a nucleolus, swaying mitochondria and floating organelles and ribosomes.
import type { Layer, Drawing } from '../../engine/geometry/schema.ts';

const BLOB = 'M0-46C25-46 47-26 45 2C43 28 24 45-2 44C-28 43-46 24-45-2C-44-28-25-46 0-46Z';
const membrane = (spin: number, phase: number, opacity: number): Layer => ({ shape: 'path', d: BLOB, material: 'stroke', color: '#2F9E6B', lineWidth: 2.6, opacity, animate: [{ type: 'spin', speed: spin }, { type: 'pulse', amplitude: 0.025, period: 3, phase }] });
const mito = (x: number, y: number, rot: number, phase: number): Layer => ({ shape: 'ellipse', x, y, rot, rx: 7, ry: 3.4, color: '#F08A4B', material: 'volume', animate: [{ type: 'sway', amplitude: 14, period: 4, phase }] });

export const cell: Drawing = {
  purpose: 'living cell with nucleus and organelles', grade: 'B', note: 'membrane with volume and glass with glare; organelles small for a lead',
  layers: [
    { shape: 'path', d: BLOB, color: '#9EE0BE', material: 'glass', lineWidth: 0, animate: [{ type: 'spin', speed: 5 }, { type: 'pulse', amplitude: 0.025, period: 3 }] },
    membrane(5, 0, 1), membrane(-4, 0.4, 0.5),
    { shape: 'particles', n: 46, radius: 36, size: [0.5, 0.9], color: '#2E7D5B', animate: [{ type: 'twinkle', period: 1.5 }] },
    { shape: 'particles', n: 9, seed: 5, radius: 30, distribution: 'ring', thickness: 14, size: [2, 3.2], colors: ['#F4C04E', '#E5484D', '#7FB8F0'], material: 'volume', animate: [{ type: 'float', amplitude: 2.5, period: 5 }] },
    mito(20, 18, 30, 0), mito(-24, 16, -40, 0.5), mito(22, -20, -20, 0.25),
    { shape: 'circle', x: -5, y: -4, r: 15, color: '#7B5BD6', material: 'volume', animate: [{ type: 'pulse', amplitude: 0.03, period: 2.4 }] },
    { shape: 'circle', x: -1, y: -1, r: 5, color: '#4B2F9E', material: 'volume' },
  ],
};
