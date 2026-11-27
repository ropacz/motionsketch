// Building blocks of every drawing (data or hand-made): the halo, the rim light and the highlight. Each block draws
// its own gradients under
// `${id}-halo`, `-rim`, `-rimclip` and `-highlight`: use each block once per id.
import type React from 'react';

import { DEG } from '../geometry/math.ts';

export type Stop = [number, string, number?];
const stops = (list: Stop[]) => list.map(([o, c, a], i) => <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />);

export function Halo({ id, r, color, opacity = 1 }: { id: string; r: number; color: Stop[]; opacity?: number }) {
  return (
    <>
      <defs>
        <radialGradient id={`${id}-halo`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={r}>
          {stops(color)}
        </radialGradient>
      </defs>
      <circle r={r} fill={`url(#${id}-halo)`} opacity={opacity} />
    </>
  );
}

/** The clip a `RimLight` with a `shape` defines: what else must stay inside that shape uses it too. */
export const rimClip = (id: string) => `${id}-rimclip`;

/**
 * Rim light: a ring on the outline that lights up on the side opposite the light (`light` in degrees, 0 at the top, clockwise;
 * −45 is top-left). Without `shape`, it is the circle of radius R; with `shape` (draws the silhouette with the given props), it is
 * its stroke clipped by itself, so only the inner half shows (R is the smaller half-size of the shape).
 */
export function RimLight({ id, R, color, strength, from = 0.55, width = 0.035, light = -45, shape }: { id: string; R: number; color: string; strength: number; from?: number; width?: number; light?: number; shape?: (props: Record<string, unknown>) => React.ReactNode }) {
  const [dx, dy] = [0.5 * Math.sin(light * DEG), -0.5 * Math.cos(light * DEG)];
  const stroke = { fill: 'none', stroke: `url(#${id}-rim)` };
  return (
    <>
      <defs>
        <linearGradient id={`${id}-rim`} x1={(0.5 + dx).toFixed(3)} y1={(0.5 + dy).toFixed(3)} x2={(0.5 - dx).toFixed(3)} y2={(0.5 - dy).toFixed(3)}>
          {stops([[0, color, 0], [from, color, 0], [1, color, strength]])}
        </linearGradient>
        {shape ? <clipPath id={rimClip(id)}>{shape({})}</clipPath> : null}
      </defs>
      {shape ? <g clipPath={`url(#${rimClip(id)})`}>{shape({ ...stroke, strokeWidth: 2 * R * width })}</g> : <circle r={R * 0.985} {...stroke} strokeWidth={R * width} />}
    </>
  );
}

/** Highlight: the specular glint at the top left (position and size as a fraction of the radius, rotated `angle` degrees). */
export function Highlight({ id, R, x = -0.36, y = -0.4, rx = 0.24, ry = 0.15, angle = -38, strength = 0.75, opacity = 0.7 }: { id: string; R: number; x?: number; y?: number; rx?: number; ry?: number; angle?: number; strength?: number; opacity?: number }) {
  const [cx, cy] = [R * x, R * y];
  return (
    <>
      <defs>
        <radialGradient id={`${id}-highlight`}>{stops([[0, '#FFFFFF', strength], [1, '#FFFFFF', 0]])}</radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={R * rx} ry={R * ry} transform={`rotate(${angle} ${cx} ${cy})`} fill={`url(#${id}-highlight)`} opacity={opacity} />
    </>
  );
}
