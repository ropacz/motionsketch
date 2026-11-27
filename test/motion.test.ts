// The math of motion: eases, cycles, stagger, sequences, paths and morph; and the errors of the new data.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { expandRepeats } from '../src/engine/geometry/layout.ts';
import { drawingErrors } from '../src/engine/geometry/validate.ts';
import { catmullRom, matchOutlines, measureLine, morphLayer, outline } from '../src/engine/geometry/outline.ts';
import { EASES, type Layer, type Step } from '../src/engine/geometry/schema.ts';
import { easedTurns, easing, leave, oscillate, playSequence, pop, staggerDelays } from '../src/engine/motion.ts';

const near = (a: number, b: number, tolerance = 1e-6) => assert.ok(Math.abs(a - b) <= tolerance, `${a} is not ${b}`);
const nearAll = (a: number[], b: number[], tolerance?: number) => {
  assert.equal(a.length, b.length);
  a.forEach((v, i) => near(v, b[i], tolerance));
};

test('every named ease starts at 0, ends at 1 and clamps outside', () => {
  for (const name of EASES) {
    const f = easing(name);
    assert.deepEqual([f(-1), f(0), f(1), f(2)], [0, 0, 1, 1], name);
  }
});

test('in, out and inOut are mirrors; back overshoots; steps jumps', () => {
  for (const family of ['power2', 'sine', 'expo', 'circ', 'back', 'elastic', 'bounce']) {
    for (const p of [0.2, 0.5, 0.8]) near(easing(`${family}.out`)(p), 1 - easing(`${family}.in`)(1 - p));
    near(easing(`${family}.inOut`)(0.5), 0.5);
  }
  near(easing('power1.in')(0.5), 0.25);
  near(easing('back')(0.5), easing('back.out')(0.5));
  assert.ok(Math.max(...[0.5, 0.6, 0.7, 0.8].map(easing('back.out'))) > 1.05);
  assert.deepEqual([0.1, 0.3, 0.55].map(easing('steps(4)')), [0, 0.25, 0.5]);
  assert.throws(() => easing('swoosh'), /unknown ease/);
});

test('an eased cycle keeps the sine period; sine.inOut gives the sine back', () => {
  for (const t of [0, 0.3, 0.5, 1.1, 1.7]) near(oscillate(t, 2, 0.1, 'sine.inOut'), oscillate(t, 2, 0.1));
  near(oscillate(0.25, 1, 0, 'linear'), 1);
  near(oscillate(0.125, 1, 0, 'linear'), 0.5);
  near(easedTurns(2.5, 'power1.in'), 2.25);
  near(easedTurns(-0.5, 'linear'), -0.5);
});

test('stagger counts from the start, the center or the edges, and the first copy has no delay', () => {
  nearAll(staggerDelays(4, 0.1), [0, 0.1, 0.2, 0.3]);
  nearAll(staggerDelays(5, { each: 0.1, from: 'center' }), [0.2, 0.1, 0, 0.1, 0.2]);
  nearAll(staggerDelays(4, { each: 0.1, from: 'center' }), [0.1, 0, 0, 0.1]);
  nearAll(staggerDelays(5, { each: 0.1, from: 'edges' }), [0, 0.1, 0.2, 0.1, 0]);
  nearAll(staggerDelays(3, { each: 0.1, ease: 'power1.in' }), [0, 0.05, 0.2]);
  assert.deepEqual(staggerDelays(1, 0.1), [0]);
});

test('repeat with stagger delays each copy; without it nothing changes', () => {
  const copies = expandRepeats([{ shape: 'circle', repeat: { n: 3 }, stagger: 0.2 }]);
  nearAll(copies.map((c) => c.lag!), [0, 0.2, 0.4]);
  assert.ok(expandRepeats([{ shape: 'circle', repeat: { n: 2 } }]).every((c) => !c.lag));
  const spread = expandRepeats([{ shape: 'particles', repeat: { n: 2 }, stagger: 0.2 }]);
  assert.equal(spread[0].children![0].stagger, 0.2);
});

test('a sequence depends only on t: each event starts where the earlier ones left the layer', () => {
  const base = Object.freeze({ x: 0, y: 0, rot: 0, scale: 1, opacity: 1 });
  const steps: Step[] = [
    { at: 2, do: 'move', to: [10, 20], duration: 1, ease: 'linear' },
    { at: 1, do: 'move', to: [10, 0], duration: 1, ease: 'linear' },
    { at: 3, do: 'fade', to: 0, duration: 1, ease: 'linear' },
  ];
  assert.deepEqual(playSequence(steps, 0, base), base);
  assert.deepEqual(playSequence(steps, 1.5, base), { ...base, x: 5 });
  assert.deepEqual(playSequence(steps, 2.5, base), { ...base, x: 10, y: 10 });
  assert.deepEqual(playSequence(steps, 9, base), { ...base, x: 10, y: 20, opacity: 0 });
  assert.deepEqual(playSequence(steps, 2.5, base), { ...base, x: 10, y: 10 });
  assert.equal(playSequence([{ at: 1, do: 'enter' }], 0.5, base).opacity, 0);
  near(playSequence([{ at: 1, do: 'pop', duration: 1, amplitude: 0.2 }], 1.5, base).scale, 1.2);
});

