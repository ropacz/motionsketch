// The whole library is valid, and the errors point to the fix.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DRAWINGS } from '../src/library/drawings/index.ts';
import { layerBox } from '../src/engine/geometry/layout.ts';
import { drawingErrors } from '../src/engine/geometry/validate.ts';
import type { Layer } from '../src/engine/geometry/schema.ts';
import { PARTS } from '../src/engine/geometry/kit.ts';

test('every data drawing is valid', () => {
  for (const [name, d] of Object.entries(DRAWINGS)) assert.deepEqual(drawingErrors(d), [], name);
});

test('the kit parts are valid and do not use other parts', () => {
  const usesSomething = (cs: Layer[]): boolean => cs.some((c) => c.use !== undefined || usesSomething(c.children ?? []));
  for (const [name, p] of Object.entries(PARTS)) {
    assert.deepEqual(drawingErrors(p), [], name);
    assert.equal(usesSomething(p.layers), false, `${name} uses another part (the engine does not descend into parts of parts)`);
  }
});

test('clipping by a group or a part is an error', () => {
  const errors = drawingErrors({ layers: [{ id: 'g', shape: 'group' }, { shape: 'circle', clip: 'g' }] });
  assert.match(errors.join('\n'), /simple shape/);
});

test('error with a suggestion for an unknown part, shape and prop', () => {
  const errors = drawingErrors({ layers: [{ use: 'wheell' }, { shape: 'circel' as never }, { shape: 'circle', opacty: 0.5 } as never] });
  assert.match(errors.join('\n'), /"wheel"/);
  assert.match(errors.join('\n'), /"circle"/);
  assert.match(errors.join('\n'), /"opacity"/);
});

test('an unknown texture is an error with a suggestion; false turns it off', () => {
  assert.match(drawingErrors({ layers: [{ shape: 'circle', texture: 'brushd' as never }] }).join('\n'), /"brushed"/);
  assert.deepEqual(drawingErrors({ layers: [{ shape: 'circle', material: 'metal', texture: false }] }), []);
});

test('the path has a box from the control points and the arc extremes', () => {
  assert.deepEqual(layerBox({ shape: 'path', d: 'M10 0a10 10 0 1 1 -20 0' }), { x0: -10, y0: 0, x1: 10, y1: 10 });
  assert.deepEqual(layerBox({ shape: 'path', x: 5, d: 'M0 0C10 -10 20 10 30 0' }), { x0: 5, y0: -10, x1: 35, y1: 10 });
  assert.equal(layerBox({ shape: 'path', d: 'M0 0A10 5 30 0 1 10 0' }), null);
});
