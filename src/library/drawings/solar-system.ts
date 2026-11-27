// Solar system: a breathing Sun of light and four planets on tilted orbits, each with its own
// period, passing behind the Sun on the back half of the orbit.
import type { Layer, Drawing } from '../../engine/geometry/schema.ts';

const orbit = (rx: number): Layer => ({ shape: 'orbit', rx, ry: rx * 0.32, rot: -10, color: 'ink', lineWidth: 0.8, opacity: 0.5, depth: true });
const planet = (rx: number, r: number, color: string, period: number, phase: number): Layer => ({ shape: 'circle', r, color, material: 'volume', trail: { width: r * 0.9, opacity: 0.18 }, animate: [{ type: 'orbit', rx, ry: rx * 0.32, rot: -10, period, phase }] });

export const solarSystem: Drawing = {
  purpose: 'Sun and planets in orbit', grade: 'B', note: 'bigger planets; still small for a lead',
  layers: [
    orbit(19), orbit(28), orbit(38), orbit(47),
    { shape: 'circle', r: 24, color: '#FFB238', material: 'glow', opacity: 0.55, animate: [{ type: 'pulse', amplitude: 0.06, period: 3 }] },
    { shape: 'circle', r: 11, color: '#FFB238', material: 'shine' },
    planet(19, 2.8, '#B9B2A8', 2.6, 0.1), planet(28, 4.2, '#E8B85C', 4.2, 0.55), planet(38, 4.8, '#2B7BD6', 6.4, 0.3), planet(47, 4, '#D9643A', 9, 0.8),
  ],
};
