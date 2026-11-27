// Characters on rigs, one per drawing: the rig gives body and movement; the drawing gives colors, proportions and the
// parts hung on its bones (hair, face, collar, spots).
import type { Drawing, Layer } from '../../engine/geometry/schema.ts';
import { groundSpeed } from '../../engine/geometry/skeleton.ts';

const DASH_GAP = 22;
/** Dashes on the ground going back at the speed of the walker's feet (its `scale` included), so they do not slide. */
export const road = (walker: Layer, y: number): Layer => ({
  shape: 'group', y, animate: [{ type: 'follow', points: [[0, 0], [-DASH_GAP, 0]], period: DASH_GAP / (groundSpeed(walker) * (walker.scale ?? 1)), ease: 'linear' }],
  children: [{ shape: 'rectangle', x: -44, w: 9, h: 1.6, radius: 0.8, color: '#9AA3B5', opacity: 0.7, repeat: { n: 5, step: { x: DASH_GAP } } }],
});

/** Eyes and hair of a person: hang them on a biped. */
export const face = (hair: string): Layer[] => [
  { bone: 'head', shape: 'curve', points: [[-10.5, 2], [-11, -6], [-4, -12], [6, -11], [10.5, -5], [3, -6], [-4, -3], [-6, 4]], color: hair, material: 'volume' },
  { bone: 'head', shape: 'circle', x: 5, y: -0.5, r: 1.5, color: '#1F2430', animate: [{ type: 'blink', period: 3.4 }] },
  { bone: 'head', shape: 'arc', x: 4.5, y: 3.5, r: 3, from: 120, until: 215, color: '#8A3B2E', lineWidth: 1 },
];

const person: Layer = { rig: 'biped', cycle: 'walk', y: 38, children: face('#5A3A24') };

export const walker: Drawing = {
  purpose: 'person walking', grade: 'B', note: 'convincing walk, feet do not slide; stick-like limbs and a profile with no nose',
  layers: [road(person, 40), person],
};

/** Collar and a spot on the back of a four-legged animal. */
export const dogParts: Layer[] = [
  { bone: 'neck', shape: 'rectangle', x: -1.6, y: 2.4, w: 3.4, h: 12, radius: 1.7, rot: 40, color: '#E5484D', material: 'volume' },
  { bone: 'neck', shape: 'circle', x: 2.6, y: 8, r: 1.9, color: '#F4C04E', material: 'volume' },
  { bone: 'back', shape: 'ellipse', x: -6, y: 5, rx: 8, ry: 4.5, color: '#7A4E2D', opacity: 0.9 },
  { bone: 'head', shape: 'circle', x: 3, y: -2.5, r: 1.7, color: '#1F2430', animate: [{ type: 'blink', period: 3 }] },
];

const puppy: Layer = { rig: 'quadruped', cycle: 'walk', y: 30, scale: 1.1, x: -4, children: dogParts };

export const dog: Drawing = {
  purpose: 'dog walking (tail wagging)', grade: 'B', note: 'four-beat walk that reads as a dog; sausage legs, paws without toes',
  layers: [road(puppy, 31), puppy],
};

export const cat: Drawing = {
  purpose: 'cat standing, swinging its tail', grade: 'B', note: 'same rig as the dog with other proportions; simple face',
  groundShadow: true,
  layers: [
    { rig: 'quadruped', y: 26, x: -2, scale: 1.15, color: '#7C8598', cycle: 'idle', period: 2.2,
      build: { leg: 17, length: 30, body: 19, neck: 11, head: 11, snout: 4, ear: 1, tail: 28, limb: 5, belly: '#EEF0F5', dark: '#5B6376', nose: '#E58A9A' }, children: [
      { bone: 'head', shape: 'triangle', x: -6, y: -11, w: 8, h: 10, rot: -18, color: '#7C8598', material: 'volume' },
      { bone: 'head', shape: 'triangle', x: 4, y: -12, w: 8, h: 10, rot: 12, color: '#7C8598', material: 'volume' },
      { bone: 'head', shape: 'ellipse', x: 3, y: -2, rx: 1.4, ry: 2.2, color: '#1F2430', animate: [{ type: 'blink', period: 2.8 }] },
      { bone: 'head', shape: 'rectangle', x: 13, y: 3, w: 11, h: 0.6, rot: -8, color: '#5B6376', repeat: { n: 2, step: { y: 3, rot: 8 } } },
    ] },
  ],
};

export const bird: Drawing = {
  purpose: 'little bird flying (wings flapping)', grade: 'B', note: 'full wing stroke on the rig; simple tail',
  layers: [{ rig: 'bird' }],
};

export const fish: Drawing = {
  purpose: 'fish swimming with bubbles', grade: 'B', note: 'the body waves down to the tail; flat stripes',
  layers: [
    { rig: 'fish', x: -2, animate: [{ type: 'float', amplitude: 2, period: 3 }] },
    { shape: 'particles', x: 36, y: -14, n: 5, radius: 3, size: [1.4, 2.8], color: '#7FB8F0', material: 'glass', animate: [{ type: 'rise', distance: 30, period: 3 }] },
  ],
};
