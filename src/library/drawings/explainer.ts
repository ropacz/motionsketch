// Explainer pieces that move: stagger and eases (checklist), following a path (paper plane), morph (play button) and
// a sequence of events (map pin).
import type { Drawing } from '../../engine/geometry/schema.ts';

export const checklist: Drawing = {
  purpose: 'checklist ticking item by item', grade: 'B', note: 'clear order; plain card',
  groundShadow: true,
  layers: [
    { shape: 'rectangle', w: 76, h: 78, radius: 9, color: '#FBFAF6', material: 'gradient', to: '#E4DFD2', outline: '#CFC8B8' },
    { shape: 'group', y: -22, repeat: { n: 3, step: { y: 22 } }, stagger: 0.3, children: [
      { shape: 'rectangle', x: -21, w: 14, h: 14, radius: 3.5, color: 'green', material: 'volume', animate: [{ type: 'enter', delay: 0.15, ease: 'back.out' }] },
      { shape: 'curve', closed: false, points: [[-25, 0], [-22, 3.5], [-16.5, -3.5]], color: '#FFFFFF', lineWidth: 2.6, animate: [{ type: 'draw', delay: 0.45, duration: 0.3, ease: 'power2.out' }] },
      { shape: 'rectangle', x: 10, w: 36, h: 5, radius: 2.5, color: '#9AA3B5', animate: [{ type: 'enter', delay: 0.25, ease: 'expo.out' }] },
    ] },
  ],
};

const flight: [number, number][] = [[-32, 6], [-14, -24], [20, -20], [33, 4], [10, 22], [-18, 26]];

export const paperPlane: Drawing = {
  purpose: 'message on its way (paper plane flying a loop)', grade: 'B', note: 'follows the route and turns with it; flat sky',
  layers: [
    { shape: 'cloud', x: -20, y: 6, w: 30, h: 16, color: '#DCE6F5', animate: [{ type: 'float', amplitude: 2, period: 6 }] },
    { shape: 'cloud', x: 18, y: -2, w: 22, h: 12, color: '#DCE6F5', animate: [{ type: 'float', amplitude: 2, period: 5, phase: 0.4 }] },
    { shape: 'curve', points: flight, material: 'stroke', color: 'muted', lineWidth: 0.8, opacity: 0.4 },
    { shape: 'group', animate: [{ type: 'follow', points: flight, closed: true, period: 5, orient: true }], children: [
      { shape: 'polygon', points: [[14, 0], [-11, -10], [-5, 0]], color: 'blue', material: 'volume' },
      { shape: 'polygon', points: [[14, 0], [-5, 0], [-11, 8]], color: '#2A5FA8', material: 'volume' },
    ] },
  ],
};

export const playButton: Drawing = {
  purpose: 'play button turning into stop', grade: 'B', note: 'clean morph; simple object',
  groundShadow: true,
  layers: [
    { shape: 'circle', r: 48, color: 'blue', material: 'stroke', lineWidth: 1.4, repeat: { n: 2, phaseStep: 0.5 }, animate: [{ type: 'ripple', period: 3, ease: 'sine.out' }], z: -1 },
    { id: 'button', shape: 'circle', r: 34, color: 'blue', material: 'volume' },
    { shape: 'triangle', x: 3, rot: 90, w: 32, h: 28, color: '#FFFFFF', animate: [{ type: 'morph', into: { shape: 'rectangle', w: 25, h: 25, radius: 3 }, period: 3, ease: 'back.inOut' }] },
  ],
};

export const mapPin: Drawing = {
  purpose: 'a place marked on the map (the pin drops and lands)', grade: 'B', note: 'the sequence reads well; schematic map',
  layers: [
    { id: 'map', shape: 'rectangle', y: 18, w: 80, h: 44, radius: 8, color: '#BFE3B4', material: 'gradient', to: '#8CCB8A' },
    { shape: 'curve', closed: false, points: [[-38, 28], [-14, 16], [6, 30], [38, 10]], color: '#FFFFFF', lineWidth: 4, clip: 'map' },
    { shape: 'ellipse', y: 19, rx: 18, ry: 6, color: 'red', material: 'stroke', lineWidth: 1.8, repeat: { n: 2, phaseStep: 0.5 }, animate: [{ type: 'ripple', period: 2 }, { type: 'enter', delay: 1.1 }] },
    { shape: 'group', y: -46, sequence: [{ at: 0.2, do: 'enter' }, { at: 0.45, do: 'move', to: [0, 1], duration: 0.7, ease: 'bounce.out' }, { at: 1.5, do: 'pop', amplitude: 0.14 }], children: [
      { shape: 'drop', rot: 180, r: 14, h: 32, color: 'red', material: 'volume' },
      { shape: 'circle', r: 5.5, color: '#FFFFFF' },
    ] },
  ],
};
