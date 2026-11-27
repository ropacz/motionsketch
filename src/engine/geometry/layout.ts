// Layout of a data drawing: default measures, named materials, parts (`use`), boxes, relative position (`anchor`),
// copies (`repeat`) and the ground shadow. Pure (no React).
import { staggerDelays } from '../motion.ts';
import { NAMED_MATERIALS, PARTS, type Part } from './kit.ts';
import { DEG, num } from './math.ts';
import { measures } from './measures.ts';
import { boxOf, pathBox, type Box } from './path-box.ts';
import { lightDegrees, SIDES, type Layer, type Drawing, type Marked } from './schema.ts';
import { traitsOf } from './shapes.ts';
import { expandFigure } from './skeleton.ts';

export const lightOf = (d: Drawing, options: Record<string, unknown>) => lightDegrees(options.light ?? d.light);

/** The ground shadow (`groundShadow` of the piece or the drawing): an ellipse below the box, a bit away from the light. */
export function groundShadowOf(d: Drawing, options: Record<string, unknown>) {
  if (!(options.groundShadow ?? d.groundShadow)) return null;
  const k = layerBox({ shape: 'group', children: d.layers });
  if (!k) return null;
  const rx = 0.42 * (k.x1 - k.x0);
  return { x: (k.x0 + k.x1) / 2 - Math.sin(lightOf(d, options) * DEG) * 0.15 * rx, y: k.y1 + 1, rx, ry: Math.max(2.5, rx * 0.1) };
}

export function resolveMaterial(c: Layer): Layer {
  const m = c.material && (NAMED_MATERIALS as Record<string, Partial<Layer>>)[c.material];
  return m ? { ...m, ...c, material: m.material } : c;
}

export function expandPart(c: Layer): Layer {
  const p = c.use ? (PARTS as Record<string, Part>)[c.use] : undefined;
  if (!p) return c;
  return { ...c, shape: 'group', use: undefined, color: c.color ?? p.color, children: [...p.layers, ...(c.children ?? [])] };
}

const centered = (w: number, h: number): Box => ({ x0: -w / 2, y0: -h / 2, x1: w / 2, y1: h / 2 });

/** The box of the shape at its own origin (no x, y or rot); null if it cannot be known (path with a rotated arc). */
function localBox(c: Layer): Box | null {
  const m = measures(c);
  switch (c.shape) {
    case 'circle': case 'ring': case 'star': case 'gear': case 'sphere': case 'heart': case 'arc':
      return centered(2 * m.r, 2 * m.r);
    case 'ellipse': case 'orbit': return centered(2 * m.rx, 2 * m.ry);
    case 'rectangle': case 'triangle': case 'diamond': case 'bolt': case 'cloud': return centered(m.w, m.h);
    case 'trapezoid': return centered(Math.max(m.top, m.bottom), m.h);
    case 'drop': return { x0: -m.r, y0: m.r - m.h, x1: m.r, y1: m.r };
    case 'leaf': return { x0: -m.w / 2, y0: -m.h, x1: m.w / 2, y1: 0 };
    case 'text': return centered(String(c.text ?? '').length * m.textSize * 0.62, m.textSize * 0.8);
    case 'particles': case 'spiral': return centered(2 * m.reach, 2 * m.reach * num(c.flatten, 1));
    case 'polygon': case 'curve':
      return c.points?.length ? boxOf(c.points.map((p) => p[0]), c.points.map((p) => p[1])) : null;
    case 'arrow': return boxOf([m.from[0], m.to[0]], [m.from[1], m.to[1]]);
    case 'path': return c.d ? pathBox(c.d) : null;
    case 'group': {
      // a layer with `clip` stays inside a sibling: it does not grow the box
      const ks = resolveAnchors(c.children ?? []).filter((f) => !f.clip).map(layerBox).filter((k): k is Box => !!k);
      return ks.length ? boxOf(ks.flatMap((k) => [k.x0, k.x1]), ks.flatMap((k) => [k.y0, k.y1])) : null;
    }
    default:
      return null;
  }
}

