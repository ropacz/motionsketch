// A sphere seen from the front: projecting longitude and latitude, and the shapes drawn on its surface. Pure.
import { DEG, TURN } from './math.ts';

export type LonLat = [number, number];
export type OnSphere = { x: number; y: number; z: number };
export type Projector = (lon: number, lat: number, R: number) => OnSphere;

/**
 * Sphere seen from the front: `tilt` (degrees) brings the north pole toward us, `axis` (degrees) rotates the axis in the screen plane.
 * Returns the point (longitude and latitude in degrees) on screen and the depth z (1 = facing us; negative = behind).
 */
export function sphere(tilt: number, axis = 0): Projector {
  const [cb, sb, cr, sr] = [Math.cos(tilt * DEG), Math.sin(tilt * DEG), Math.cos(axis * DEG), Math.sin(axis * DEG)];
  return (lon, lat, R) => {
    const [l, f] = [lon * DEG, lat * DEG];
    const x0 = R * Math.cos(f) * Math.sin(l);
    const y0 = -R * (Math.sin(f) * cb - Math.cos(f) * Math.cos(l) * sb);
    const z = Math.cos(f) * Math.cos(l) * cb + Math.sin(f) * sb;
    return { x: x0 * cr - y0 * sr, y: x0 * sr + y0 * cr, z };
  };
}

/**
 * A point on the spinning surface: position, depth and the radial angle (degrees) to flatten a spot at the edge
 * (`rx = r * z`, rotated by `angle`). Null when it is behind (z below `zMin`).
 */
export function pointOnSphere(proj: Projector, lon: number, lat: number, R: number, zMin = 0) {
  const p = proj(lon, lat, R);
  if (p.z <= zMin) return null;
  return { ...p, angle: Math.atan2(p.y, p.x) / DEG, pos: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})` };
}

/**
 * SVG path of a surface shape (continent, cloud, cap): what is behind is pushed to the edge,
 * so the shape shrinks and disappears at the outline without jumping. Empty when the whole shape is behind.
 */
export function shapeOnSphere(proj: Projector, pts: LonLat[], spin: number, R: number, dx = 0, dy = 0) {
  let d = '';
  let visible = false;
  for (const [i, [lon, lat]] of pts.entries()) {
    const p = proj(lon + spin, lat, R);
    let [x, y] = [p.x, p.y];
    if (p.z > 0) visible = true;
    else {
      const h = Math.hypot(x, y) || 1;
      [x, y] = [(x / h) * R, (y / h) * R];
    }
    d += `${i ? 'L' : 'M'}${(x + dx).toFixed(1)} ${(y + dy).toFixed(1)}`;
  }
  return visible ? `${d}Z` : '';
}

/**
 * Cap north of latitude `lat` (degrees), as seen: the visible arc of the parallel closed by the edge of the disc,
 * on the north pole side. `offset(lon)` makes the parallel wave (lon in degrees, 0 = facing us). Two caps in the
 * same path with `fillRule="evenodd"` make a latitude band (gas planet).
 */
export function capOnSphere(proj: Projector, lat: number, R: number, offset: (lon: number) => number = () => 0) {
  const disc = `M${R} 0A${R} ${R} 0 1 0 ${-R} 0A${R} ${R} 0 1 0 ${R} 0Z`;
  const pole = proj(0, 90, R);
  const vis: OnSphere[] = [];
  for (let i = 0; i <= 120; i++) {
    const p = proj(-180 + i * 3, lat + offset(-180 + i * 3), R);
    if (p.z > 0) vis.push(p);
  }
  const line = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('') + 'Z';
  if (!vis.length) return Math.asin(Math.max(-1, Math.min(1, pole.z / R))) / DEG > lat ? disc : '';
  if (vis.length === 121) return pole.z > 0 ? line(vis) : disc + line(vis);
  const [a, b] = [vis[0], vis[vis.length - 1]];
  const [aa, ab, an] = [Math.atan2(a.y, a.x), Math.atan2(b.y, b.x), Math.atan2(pole.y, pole.x)];
  const norm = (v: number) => ((v % TURN) + TURN) % TURN;
  let turn = norm(aa - ab);
  if (norm(an - ab) > turn) turn -= TURN;
  const edge = Array.from({ length: 25 }, (_, i) => ({ x: R * Math.cos(ab + (turn * i) / 24), y: R * Math.sin(ab + (turn * i) / 24) }));
  return line([...vis, ...edge]);
}
