// Where a layer is at a moment: its behaviors and its sequence turn t into position, rotation, scale, opacity and
// color shifts. One entry per behavior says how it moves, how it counts for the second rhythm and what it needs. Pure.
import { arrival, clamp, easedTurns, easing, leave, oscillate, playSequence, pop, progress } from '../motion.ts';
import { DEG, TURN, frac, num } from './math.ts';
import { catmullRom, measureLine, morphLayer } from './outline.ts';
import { ORBIT_SIZE, type Animation, type Layer } from './schema.ts';
import { MORPHABLE, traitsOf } from './shapes.ts';

/** `t`: seconds since the entrance; `tc`: the cycle time (t × the piece speed). */
export type Clock = { t: number; tc: number };
/** A change of color on its way: toward `to` (a palette name or #hex), `k` of the way. */
export type ColorShift = { to: string; k: number };

export type LayerState = {
  x: number;
  y: number;
  rot: number;
  center: [number, number];
  scale: number;
  /** scale on the height only (blink) */
  sy: number;
  opacity: number;
  /** on an orbit: the angle, whether it is on the front half and the behavior that moves it */
  orbit: { a: number; front: boolean; o: Animation } | null;
  /** fraction of the stroke drawn */
  drawn: number;
  shifts: ColorShift[];
};

type Behavior = {
  /** keeps the layer alive: always, or only when it loops (has a `period`) */
  alive?: 'always' | 'looping';
  /** already changes the scale, so it gets no breath on top */
  resizes?: true;
  /** a one-time change: on particles it applies to the set, or to each particle with `stagger` */
  timed?: true;
  /** moves the layer (morph changes its shape instead: see `reshape`) */
  apply?: (s: LayerState, a: Animation, clock: Clock) => void;
  /** what is missing or wrong in the data, as messages */
  needs?: (a: Animation, c: Layer) => string[];
};

const curveOf = (a: Animation) => (a.ease ? easing(a.ease) : undefined);

const comeOrGo = (s: LayerState, change: { scale: number; opacity: number }) => {
  (s.scale *= change.scale), (s.opacity *= change.opacity);
};

/** The path of an `orbit` behavior, with its defaults: the body and its trail travel the same one. */
export const orbitOf = (a: Animation) => ({ rx: num(a.rx, ORBIT_SIZE.rx), ry: num(a.ry, ORBIT_SIZE.ry), rot: num(a.rot, 0), direction: num(a.direction, 1) });
export const isFront = (angle: number) => Math.sin(angle) >= 0;

const BEHAVIOR_RULES: Record<Animation['type'], Behavior> = {
  spin: {
    alive: 'always',
    apply(s, a, { tc }) {
      const turned = num(a.speed, 30) * tc;
      (s.rot += (a.ease ? 360 * easedTurns(turned / 360, a.ease) : turned) + num(a.phase, 0) * 360), (s.center = a.center ?? s.center);
    },
  },
  sway: {
    alive: 'always',
    apply(s, a, { tc }) {
      (s.rot += num(a.amplitude, 12) * oscillate(tc, num(a.period, 3), num(a.phase, 0), a.ease)), (s.center = a.center ?? s.center);
    },
  },
  blink: {
    alive: 'always',
    // closes and opens (in `duration`, 0.2 s: an eye; slower: a spinning coin, a turning page) once per period
    apply(s, a, { tc }) {
      const [per, d] = [num(a.period, 3.5), num(a.duration, 0.2)];
      const p = frac(tc / per + num(a.phase, 0)) * per;
      s.sy *= p < d ? 1 - 0.9 * Math.sin((curveOf(a)?.(p / d) ?? p / d) * Math.PI) : 1;
    },
  },
  rise: {
    alive: 'always',
    resizes: true,
    // smoke, bubble: rises, grows and fades, in a loop
    apply(s, a, { tc }) {
      const p = frac(tc / num(a.period, 3) + num(a.phase, 0));
      const gone = curveOf(a)?.(p) ?? p;
      (s.y -= num(a.distance, 20) * gone), (s.scale *= 0.6 + 0.8 * gone), (s.opacity *= clamp(p * 5) * clamp((1 - p) * 2.5));
    },
  },
  pulse: {
    alive: 'always',
    resizes: true,
    apply(s, a, { tc }) {
      s.scale *= 1 + num(a.amplitude, 0.06) * oscillate(tc, num(a.period, 2), num(a.phase, 0), a.ease);
    },
  },
  ripple: {
    alive: 'always',
    resizes: true,
    // born small, grows and fades, in a loop (radio wave, ripple on water)
    apply(s, a, { tc }) {
      const p = frac(tc / num(a.period, 2) + num(a.phase, 0));
      (s.scale *= 0.3 + 0.7 * (curveOf(a)?.(p) ?? p)), (s.opacity *= clamp(p * 6) * (1 - p));
    },
  },
  float: {
    alive: 'always',
    // X and Y at different frequencies (0.22 : 0.35): the path does not visibly repeat
    apply(s, a, { tc }) {
      const [amp, per, f] = [num(a.amplitude, 1.5), num(a.period, 4), num(a.phase, 0)];
      s.x += amp * oscillate(tc, (per * 0.35) / 0.22, f + 0.25, a.ease);
      s.y += amp * oscillate(tc, per, f, a.ease);
    },
  },
  twinkle: {
    alive: 'always',
    apply(s, a, { tc }) {
      s.opacity *= 0.7 + 0.3 * oscillate(tc, num(a.period, 1.6), num(a.phase, 0), a.ease);
    },
  },
  orbit: {
    alive: 'always',
    apply(s, a, { tc }) {
      const { rx, ry, rot, direction } = orbitOf(a);
      const ang = direction * easedTurns(tc / num(a.period, 4) + num(a.phase, 0), a.ease) * TURN;
      const r = rot * DEG;
      const [px, py] = [rx * Math.cos(ang), ry * Math.sin(ang)];
      s.x += px * Math.cos(r) - py * Math.sin(r);
      s.y += px * Math.sin(r) + py * Math.cos(r);
      const depth = 0.5 + 0.5 * Math.sin(ang);
      (s.scale *= 0.8 + 0.3 * depth), (s.opacity *= 0.65 + 0.35 * depth);
      s.orbit = { a: ang, front: isFront(ang), o: a };
    },
  },
  enter: {
    timed: true,
    apply: (s, a, { t }) => comeOrGo(s, pop(t, num(a.delay, 0), a.duration, curveOf(a))),
  },
  exit: {
    timed: true,
    apply: (s, a, { t }) => comeOrGo(s, leave(t, num(a.at, 0), a.duration, curveOf(a))),
    needs: (a) => (typeof a.at === 'number' ? [] : ['the "exit" behavior needs "at" (seconds after the entrance)']),
  },
  draw: {
    apply(s, a, { t }) {
      const delay = num(a.delay, 0);
      s.drawn = clamp(progress(t, delay, num(a.duration, 1), curveOf(a) ?? clamp));
      if (delay > 0 && t <= delay) s.opacity = 0; // the round cap of a stroke not started yet would show as a dot
    },
  },
  color: {
    timed: true,
    apply(s, a, { t }) {
      if (!a.to) return;
      const [at, duration] = [num(a.at, 0.8), num(a.duration, 0.6)];
      s.shifts.push({ to: a.to, k: a.ease ? progress(t, at, duration, easing(a.ease)) : arrival(t, at, duration) });
    },
    needs: (a) => (a.to ? [] : ['the "color" behavior needs "to" (the new color); "at" (seconds after the entrance) says when']),
  },
  follow: {
    alive: 'looping',
    apply(s, a, { t, tc }) {
      if (!a.points || a.points.length < 2) return;
      const u = a.period !== undefined ? frac(easedTurns(tc / a.period + num(a.phase, 0), a.ease)) : progress(t, num(a.at, 0), num(a.duration, 2), easing(a.ease ?? 'sine.inOut'));
      const way = measureLine(catmullRom(a.points, a.closed === true, 16), a.closed === true)(u);
      (s.x += way.x), (s.y += way.y), (s.rot += a.orient ? way.angle : 0);
    },
    needs: (a) => ((a.points?.length ?? 0) > 1 ? [] : ['the "follow" behavior needs "points" (at least two)']),
  },
  morph: {
    alive: 'looping',
    needs: (a, c) => [
      ...(!traitsOf(c.shape).morphable || c.closed === false ? [`"morph" starts from a closed shape (${MORPHABLE.join('|')})`] : []),
      ...(!a.into || !traitsOf(a.into.shape).morphable ? [`"morph" needs "into" with one of these shapes: ${MORPHABLE.join('|')}`] : []),
    ],
  },
};

