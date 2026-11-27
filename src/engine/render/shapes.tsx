// The SVG of each simple shape, at the layer origin.

import { measures } from '../geometry/measures.ts';
import { DEG, TURN, num } from '../geometry/math.ts';
import { smoothCurve, vertices } from '../geometry/outline.ts';
import type { Layer, Marked } from '../geometry/schema.ts';
import { materialOf } from '../geometry/shapes.ts';
import { random } from '../motion.ts';
import type { Ctx } from './context.ts';

const halfOrbit = (rx: number, ry: number, front: boolean) => `M${rx} 0A${rx} ${ry} 0 0 ${front ? 1 : 0} ${-rx} 0`;

const pointList = (ps: [number, number][]) => ps.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
const clockPoint = (r: number, g: number): [number, number] => [r * Math.sin(g * DEG), -r * Math.cos(g * DEG)];
const HEART = 'M0 0.95C-0.35 0.65 -1 0.25 -1 -0.3C-1 -0.72 -0.68 -0.95 -0.42 -0.95C-0.2 -0.95 -0.05 -0.82 0 -0.6C0.05 -0.82 0.2 -0.95 0.42 -0.95C0.68 -0.95 1 -0.72 1 -0.3C1 0.25 0.35 0.65 0 0.95Z';

function cloudPath(w: number, h: number, n: number, seed: number) {
  const a = random(seed);
  const [rx, ry] = [w / 2, h / 2];
  const ps = Array.from({ length: n }, (_, i): [number, number] => {
    const th = ((i + 0.5 + 0.35 * (a() - 0.5)) / n) * TURN;
    return [rx * Math.cos(th), ry * Math.sin(th)];
  });
  let d = `M${ps[0][0].toFixed(2)} ${ps[0][1].toFixed(2)}`;
  ps.forEach((p, i) => {
    const q = ps[(i + 1) % n];
    const chord = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const r = (p[1] + q[1]) / 2 > ry * 0.3 ? chord * 1.4 : chord * (0.52 + 0.18 * a());
    d += `A${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${q[0].toFixed(2)} ${q[1].toFixed(2)}`;
  });
  return `${d}Z`;
}

function arrow(c: Layer, props: Record<string, unknown>, drawn: number) {
  const { from: a, to: b } = measures(c);
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const k = num(c.bend, 0);
  const ctl = [(a[0] + b[0]) / 2 - ((b[1] - a[1]) / len) * k * len, (a[1] + b[1]) / 2 + ((b[0] - a[0]) / len) * k * len];
  const [ux, uy] = [b[0] - ctl[0], b[1] - ctl[1]].map((v) => v / (Math.hypot(b[0] - ctl[0], b[1] - ctl[1]) || 1));
  const p = num(c.head, 4);
  const end = [b[0] - ux * p * 1.2, b[1] - uy * p * 1.2];
  const head: [number, number][] = [[b[0], b[1]], [b[0] - ux * p * 1.8 - uy * p, b[1] - uy * p * 1.8 + ux * p], [b[0] - ux * p * 1.8 + uy * p, b[1] - uy * p * 1.8 - ux * p]];
  return (
    <>
      <path d={`M${a[0]} ${a[1]}Q${ctl[0].toFixed(2)} ${ctl[1].toFixed(2)} ${end[0].toFixed(2)} ${end[1].toFixed(2)}`} {...props} />
      {1 - drawn < 0.05 ? <polygon points={pointList(head)} fill={String(props.stroke)} stroke={String(props.stroke)} strokeWidth={num(c.lineWidth, 1.2) * 0.5} strokeLinejoin="round" /> : null}
    </>
  );
}

function gearPath(r: number, teeth: number, inner: number, hole: number) {
  const p = TURN / teeth;
  const pts: [number, number][] = [];
  for (let i = 0; i < teeth; i++)
    for (const [q, da] of [[inner, -0.28], [1, -0.16], [1, 0.16], [inner, 0.28]] as const) pts.push([r * q * Math.sin(i * p + da * p), -r * q * Math.cos(i * p + da * p)]);
  const f = r * hole;
  return `M${pointList(pts).replace(/ /g, 'L')}Z${f > 0 ? `M${f} 0A${f} ${f} 0 1 0 ${-f} 0A${f} ${f} 0 1 0 ${f} 0Z` : ''}`;
}

