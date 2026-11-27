// A camera over a scene: a list of shots in time. Pure (no React), so any frame is the same in any order.
import type { Point } from './geometry/math.ts';
import { easing } from './motion.ts';

/**
 * Where the camera is `at` a second: looking at `to` (a point of the scene, or a function of `t` to track something
 * that moves) with `zoom` (1: one scene unit is one pixel). `ease` shapes the way from the shot before.
 */
export type Shot = { at: number; to: Point | ((t: number) => Point); zoom: number; ease?: string };

export type View = { x: number; y: number; zoom: number };

/**
 * The view at `t`. Zoom changes in equal ratios (it feels steady), and while it changes the center follows the zoom,
 * so the place being approached glides to the middle of the screen without swinging away on the way.
 */
export function cameraAt(shots: Shot[], t: number): View {
  const ordered = [...shots].sort((a, b) => a.at - b.at);
  const next = ordered.findIndex((s) => s.at > t);
  const b = ordered[next < 0 ? ordered.length - 1 : next];
  const a = ordered[next < 0 ? ordered.length - 1 : Math.max(0, next - 1)];
  const k = a === b ? 1 : easing(b.ease ?? 'power2.inOut')((t - a.at) / (b.at - a.at));
  const point = (s: Shot) => (typeof s.to === 'function' ? s.to(t) : s.to);
  const [from, until] = [point(a), point(b)];
  const zoom = a.zoom * (b.zoom / a.zoom) ** k;
  const along = Math.abs(b.zoom - a.zoom) > 1e-9 ? (1 / a.zoom - 1 / zoom) / (1 / a.zoom - 1 / b.zoom) : k;
  return { x: from[0] + (until[0] - from[0]) * along, y: from[1] + (until[1] - from[1]) * along, zoom };
}

/**
 * The SVG transform that shows the scene through the view on a `width` × `height` frame. `depth` below 1 is a far
 * layer: it moves and grows less than the scene (parallax).
 */
export const cameraTransform = ({ x, y, zoom }: View, width: number, height: number, depth = 1) =>
  `translate(${width / 2} ${height / 2}) scale(${(zoom ** depth).toFixed(5)}) translate(${(-x * depth).toFixed(3)} ${(-y * depth).toFixed(3)})`;
