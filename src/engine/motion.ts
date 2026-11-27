// Easing curves, timed changes and stable randomness (no React), so everything is a function of time.
import { EASES, EASE_FAMILIES, type ACTIONS, type Step, type Stagger } from './geometry/schema.ts';

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/** ease out with overshoot: cubic-bezier(0.34, 1.56, 0.64, 1), approximated */
export const backOut = (p: number) => {
  const x = clamp(p);
  const c1 = 1.70158 * 1.2;
  return 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
/** ease in-out (S curve): what changes slowly without a jolt, like night falling on an illustration */
export const easeInOut = (p: number) => {
  const x = clamp(p);
  return x * x * (3 - 2 * x);
};
/** How far a timed change has arrived: starts `at` seconds after the entrance and completes in `dur`, on an S curve. */
export const arrival = (t: number, at: number, dur: number) => easeInOut((t - at) / dur);

export type Curve = (p: number) => number;

const bounceOut: Curve = (p) => {
  const [n, d] = [7.5625, 2.75];
  if (p < 1 / d) return n * p * p;
  if (p < 2 / d) return n * (p - 1.5 / d) ** 2 + 0.75;
  if (p < 2.5 / d) return n * (p - 2.25 / d) ** 2 + 0.9375;
  return n * (p - 2.625 / d) ** 2 + 0.984375;
};
/** Each family as its "in" curve (starts slow); "out" and "inOut" are mirrors of it. */
const EASE_IN: Record<(typeof EASE_FAMILIES)[number], Curve> = {
  power1: (p) => p ** 2,
  power2: (p) => p ** 3,
  power3: (p) => p ** 4,
  power4: (p) => p ** 5,
  sine: (p) => 1 - Math.cos((p * Math.PI) / 2),
  expo: (p) => 2 ** (10 * p - 10),
  circ: (p) => 1 - Math.sqrt(1 - p * p),
  back: (p) => 2.70158 * p ** 3 - 1.70158 * p ** 2,
  elastic: (p) => -(2 ** (10 * p - 10)) * Math.sin((p * 10 - 10.75) * ((2 * Math.PI) / 3)),
  bounce: (p) => 1 - bounceOut(1 - p),
};

const STEPS = /^steps(?:\((\d+)\))?$/;

export const isEase = (name: string) => EASES.includes(name) || STEPS.test(name);

/**
 * A named ease (`EASES` in the schema): "linear", "family.in|out|inOut" (a bare family is "out") or "steps(n)".
 * Input is clamped to 0..1 and the ends are exact; back and elastic overshoot in between.
 */
export function easing(name: string): Curve {
  const exact = (f: Curve): Curve => (p) => (p <= 0 ? 0 : p >= 1 ? 1 : f(p));
  if (name === 'linear') return exact((p) => p);
  const steps = STEPS.exec(name);
  if (steps) {
    const n = Math.max(1, Number(steps[1] ?? 5));
    return exact((p) => Math.floor(p * n) / n);
  }
  const [family, direction = 'out'] = name.split('.');
  const into = EASE_IN[family as (typeof EASE_FAMILIES)[number]];
  if (!into || !['in', 'out', 'inOut'].includes(direction)) throw new Error(`unknown ease "${name}"`);
  if (direction === 'in') return exact(into);
  if (direction === 'out') return exact((p) => 1 - into(1 - p));
  return exact((p) => (p < 0.5 ? into(2 * p) / 2 : 1 - into(2 - 2 * p) / 2));
}

/** The progress (0..1, eased) of a change that starts at `at` and takes `duration` seconds. */
export const progress = (t: number, at: number, duration: number, curve: Curve) => curve(clamp((t - at) / Math.max(1e-6, duration)));

/**
 * A back-and-forth cycle from −1 to 1 that starts at 0 going up. Without an ease it is a sine; with one, the ease
 * shapes each half swing ("sine.inOut" gives the sine back, "linear" a zigzag).
 */
export function oscillate(t: number, period: number, phase = 0, ease?: string) {
  if (!ease) return Math.sin((t / period + phase) * 2 * Math.PI);
  const p = t / period + phase + 0.25;
  const v = p - Math.floor(p);
  return 2 * easing(ease)(v < 0.5 ? 2 * v : 2 - 2 * v) - 1;
}

/** Turns of a cycle with the ease applied inside each turn (spin, orbit, a looping path). */
export function easedTurns(turns: number, ease?: string) {
  const whole = Math.floor(turns);
  return ease ? whole + easing(ease)(turns - whole) : turns;
}

/**
 * The delay of each of `n` copies: `each` seconds between neighbours, counted from the start, the center or the
 * edges; the first copy to move has no delay. `ease` redistributes the delays inside the same total time.
 */
export function staggerDelays(n: number, stagger: Stagger): number[] {
  const { each = 0.07, from = 'start', ease = 'linear' } = typeof stagger === 'number' ? { each: stagger } : stagger;
  const rank = Array.from({ length: n }, (_, k) => (from === 'center' ? Math.abs(k - (n - 1) / 2) : from === 'edges' ? Math.min(k, n - 1 - k) : k));
  const first = Math.min(...rank);
  const last = Math.max(...rank) - first;
  const curve = easing(ease);
  return rank.map((r) => (last > 0 ? last * each * curve((r - first) / last) : 0));
}

export const random = (seed: number) => {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280), s / 233280);
};

