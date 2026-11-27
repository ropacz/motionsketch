// Living Earth (original drawing, in the spirit of Kurzgesagt): ocean with volume, stylized continents spinning on a
// as a rim light. Night (`night`) falls as a terminator that covers part of the planet and
// lights up the cities; ice (`ice`) makes the caps grow. Both arrive slowly (S curve), at `nightAt` and `iceAt`.
// Style sheet:
// - palette: dominant ocean blue (#2B7BD6), leaf green (#5DB35E) and sand (#E2C27A) on the continents, white for
//   clouds and ice, sky blue (#9BDCFF) for the atmosphere, amber (#FFD36B) for the cities. Real Earth colors, stylized;
//   amber is the only warm one, so the city lights pop on the dark side.
// - light: the Sun, at the top left; night falls on the bottom right.
// - shape: organic (rounded spots), inside a perfect circle.
// Options: night (0 to 1, 0), ice (0 to 1, 0), nightAt/iceAt (seconds after the entrance when each one arrives).

import { random, arrival, clamp } from '../../engine/motion.ts';
import type { DrawingProps } from '../../engine/types.ts';
import { DEG, TURN, num } from '../../engine/geometry/math.ts';
import { Halo, RimLight, Highlight } from '../../engine/render/blocks.tsx';
import { type LonLat, sphere, shapeOnSphere } from '../../engine/geometry/sphere.ts';
import { catmullRom } from '../../engine/geometry/outline.ts';

const proj = sphere(22, -18); // the north pole tilted toward us and the axis tilted in the screen plane
const SHADOW = 32 * DEG; // where night advances (bottom right, opposite the light)
const onScreen = (pts: LonLat[], spin: number, R: number, dx = 0, dy = 0) => shapeOnSphere(proj, pts, spin, R, dx, dy);

// Stylized continents (not a map): the rough outline of each one and the spots inside (desert and forest).
const LANDS: LonLat[][] = [
  [[-165, 62], [-140, 70], [-100, 72], [-75, 66], [-60, 52], [-78, 40], [-82, 28], [-97, 18], [-86, 12], [-105, 22], [-118, 32], [-125, 46], [-142, 58]],
  [[-80, 10], [-62, 10], [-50, 0], [-35, -7], [-40, -22], [-55, -35], [-66, -52], [-73, -45], [-72, -25], [-80, -5]],
  [[-56, 62], [-42, 60], [-22, 70], [-24, 80], [-50, 82], [-62, 76]],
  [[-17, 15], [-12, 30], [-6, 36], [10, 37], [30, 32], [42, 12], [51, 10], [40, -15], [32, -30], [20, -35], [12, -18], [9, 0], [-8, 5]],
  [[44, -13], [50, -15], [48, -25], [44, -23]],
  [[-10, 37], [-9, 44], [-4, 50], [6, 58], [20, 70], [40, 68], [48, 56], [46, 42], [32, 38], [22, 37], [10, 43], [0, 41]],
  [[40, 42], [36, 62], [60, 72], [100, 76], [140, 72], [172, 66], [160, 57], [140, 50], [126, 38], [120, 24], [106, 9], [96, 18], [80, 8], [72, 20], [58, 25], [50, 13], [42, 16], [36, 32]],
  [[114, -22], [122, -14], [135, -12], [143, -11], [153, -26], [147, -38], [135, -34], [116, -34]],
].map((c) => catmullRom(c as LonLat[]));

const SAND: LonLat[][] = [
  [[-12, 18], [0, 28], [25, 28], [34, 20], [20, 13], [0, 14]],
  [[38, 28], [52, 30], [57, 21], [47, 15], [40, 20]],
  [[120, -22], [134, -18], [143, -24], [133, -31], [122, -28]],
  [[-115, 38], [-104, 40], [-102, 30], [-112, 28]],
].map((c) => catmullRom(c as LonLat[]));

const FOREST: LonLat[][] = [
  [[-72, -2], [-55, 2], [-46, -6], [-58, -15], [-70, -11]],
  [[60, 58], [100, 64], [132, 61], [112, 52], [72, 52]],
  [[10, 4], [25, 4], [30, -8], [18, -12], [12, -4]],
  [[-95, 52], [-75, 56], [-68, 48], [-88, 46]],
].map((c) => catmullRom(c as LonLat[]));

/** Point inside a polygon (longitude and latitude). */
function inside([x, y]: LonLat, poly: LonLat[]) {
  let yes = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) yes = !yes;
  }
  return yes;
}

/** City lights: random points on land (without Greenland), stable by seed; a few big cities. */
const CITIES = (() => {
  const a = random(41);
  const list: { lon: number; lat: number; big: boolean; per: number; phase: number }[] = [];
  while (list.length < 110) {
    const p: LonLat = [a() * 360 - 180, -40 + a() * 100];
    if (LANDS.some((t, i) => i !== 2 && inside(p, t))) list.push({ lon: p[0], lat: p[1], big: a() < 0.18, per: 2.5 + a() * 2.5, phase: a() * TURN });
  }
  return list;
})();

