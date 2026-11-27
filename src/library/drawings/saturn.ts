// Saturn: a sphere with wavy bands (the spin shows) and rings with depth (the back half
// passes behind the planet), in a warm glow.
import type { Layer, Drawing } from '../../engine/geometry/schema.ts';

const ring = (rx: number, lineWidth: number, color: string, opacity: number): Layer => ({ shape: 'orbit', rx, ry: rx * 0.3, rot: -18, color, lineWidth, opacity, depth: true });

export const saturn: Drawing = {
  purpose: 'Saturn with bands and rings that pass behind', grade: 'A', note: 'bands and rings with depth',
  layers: [
    { shape: 'circle', r: 46, color: '#F4C04E', material: 'glow', opacity: 0.22, z: -1 },
    ring(47, 2, '#C9A46A', 0.7), ring(41, 7, '#E8D3A2', 0.95), ring(33.5, 3, '#B8925C', 0.8),
    {
      shape: 'sphere', r: 24, color: '#E3C27E', tilt: 17, axis: -18, spin: 14,
      bands: [
        { lat: 52, width: 12, color: '#C99A5B', wave: 2 }, { lat: 28, width: 8, color: '#F2DEAD', wave: 1.5 }, { lat: 8, width: 12, color: '#B98552', wave: 2.5 },
        { lat: -14, width: 8, color: '#EFD7A0', wave: 1.5 }, { lat: -34, width: 12, color: '#C79458', wave: 2 },
      ],
    },
  ],
};
