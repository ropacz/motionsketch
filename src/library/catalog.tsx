// Every drawing by name, both kinds (data and handmade).
import { DRAWINGS } from './drawings/index.ts';
import { unknownName } from '../engine/geometry/suggest.ts';
import { DataDrawing } from '../engine/render/data-drawing.tsx';
import type { DrawingProps } from '../engine/types.ts';
import type { Entry } from './entry.ts';
import { HANDMADE } from './handmade/index.ts';

// one name, one drawing: a repeated one would silently replace the other
const repeated = Object.keys(DRAWINGS).find((name) => name in HANDMADE);
if (repeated) throw new Error(`"${repeated}" is both a data drawing and a hand-made one`);

export const LIBRARY: Record<string, Entry> = {
  ...HANDMADE,
  ...Object.fromEntries(
    Object.entries(DRAWINGS).map(([name, d]) => [name, { purpose: d.purpose, grade: d.grade, note: d.note, Draw: (p: DrawingProps) => <DataDrawing d={d} {...p} /> }]),
  ),
};

export function getEntry(name: string): Entry {
  const found = LIBRARY[name];
  if (found) return found;
  throw unknownName('drawing', name, Object.keys(LIBRARY));
}