/** Clouds: spots stretched along the latitude (center, half width and half height in degrees) that breathe. */
const CLOUDS = (() => {
  const a = random(17);
  const base: [number, number, number, number][] = [
    [-150, 38, 15, 8], [-95, 8, 12, 6], [-40, 44, 16, 7], [-10, -12, 10, 6], [35, 50, 14, 6], [70, -8, 15, 6],
    [120, 30, 12, 8], [160, -30, 16, 7], [-120, -40, 18, 6], [10, -45, 18, 6], [95, 44, 13, 5], [-60, -28, 9, 7],
    [-175, -5, 11, 6], [-20, 20, 9, 5], [140, 5, 10, 6],
  ];
  return base.map(([lon, lat, dl, df]) => ({ lon, lat, dl: dl / Math.cos(lat * DEG), df, f1: a() * TURN, f2: a() * TURN, per: 5 + a() * 4 }));
})();

function cloud(n: (typeof CLOUDS)[number], t: number, k: number): LonLat[] {
  const pts: LonLat[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * TURN;
    const r = 1 + 0.12 * Math.sin(4 * a + n.f1) + 0.08 * Math.sin(7 * a + n.f2 + (t * TURN) / n.per);
    pts.push([n.lon + n.dl * k * r * Math.cos(a), n.lat + n.df * k * r * Math.sin(a)]);
  }
  return pts;
}

/** Polar cap: the circle of latitude `lat` with a wavy edge (closed around the pole). */
function cap(lat: number, t: number): LonLat[] {
  const sign = Math.sign(lat);
  return Array.from({ length: 72 }, (_, i) => {
    const lon = i * 5;
    return [lon, lat - sign * (2.2 * Math.sin(6 * lon * DEG + 1) + 1.2 * Math.sin(11 * lon * DEG + t * 0.25))] as LonLat;
  });
}

