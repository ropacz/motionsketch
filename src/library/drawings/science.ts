// Science and nature: rocket, rain cloud, volcano, thermometer, brain, DNA and virus.
// Parametric shapes, `anchor`, `use`, `clip` and `repeat`; one living layer in each.
import type { Layer, Drawing } from '../../engine/geometry/schema.ts';

/** Ogive body (curve), nose and window; the flame (kit) flickers and the smoke spreads to the sides, behind. */
export const rocket: Drawing = {
  purpose: 'rocket taking off (flame and smoke)', grade: 'B', note: 'good body; simple flame and smoke',
  layers: [
    { shape: 'particles', y: 42, n: 10, radius: 30, flatten: 0.2, size: [4, 8], color: '#D5D9E0', material: 'volume', z: -2, animate: [{ type: 'rise', distance: -6, period: 1.8 }] },
    { shape: 'group', y: -4, animate: [{ type: 'float', amplitude: 1, period: 0.5 }], children: [
      { use: 'flame', y: 28, rot: 180, scale: 1.7, z: -1 },
      { shape: 'triangle', x: -15, y: 12, w: 13, h: 24, rot: -16, color: 'red', material: 'volume', z: -0.5 },
      { shape: 'triangle', x: 15, y: 12, w: 13, h: 24, rot: 16, color: 'red', material: 'volume', z: -0.5 },
      { id: 'body', shape: 'curve', points: [[0, -42], [9, -28], [14, -8], [13, 12], [8, 21], [-8, 21], [-13, 12], [-14, -8], [-9, -28]], color: '#F3F4F7', material: 'volume' },
      { shape: 'rectangle', y: -36, w: 40, h: 20, color: 'red', material: 'volume', clip: 'body' },
      { shape: 'rectangle', y: 19, w: 18, h: 5, radius: 1.5, material: 'metal' },
      { shape: 'circle', y: -8, r: 7, color: 'blue', material: 'glass', outline: '#8A909A', lineWidth: 2 },
    ] },
  ],
};

export const rainCloud: Drawing = {
  purpose: 'rain cloud with falling drops', grade: 'B', note: 'good cloud; drops too small',
  layers: [
    { shape: 'drop', x: -24, y: 12, r: 2.6, h: 8, color: 'blue', material: 'volume', repeat: { n: 5, step: { x: 12 }, phaseStep: 0.37 }, animate: [{ type: 'rise', distance: -30, period: 1.1 }] },
    { shape: 'drop', x: -18, y: 16, r: 2.2, h: 7, color: 'blue', material: 'volume', opacity: 0.8, repeat: { n: 4, step: { x: 12 }, phaseStep: 0.29 }, animate: [{ type: 'rise', distance: -28, period: 1.1, phase: 0.5 }] },
    { shape: 'group', animate: [{ type: 'float', amplitude: 1.5, period: 5 }], children: [
      { shape: 'cloud', y: -12, w: 80, h: 42, n: 8, seed: 3, color: '#8F9BB0', material: 'volume' },
      { shape: 'cloud', x: 5, y: -18, w: 58, h: 30, n: 6, seed: 7, color: '#B4BECD', material: 'volume' },
    ] },
  ],
};

export const volcano: Drawing = {
  purpose: 'volcano with lava and rising smoke', grade: 'B', note: 'flat mountain, good lava',
  layers: [
    { shape: 'particles', y: -16, n: 6, radius: 6, size: [5, 9], color: '#9AA0AA', material: 'volume', z: -1, animate: [{ type: 'rise', distance: 30, period: 3.5 }] },
    { shape: 'ellipse', y: 40, rx: 48, ry: 4, color: '#1F2430', opacity: 0.12 },
    { id: 'mountain', shape: 'trapezoid', y: 18, top: 20, bottom: 92, h: 44, color: '#8A5A3C', material: 'volume' },
    { shape: 'curve', y: -4, points: [[-11, -2], [11, -2], [12, 10], [17, 30], [9, 16], [4, 26], [0, 12], [-6, 34], [-9, 14], [-15, 24]], color: '#FFB02E', material: 'gradient', to: '#E5484D', clip: 'mountain', animate: [{ type: 'twinkle', period: 1.2 }] },
    { shape: 'ellipse', y: -4, rx: 11, ry: 3, color: '#FFD15C', material: 'shine' },
    { shape: 'particles', y: -8, n: 7, radius: 5, size: [1.4, 3], color: '#FF7A1C', material: 'volume', animate: [{ type: 'rise', distance: 18, period: 1.4 }] },
  ],
};

