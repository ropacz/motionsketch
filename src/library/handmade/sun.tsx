// Living Sun (original drawing, in the spirit of Kurzgesagt): a hot disc with volume, sunspots that turn with it,
// twinkling granulation, prominences (plasma arcs) that rise and fall at the edge and a wavy corona.
// Style sheet:
// - palette: dominant orange-gold (#FFB23E); support cream (#FFF6D6), yellow (#FFD84A), orange (#F2702A) and
//   red (#D2381E); sunspots in burnt brown. Real Sun colors, stylized (does not use the palette's).
// - light: the Sun itself; the bright core sits a bit up and to the left, and the edge darkens (as on the real Sun).
// - shape: round and organic (wavy corona, plasma arcs); no triangle rays.

import { random, clamp, easing } from '../../engine/motion.ts';
import type { DrawingProps } from '../../engine/types.ts';
import { DEG, TURN } from '../../engine/geometry/math.ts';
import { Halo, RimLight, Highlight } from '../../engine/render/blocks.tsx';
import { sphere, pointOnSphere } from '../../engine/geometry/sphere.ts';

const easeOut = easing('power2.out');
const onSphere = sphere(14); // the Sun's north pole tilted toward us: the spots travel on a curve

/** Sunspots (longitude, latitude and radius as a fraction of the Sun radius); the big ones have a companion. */
const SPOTS = [
  { lon: 10, lat: 18, r: 0.13 },
  { lon: -6, lat: 9, r: 0.05 },
  { lon: 128, lat: -15, r: 0.1 },
  { lon: 232, lat: 24, r: 0.08 },
  { lon: 300, lat: -22, r: 0.115 },
  { lon: 284, lat: -30, r: 0.045 },
];

/** Surface grains, stable by seed. */
const GRAINS = (() => {
  const a = random(7);
  return Array.from({ length: 64 }, (_, i) => ({ light: i % 3 !== 0, lon: a() * 360, lat: (Math.asin(2 * a() - 1) / DEG) * 0.85, r: 0.05 + a() * 0.05, phase: a() * TURN, per: 2.6 + a() * 2.4 }));
})();

/** Prominences: angle on the edge (degrees, 0 = right, clockwise), half opening of the feet, height and rhythm. */
const PROMINENCES = [
  { ang: -42, open: 14, h: 0.46, per: 6.4, phase: 0, delay: 0.15 },
  { ang: 197, open: 11, h: 0.42, per: 5.1, phase: 2.1, delay: 0.3 },
  { ang: 128, open: 9, h: 0.36, per: 7.3, phase: 4.2, delay: 0.45 },
];

/** Wavy outline (corona): a radius that varies with the angle and time, closed and seamless. */
function wavy(R: number, base: number, waves: [number, number, number][], n = 120) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const th = (i / n) * TURN;
    const r = R * (base + waves.reduce((s, [amp, freq, phase]) => s + amp * Math.sin(freq * th + phase), 0));
    d += `${i ? 'L' : 'M'}${(Math.cos(th) * r).toFixed(1)} ${(Math.sin(th) * r).toFixed(1)}`;
  }
  return `${d}Z`;
}

