// the tilted accretion disc spinning (the inner bands move faster, as in an orbit), the back half of the disc
// bent over the shadow by gravitational lensing (the arc of the Interstellar and NASA images), the side coming
// Options: tilt (degrees above the disc plane, 15).

import { random } from '../../engine/motion.ts';
import type { DrawingProps } from '../../engine/types.ts';
import { DEG, num } from '../../engine/geometry/math.ts';

const HOT = ['#FFFFFF', '#FFF2B8', '#FFD36B', '#FFB347'];

/** Bands and blobs of the disc (radius, arc in degrees, thickness, color, opacity and phase), stable by seed. */
function bands(seed: number, n: number, r0: number, r1: number) {
  const a = random(seed);
  return Array.from({ length: n }, () => {
    const r = r0 + (r1 - r0) * Math.pow(a(), 1.4);
    return { r, arc: 18 + a() * 70, w: 0.6 + a() * 1.8, color: HOT[Math.floor(a() * HOT.length)], op: 0.35 + a() * 0.5, phase: a() * 360 };
  });
}

/** Annulus between two circles (the outer one can be shifted in y), to fill with evenodd. */
const annulus = (a: number, b: number, dy = 0) =>
  `M${-b} ${dy}a${b} ${b} 0 1 0 ${2 * b} 0a${b} ${b} 0 1 0 ${-2 * b} 0ZM${-a} 0a${a} ${a} 0 1 1 ${2 * a} 0a${a} ${a} 0 1 1 ${-2 * a} 0Z`;