export function shape(c: Layer, props: Record<string, unknown>, ctx: Ctx, half?: 'back' | 'front', drawn = 1) {
  const { r, w, h, rx, ry } = measures(c);
  switch (c.shape) {
    case 'drop': {
      const dist = h - r;
      if (dist <= r) return <circle r={r} {...props} />;
      const b = Math.acos(r / dist);
      const [sx, sy] = [(r * Math.sin(b)).toFixed(2), (-r * Math.cos(b)).toFixed(2)];
      return <path d={`M0 ${-dist}L${sx} ${sy}A${r} ${r} 0 1 1 -${sx} ${sy}Z`} strokeLinejoin="round" {...props} />;
    }
    case 'leaf': {
      const k = num(c.bend, 0);
      return <path d={`M0 0Q${w + k * w} ${-h / 2} ${k * w} ${-h}Q${-w + k * w} ${-h / 2} 0 0Z`} {...props} />;
    }
    case 'cloud':
      return <path d={cloudPath(w, h, Math.max(4, Math.round(num(c.n, 7))), num(c.seed, 3))} {...props} />;
    case 'heart':
      return <path d={HEART.replace(/-?\d*\.?\d+/g, (v) => (parseFloat(v) * r).toFixed(2))} {...props} />;
    case 'arrow':
      return arrow(c, props, drawn);
    case 'bolt': case 'triangle': case 'diamond': case 'trapezoid':
      return <polygon points={pointList(vertices(c))} strokeLinejoin="round" {...props} />;
    case 'gear':
      return <path fillRule="evenodd" d={gearPath(r, Math.max(3, Math.round(num(c.teeth, 8))), num(c.inner, 0.78), num(c.hole, 0.3))} {...props} />;
    case 'arc': {
      const [from, until] = [num(c.from, -90), num(c.until, 90)];
      const turn = Math.min(359.9, Math.max(0.1, until - from));
      const [a, b] = [clockPoint(r, from), clockPoint(r, from + turn)];
      const d = `M${a[0].toFixed(2)} ${a[1].toFixed(2)}A${r} ${r} 0 ${turn > 180 ? 1 : 0} 1 ${b[0].toFixed(2)} ${b[1].toFixed(2)}`;
      return <path d={materialOf(c) === 'stroke' ? d : `M0 0L${d.slice(1)}Z`} {...props} />;
    }
    case 'curve':
      return <path d={smoothCurve(c.points ?? [], c.closed !== false)} strokeLinejoin="round" {...props} />;
    case 'text':
      return (
        <text textAnchor="middle" dominantBaseline="central" fontFamily={ctx.palette.sans} fontWeight={num(c.weight, 700)} fontSize={measures(c).textSize} {...props}>
          {String(c.text ?? '')}
        </text>
      );
    case 'circle':
      return <circle r={r} {...props} />;
    case 'ellipse':
      return <ellipse rx={rx} ry={ry} {...props} />;
    case 'rectangle':
      return <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={num(c.radius, 0)} {...props} />;
    case 'polygon':
      return <polygon points={(c.points ?? []).map((p) => p.join(',')).join(' ')} {...props} />;
    case 'path':
      return <path d={c.d ?? ''} strokeLinejoin={(c as Marked).rounded ? 'round' : undefined} {...props} />;
    case 'ring': {
      const [ro, ri] = [r, Math.max(0, r - num(c.thickness, 4))];
      return <path fillRule="evenodd" d={`M${ro} 0A${ro} ${ro} 0 1 0 ${-ro} 0A${ro} ${ro} 0 1 0 ${ro} 0ZM${ri} 0A${ri} ${ri} 0 1 0 ${-ri} 0A${ri} ${ri} 0 1 0 ${ri} 0Z`} {...props} />;
    }
    case 'star':
      return <polygon points={pointList(vertices(c))} {...props} />;
    case 'orbit': {
      if (!half) return <ellipse rx={rx} ry={ry} {...props} />;
      return <path d={halfOrbit(rx, ry, half === 'front')} {...props} strokeLinecap="butt" opacity={half === 'back' ? 0.55 : 1} />;
    }
    default:
      return null;
  }
}