export function Earth({ t, tc, size, options, id }: DrawingProps) {
  const R = size * 0.4; // with the atmosphere and the halo, it fits in size
  const u = size / 500;
  const url = (name: string) => `url(#${id}-${name})`;
  // night and ice arrive `nightAt`/`iceAt` seconds after the entrance (default: right after, a pause before the reveal)
  const night = clamp(num(options.night, 0)) * arrival(t, num(options.nightAt, 0.5), 1.6);
  const ice = clamp(num(options.ice, 0)) * arrival(t, num(options.iceAt, 0.9), 1.8);
  const spin = -6 * tc; // degrees per second: the surface moves from left to right
  const cloudSpin = spin * 1.3 - 4;

  // terminator: the day/night boundary is half an ellipse; s = 1 (all day) to -1 (all night)
  const s = 1 - 2 * night;
  const half = (k: number) => {
    const rx = Math.abs(k) * R;
    return `M0 ${-R}A${rx.toFixed(1)} ${R} 0 0 ${k >= 0 ? 1 : 0} 0 ${R}A${R} ${R} 0 0 0 0 ${-R}Z`;
  };
  const nightLayers = night > 0.005 ? [-3, -2, -1, 0, 1, 2, 3].map((j) => half(clamp(s + j * 0.03, -1, 1))) : [];
  /** 0 in daylight, 1 deep in the night. */
  const dark = (x: number, y: number) => {
    if (night <= 0.005) return 0;
    const xs = x * Math.cos(SHADOW) + y * Math.sin(SHADOW);
    const ys = -x * Math.sin(SHADOW) + y * Math.cos(SHADOW);
    return clamp((xs - s * Math.sqrt(Math.max(0, R * R - ys * ys))) / (0.14 * R));
  };

  const lands = LANDS.map((c) => onScreen(c, spin, R));
  const sand = SAND.map((c) => onScreen(c, spin, R));
  const forest = FOREST.map((c) => onScreen(c, spin, R));
  const clouds = CLOUDS.map((n) => ({ edge: cloud(n, tc, 1.2), core: cloud(n, tc, 0.88), vis: clamp((proj(n.lon + cloudSpin, n.lat, 1).z + 0.05) / 0.4) }));
  const latNorth = 76 - 42 * ice;
  const latSouth = -72 + 42 * ice;

  const cities = CITIES.map((c, i) => {
    const p = proj(c.lon + spin, c.lat, R);
    if (p.z <= 0.08) return null;
    const k = dark(p.x, p.y) * clamp((p.z - 0.08) / 0.3);
    if (k <= 0.02) return null;
    const blink = 0.72 + 0.28 * Math.sin((t * TURN) / c.per + c.phase);
    const r = (c.big ? 5.5 : 3.2) * u;
    return (
      <g key={i} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`} opacity={k * blink}>
        <circle r={r * 2.4} fill={url('city')} />
        <circle r={r * 0.5} fill="#FFF6D2" />
      </g>
    );
  });

  return (
    <g>
      <defs>
        <radialGradient id={`${id}-ocean`} cx="0.5" cy="0.5" r="0.5" fx="0.34" fy="0.3">
          <stop offset={0} stopColor="#6EC1F7" />
          <stop offset={0.45} stopColor="#2B7BD6" />
          <stop offset={0.85} stopColor="#1B4FA3" />
          <stop offset={1} stopColor="#163F86" />
        </radialGradient>
        {/* volume over everything on the surface: light on the light side, dark on the opposite side, deeper edge */}
        <radialGradient id={`${id}-volume`} cx="0.5" cy="0.5" r="0.5" fx="0.32" fy="0.28">
          <stop offset={0} stopColor="#FFFFFF" stopOpacity={0.2} />
          <stop offset={0.38} stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset={0.72} stopColor="#0B2A66" stopOpacity={0.12} />
          <stop offset={1} stopColor="#071A45" stopOpacity={0.55} />
        </radialGradient>
        <radialGradient id={`${id}-atmosphere`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={R * 1.1}>
          <stop offset={0.8} stopColor="#9BDCFF" stopOpacity={0} />
          <stop offset={0.895} stopColor="#9BDCFF" stopOpacity={0.55} />
          <stop offset={0.912} stopColor="#C8EEFF" stopOpacity={0.85} />
          <stop offset={0.95} stopColor="#9BDCFF" stopOpacity={0.3} />
          <stop offset={1} stopColor="#9BDCFF" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-ice`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={R}>
          <stop offset={0} stopColor="#FFFFFF" />
          <stop offset={1} stopColor="#D5ECFA" />
        </radialGradient>
        <radialGradient id={`${id}-city`}>
          <stop offset={0} stopColor="#FFE08A" stopOpacity={0.95} />
          <stop offset={0.4} stopColor="#FFC24A" stopOpacity={0.45} />
          <stop offset={1} stopColor="#FFB238" stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-disc`}>
          <circle r={R} />
        </clipPath>
      </defs>

      <Halo id={id} r={R * 1.25} color={[[0.6, '#7FCBFF', 0.35], [1, '#7FCBFF', 0]]} opacity={0.55 * (1 - 0.6 * night)} />

      <circle r={R} fill={url('ocean')} />
      <g clipPath={url('disc')}>
        <g fill="none" stroke="#7DD3F5" strokeWidth={9 * u} strokeLinejoin="round" opacity={0.45}>
          {lands.map((d, i) => (d ? <path key={i} d={d} /> : null))}
        </g>
        <g fill="#5DB35E">
          {lands.map((d, i) => (d ? <path key={i} d={d} /> : null))}
        </g>
        <g fill="#E2C27A" opacity={0.9}>
          {sand.map((d, i) => (d ? <path key={i} d={d} /> : null))}
        </g>
        <g fill="#3E8E4F" opacity={0.85}>
          {forest.map((d, i) => (d ? <path key={i} d={d} /> : null))}
        </g>
        <path d={onScreen(cap(latNorth, t), 0, R)} fill={url('ice')} />
        <path d={onScreen(cap(latSouth, t), 0, R)} fill={url('ice')} />
        <g fill="#0B2A66" opacity={0.1}>
          {clouds.map((n, i) => {
            const d = n.vis > 0 ? onScreen(n.core, cloudSpin, R, R * 0.018, R * 0.024) : '';
            return d ? <path key={i} d={d} opacity={n.vis} /> : null;
          })}
        </g>
        <g fill="#FFFFFF" opacity={0.3}>
          {clouds.map((n, i) => {
            const d = n.vis > 0 ? onScreen(n.edge, cloudSpin, R) : '';
            return d ? <path key={i} d={d} opacity={n.vis} /> : null;
          })}
        </g>
        <g fill="#FFFFFF" opacity={0.88}>
          {clouds.map((n, i) => {
            const d = n.vis > 0 ? onScreen(n.core, cloudSpin, R) : '';
            return d ? <path key={i} d={d} opacity={n.vis} /> : null;
          })}
        </g>
        <circle r={R} fill="#E6F4FF" opacity={0.16 * ice} />
        <circle r={R} fill={url('volume')} />
        <g transform={`rotate(${SHADOW / DEG})`} fill="#081033">
          {nightLayers.map((d, i) => (
            <path key={i} d={d} opacity={0.215} />
          ))}
        </g>
        {cities}
      </g>

      {/* thin atmosphere, rim light at the bottom right and the Sun's glint on the sea */}
      <circle r={R * 1.1} fill={url('atmosphere')} opacity={1 - 0.45 * night} />
      <RimLight id={id} R={R} color="#D6F4FF" strength={0.9} from={0.6} width={0.03} />
      <Highlight id={id} R={R} x={-0.38} y={-0.42} rx={0.22} ry={0.13} angle={-40} strength={0.6} opacity={0.75 * (1 - (0.8 * Math.max(0, night - 0.6)) / 0.4)} />
    </g>
  );
}
