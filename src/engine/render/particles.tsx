// Particles and spirals.
import React from 'react';

import { layerState, splitScattered, type LayerState } from '../geometry/behaviors.ts';
import { DEG, TURN, num } from '../geometry/math.ts';
import { measures, particleCount } from '../geometry/measures.ts';
import type { Layer } from '../geometry/schema.ts';
import { materialOf } from '../geometry/shapes.ts';
import { random, staggerDelays } from '../motion.ts';
import { paletteColor, type Palette } from '../palette.ts';
import { layerColor, mix, tint } from './color.ts';
import type { Ctx } from './context.ts';
import { glowGradient, volumeGradient } from './paint.tsx';

function spiralOf(c: Layer) {
  const [arms, turns, R] = [Math.max(1, Math.round(num(c.arms, 2))), num(c.turns, 1.2), measures(c).reach];
  return { arms, radiusAt: (u: number) => R * (0.06 + 0.94 * u), angleAt: (arm: number, u: number) => (arm / arms + u * turns) * TURN };
}

function particlePoints(c: Layer, palette: Palette) {
  const a = random(num(c.seed, 7));
  const g = () => a() + a() + a() - 1.5; // almost normal
  const n = particleCount(c);
  const R = measures(c).reach;
  const [t0, t1] = Array.isArray(c.size) ? c.size : (c.shape === 'spiral' ? [0.5, 1.4] : [0.8, 2]);
  const colors = (c.colors?.length ? c.colors : [c.color]).map((k) => layerColor(palette, k));
  const [spiral, spread] = [spiralOf(c), num(c.spread, 0.12)];
  return Array.from({ length: n }, (_, i) => {
    let [r, ang] = [0, 0];
    if (c.shape === 'spiral') {
      const u = a() ** 1.1;
      r = spiral.radiusAt(u) * (1 + spread * 0.6 * g());
      ang = spiral.angleAt(i % spiral.arms, u) + spread * 3 * g();
    } else {
      const d = c.distribution ?? 'disc';
      let [x, y] = [0, 0];
      if (d === 'disc') [r, ang] = [R * Math.sqrt(a()), a() * TURN];
      else if (d === 'ring') [r, ang] = [R - num(c.thickness, R * 0.3) * a(), a() * TURN];
      else if (d === 'sunflower') [r, ang] = [R * Math.sqrt((i + 0.5) / n), i * 137.508 * DEG];
      else if (d === 'band') [x, y] = [(a() - 0.5) * num(c.w, 2 * R), (a() - 0.5) * num(c.h, R * 0.5)];
      else [x, y] = [g() * R * 0.55, g() * R * 0.55];
      if (d === 'band' || d === 'cloud') [r, ang] = [Math.hypot(x, y), Math.atan2(y, x)];
    }
    return { r, ang, size: t0 + a() * (t1 - t0), color: colors[Math.floor(a() * colors.length) % colors.length], phase: a(), depth: a() };
  });
}

export function particlesSvg(c: Layer, ctx: Ctx, id: string, s: LayerState) {
  const R = measures(c).reach;
  const flatten = num(c.flatten, 1);
  const [spin, dif] = [num(c.spin, c.shape === 'spiral' ? 8 : 0), num(c.differential, c.shape === 'spiral' ? 0.35 : 0)];
  const spinAt = (r: number) => spin * (1 + dif * (1 - (2 * r) / R)) * ctx.tc * DEG;
  const edgeOn = flatten < 0.98;
  const lags = c.stagger === undefined ? null : staggerDelays(particleCount(c), c.stagger);
  const animate = splitScattered(c).each;
  const m = materialOf(c);
  if (c.shape === 'spiral' && m === 'stroke') {
    const spiral = spiralOf(c);
    const color = tint(ctx.palette, layerColor(ctx.palette, c.color), s.shifts);
    return Array.from({ length: spiral.arms }, (_, b) => {
      let d = '';
      for (let j = 0; j <= 60; j++) {
        const u = j / 60;
        const r = spiral.radiusAt(u);
        const ang = spiral.angleAt(b, u) + spinAt(r);
        d += `${j ? 'L' : 'M'}${(r * Math.cos(ang)).toFixed(2)} ${(r * Math.sin(ang) * flatten).toFixed(2)}`;
      }
      return <path key={b} d={d} fill="none" stroke={color} strokeWidth={num(c.lineWidth, 1.2)} strokeLinecap="round" />;
    });
  }
  const [ids, defs] = [new Map<string, string>(), [] as React.ReactNode[]];
  const fillFor = (color: string) => {
    if (m === 'flat') return color;
    if (!ids.has(color)) {
      const gid = `${id}-p${ids.size}`;
      ids.set(color, gid);
      defs.push(m === 'volume' ? volumeGradient(gid, color, ctx.light) : glowGradient(gid, color, c.core && paletteColor(ctx.palette, c.core)));
    }
    return `url(#${ids.get(color)})`;
  };
  const depth = c.depth;
  const list = particlePoints(c, ctx.palette)
    .map((p, i) => {
      const ang = p.ang + spinAt(p.r);
      const pr = edgeOn ? 0.5 + 0.5 * Math.sin(ang) : p.depth;
      const own = animate?.map((a) => ({ ...a, phase: num(a.phase, 0) + p.phase }));
      const q = layerState({ shape: 'circle', x: p.r * Math.cos(ang), y: p.r * Math.sin(ang) * flatten, animate: own }, lags ? { ...ctx, t: ctx.t - lags[i] } : ctx);
      const base = tint(ctx.palette, p.color, [...s.shifts, ...q.shifts]);
      const color = depth ? mix(base, '#2A3140', 0.5 * (1 - pr)) : base;
      const size = p.size * q.scale * (depth ? 0.55 + 0.45 * pr : 1);
      return { pr, node: <circle cx={q.x.toFixed(2)} cy={q.y.toFixed(2)} r={size.toFixed(2)} fill={fillFor(color)} opacity={q.opacity * (depth ? 0.55 + 0.45 * pr : 1)} /> };
    })
    .sort((a, b) => (depth ? a.pr - b.pr : 0));
  return (
    <>
      {defs.length ? <defs>{defs}</defs> : null}
      {list.map((p, i) => React.cloneElement(p.node, { key: i }))}
    </>
  );
}