export function Sun({ t, tc, size, id }: DrawingProps) {
  const R = size * 0.33;
  const spin = 11 * tc; // degrees of longitude per second
  const pulse = Math.sin((tc * TURN) / 4.4);
  const url = (name: string) => `url(#${id}-${name})`;

  // plasma arc: a filled band between two arcs (thick at the top), with the feet hidden behind the disc
  const arc = (p: (typeof PROMINENCES)[number], k = 1) => {
    const grow = easeOut(clamp((t - p.delay) / 0.9));
    const h = R * p.h * k * (0.62 + 0.38 * Math.sin((tc * TURN) / p.per + p.phase)) * grow;
    const sway = 3 * Math.sin((tc * TURN) / (p.per * 1.7) + p.phase);
    const pt = (ang: number, r: number) => `${(Math.cos(ang * DEG) * r).toFixed(1)} ${(Math.sin(ang * DEG) * r).toFixed(1)}`;
    const curve = (open: number, high: number, back: boolean) => {
      const [a, b] = back ? [p.ang + open, p.ang - open] : [p.ang - open, p.ang + open];
      const [ca, cb] = back ? [p.ang + open * 0.9 + sway, p.ang - open * 0.9 + sway] : [p.ang - open * 0.9 + sway, p.ang + open * 0.9 + sway];
      return `${back ? 'L' : 'M'}${pt(a, R * 0.94)}C${pt(ca, R + high * 1.35)} ${pt(cb, R + high * 1.35)} ${pt(b, R * 0.94)}`;
    };
    return `${curve(p.open, h, false)}${curve(p.open * 0.55, h * 0.6, true)}Z`;
  };

  const spots = SPOTS.map((m, i) => {
    const p = pointOnSphere(onSphere, m.lon + spin, m.lat, R * 0.98, 0.02);
    if (!p) return null;
    const vis = easeOut(clamp(p.z / 0.3));
    const r = R * m.r * (1 + 0.06 * Math.sin(tc * 0.9 + i));
    return (
      <g key={i} transform={`${p.pos} rotate(${p.angle.toFixed(1)})`} opacity={vis}>
        <ellipse rx={r * p.z} ry={r} fill="#A63A16" opacity={0.75} />
        <ellipse rx={r * 0.55 * p.z} ry={r * 0.55} cx={-r * 0.08 * p.z} fill="#5A160A" />
      </g>
    );
  });

  const grains = GRAINS.map((g, i) => {
    const p = pointOnSphere(onSphere, g.lon + spin, g.lat, R, 0.05);
    if (!p) return null;
    const glow = 0.5 + 0.5 * Math.sin((tc * TURN) / g.per + g.phase);
    const r = R * g.r;
    return <ellipse key={i} rx={r * p.z} ry={r} transform={`${p.pos} rotate(${p.angle.toFixed(1)})`} fill={url(g.light ? 'grain' : 'grain-dark')} opacity={(0.15 + 0.4 * glow) * clamp(p.z / 0.4)} />;
  });

  return (
    <g>
      <defs>
        <radialGradient id={`${id}-corona`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={R * 1.3}>
          <stop offset={0.74} stopColor="#FFB23E" stopOpacity={0.95} />
          <stop offset={0.86} stopColor="#FF8A30" stopOpacity={0.5} />
          <stop offset={1} stopColor="#FF8A3D" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-body`} cx="0.5" cy="0.5" r="0.5" fx="0.4" fy="0.38">
          <stop offset={0} stopColor="#FFFBEA" />
          <stop offset={0.3} stopColor="#FFE680" />
          <stop offset={0.62} stopColor="#FFB23E" />
          <stop offset={0.86} stopColor="#F5872C" />
          <stop offset={1} stopColor="#E2552A" />
        </radialGradient>
        <radialGradient id={`${id}-limb`} cx="0.5" cy="0.5" r="0.5">
          <stop offset={0.72} stopColor="#D2381E" stopOpacity={0} />
          <stop offset={1} stopColor="#C2301A" stopOpacity={0.55} />
        </radialGradient>
        <radialGradient id={`${id}-grain`}>
          <stop offset={0} stopColor="#FFF6C8" stopOpacity={0.9} />
          <stop offset={1} stopColor="#FFF6C8" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-grain-dark`}>
          <stop offset={0} stopColor="#E8602A" stopOpacity={0.8} />
          <stop offset={1} stopColor="#E8602A" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-plasma`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={R * 1.5}>
          <stop offset={0.64} stopColor="#FFB040" />
          <stop offset={0.78} stopColor="#FF6A26" />
          <stop offset={1} stopColor="#D8301C" />
        </radialGradient>
        <clipPath id={`${id}-disc`}>
          <circle r={R} />
        </clipPath>
      </defs>

      <Halo id={id} r={size * 0.5} color={[[0.55, '#FFB547', 0.5], [0.75, '#FF9A3C', 0.16], [1, '#FF8A3D', 0]]} opacity={0.8 + 0.2 * pulse} />
      <path d={wavy(R, 1.16 + 0.015 * pulse, [[0.025, 4, tc * 0.25], [0.015, 7, -tc * 0.4 + 1]])} fill={url('corona')} opacity={0.35} />
      <path d={wavy(R, 1.08 + 0.01 * pulse, [[0.025, 6, -tc * 0.5 + 2], [0.015, 11, tc * 0.7]])} fill={url('corona')} opacity={0.8} />

      {PROMINENCES.map((p, i) => (
        <g key={i}>
          <path d={arc(p)} fill="none" stroke="#FF6A2A" strokeWidth={R * 0.1} strokeLinejoin="round" opacity={0.3} />
          <path d={arc(p)} fill={url('plasma')} />
        </g>
      ))}

      <circle r={R} fill={url('body')} />
      <g clipPath={url('disc')}>
        {grains}
        {spots}
        <circle r={R} fill={url('limb')} />
      </g>

      <RimLight id={id} R={R} color="#FFE9A8" strength={0.95} />
      <Highlight id={id} R={R} />
    </g>
  );
}
