// The engine that draws and animates a data drawing. Everything comes from t (deterministic). Depth: each layer becomes
// chunks with a z (the z adds up with the parent's) and the whole drawing is sorted at once, so z works across groups.
// An orbiting layer counts as z − 0.5 on the back half and z + 0.5 on the front; an `orbit` with `depth` splits its stroke.
// `clip` is a clipPath in the parent space, set on the shape itself: Chrome ignores a clipPath on a transformed <g>.
import React from 'react';

import { isAlive, isFront, layerState, orbitOf, reshape, splitScattered, type LayerState } from '../geometry/behaviors.ts';
import { expandPart, expandRepeats, groundShadowOf, lightOf, resolveAnchors, resolveMaterial } from '../geometry/layout.ts';
import { num } from '../geometry/math.ts';
import { measures } from '../geometry/measures.ts';
import type { Drawing, Layer, Marked, Trail } from '../geometry/schema.ts';
import { traitsOf } from '../geometry/shapes.ts';
import { expandFigure } from '../geometry/skeleton.ts';
import { paletteColor } from '../palette.ts';
import type { DrawingProps } from '../types.ts';
import { Halo } from './blocks.tsx';
import { layerColor, mix, tint } from './color.ts';
import type { Ctx } from './context.ts';
import { finish, glowStops, paint, texture, textureDefs } from './paint.tsx';
import { particlesSvg } from './particles.tsx';
import { shape } from './shapes.tsx';
import { sphereSvg } from './sphere.tsx';

/** Trail of an orbiting layer: stroke layers that get shorter and thicker; together, they thin out behind the body. */
function trail(c: Layer, s: LayerState, ctx: Ctx, front: boolean, base: string) {
  if (!c.trail || !s.orbit) return null;
  const o = s.orbit.o;
  const tr: Trail = typeof c.trail === 'object' ? c.trail : {};
  const { rx, ry, rot, direction } = orbitOf(o);
  const [totalArc, width] = [num(tr.arc, 0.9), num(tr.width, 4.5)];
  const color = tr.color ? paletteColor(ctx.palette, tr.color) : base;
  const [LAYERS, STEPS] = [5, 14];
  const point = (a: number) => `${(rx * Math.cos(a)).toFixed(2)} ${(ry * Math.sin(a)).toFixed(2)}`;
  const lines = Array.from({ length: LAYERS }, (_, k) => {
    const fr = 1 - k / LAYERS;
    let d = '';
    for (let j = 0; j < STEPS; j++) {
      const [a0, a1] = [s.orbit!.a - (direction * totalArc * fr * j) / STEPS, s.orbit!.a - (direction * totalArc * fr * (j + 1)) / STEPS];
      if (isFront((a0 + a1) / 2) !== front) continue;
      d += `M${point(a0)}L${point(a1)}`;
    }
    return d ? <path key={k} d={d} fill="none" stroke={color} strokeWidth={width * (0.35 + 0.55 * (1 - fr))} opacity={num(tr.opacity, 0.22)} /> : null;
  });
  return <g transform={`translate(${num(c.x, 0)} ${num(c.y, 0)}) rotate(${rot})`}>{lines}</g>;
}

type Level = { transform?: string; opacity?: number; clip?: React.ReactNode };
type Chunk = { z: number; i: number; node: React.ReactNode };

const wrap = (levels: Level[], node: React.ReactNode, key: string) => (
  <g key={key}>
    {levels.reduceRight<React.ReactNode>((inside, q, k) => {
      if (!q.clip) return <g transform={q.transform} opacity={q.opacity}>{inside}</g>;
      const cid = `${key}-r${k}`;
      return (
        <g clipPath={`url(#${cid})`}>
          <clipPath id={cid}>{q.clip}</clipPath>
          {inside}
        </g>
      );
    }, node)}
  </g>
);

const transformOf = (s: LayerState, flip?: boolean) => `translate(${s.x.toFixed(2)} ${s.y.toFixed(2)}) rotate(${s.rot.toFixed(2)} ${s.center[0]} ${s.center[1]}) scale(${(flip ? -s.scale : s.scale).toFixed(4)} ${(s.scale * s.sy).toFixed(4)})`;

function silhouette(c0: Layer, ctx: Ctx) {
  const c = reshape(resolveMaterial(c0), ctx);
  const s = layerState(c, ctx);
  const node = c.shape === 'sphere' ? <circle r={measures(c).r} /> : shape(c, {}, ctx);
  // clipPath does not accept <g>: the transform goes on the shape itself
  return React.isValidElement(node) && node.type !== React.Fragment ? React.cloneElement(node as React.ReactElement<{ transform?: string }>, { transform: transformOf(s, c.flip) }) : null;
}

