// Mars: a spinning rust-red sphere, with dark seas, the equatorial canyon, craters with light rims,
// a small polar cap, drifting dust and a thin orange atmosphere.
import type { Drawing, Spot } from '../../engine/geometry/schema.ts';

const DARK = '#7E2F16';
const sea = (points: [number, number][]): Spot => ({ points, color: DARK, opacity: 0.78 });
// crater: a light rim slightly toward the light and the dark floor
const crater = (lon: number, lat: number, r: number): Spot[] => [
  { lon: lon - r * 0.25, lat: lat + r * 0.25, r, irregular: 0.08, color: '#F2A878', opacity: 0.7 },
  { lon, lat, r: r * 0.78, irregular: 0.08, color: DARK, opacity: 0.75 },
];

export const mars: Drawing = {
  purpose: 'spinning Mars, with craters, polar cap and thin atmosphere', grade: 'A', note: 'seas, canyon, rimmed craters and cap',
  layers: [
    {
      shape: 'sphere', r: 40, color: '#C4532C', tilt: 24, axis: -12, spin: 8, atmosphere: '#FFAE70',
      bands: [{ lat: 84, width: 12, color: '#FFF6EE', wave: 3 }, { lat: -88, width: 5, color: '#FFF6EE', opacity: 0.85 }],
      spots: [
        { n: 7, seed: 9, size: [10, 18], irregular: 0.5, stretch: 1.6, color: '#E07A4A', opacity: 0.45 },
        sea([[60, 22], [78, 30], [86, 12], [80, -10], [70, -18], [64, 0]]),
        sea([[-40, -18], [10, -12], [40, -22], [20, -32], [-30, -30]]),
        sea([[140, 40], [175, 34], [170, 18], [138, 24]]),
        { lon: -70, lat: -8, r: 5, stretch: 6, irregular: 0.25, color: DARK, opacity: 0.7 },
        ...crater(-120, 20, 8), ...crater(20, 30, 6), ...crater(110, -30, 7), ...crater(-10, -50, 5), ...crater(-160, -20, 5),
        { n: 4, seed: 21, size: [8, 14], stretch: 2.4, irregular: 0.5, color: '#F6C8A2', opacity: 0.28, drift: 2.5 },
      ],
    },
  ],
};
