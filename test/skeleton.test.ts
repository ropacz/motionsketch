// The skeleton math: inverse kinematics, cycles, the rigs and the errors of figure data.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { layerBox } from '../src/engine/geometry/layout.ts';
import { drawingErrors } from '../src/engine/geometry/validate.ts';
import { solveLimb } from '../src/engine/geometry/ik.ts';
import { RIG_LIBRARY } from '../src/engine/geometry/rigs.ts';
import { MARKS, RIGS, type Layer } from '../src/engine/geometry/schema.ts';
import { expandFigure, figureOf, groundSpeed, poseOf, sampleCycle } from '../src/engine/geometry/skeleton.ts';

const near = (a: number, b: number, tolerance = 1e-6) => assert.ok(Math.abs(a - b) <= tolerance, `${a} is not ${b}`);
const length = (a: [number, number], b: [number, number]) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const instants = Array.from({ length: 200 }, (_, i) => i / 200);

test('a limb reaches its target with bones that never stretch', () => {
  for (const target of [[3, 12], [-8, 8], [10, -2], [0.5, 0.5], [0, 0]] as [number, number][]) {
    for (const bend of [1, -1] as const) {
      const { joint, end } = solveLimb([0, 0], target, 10, 8, bend);
      near(length([0, 0], joint), 10, 1e-4);
      near(length(joint, end), 8, 1e-4);
      if (length([0, 0], target) >= 2) (near(end[0], target[0]), near(end[1], target[1]));
    }
  }
});

test('out of reach the limb goes straight at the target; bend chooses the side of the joint', () => {
  const far = solveLimb([0, 0], [0, 100], 10, 10, 1);
  (near(far.end[1], 20), near(far.joint[0], 0, 1e-4));
  assert.ok(solveLimb([0, 0], [0, 15], 10, 10, 1).joint[0] > 0);
  assert.ok(solveLimb([0, 0], [0, 15], 10, 10, -1).joint[0] < 0);
});

test('a cycle passes through its poses, loops without a seam and fills what a key leaves out', () => {
  const rest = { bob: 0, foot: [0, 0] as [number, number] };
  const keys = [{ at: 0, bob: 1 }, { at: 0.5, foot: [4, -2] as [number, number] }];
  assert.deepEqual(sampleCycle(keys, rest, 0), { bob: 1, foot: [0, 0] });
  assert.deepEqual(sampleCycle(keys, rest, 0.5), { bob: 0, foot: [4, -2] });
  assert.deepEqual(sampleCycle(keys, rest, 3.5), sampleCycle(keys, rest, 0.5));
  near(sampleCycle(keys, rest, 0.999999).bob as number, 1, 1e-3);
  near(sampleCycle([{ at: 0, bob: 0 }, { at: 0.5, bob: 10, ease: 'linear' }], rest, 0.25).bob as number, 5);
  assert.deepEqual(sampleCycle([{ at: 0.3, bob: 2 }], rest, 0.9), { bob: 2, foot: [0, 0] });
});

test('every cycle of every rig draws finite figures, loops, and its pose only has the rig fields', () => {
  for (const name of RIGS) {
    const rig = RIG_LIBRARY[name];
    for (const [cycle, { period, poses }] of Object.entries(rig.cycles)) {
      const layer: Layer = { rig: name, cycle };
      assert.deepEqual(drawingErrors({ layers: [{ ...layer, poses }] }), [], `${name} ${cycle}`);
      assert.doesNotMatch(JSON.stringify(instants.map((p) => figureOf(layer, p * period))), /null|NaN|Infinity/, `${name} ${cycle}`);
      const [start, end] = [figureOf(layer, 0).bones, figureOf(layer, period * (1 - 1e-6)).bones];
      for (const [bone, at] of Object.entries(start)) (near(end[bone].x, at.x, 0.05), near(end[bone].y, at.y, 0.05));
    }
    // the marks a figure sets for the renderer are not part of the data format
    const drawn = JSON.parse(JSON.stringify(expandFigure({ rig: name }, 0).children, (key, value) => (MARKS.includes(key) ? undefined : value)));
    assert.deepEqual(drawingErrors({ layers: drawn }), [], `${name}: the layers it draws`);
    assert.ok(layerBox({ rig: name }), `${name} has a box`);
  }
});

test('in every gait each planted foot is within reach: knees solve it and it touches the ground', () => {
  const feet = { biped: ['footNear', 'footFar'], quadruped: ['frontNear', 'frontFar', 'backNear', 'backFar'] } as const;
  for (const [name, names] of Object.entries(feet) as ['biped' | 'quadruped', readonly string[]][]) {
    for (const [cycle, { period }] of Object.entries(RIG_LIBRARY[name].cycles)) {
      const leg = RIG_LIBRARY[name].build.leg as number;
      for (const foot of names) {
        // where the hip is: the foot's place minus what the pose asks, the same at every planted instant
        const roots: number[] = [];
        for (const p of instants) {
          const layer: Layer = { rig: name, cycle };
          const [x, y] = poseOf(layer, p * period)[foot] as [number, number];
          if (y < -1e-3) continue;
          const { bones } = figureOf(layer, p * period);
          near(bones[foot].y, 0, 0.5);
          roots.push(bones[foot].x - x * leg);
        }
        assert.ok(roots.length > instants.length / 3, `${name} ${cycle} ${foot} is hardly ever on the ground`);
        assert.ok(Math.max(...roots) - Math.min(...roots) < 0.8, `${name} ${cycle} ${foot} misses its target`);
      }
    }
  }
});

