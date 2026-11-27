// The box of an SVG `d`, measured without a browser. Pure.

export type Box = { x0: number; y0: number; x1: number; y1: number };
export const boxOf = (xs: number[], ys: number[]): Box => ({ x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) });

const ARITY: Record<string, number> = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7, Z: 0 };

/**
 * The points that bound an `A` arc (unrotated ellipse): the endpoints and the ellipse extremes (0°, 90°, 180°, 270°)
 * that fall inside the arc. The center comes from the SVG spec computation (appendix F.6.5). Null when rotated.
 */
function arcExtremes([x1, y1]: [number, number], [rx0, ry0, rot, large, sweep, x2, y2]: number[]): [number, number][] | null {
  if (rot % 180 !== 0) return null;
  const [px, py] = [(x1 - x2) / 2, (y1 - y2) / 2];
  if (!rx0 || !ry0 || (!px && !py)) return [[x2, y2]];
  const lambda = Math.sqrt((px * px) / (rx0 * rx0) + (py * py) / (ry0 * ry0));
  const [rx, ry] = [Math.abs(rx0) * Math.max(1, lambda), Math.abs(ry0) * Math.max(1, lambda)];
  const q = Math.max(0, (rx * rx * ry * ry - rx * rx * py * py - ry * ry * px * px) / (rx * rx * py * py + ry * ry * px * px));
  const k = (large !== sweep ? 1 : -1) * Math.sqrt(q);
  const [cx, cy] = [(k * rx * py) / ry + (x1 + x2) / 2, (-k * ry * px) / rx + (y1 + y2) / 2];
  const a0 = Math.atan2((y1 - cy) / ry, (x1 - cx) / rx);
  let turn = Math.atan2((y2 - cy) / ry, (x2 - cx) / rx) - a0;
  if (sweep && turn < 0) turn += 2 * Math.PI;
  if (!sweep && turn > 0) turn -= 2 * Math.PI;
  const inside = (a: number) => (((Math.sign(turn) * (a - a0)) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) <= Math.abs(turn);
  const axes = [0, 0.5, 1, 1.5].map((f) => f * Math.PI).filter(inside);
  return [[x2, y2], ...axes.map((a): [number, number] => [cx + rx * Math.cos(a), cy + ry * Math.sin(a)])];
}

/** The box of a `d` from its control points (contains the curve, a little loose) and the arc extremes; null if unknown. */
export function pathBox(d: string): Box | null {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? [];
  const [xs, ys] = [[] as number[], [] as number[]];
  let [cx, cy, sx, sy, i] = [0, 0, 0, 0, 0];
  let cmd = '';
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    const k = ARITY[cmd.toUpperCase()];
    if (k === undefined) return null;
    const rel = cmd !== cmd.toUpperCase();
    if (k === 0) {
      [cx, cy] = [sx, sy];
      continue;
    }
    const v = tokens.slice(i, i + k).map(Number);
    if (v.length < k || v.some(Number.isNaN)) return null;
    i += k;
    const U = cmd.toUpperCase();
    if (U === 'A') {
      const arc = arcExtremes([cx, cy], rel ? [...v.slice(0, 5), v[5] + cx, v[6] + cy] : v);
      if (!arc) return null;
      for (const [x, y] of arc) xs.push(x), ys.push(y);
      [cx, cy] = arc[0];
      continue;
    }
    const pts: [number, number][] = U === 'H' ? [[v[0] + (rel ? cx : 0), cy]] : U === 'V' ? [[cx, v[0] + (rel ? cy : 0)]] : Array.from({ length: k / 2 }, (_, j) => [v[2 * j] + (rel ? cx : 0), v[2 * j + 1] + (rel ? cy : 0)]);
    for (const [x, y] of pts) xs.push(x), ys.push(y);
    [cx, cy] = pts[pts.length - 1];
    if (U === 'M') {
      [sx, sy] = pts[0];
      cmd = rel ? 'l' : 'L';
    }
  }
  return xs.length ? boxOf(xs, ys) : null;
}