const ruleOf = (a: Animation): Behavior => BEHAVIOR_RULES[a.type] ?? {};

export const behaviorNeeds = (a: Animation, c: Layer) => ruleOf(a).needs?.(a, c) ?? [];

/**
 * How the behaviors of a layer of particles divide between the set and each particle: the one-time changes go to the set,
 * or, with `stagger`, to each particle on its own delay; everything else always goes to each particle.
 */
export function splitScattered(c: Layer): { set: Animation[] | undefined; each: Animation[] | undefined } {
  if (c.stagger !== undefined) return { set: [], each: c.animate };
  return { set: c.animate?.filter((a) => ruleOf(a).timed), each: c.animate?.filter((a) => !ruleOf(a).timed) };
}

export const isAlive = (c: Layer) => !!c.animate?.some((a) => ruleOf(a).alive === 'always' || (ruleOf(a).alive === 'looping' && a.period !== undefined));

/** Second rhythm: a ±1.5% breath every 7 s, with a phase taken from the position (the layers do not breathe together). */
const BREATH = { amplitude: 0.015, period: 7 };

export function layerState(c: Layer, clock: Clock): LayerState {
  const placed = { x: num(c.x, 0), y: num(c.y, 0), rot: num(c.rot, 0), scale: num(c.scale, 1), opacity: num(c.opacity, 1) };
  const start = c.sequence ? playSequence(c.sequence, clock.t, placed) : placed;
  const s: LayerState = { ...start, center: [0, 0], sy: 1, orbit: null, drawn: 1, shifts: [] };
  for (const a of c.animate ?? []) ruleOf(a).apply?.(s, a, clock);
  if (isAlive(c) && !c.animate!.some((a) => ruleOf(a).resizes)) s.scale *= 1 + BREATH.amplitude * oscillate(clock.tc, BREATH.period, frac(0.137 * num(c.x, 0) + 0.291 * num(c.y, 0)));
  return s;
}

/** The layer's shape now: a `morph` takes it part of the way (or all the way) to another one. */
export function reshape(c: Layer, { t, tc }: Clock): Layer {
  const a = c.animate?.find((q) => q.type === 'morph');
  if (!a?.into) return c;
  const curve = easing(a.ease ?? 'power2.inOut');
  if (a.period === undefined) return morphLayer(c, a.into, progress(t, num(a.at, 0.8), num(a.duration, 0.6), curve));
  const quarter = frac(tc / a.period + num(a.phase, 0)) * 4;
  return morphLayer(c, a.into, quarter < 2 ? curve(clamp(quarter - 1)) : 1 - curve(clamp(quarter - 3)));
}