test('the planted foot goes back at a steady ground speed, so it does not slide', () => {
  const walk = groundSpeed({ rig: 'biped', cycle: 'walk' });
  const leg = RIG_LIBRARY.biped.build.leg as number;
  assert.ok(walk > 0);
  near(groundSpeed({ rig: 'biped', cycle: 'walk', period: 2 }), (walk * RIG_LIBRARY.biped.cycles.walk.period) / 2);
  near(groundSpeed({ rig: 'biped', cycle: 'walk', build: { leg: 2 * leg } }), 2 * walk);
  assert.throws(() => groundSpeed({ rig: 'biped' }), /"idle" is not a gait/);
  for (const [rig, cycle, foot] of [['biped', 'walk', 'footNear'], ['biped', 'run', 'footNear'], ['quadruped', 'walk', 'backNear'], ['quadruped', 'run', 'backNear']] as const) {
    const layer: Layer = { rig, cycle };
    const [speed, period, leg] = [groundSpeed(layer), RIG_LIBRARY[rig].cycles[cycle].period, RIG_LIBRARY[rig].build.leg as number];
    const x = (p: number) => (poseOf(layer, p * period)[foot] as [number, number])[0] * leg;
    for (let p = 0.01; p < 0.48; p += 0.013) near((x(p) - x(p + 0.01)) / (0.01 * period), speed, 1e-6);
  }
});

test('a fixed pose holds a field while the cycle goes on; build and color change the figure', () => {
  const held: Layer = { rig: 'biped', cycle: 'walk', pose: { handNear: [0.6, 0.4] } };
  assert.deepEqual([poseOf(held, 0.1).handNear, poseOf(held, 0.6).handNear], [[0.6, 0.4], [0.6, 0.4]]);
  assert.notDeepEqual(poseOf(held, 0.1).footNear, poseOf(held, 0.6).footNear);
  const colors = figureOf({ rig: 'biped', color: '#123456', build: { skin: '#654321' } }, 0).layers.map((l) => l.color);
  assert.ok(colors.includes('#123456') && colors.includes('#654321'));
});

/** Where the layer with this id ends up inside a group, adding up the offsets and turns of the groups around it. */
function placeOf(layers: Layer[], id: string, at = { x: 0, y: 0, rot: 0 }): { x: number; y: number; rot: number } | undefined {
  for (const l of layers) {
    const turn = (at.rot * Math.PI) / 180;
    const [x, y] = [l.x ?? 0, l.y ?? 0];
    const here = { x: at.x + x * Math.cos(turn) - y * Math.sin(turn), y: at.y + x * Math.sin(turn) + y * Math.cos(turn), rot: at.rot + (l.rot ?? 0) };
    if (l.id === id) return here;
    const found = placeOf(l.children ?? [], id, here);
    if (found) return found;
  }
}

test('children hang on bones and move with them; the others stay in figure space', () => {
  for (const tc of [0.1, 0.3, 0.8]) {
    const group = expandFigure({ rig: 'biped', cycle: 'walk', children: [{ id: 'hat', shape: 'circle', bone: 'head', x: 2 }, { id: 'sign', shape: 'circle', x: 7 }] }, tc);
    const head = figureOf({ rig: 'biped', cycle: 'walk' }, tc).bones.head;
    const [hat, sign] = [placeOf(group.children!, 'hat')!, placeOf(group.children!, 'sign')!];
    const turn = (head.angle * Math.PI) / 180;
    (near(hat.x, head.x + 2 * Math.cos(turn)), near(hat.y, head.y + 2 * Math.sin(turn)), near(hat.rot, head.angle));
    (near(sign.x, 7), near(sign.y, 0));
  }
});

test('a mirrored figure has a mirrored box', () => {
  const box = layerBox({ rig: 'quadruped' })!;
  const mirrored = layerBox({ rig: 'quadruped', flip: true })!;
  (near(mirrored.x0, -box.x1), near(mirrored.x1, -box.x0));
});

test('errors of figure data come with a suggestion', () => {
  const errors = drawingErrors({
    layers: [
      { rig: 'bipde' as never },
      { rig: 'biped', cycle: 'wakl', pose: { handNea: [0, 1] }, build: { lge: 3 }, children: [{ shape: 'circle', bone: 'hed' }] },
      { rig: 'bird', pose: { wing: [0, 1] }, poses: [{ wing: 3 } as never] },
      { shape: 'circle', cycle: 'walk' },
      { id: 'a', rig: 'fish' },
      { shape: 'circle', clip: 'a' },
    ],
  }).join('\n');
  for (const expected of [/"biped"/, /no cycle "wakl" \(did you mean "walk"/, /"handNear"/, /"leg"/, /no bone "hed" \(did you mean "head"/, /"wing" needs a number/, /needs "at"/, /only works on a layer with "rig"/, /which is a figure/]) assert.match(errors, expected);
});