export function BlackHole({ t, tc, size, palette, options, id }: DrawingProps) {
  const k = Math.sin(Math.max(5, Math.min(60, num(options.tilt, 15))) * DEG); // disc flattening
  const rs = size * 0.15; // shadow
  const ri = rs * 1.45; // inner edge of the disc
  const ro = size * 0.49; // outer edge of the disc
  // lens arc: around the shadow, thick at the top (the back of the disc) and thin at the bottom
  const [l0, l1] = [rs * 1.05, rs * 1.4];
  const lift = (l1 - l0) * 0.55;
  const u = size / 520; // thicknesses follow the size
  // orbit: the closer, the faster (degrees per second); the sign makes the front of the disc move right
  const spinAt = (r: number) => -75 * Math.pow(ri / r, 1.5) * tc;
  const pulse = 0.82 + 0.18 * Math.sin((t * 2 * Math.PI) / 4.5);
  const url = (name: string) => `url(#${id}-${name})`;

  const Bands = ({ list }: { list: ReturnType<typeof bands> }) => (
    <>
      {list.map((f, i) => {
        const c = 2 * Math.PI * f.r;
        const d = (c * f.arc) / 360;
        return (
          <circle
            key={i}
            r={f.r}
            fill="none"
            stroke={f.color}
            strokeWidth={f.w * u * 3}
            strokeLinecap="round"
            strokeDasharray={`${d} ${c - d}`}
            opacity={f.op}
            transform={`rotate(${f.phase + spinAt(f.r)})`}
          />
        );
      })}
    </>
  );

  // the disc seen from above (circles), flattened by the tilt; Doppler is a fixed layer on top
  const Disc = () => (
    <g transform={`scale(1 ${k})`}>
      <path d={annulus(ri * 0.99, ro)} fillRule="evenodd" fill={url('disc')} />
      <Bands list={bands(11, 26, ri * 1.02, ro * 0.9)} />
      <path d={annulus(ri * 0.98, ro * 0.86)} fillRule="evenodd" fill={url('doppler')} />
    </g>
  );

  const stars = Array.from({ length: 7 }, (_, i) => {
    const a = random(50 + i);
    const ang = (i / 7) * 360 + a() * 30;
    const dist = 0.62 + a() * 0.3;
    return { x: Math.cos(ang * DEG) * size * 0.5 * dist, y: Math.sin(ang * DEG) * size * 0.34 * dist, s: (0.7 + a() * 0.6) * 9 * u, phase: a() * 6 };
  });

  return (
    <g>
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#FFB04A" stopOpacity={0.55} />
          <stop offset="0.45" stopColor="#FF8A3D" stopOpacity={0.22} />
          <stop offset="1" stopColor="#FF6A2A" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-disc`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={ro}>
          <stop offset={ri / ro - 0.01} stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset={ri / ro} stopColor="#FFFFFF" />
          <stop offset={ri / ro + 0.07} stopColor="#FFF1B0" />
          <stop offset="0.55" stopColor="#FFB23E" />
          <stop offset="0.8" stopColor="#EE5A22" />
          <stop offset="0.93" stopColor="#C2301A" stopOpacity={0.7} />
          <stop offset="1" stopColor="#C2301A" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-doppler`} gradientUnits="userSpaceOnUse" x1={-ro} y1={0} x2={ro} y2={0}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.45} />
          <stop offset="0.42" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.58" stopColor="#7A0E0A" stopOpacity={0} />
          <stop offset="1" stopColor="#7A0E0A" stopOpacity={0.4} />
        </linearGradient>
        <radialGradient id={`${id}-lens`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={l1 + lift}>
          <stop offset={l0 / (l1 + lift)} stopColor="#FFFFFF" />
          <stop offset={(l0 + rs * 0.12) / (l1 + lift)} stopColor="#FFE38C" />
          <stop offset={(l1 + lift * 0.3) / (l1 + lift)} stopColor="#FF9E3A" />
          <stop offset="1" stopColor="#F0602A" stopOpacity={0.15} />
        </radialGradient>
        {/* the lens dims a bit at the bottom (the lower image is fainter) */}
        <linearGradient id={`${id}-lens-g`} gradientUnits="userSpaceOnUse" x1={0} y1={-l1} x2={0} y2={l1}>
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#F0F0F0" />
          <stop offset="1" stopColor="#A0A0A0" />
        </linearGradient>
        <mask id={`${id}-lens-m`} maskUnits="userSpaceOnUse" x={-size} y={-size} width={size * 2} height={size * 2}>
          <path d={annulus(l0, l1, -lift)} fillRule="evenodd" fill={url('lens-g')} />
        </mask>
        <clipPath id={`${id}-front`}>
          <rect x={-size} y={0} width={size * 2} height={size} />
        </clipPath>
      </defs>

      <ellipse rx={size * 0.5} ry={size * 0.36} fill={url('glow')} opacity={pulse} />

      {/* twinkling stars */}
      {stars.map((s, i) => {
        const b = 0.5 + 0.5 * Math.sin(t * 2.2 + s.phase);
        const r = s.s * (0.55 + 0.45 * b);
        return (
          <path
            key={i}
            d={`M${s.x} ${s.y - r}Q${s.x} ${s.y} ${s.x + r} ${s.y}Q${s.x} ${s.y} ${s.x} ${s.y + r}Q${s.x} ${s.y} ${s.x - r} ${s.y}Q${s.x} ${s.y} ${s.x} ${s.y - r}Z`}
            fill={palette.accent}
            opacity={0.45 + 0.55 * b}
          />
        );
      })}

      <g transform="rotate(-8)">
        <Disc />
        <circle r={rs} fill="#050409" />
        {/* lens arc: the back of the disc bent around the shadow, spinning with it */}
        <g mask={url('lens-m')}>
          <circle r={l1 + lift} fill={url('lens')} />
          <Bands list={bands(29, 12, l0 * 1.06, l1 * 1.1)} />
        </g>
        {/* photon ring */}
        <circle r={rs * 1.02} fill="none" stroke="#FFE7A8" strokeWidth={6 * u} opacity={0.45} />
        <circle r={rs * 1.02} fill="none" stroke="#FFFFFF" strokeWidth={2.2 * u} />
        <g clipPath={url('front')}>
          <Disc />
        </g>
      </g>
    </g>
  );
}
