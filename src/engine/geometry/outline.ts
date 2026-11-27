// Outlines as lists of points: the corners of the straight-edged shapes, smooth curves, walking a line by its length
// and the morph between two closed shapes. Pure (no React).
import { DEG, catmull, type Point } from './math.ts';
import { measures } from './measures.ts';
import { MORPH_PROPS, type Layer, type MorphTarget } from './schema.ts';

const BOLT: Point[] = [[0.12, -0.5], [-0.38, 0.06], [-0.02, 0.06], [-0.14, 0.5], [0.38, -0.1], [0.02, -0.1]];

/** The corners of a straight-edged shape (star, triangle, diamond, trapezoid, bolt), at its origin. */
export function vertices(c: Layer): Point[] {
  const { r, w, h, top, bottom } = measures(c);
  switch (c.shape) {
    case 'star': {
      const tips = Math.max(3, Math.round(c.tips ?? 5));
      return Array.from({ length: tips * 2 }, (_, i): Point => {
        const [a, q] = [(i * Math.PI) / tips - Math.PI / 2, i % 2 ? r * (c.inner ?? 0.45) : r];
        return [q * Math.cos(a), q * Math.sin(a)];
      });
    }
    case 'triangle': return [[0, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
    case 'diamond': return [[0, -h / 2], [w / 2, 0], [0, h / 2], [-w / 2, 0]];
    case 'trapezoid': return [[-top / 2, -h / 2], [top / 2, -h / 2], [bottom / 2, h / 2], [-bottom / 2, h / 2]];
    case 'bolt': return BOLT.map(([x, y]) => [x * w, y * h]);
    default: return [];
  }
}

export function catmullRom(pts: Point[], closed = true, steps = 5): Point[] {
  const n = pts.length;
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const out: Point[] = [];
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let s = 0; s < steps; s++) {
      const u = s / steps;
      out.push([catmull(p0[0], p1[0], p2[0], p3[0], u), catmull(p0[1], p1[1], p2[1], p3[1], u)]);
    }
  }
  if (!closed && n) out.push(pts[n - 1]);
  return out;
}

export function smoothCurve(pts: [number, number][], closed = true) {
  const n = pts.length;
  if (n < 2) return '';
  const p = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const f = (v: number) => v.toFixed(2);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [a, b, c, e] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    d += `C${f(b[0] + (c[0] - a[0]) / 6)} ${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)} ${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])} ${f(c[1])}`;
  }
  return closed ? `${d}Z` : d;
}

/** A line measured once: `at(u)` is the point and the direction (degrees) at the fraction `u` of its length. */
export function measureLine(pts: Point[], closed = false) {
  const line = closed ? [...pts, pts[0]] : pts;
  const ends = [0];
  for (let i = 1; i < line.length; i++) ends.push(ends[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  const length = ends[ends.length - 1];
  return (u: number) => {
    const target = Math.max(0, Math.min(1, u)) * length;
    let [low, high] = [1, line.length - 1];
    while (low < high) {
      const mid = (low + high) >> 1;
      if (ends[mid] < target) low = mid + 1;
      else high = mid;
    }
    const [a, b] = [line[low - 1], line[low]];
    const span = ends[low] - ends[low - 1];
    const k = span ? (target - ends[low - 1]) / span : 0;
    return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, angle: Math.atan2(b[1] - a[1], b[0] - a[0]) / DEG };
  };
}

function resample(pts: Point[], n: number): Point[] {
  const at = measureLine(pts, true);
  return Array.from({ length: n }, (_, i): Point => {
    const p = at(i / n);
    return [p.x, p.y];
  });
}

export function outline(c: Layer): Point[] {
  const { r, rx, ry, w, h } = measures(c);
  const around = (a: number, b: number, from: number, sweep: number, n: number, cx = 0, cy = 0) =>
    Array.from({ length: n }, (_, i): Point => {
      const th = from + (sweep * i) / n;
      return [cx + a * Math.cos(th), cy + b * Math.sin(th)];
    });
  if (c.shape === 'circle') return around(r, r, -Math.PI / 2, 2 * Math.PI, 96);
  if (c.shape === 'ellipse') return around(rx, ry, -Math.PI / 2, 2 * Math.PI, 96);
  if (c.shape === 'rectangle') {
    const k = Math.max(0, Math.min(c.radius ?? 0, w / 2, h / 2));
    const corners: Point[] = [[w / 2 - k, -h / 2 + k], [w / 2 - k, h / 2 - k], [-w / 2 + k, h / 2 - k], [-w / 2 + k, -h / 2 + k]];
    return corners.flatMap(([x, y], i) => (k ? [...around(k, k, (i - 1) * (Math.PI / 2), Math.PI / 2, 9, x, y), ...around(k, k, i * (Math.PI / 2), 0, 1, x, y)] : [[x, y] as Point]));
  }
  if (c.shape === 'polygon') return c.points ?? [];
  if (c.shape === 'curve') return catmullRom(c.points ?? [], true, 12);
  return vertices(c);
}

/** Twice the signed area: positive when the outline runs clockwise on screen (y down). */
const turnOf = (pts: Point[]) => pts.reduce((sum, [x, y], i) => sum + x * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * y, 0);

/**
 * Two outlines ready to interpolate: the same number of points evenly spaced by length, the same direction, and the
 * start of the second one chosen to move the points as little as possible.
 */
export function matchOutlines(a: Point[], b: Point[], n = 180): [Point[], Point[]] {
  const clockwise = (pts: Point[]) => (turnOf(pts) < 0 ? [...pts].reverse() : pts);
  const [from, to] = [resample(clockwise(a), n), resample(clockwise(b), n)];
  const cost = (shift: number) => from.reduce((sum, [x, y], i) => sum + (x - to[(i + shift) % n][0]) ** 2 + (y - to[(i + shift) % n][1]) ** 2, 0);
  let [best, smallest] = [0, Infinity];
  for (let shift = 0; shift < n; shift++) {
    const value = cost(shift);
    if (value < smallest) [best, smallest] = [shift, value];
  }
  return [from, to.map((_, i) => to[(i + best) % n])];
}

/** The geometry props: a morph target replaces all of them, so nothing of the first shape leaks into the second. */
const GEOMETRY = [...MORPH_PROPS, 'closed'] as const;

/** The layer at `k` of the way to the shape `into`: itself at 0, the target at 1, a polygon otherwise (an overshoot too). */
export function morphLayer(c: Layer, into: MorphTarget, k: number): Layer {
  if (k === 0) return c;
  const look: Layer = { ...c };
  for (const key of GEOMETRY) delete look[key];
  const target: Layer = { ...look, ...into };
  if (k === 1) return target;
  const [a, b] = matchOutlines(outline(c), outline(target));
  return { ...look, shape: 'polygon', points: a.map(([x, y], i): Point => [+(x + (b[i][0] - x) * k).toFixed(2), +(y + (b[i][1] - y) * k).toFixed(2)]) };
}
