// The measures of each shape with the defaults filled in: boxes and renderer read from here, so they never diverge. Pure.
import { num } from './math.ts';
import { ORBIT_SIZE, type Layer } from './schema.ts';

export function measures(c: Layer) {
  const r = num(c.r, c.shape === 'sphere' ? 30 : 10);
  const [w, h] = c.shape === 'cloud' ? [40, 22] : c.shape === 'leaf' ? [10, 24] : c.shape === 'drop' ? [2 * r, 2.6 * r] : c.shape === 'trapezoid' ? [20, 14] : [20, 20];
  const [rx, ry] = c.shape === 'orbit' ? [ORBIT_SIZE.rx, ORBIT_SIZE.ry] : [12, 8];
  return {
    r,
    w: num(c.w, w),
    h: num(c.h, h),
    rx: num(c.rx, rx),
    ry: num(c.ry, ry),
    top: num(c.top, 12),
    bottom: num(c.bottom, 20),
    /** particles and spiral: the spread radius */
    reach: num(c.radius, 40),
    textSize: num(c.size, 20),
    from: (Array.isArray(c.from) ? c.from : [-20, 0]) as [number, number],
    to: (Array.isArray(c.to) ? c.to : [20, 0]) as [number, number],
  };
}

export const particleCount = (c: Layer) => Math.max(0, Math.round(num(c.n, c.shape === 'spiral' ? 240 : 40)));
