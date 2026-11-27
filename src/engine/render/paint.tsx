// How a shape is painted and finished: materials, the light on its volume, textures and the highlight.
import React from 'react';

import { shapeBox } from '../geometry/layout.ts';
import { DEG, frac, num } from '../geometry/math.ts';
import type { Layer } from '../geometry/schema.ts';
import { materialOf, traitsOf } from '../geometry/shapes.ts';
import { random } from '../motion.ts';
import { paletteColor } from '../palette.ts';
import { Highlight, RimLight, rimClip } from './blocks.tsx';
import { mix, tint } from './color.ts';
import type { Ctx } from './context.ts';
import type { ColorShift } from '../geometry/behaviors.ts';
import { shape } from './shapes.tsx';

/** An offset designed for the light at the top left (−45°), rotated to the drawing's light. */
export function toLight([x, y]: [number, number], light: number): [number, number] {
  const g = (light + 45) * DEG;
  return [x * Math.cos(g) - y * Math.sin(g), x * Math.sin(g) + y * Math.cos(g)];
}

export const volumeGradient = (id: string, base: string, light: number) => {
  const [c, f] = [toLight([-0.07, -0.07], light), toLight([-0.18, -0.22], light)].map((v) => v.map((q) => (0.5 + q).toFixed(3)));
  return (
    <radialGradient key={id} id={id} cx={c[0]} cy={c[1]} r="0.68" fx={f[0]} fy={f[1]}>
      <stop offset={0} stopColor={mix(base, '#FFFFFF', 0.55)} />
      <stop offset={0.3} stopColor={mix(base, '#FFFFFF', 0.16)} />
      <stop offset={0.62} stopColor={base} />
      <stop offset={1} stopColor={mix(base, '#000000', 0.4)} />
    </radialGradient>
  );
};

export function finish(c: Layer, ctx: Ctx, id: string, base: string) {
  if (materialOf(c) !== 'volume' || traitsOf(c.shape).noFinish) return null;
  const k = shapeBox(c);
  if (!k) return null;
  const [hw, hh] = [(k.x1 - k.x0) / 2, (k.y1 - k.y0) / 2];
  const R = Math.min(hw, hh);
  if (R < 1.5) return null;
  const outlineOf = (props: Record<string, unknown>) => shape(c, props, ctx);
  const [ux, uy] = toLight([-0.38, -0.42], ctx.light);
  const [x, y] = [(k.x0 + k.x1) / 2 + ux * hw, (k.y0 + k.y1) / 2 + uy * hh];
  return (
    <>
      <RimLight id={id} R={R} color={mix(base, '#FFFFFF', 0.6)} strength={0.6} from={0.5} width={0.06} light={ctx.light} shape={outlineOf} />
      <g clipPath={`url(#${rimClip(id)})`}>
        <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}>
          <Highlight id={id} R={R} x={0} y={0} rx={0.3} ry={0.19} angle={ctx.light + 10} opacity={0.6} />
        </g>
      </g>
    </>
  );
}
const textureOf = (c: Layer) => (c.texture === false ? null : (c.texture ?? (materialOf(c) === 'volume' ? 'grain' : null)));

function lightAxis(light: number) {
  const [lx, ly] = [0.5 * Math.sin(light * DEG), -0.5 * Math.cos(light * DEG)];
  return { x1: 0.5 + lx, y1: 0.5 + ly, x2: 0.5 - lx, y2: 0.5 - ly };
}
const white = (o: number, a: number, k: number) => <stop key={k} offset={o} stopColor="#FFFFFF" stopOpacity={a} />;

export const textureFill = (drawingId: string, name: 'grain' | 'brushed' | 'fibers' | 'glare') => `url(#${drawingId}-${name})`;

/**
 * Light textures, once per drawing: dotted grain (volume), brushed fibers (metal), a diagonal glare in the
 * light direction (glass). Patterns and gradients, no filters.
 */
/** Patterns and gradients, no filters: filters are slow to render. */
export function textureDefs(id: string, light: number) {
  const a = random(11);
  const grain = Array.from({ length: 28 }, (_, i) => <circle key={i} cx={(a() * 7).toFixed(2)} cy={(a() * 7).toFixed(2)} r={(0.14 + a() * 0.16).toFixed(2)} fill={i % 3 ? '#000000' : '#FFFFFF'} opacity={i % 3 ? 0.05 : 0.08} />);
  const b = random(5);
  const stripes = Array.from({ length: 11 }, (_, i) => white(i / 10, i % 4 === 1 ? 0 : 0.06 + 0.22 * b(), i));
  return (
    <defs>
      <pattern id={`${id}-grain`} patternUnits="userSpaceOnUse" width={7} height={7}>{grain}</pattern>
      <pattern id={`${id}-fibers`} patternUnits="userSpaceOnUse" width={10} height={0.9}>
        <rect width={10} height={0.22} fill="#FFFFFF" opacity={0.2} />
        <rect y={0.5} width={10} height={0.14} fill="#000000" opacity={0.07} />
      </pattern>
      <linearGradient id={`${id}-brushed`} x1={0} y1={0} x2={0} y2={1}>{stripes}</linearGradient>
      <linearGradient id={`${id}-glare`} {...lightAxis(light)}>
        {[[0.16, 0], [0.2, 0.42], [0.29, 0.42], [0.32, 0], [0.37, 0], [0.39, 0.26], [0.42, 0]].map(([o, op], i) => white(o, op, i))}
      </linearGradient>
    </defs>
  );
}

