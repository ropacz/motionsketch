// The camera: shots, zoom toward a place and tracking.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cameraAt, cameraTransform, type Shot } from '../src/engine/camera.ts';

const near = (a: number, b: number, tolerance = 1e-6) => assert.ok(Math.abs(a - b) <= tolerance, `${a} is not ${b}`);
const shots: Shot[] = [{ at: 1, to: [0, 0], zoom: 1 }, { at: 3, to: [400, 200], zoom: 9, ease: 'linear' }];

test('the camera holds before the first shot and after the last, and arrives exactly', () => {
  assert.deepEqual(cameraAt(shots, 0), { x: 0, y: 0, zoom: 1 });
  assert.deepEqual(cameraAt(shots, 1), { x: 0, y: 0, zoom: 1 });
  const end = cameraAt(shots, 3);
  (near(end.x, 400), near(end.y, 200), near(end.zoom, 9));
  assert.deepEqual(cameraAt(shots, 8), end);
});

test('zoom changes in equal ratios', () => near(cameraAt(shots, 2).zoom, 3));

test('while zooming in, the target only gets closer to the middle of the screen', () => {
  let last = Infinity;
  for (let t = 1; t <= 3.0001; t += 0.05) {
    const view = cameraAt(shots, t);
    const offCenter = Math.hypot((400 - view.x) * view.zoom, (200 - view.y) * view.zoom);
    assert.ok(offCenter <= last + 1e-6, `at ${t.toFixed(2)} s the target moved away: ${offCenter}`);
    last = offCenter;
  }
  near(last, 0, 1e-3);
});

test('without a zoom change the camera pans on the ease', () => {
  near(cameraAt([{ at: 0, to: [0, 0], zoom: 2 }, { at: 2, to: [10, 0], zoom: 2, ease: 'linear' }], 0.5).x, 2.5);
});

test('a moving target is tracked at the current time', () => {
  const track: Shot[] = [{ at: 0, to: (t) => [t * 10, 0], zoom: 4 }];
  assert.deepEqual([cameraAt(track, 1).x, cameraAt(track, 5).x], [10, 50]);
});

/** Applies an SVG transform list of translate and scale to a point. */
function project(transform: string, [x, y]: [number, number]) {
  const steps = [...transform.matchAll(/(translate|scale)\(([^)]*)\)/g)].reverse();
  return steps.reduce<[number, number]>(([px, py], [, kind, args]) => {
    const [a, b = a] = args.trim().split(/[ ,]+/).map(Number);
    return kind === 'scale' ? [px * a, py * b] : [px + a, py + b];
  }, [x, y]);
}

test('the view is centered on the frame; a far layer moves and grows less', () => {
  const view = { x: 100, y: 0, zoom: 4 };
  const at = (point: [number, number], depth?: number) => project(cameraTransform(view, 200, 100, depth), point);
  assert.deepEqual(at([100, 0]), [100, 50]);
  // on a far layer the camera is only part of the way along: that point of the layer is what sits in the middle
  assert.deepEqual(at([50, 0], 0.5), [100, 50]);
  near(at([110, 0])[0] - at([100, 0])[0], 40);
  near(at([110, 0], 0.5)[0] - at([100, 0], 0.5)[0], 20);
  assert.ok(Math.abs(at([0, 0], 0.5)[0] - 100) < Math.abs(at([0, 0])[0] - 100));
});
