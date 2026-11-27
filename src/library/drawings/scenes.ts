// Scenes: drawings with more than one figure. Each figure keeps its own cycle, phase and side; other library drawings
// come in as a group with their layers.
import type { Drawing, Layer, Step } from '../../engine/geometry/schema.ts';
import { figureOf } from '../../engine/geometry/skeleton.ts';
import { dogParts, face, road } from './characters.ts';
import { house } from './objects.ts';

// the walk with a leash: the hand is held still on the arm cycle, and the leash goes from it to the dog's collar
const owner: Layer = { rig: 'biped', cycle: 'walk', x: -23, y: 34, scale: 0.78, pose: { handNear: [0.62, 0.5] }, children: face('#2F2018') };
const pet: Layer = { rig: 'quadruped', cycle: 'walk', x: 23, y: 34, scale: 0.72, period: 0.62, children: dogParts };
const hand = figureOf(owner, 0).bones.handNear;
const collar = figureOf(pet, 0).bones.neck;
const reach = [(pet.x! + collar.x * pet.scale! - owner.x!) / owner.scale!, (pet.y! + collar.y * pet.scale! - owner.y!) / owner.scale!];
const leash: Layer = { shape: 'curve', closed: false, points: [[hand.x, hand.y], [(hand.x + reach[0]) / 2, (hand.y + reach[1]) / 2 + 7], [reach[0], reach[1]]], color: '#8A5A3C', lineWidth: 1.2 };

export const dogWalk: Drawing = {
  purpose: 'person walking a dog', grade: 'B', note: 'two figures walking at their own pace; the leash follows the hand, not the collar bounce',
  layers: [
    { shape: 'cloud', x: -24, y: -34, w: 26, h: 13, color: '#DCE6F5', animate: [{ type: 'float', amplitude: 3, period: 8 }] },
    { shape: 'cloud', x: 24, y: -24, w: 18, h: 10, color: '#DCE6F5', animate: [{ type: 'float', amplitude: 2, period: 6, phase: 0.5 }] },
    road(owner, 36),
    { ...owner, children: [...owner.children!, leash] },
    pet,
  ],
};

/** A speech bubble that shows during each [from, until] window. */
const bubble = (x: number, color: string, windows: [number, number][], tail: number): Layer => ({
  shape: 'group', x, y: -34, sequence: windows.flatMap(([from, until]): Step[] => [{ at: from, do: 'enter' }, { at: until, do: 'exit' }]),
  children: [
    { shape: 'rectangle', w: 34, h: 20, radius: 9, color, material: 'volume' },
    { shape: 'triangle', x: tail, y: 11, w: 8, h: 7, rot: 180, color },
    { shape: 'circle', x: -8, r: 2.2, color: '#FFFFFF', repeat: { n: 3, step: { x: 8 }, phaseStep: -0.18 }, animate: [{ type: 'twinkle', period: 0.9 }] },
  ],
});

export const conversation: Drawing = {
  purpose: 'two people talking, taking turns', grade: 'B', note: 'turns read well; faces without expression',
  groundShadow: true,
  layers: [
    { rig: 'biped', x: -25, y: 40, scale: 0.8, cycle: 'talk', children: face('#5A3A24') },
    { rig: 'biped', x: 25, y: 40, scale: 0.8, flip: true, cycle: 'talk', phase: 0.5, color: '#2E9E5B', build: { skin: '#C98A63', legs: '#4A3B52' }, children: face('#1F1712') },
    bubble(-21, '#3D6BE0', [[0.3, 2.4], [4.6, 6.8]], -8),
    bubble(21, '#2E9E5B', [[2.5, 4.5], [6.9, 9.2]], 8),
  ],
};

export const frontYard: Drawing = {
  purpose: 'waving at home: person, dog and bird', grade: 'B', note: 'three figures and a reused drawing read at once; small at icon size',
  layers: [
    { shape: 'rectangle', y: 40, w: 100, h: 8, radius: 4, color: '#8CCB8A', material: 'gradient', to: '#6BB06E' },
    { shape: 'group', x: -20, y: 10, scale: 0.78, children: house.layers },
    { rig: 'biped', x: 13, y: 38, scale: 0.62, flip: true, cycle: 'wave', color: '#E5484D', children: face('#8A5A3C') },
    { rig: 'quadruped', x: 35, y: 38, scale: 0.46, flip: true, cycle: 'idle', children: dogParts },
    { shape: 'group', animate: [{ type: 'follow', points: [[-18, -34], [14, -40], [36, -24], [4, -20]], closed: true, period: 6 }], children: [
      { rig: 'bird', scale: 0.28 },
    ] },
  ],
};

export const schoolOfFish: Drawing = {
  purpose: 'a school of fish swimming together', grade: 'B', note: 'one rig, three sizes and phases; same silhouette repeated',
  layers: [
    { rig: 'fish', x: 12, y: -2, scale: 0.8, animate: [{ type: 'float', amplitude: 2, period: 3.2 }] },
    { rig: 'fish', x: -22, y: -26, scale: 0.46, phase: 0.35, period: 0.82, color: '#4C9BE8', build: { fins: '#9AD0FF', stripes: 0 }, animate: [{ type: 'float', amplitude: 3, period: 2.6, phase: 0.3 }] },
    { rig: 'fish', x: -18, y: 24, scale: 0.54, phase: 0.7, period: 0.9, color: '#F4C04E', build: { fins: '#F08A4B', stripes: 3, stripe: '#2F3B52' }, animate: [{ type: 'float', amplitude: 3, period: 2.9, phase: 0.65 }] },
    { shape: 'particles', x: 34, y: 20, n: 6, radius: 5, size: [1.2, 2.6], color: '#7FB8F0', material: 'glass', animate: [{ type: 'rise', distance: 50, period: 3.5 }] },
  ],
};