test('in a sequence a layer can leave and come back', () => {
  const base = { x: 0, y: 0, rot: 0, scale: 1, opacity: 1 };
  const steps: Step[] = [{ at: 1, do: 'enter' }, { at: 2, do: 'exit' }, { at: 4, do: 'enter' }];
  assert.deepEqual([0.5, 1.8, 3, 4.9].map((t) => playSequence(steps, t, base).opacity), [0, 1, 0, 1]);
  assert.equal(playSequence([{ at: 2, do: 'exit' }], 1, base).opacity, 1);
});

test('exit is the counterpart of the entrance: whole before, gone after', () => {
  assert.deepEqual(leave(0.5, 1), { scale: 1, opacity: 1 });
  near(leave(5, 1).scale, 0.55);
  assert.equal(leave(5, 1).opacity, 0);
  assert.equal(pop(5).opacity, 1);
  near(pop(5).scale, 1);
});

test('a line is walked by length, with the direction of each stretch', () => {
  const at = measureLine([[0, 0], [10, 0], [10, 30]]);
  for (const [u, x, y, angle] of [[0.25, 10, 0, 0], [0.625, 10, 15, 90], [2, 10, 30, 90]]) {
    const p = at(u);
    (near(p.x, x), near(p.y, y), near(p.angle, angle));
  }
  near(measureLine([[0, 0], [4, 0], [4, 4], [0, 4]], true)(0.875).y, 2);
});

test('an open smooth curve goes from the first point to the last', () => {
  const pts = catmullRom([[0, 0], [10, 5], [20, 0]], false, 4);
  assert.deepEqual([pts[0], pts[4], pts[pts.length - 1]], [[0, 0], [10, 5], [20, 0]]);
});

test('morph matches count, direction and start, so a shape morphed into itself stays still', () => {
  const square: [number, number][] = [[-5, -5], [5, -5], [5, 5], [-5, 5]];
  const [a, b] = matchOutlines(square, [...square.slice(2), ...square.slice(0, 2)].reverse(), 40);
  assert.equal(a.length, 40);
  a.forEach(([x, y], i) => (near(x, b[i][0]), near(y, b[i][1])));
});

test('morph is the shape itself at 0, the target at 1 and in between on the way', () => {
  const circle: Layer = { shape: 'circle', r: 10, color: 'red' };
  assert.deepEqual(morphLayer(circle, { shape: 'circle', r: 20 }, 0), circle);
  assert.deepEqual(morphLayer(circle, { shape: 'star', r: 20 }, 1), { shape: 'star', r: 20, color: 'red' });
  const half = morphLayer(circle, { shape: 'circle', r: 20 }, 0.5);
  assert.equal(half.shape, 'polygon');
  assert.equal(half.color, 'red');
  assert.ok(half.points!.length > 30);
  for (const [x, y] of half.points!) near(Math.hypot(x, y), 15, 0.05);
  for (const [x, y] of morphLayer(circle, { shape: 'circle', r: 20 }, 1.1).points!) near(Math.hypot(x, y), 21, 0.05);
  const box = outline({ shape: 'rectangle', w: 20, h: 10, radius: 2 });
  const [xs, ys] = [box.map(([x]) => x), box.map(([, y]) => y)];
  [[Math.min(...xs), -10], [Math.max(...xs), 10], [Math.min(...ys), -5], [Math.max(...ys), 5]].forEach(([got, wanted]) => near(got, wanted));
});

test('errors of the motion data come with a suggestion or say what is missing', () => {
  const errors = drawingErrors({
    layers: [
      { shape: 'circle', stagger: 0.1, animate: [{ type: 'enter', ease: 'bak.out' }, { type: 'exit' }, { type: 'follow' }] },
      { shape: 'text', animate: [{ type: 'morph', into: { shape: 'arrow' } }] },
      { shape: 'circle', sequence: [{ at: 1, do: 'mvoe' as never }, { at: 1, do: 'move' }, { do: 'fade', to: 1 } as never] },
      { shape: 'circle', repeat: { n: 2 }, stagger: { eahc: 0.1, from: 'middle' as never } as never },
    ],
  }).join('\n');
  for (const expected of [/"back.out"/, /"stagger" needs "repeat"/, /"exit" behavior needs "at"/, /"follow" behavior needs "points"/, /"morph" starts from a closed shape/, /needs "into"/, /did you mean "move"/, /"move" needs "to"/, /"fade" needs "at"/, /did you mean "each"/, /unknown stagger from "middle"/]) assert.match(errors, expected);
  assert.deepEqual(drawingErrors({ layers: [{ shape: 'circle', repeat: { n: 3 }, stagger: { from: 'center' }, animate: [{ type: 'enter', ease: 'steps(3)' }] }] }), []);
});
