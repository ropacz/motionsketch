// The handmade drawings (React components), by name, with their purpose and quality.
import type { Entry } from '../entry.ts';
import { BlackHole } from './black-hole.tsx';
import { Sun } from './sun.tsx';
import { Earth } from './earth.tsx';

export const HANDMADE: Record<string, Entry> = {
  'black-hole': { purpose: 'spinning disc (option: tilt)', grade: 'A', note: 'glowing disc, lensing and rotation', Draw: BlackHole },
  sun: { purpose: 'sunspots and plasma', grade: 'A', note: 'plasma, sunspots, prominences', Draw: Sun },
  earth: { purpose: 'spinning planet (options: night, nightAt, ice, iceAt)', grade: 'A', note: 'continents, clouds, atmosphere, night', Draw: Earth },
};