const POP_DURATION = 0.38;

export function pop(t: number, delay = 0, duration = POP_DURATION, curve: Curve = backOut) {
  const p = (t - delay) / duration;
  return { scale: 0.55 + 0.45 * curve(clamp(p)), opacity: clamp(p * 3) };
}

export function leave(t: number, at: number, duration = 0.3, curve: Curve = easing('power2.in')) {
  const p = clamp((t - at) / duration);
  return { scale: 1 - 0.45 * curve(p), opacity: 1 - clamp(p * 3 - 2) };
}

export type Placement = { x: number; y: number; rot: number; scale: number; opacity: number };

/** The actions that take a number in `to`, and what each one changes (the other actions have their own rules). */
export const VALUE_ACTIONS: Record<Exclude<(typeof ACTIONS)[number], 'enter' | 'exit' | 'pop' | 'move'>, 'scale' | 'rot' | 'opacity'> = { scale: 'scale', rotate: 'rot', fade: 'opacity' };

/**
 * A layer's `sequence` at time `t`: each event starts from where the earlier ones left the layer, so the result
 * depends only on `t`. move, scale, rotate and fade go to `to`; pop is momentary. Of enter and exit only the latest
 * one counts, so a layer can leave and come back; before the first one, a layer that starts with enter is hidden.
 */
export function playSequence(steps: Step[], t: number, base: Placement): Placement {
  const out = { ...base };
  const mix = (a: number, b: number, k: number) => a + (b - a) * k;
  const ordered = [...steps].sort((a, b) => a.at - b.at);
  const comings = ordered.filter((s) => s.do === 'enter' || s.do === 'exit');
  const coming = [...comings].reverse().find((s) => s.at <= t) ?? (comings[0]?.do === 'enter' ? comings[0] : undefined);
  for (const s of ordered) {
    const curve = s.ease ? easing(s.ease) : undefined;
    if (s.do === 'enter' || s.do === 'exit') {
      if (s !== coming) continue;
      const change = s.do === 'enter' ? pop(t, s.at, s.duration, curve) : leave(t, s.at, s.duration, curve);
      (out.scale *= change.scale), (out.opacity *= change.opacity);
    } else if (s.do === 'pop') {
      out.scale *= 1 + (s.amplitude ?? 0.18) * Math.sin(Math.PI * progress(t, s.at, s.duration ?? 0.35, curve ?? easing('linear')));
    } else if (t > s.at) {
      const k = progress(t, s.at, s.duration ?? 0.6, curve ?? easing('power2.inOut'));
      if (s.do === 'move' && Array.isArray(s.to)) (out.x = mix(out.x, s.to[0], k)), (out.y = mix(out.y, s.to[1], k));
      else if (s.do !== 'move' && typeof s.to === 'number') out[VALUE_ACTIONS[s.do]] = mix(out[VALUE_ACTIONS[s.do]], s.to, k);
    }
  }
  return out;
}