/** The layer box in the parent space: the shape (or the children, for a group, `use` and `rig` at the start of its cycle) with scale, x and y; no rotation or animation. */
export function layerBox(c0: Layer): Box | null {
  const c = expandFigure(expandPart(c0), 0);
  const own = localBox(c);
  if (!own) return null;
  const k = c.flip ? { ...own, x0: -own.x1, x1: -own.x0 } : own;
  const [s, x, y] = [num(c.scale, 1), num(c.x, 0), num(c.y, 0)];
  return { x0: x + k.x0 * s, y0: y + k.y0 * s, x1: x + k.x1 * s, y1: y + k.y1 * s };
}

/** The box of the shape alone, at its own origin and size: what the finish and the stroke gradient fit. */
export const shapeBox = (c: Layer) => layerBox({ ...c, x: 0, y: 0, scale: 1, children: undefined, anchor: undefined });

export function resolveAnchors(cs: Layer[]): Layer[] {
  if (!cs.some((c) => c.anchor)) return cs;
  const done = new Map<number, Layer>();
  const index = new Map(cs.map((c, i) => [c.id, i] as const));
  const resolve = (i: number, stack: Set<number>): Layer => {
    const ready = done.get(i);
    if (ready) return ready;
    const c = cs[i];
    let out = c;
    const j = c.anchor ? index.get(c.anchor.to) : undefined;
    if (c.anchor && j !== undefined && j !== i && !stack.has(j)) {
      const ref = layerBox(resolve(j, new Set([...stack, i])));
      const me = layerBox({ ...c, x: 0, y: 0 }) ?? { x0: 0, y0: 0, x1: 0, y1: 0 };
      if (ref) {
        const e = num(c.anchor.gap, 0);
        const [cx, cy] = [(ref.x0 + ref.x1) / 2 - (me.x0 + me.x1) / 2, (ref.y0 + ref.y1) / 2 - (me.y0 + me.y1) / 2];
        const place: Record<(typeof SIDES)[number], [number, number]> = {
          top: [cx, ref.y0 - e - me.y1],
          bottom: [cx, ref.y1 + e - me.y0],
          left: [ref.x0 - e - me.x1, cy],
          right: [ref.x1 + e - me.x0, cy],
          center: [cx, cy],
          'inside-top': [cx, ref.y0 + e - me.y0],
          'inside-bottom': [cx, ref.y1 - e - me.y1],
        };
        const [x, y] = place[c.anchor.side ?? 'center'] ?? [cx, cy];
        out = { ...c, anchor: undefined, x: x + num(c.x, 0), y: y + num(c.y, 0) };
      }
    }
    done.set(i, out);
    return out;
  };
  return cs.map((_, i) => resolve(i, new Set()));
}

export function expandRepeats(cs: Layer[]): Marked[] {
  return cs.flatMap((c) => {
    if (!c.repeat) return [c];
    const { n, step = {}, phaseStep = 0 } = c.repeat;
    const { repeat: _, z, clip, stagger, ...rest } = c; // the clip stays on the group, which lives among the siblings
    const count = Math.max(0, Math.round(n));
    const lags = stagger === undefined ? [] : staggerDelays(count, stagger);
    const inner = traitsOf(c.shape).scattered ? stagger : undefined;
    return Array.from({ length: count }, (_, k): Marked => ({
      shape: 'group', z, clip, lag: lags[k], x: k * (step.x ?? 0), y: k * (step.y ?? 0), rot: k * (step.rot ?? 0), scale: (step.scale ?? 1) ** k,
      children: [{ ...rest, stagger: inner, ...(rest.rig ? { phase: (rest.phase ?? 0) + k * phaseStep } : {}), animate: rest.animate?.map((a) => ({ ...a, phase: (a.phase ?? 0) + k * phaseStep })) }],
    }));
  });
}