/** The mercury is a wide rectangle that rises and falls (float), clipped by the channel; it heats from blue to red. */
export const thermometer: Drawing = {
  purpose: 'thermometer with rising mercury (blue to red)', grade: 'B', note: 'glass with glare; simple scale and bulb',
  layers: [
    { shape: 'rectangle', x: 13, y: -34, w: 6, h: 1.4, color: 'ink', opacity: 0.45, repeat: { n: 6, step: { y: 11 } } },
    { shape: 'rectangle', y: -6, w: 17, h: 74, radius: 8.5, color: '#EEF3F8', material: 'volume', outline: '#B9BEC8', lineWidth: 1 },
    { shape: 'circle', y: 32, r: 13, color: '#EEF3F8', material: 'volume', outline: '#B9BEC8', lineWidth: 1 },
    { id: 'channel', shape: 'rectangle', y: -6, w: 7, h: 64, radius: 3.5, color: '#DDE3EA' },
    { shape: 'rectangle', y: 27, w: 70, h: 70, color: 'blue', clip: 'channel', animate: [{ type: 'float', amplitude: 28, period: 6, phase: 0.25 }, { type: 'color', to: 'red', at: 1.2, duration: 1.6 }] },
    { shape: 'circle', y: 32, r: 9, color: 'blue', material: 'volume', animate: [{ type: 'color', to: 'red', at: 1.2, duration: 1.6 }] },
  ],
};

/** Half of the brain seen from above (side −1 is the left one): a wavy lobe and sulci as `curve`. */
const hemisphere = (side: 1 | -1): Layer[] => {
  const m = (ps: [number, number][]) => ps.map(([x, y]): [number, number] => [x * side, y]);
  const sulcus = (ps: [number, number][]): Layer => ({ shape: 'curve', points: m(ps), closed: false, color: '#C95F80', lineWidth: 1.8, opacity: 0.85 });
  return [
    { shape: 'curve', points: m([[-1.5, -32], [-12, -35], [-25, -29], [-36, -18], [-41, -3], [-39, 12], [-31, 24], [-18, 31], [-6, 31], [-1.5, 26]]), color: '#F29CB4', material: 'volume' },
    sulcus([[-6, -26], [-15, -24], [-13, -16], [-24, -16]]),
    sulcus([[-33, -8], [-24, -5], [-28, 3], [-17, 5]]),
    sulcus([[-7, -10], [-12, -2], [-6, 5], [-10, 13]]),
    sulcus([[-33, 14], [-24, 17], [-18, 24], [-9, 23]]),
  ];
};

export const brain: Drawing = {
  purpose: 'brain with synapses lighting up', grade: 'B', note: 'two hemispheres with sulci; sulci too regular',
  layers: [
    { shape: 'group', animate: [{ type: 'pulse', amplitude: 0.015, period: 3 }], children: [...hemisphere(-1), ...hemisphere(1)] },
    { shape: 'particles', y: -2, n: 8, seed: 4, radius: 28, flatten: 0.65, size: [7, 10], color: '#3FA9F5', material: 'glow', animate: [{ type: 'ripple', period: 2.2 }] },
    { shape: 'particles', y: -2, n: 8, seed: 4, radius: 28, flatten: 0.65, size: [1.8, 2.4], color: '#FFFFFF', animate: [{ type: 'ripple', period: 2.2 }] },
  ],
};

/** Each rung: two balls on a flattened orbit (with depth) and the bar that shrinks with them (cos², twice the phase). */
export const dna: Drawing = {
  purpose: 'DNA (spinning double helix)', grade: 'B', note: 'good helix, tangles at some moments',
  layers: [
    { shape: 'group', rot: 24, children: [
      { shape: 'rectangle', y: -40, w: 16, h: 1.6, radius: 0.8, color: '#B9BEC8', repeat: { n: 11, step: { y: 8 }, phaseStep: 0.16 }, animate: [{ type: 'pulse', amplitude: 1, period: 2, phase: 0.25 }] },
      { shape: 'circle', y: -40, r: 3.6, color: 'blue', material: 'volume', repeat: { n: 11, step: { y: 8 }, phaseStep: 0.08 }, animate: [{ type: 'orbit', rx: 16, ry: 2, period: 4 }] },
      { shape: 'circle', y: -40, r: 3.6, color: 'red', material: 'volume', repeat: { n: 11, step: { y: 8 }, phaseStep: 0.08 }, animate: [{ type: 'orbit', rx: 16, ry: 2, period: 4, phase: 0.5 }] },
    ] },
  ],
};

/** The spikes pulse in a wave (phaseStep on each one's group) and spin slowly; the sphere spins inside. */
export const virus: Drawing = {
  purpose: 'floating virus with spikes', grade: 'A', note: 'sphere and pulsing spikes',
  layers: [
    { shape: 'group', animate: [{ type: 'float', amplitude: 3, period: 4 }], children: [
      { shape: 'group', animate: [{ type: 'spin', speed: 10 }], children: [
        { shape: 'group', repeat: { n: 12, step: { rot: 30 }, phaseStep: 1 / 12 }, animate: [{ type: 'pulse', amplitude: 0.06, period: 2 }], children: [
          { shape: 'rectangle', y: -33, w: 2.8, h: 12, radius: 1, color: '#3F9E6E' },
          { shape: 'circle', y: -40, r: 4.2, color: 'red', material: 'volume' },
        ] },
      ] },
      { shape: 'sphere', r: 29, color: 'green', spin: 18, spots: [{ n: 9, seed: 3, size: [4, 8], color: '#2E8B57' }] },
    ] },
  ],
};