function collect(cs0: Layer[], ctx: Ctx, path: string, levels: Level[], zParent: number, colorParent: string | undefined, aliveParent: boolean, out: Chunk[]) {
  const siblings = resolveAnchors(cs0);
  const byId = new Map(siblings.flatMap((c) => (c.id ? [[c.id, c] as const] : [])));
  expandRepeats(siblings).forEach((c0, i) => {
    const p = expandPart(c0);
    const clock = c0.lag ? { ...ctx, t: ctx.t - c0.lag } : ctx;
    // inside a mirrored layer the light is mirrored too, so on screen it stays where it was
    const here = p.flip ? { ...clock, light: -clock.light } : clock;
    let c = reshape(resolveMaterial(expandFigure(p, here.tc)), here);
    const colorChildren = c0.use ? (p.color ?? colorParent) : colorParent;
    if (c.color === undefined && colorParent) c = { ...c, color: colorParent };
    const id = `${path}-${i}`;
    const uid = `${ctx.id}${id}`;
    const alive = aliveParent || isAlive(c);
    const loose = traitsOf(c.shape).scattered;
    const s = layerState(loose ? { ...c, animate: splitScattered(c).set } : c, here);
    const z = zParent + num(c.z, 0);
    const shaded = (c as Marked).dim;
    const lit = tint(ctx.palette, layerColor(ctx.palette, c.color), s.shifts);
    const base = shaded ? mix(lit, '#000000', shaded) : lit;
    const own: Level = { transform: transformOf(s, c.flip), opacity: s.opacity };
    const ref = c.clip ? byId.get(c.clip) : undefined;
    const clip = ref ? silhouette(ref, here) : null;
    const outer = clip ? [...levels, { clip }] : levels;
    const put = (dz: number, node: React.ReactNode, k: string) => out.push({ z: z + dz, i: out.length, node: wrap(outer, node, `${uid}${k}`) });
    const content = (half?: 'back' | 'front') => {
      if (c.shape === 'sphere') return sphereSvg(c, here, uid, s, base);
      if (loose) return particlesSvg(c, here, uid, s);
      const { defs, props } = paint(c, here, uid, s.drawn, base, s.shifts);
      if (c.material === 'glow' && c.shape === 'circle') return <Halo id={uid} r={measures(c).r} color={glowStops(base, c.core && paletteColor(ctx.palette, c.core))} />;
      return (
        <>
          {defs && half !== 'front' ? <defs>{defs}</defs> : null}
          {shape(c, props, here, half, s.drawn)}
          {s.drawn < 1 ? null : texture(c, here, uid, alive)}
          {finish(c, here, uid, base)}
        </>
      );
    };
    const body = (half?: 'back' | 'front') => (
      <g transform={own.transform} opacity={own.opacity}>
        {content(half)}
      </g>
    );
    let dz = 0;
    if (c.shape === 'orbit' && c.depth) {
      put(-0.5, body('back'), 't');
      put(0.5, body('front'), 'f');
    } else {
      if (s.orbit) {
        dz = s.orbit.front ? 0.5 : -0.5;
        put(-0.5, trail(c, s, here, false, base), 'rt');
        put(0.5, trail(c, s, here, true, base), 'rf');
      }
      if (c.shape !== 'group') put(dz, body(), 'c');
    }
    if (c.children) collect(c.children, here, id, [...outer, own], z + dz, colorChildren, alive, out);
  });
}

export function DataDrawing({ d, t, tc, size, palette, options, id }: DrawingProps & { d: Drawing }) {
  const ctx: Ctx = { t, tc, palette, id, light: lightOf(d, options) };
  const chunks: Chunk[] = [];
  collect(d.layers, ctx, '', [], 0, undefined, false, chunks);
  const ground = groundShadowOf(d, options);
  return (
    <g transform={`scale(${size / 100})`}>
      {textureDefs(id, ctx.light)}
      {ground ? (
        <>
          <defs>
            <radialGradient id={`${id}-ground`}>
              <stop offset={0} stopColor="#1F2430" stopOpacity={0.24} />
              <stop offset={0.55} stopColor="#1F2430" stopOpacity={0.12} />
              <stop offset={1} stopColor="#1F2430" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={ground.x.toFixed(2)} cy={ground.y.toFixed(2)} rx={ground.rx.toFixed(2)} ry={ground.ry.toFixed(2)} fill={`url(#${id}-ground)`} />
        </>
      ) : null}
      {chunks.sort((a, b) => a.z - b.z || a.i - b.i).map((p) => p.node)}
    </g>
  );
}
