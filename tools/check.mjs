// Motion checks on a probe render: one row per drawing, one column per moment, no background. The verdict is
// text, so an obvious mistake costs no image to find.
import { readPng } from './png.mjs';

/** Moments after the entrance, unevenly spaced so that a cycle does not repeat in step with them. */
export const MOMENTS = [1.5, 2.2, 3.1, 3.9, 5, 6.3, 7.4, 8.9];
/** A cell is wider than the drawing box (`size` pixels for its 100 units), to see what leaves it. */
export const PROBE = { cell: 300, size: 200 };

const SOLID = 128; // alpha: soft glows, halos and shadows may leave the box
const TOLERANCE = 2; // units
const CHANGED = 12; // channel difference above the noise of antialiasing
const MOVING = 8; // changed blocks of 2x2 pixels: lone pixels on an edge differ from one cell to another

/** One list of warnings per name, empty when there is nothing to say. */
export function motionWarnings(file, names) {
  const { width, height, channels, pixels } = readPng(file);
  const { cell, size } = PROBE;
  if (channels !== 4 || width !== cell * MOMENTS.length || height !== cell * names.length) throw new Error(`${file}: not a probe of ${names.length} drawings`);
  const unit = size / 100;
  const edge = (cell - size) / 2;
  const offset = (column, row, x, y) => ((row * cell + y) * width + column * cell + x) * 4;

  const changed = (column, row, x, y) => {
    const i = offset(column, row, x, y);
    const first = offset(0, row, x, y);
    return [0, 1, 2, 3].some((k) => Math.abs(pixels[i + k] - pixels[first + k]) > CHANGED);
  };
  const BLOCK = [[0, 0], [1, 0], [0, 1], [1, 1]];

  return names.map((name, row) => {
    // how far solid ink goes past each side of the box, in pixels
    const past = { left: 0, right: 0, top: 0, bottom: 0 };
    let ink = false;
    let moves = false;
    for (let column = 0; column < MOMENTS.length; column++) {
      let blocks = 0;
      for (let y = 0; y < cell; y++) {
        for (let x = 0; x < cell; x++) {
          const i = offset(column, row, x, y);
          if (column && x < cell - 1 && y < cell - 1 && BLOCK.every(([dx, dy]) => changed(column, row, x + dx, y + dy))) blocks++;
          if (pixels[i + 3] < SOLID) continue;
          ink = true;
          past.left = Math.max(past.left, edge - x);
          past.right = Math.max(past.right, x + 1 - (edge + size));
          past.top = Math.max(past.top, edge - y);
          past.bottom = Math.max(past.bottom, y + 1 - (edge + size));
        }
      }
      if (blocks >= MOVING) moves = true;
    }
    const range = `between ${MOMENTS[0]} and ${MOMENTS.at(-1)} s`;
    if (!ink) return [`${name}: nothing solid is drawn ${range}`];
    const warnings = moves ? [] : [`${name}: no movement seen at ${MOMENTS.length} moments ${range} (a short event can fall between them)`];
    const sides = Object.entries(past)
      .filter(([, outside]) => outside / unit > TOLERANCE)
      .map(([side, outside]) => `${side} ${outside >= edge ? '≥' : ''}${Math.round(outside / unit)}`);
    if (sides.length) warnings.push(`${name}: solid ink leaves the box (-50 to 50): ${sides.join(', ')} units`);
    return warnings;
  });
}