export function texture(c: Layer, ctx: Ctx, id: string, alive: boolean) {
  const kind = textureOf(c);
  if (!kind || traitsOf(c.shape).noFinish) return null;
  const cover = (fill: string, k: string) => <React.Fragment key={k}>{shape(c, { fill }, ctx)}</React.Fragment>;
  const fill = kind === 'grain' ? [cover(textureFill(ctx.id, 'grain'), 'g')] : kind === 'brushed' ? [cover(textureFill(ctx.id, 'brushed'), 'e'), cover(textureFill(ctx.id, 'fibers'), 'f')] : [cover(textureFill(ctx.id, 'glare'), 'r')];
  let sweep = null;
  if (alive && kind !== 'grain') {
    const p = frac(ctx.tc / 6 + [...id].reduce((h, ch) => h * 0.61 + ch.charCodeAt(0) * 0.137, 0));
    if (p < 0.3) {
      const e = lightAxis(ctx.light);
      const shift = -1 + (2 * p) / 0.3;
      const [dx, dy] = [(e.x2 - e.x1) * shift, (e.y2 - e.y1) * shift];
      sweep = (
        <>
          <defs>
            <linearGradient id={`${id}-sweep`} x1={e.x1 + dx} y1={e.y1 + dy} x2={e.x2 + dx} y2={e.y2 + dy}>
              {[[0.4, 0], [0.5, 0.5], [0.6, 0]].map(([o, op], i) => white(o, op, i))}
            </linearGradient>
          </defs>
          {cover(`url(#${id}-sweep)`, 'p')}
        </>
      );
    }
  }
  return (
    <>
      {fill}
      {sweep}
    </>
  );
}

function strokeGradient(c: Layer, id: string, base: string, light: number) {
  if (traitsOf(c.shape).plainStroke) return null;
  const k = shapeBox(c);
  if (!k || Math.max(k.x1 - k.x0, k.y1 - k.y0) < 4) return null;
  const [cx, cy, R] = [(k.x0 + k.x1) / 2, (k.y0 + k.y1) / 2, Math.max(k.x1 - k.x0, k.y1 - k.y0) / 2];
  const [lx, ly] = [Math.sin(light * DEG) * R, -Math.cos(light * DEG) * R];
  return (
    <linearGradient key={id} id={id} gradientUnits="userSpaceOnUse" x1={(cx + lx).toFixed(2)} y1={(cy + ly).toFixed(2)} x2={(cx - lx).toFixed(2)} y2={(cy - ly).toFixed(2)}>
      <stop offset={0} stopColor={mix(base, '#FFFFFF', 0.4)} />
      <stop offset={0.5} stopColor={base} />
      <stop offset={1} stopColor={mix(base, '#000000', 0.2)} />
    </linearGradient>
  );
}

export const glowStops = (base: string, core?: string): [number, string, number][] => [[0, core ?? base, 1], [core ? 0.22 : 0.35, base, core ? 0.8 : 0.6], [1, base, 0]];
export const glowGradient = (id: string, base: string, core?: string) => (
  <radialGradient key={id} id={id}>
    {glowStops(base, core).map(([o, c, a], i) => <stop key={i} offset={o} stopColor={c} stopOpacity={a} />)}
  </radialGradient>
);

export function paint(c: Layer, ctx: Ctx, id: string, drawn: number, base: string, shifts: ColorShift[]) {
  const m = materialOf(c);
  const drawing = drawn < 1 ? { pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - drawn } : {};
  const outline = c.outline ? { stroke: paletteColor(ctx.palette, c.outline), strokeWidth: num(c.lineWidth, 0.8), ...drawing } : {};
  if (m === 'stroke') {
    const g = strokeGradient(c, id, base, ctx.light);
    return { defs: g, props: { fill: 'none', stroke: g ? `url(#${id})` : base, strokeWidth: num(c.lineWidth, 1.2), strokeLinecap: 'round' as const, ...drawing } };
  }
  const appear = drawn < 1 ? { fillOpacity: drawn } : {};
  if (m === 'volume') return { defs: volumeGradient(id, base, ctx.light), props: { fill: `url(#${id})`, ...outline, ...appear } };
  if (m === 'gradient') {
    const a = num(c.angle, 180) * DEG;
    const [from, to] = [typeof c.from === 'string' ? tint(ctx.palette, paletteColor(ctx.palette, c.from), shifts) : base, typeof c.to === 'string' ? tint(ctx.palette, paletteColor(ctx.palette, c.to), shifts) : mix(base, '#000000', 0.35)];
    const [sx, sy] = [0.5 * Math.sin(a), 0.5 * Math.cos(a)];
    const defs = (
      <linearGradient key={id} id={id} x1={0.5 - sx} y1={0.5 + sy} x2={0.5 + sx} y2={0.5 - sy}>
        <stop offset={0} stopColor={from} />
        <stop offset={1} stopColor={to} />
      </linearGradient>
    );
    return { defs, props: { fill: `url(#${id})`, ...outline, ...appear } };
  }
  if (m === 'glow') return { defs: glowGradient(id, base, c.core && paletteColor(ctx.palette, c.core)), props: { fill: `url(#${id})`, ...outline, ...appear } };
  return { defs: null, props: { fill: base, ...outline, ...appear } };
}
