// The spinning sphere of data drawings: latitude bands, surface spots, shading, night, atmosphere and highlight.

import type { LayerState } from '../geometry/behaviors.ts';
import { DEG, TURN, num } from '../geometry/math.ts';
import { measures } from '../geometry/measures.ts';
import { catmullRom } from '../geometry/outline.ts';
import type { Layer } from '../geometry/schema.ts';
import { materialOf } from '../geometry/shapes.ts';
import { capOnSphere, shapeOnSphere, sphere, type LonLat } from '../geometry/sphere.ts';
import { clamp, random } from '../motion.ts';
import { paletteColor } from '../palette.ts';
import { Halo, Highlight, RimLight } from './blocks.tsx';
import { mix, tint } from './color.ts';
import type { Ctx } from './context.ts';
import { textureFill, toLight, volumeGradient } from './paint.tsx';

function spotOutline(lon: number, lat: number, r: number, stretch: number, irregular: number, seed: number): LonLat[] {
  const a = random(seed);
  const [f1, f2] = [a() * TURN, a() * TURN];
  return Array.from({ length: 22 }, (_, i) => {
    const th = (i / 22) * TURN;
    const q = r * (1 + irregular * (0.55 * Math.sin(3 * th + f1) + 0.45 * Math.sin(5 * th + f2)));
    return [lon + (q * stretch * Math.cos(th)) / Math.max(0.2, Math.cos(lat * DEG)), lat + q * Math.sin(th)] as LonLat;
  });
}

export function sphereSvg(c: Layer, ctx: Ctx, id: string, s: LayerState, base: string) {
  const R = measures(c).r;
  const proj = sphere(num(c.tilt, 15), num(c.axis, 0));
  const spin = num(c.spin, 6) * ctx.tc;
  const volume = materialOf(c) === 'volume';
  const url = (k: string) => `url(#${id}-${k})`;
  const color = (k?: string) => tint(ctx.palette, paletteColor(ctx.palette, k, base), s.shifts);
  const bands = (c.bands ?? []).map((f, i) => {
    const [l, wv] = [num(f.width, 10) / 2, num(f.wave, 0)];
    // the edge waves attached to the surface (lon + spin): that is what shows the spin
    const offset = (k: number) => (lon: number) => wv * Math.sin((k * (lon - spin) + 40 * i) * DEG);
    const [south, north] = [f.lat - l, f.lat + l];
    const d = (south <= -90 ? capOnSphere(proj, -90, R) : capOnSphere(proj, south, R, offset(4))) + (north >= 90 ? '' : capOnSphere(proj, north, R, offset(5)));
    return d ? <path key={`f${i}`} d={d} fillRule="evenodd" fill={color(f.color)} opacity={num(f.opacity, 1)} /> : null;
  });
  let k = 0;
  const spots = (c.spots ?? []).flatMap((m) => {
    const list: { lon: number; lat: number; r: number; seed: number }[] = [];
    if (m.n) {
      const a = random(num(m.seed, 1));
      const [t0, t1] = m.size ?? [4, 10];
      for (let i = 0; i < m.n; i++) list.push({ lon: a() * 360 - 180, lat: (a() * 2 - 1) * 65, r: t0 + a() * (t1 - t0), seed: 1 + i * 7 + num(m.seed, 1) * 131 });
    } else if (m.points?.length) {
      const mean = (j: 0 | 1) => m.points!.reduce((s, p) => s + p[j], 0) / m.points!.length; // the center, to fade at the edge
      list.push({ lon: mean(0), lat: mean(1), r: 0, seed: 0 });
    } else list.push({ lon: num(m.lon, 0), lat: num(m.lat, 0), r: num(m.r, 15), seed: 3 + k * 17 });
    return list.map((p) => {
      const g = spin + num(m.drift, 0) * ctx.tc;
      const pts = m.points && !m.n ? catmullRom(m.points, true, 5) : spotOutline(p.lon, p.lat, p.r, num(m.stretch, 1), num(m.irregular, 0.3), p.seed);
      const d = shapeOnSphere(proj, pts, g, R);
      // fades by the depth of the center: a spot going behind does not become a veil at the edge
      const vis = clamp((proj(p.lon + g, p.lat, 1).z + 0.1) / 0.35);
      return d && vis > 0 ? <path key={`m${k++}`} d={d} fill={color(m.color ?? '#FFFFFF')} opacity={num(m.opacity, 1) * vis} /> : null;
    });
  });
  const night = clamp(num(c.night, 0));
  const dark = mix(base, '#050B1E', 0.75);
  const air = c.atmosphere ? paletteColor(ctx.palette, c.atmosphere) : null;
  const body = volume ? volumeGradient(`${id}-base`, base, ctx.light) : null;
  const [sx, sy] = toLight([-0.18, -0.22], ctx.light).map((v) => (0.5 + v).toFixed(3));
  const [nx, ny] = toLight([-0.35, -0.4], ctx.light);
  const [hx, hy] = toLight([-0.36, -0.4], ctx.light);
  return (
    <>
      <defs>
        {body}
        <clipPath id={`${id}-disc`}>
          <circle r={R} />
        </clipPath>
        <radialGradient id={`${id}-shade`} cx="0.5" cy="0.5" r="0.5" fx={sx} fy={sy}>
          <stop offset={0} stopColor="#FFFFFF" stopOpacity={0.18} />
          <stop offset={0.4} stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset={0.72} stopColor={dark} stopOpacity={0.14} />
          <stop offset={1} stopColor={dark} stopOpacity={0.55} />
        </radialGradient>
        {night > 0.01 ? (
          <linearGradient id={`${id}-night`} x1={0.5 + nx} y1={0.5 + ny} x2={0.5 - nx} y2={0.5 - ny}>
            <stop offset={clamp(1 - night - 0.12)} stopColor={dark} stopOpacity={0} />
            <stop offset={clamp(1.06 - night)} stopColor={dark} stopOpacity={0.85} />
          </linearGradient>
        ) : null}
      </defs>
      {air ? <Halo id={id} r={R * 1.14} color={[[0.84, air, 0], [0.88, air, 0.5], [1, air, 0]]} /> : null}
      <circle r={R} fill={body ? url('base') : base} />
      <g clipPath={url('disc')}>
        {bands}
        {spots}
        {volume && c.texture !== false ? <circle r={R} fill={textureFill(ctx.id, 'grain')} /> : null}
        {volume ? <circle r={R} fill={url('shade')} /> : null}
        {night > 0.01 ? <circle r={R} fill={url('night')} /> : null}
      </g>
      {air || volume ? <RimLight id={id} R={R} color={air ?? mix(base, '#FFFFFF', 0.7)} strength={air ? 0.9 : 0.7} width={air ? 0.05 : 0.04} from={air ? 0.4 : 0.5} light={ctx.light} /> : null}
      {volume ? <Highlight id={id} R={R} x={hx} y={hy} angle={-38 + ctx.light + 45} opacity={0.45} /> : null}
    </>
  );
}
