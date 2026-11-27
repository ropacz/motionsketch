// The data format of a drawing: layers with shape, material, position and animation, in a box from −50 to 50
// centered on 0 (the engine scales it to the `size`). Types and lists only, no dependencies. Guide: docs/illustration.md.

export const SHAPES = [
  'circle', 'ellipse', 'rectangle', 'polygon', 'path', 'ring', 'star', 'orbit', 'sphere', 'particles', 'spiral', 'group',
  'drop', 'leaf', 'cloud', 'heart', 'arrow', 'bolt', 'triangle', 'diamond', 'trapezoid', 'gear', 'arc', 'curve', 'text',
] as const;
export const MATERIALS = ['flat', 'volume', 'glow', 'stroke', 'gradient'] as const;
export const BEHAVIORS = ['spin', 'orbit', 'pulse', 'float', 'twinkle', 'sway', 'ripple', 'draw', 'enter', 'exit', 'color', 'blink', 'rise', 'follow', 'morph'] as const;
export const EASE_FAMILIES = ['power1', 'power2', 'power3', 'power4', 'sine', 'expo', 'circ', 'back', 'elastic', 'bounce'] as const;
/** Named eases (a bare family means "out"); "steps(n)" also works. */
export const EASES: string[] = ['linear', 'steps', ...EASE_FAMILIES.flatMap((f) => [f, `${f}.in`, `${f}.out`, `${f}.inOut`])];
/** What an event of a `sequence` does. */
export const ACTIONS = ['enter', 'exit', 'move', 'scale', 'rotate', 'fade', 'pop'] as const;
/** The geometry props a `morph` target replaces. */
export const MORPH_PROPS = ['shape', 'r', 'rx', 'ry', 'w', 'h', 'radius', 'points', 'tips', 'inner', 'top', 'bottom'] as const;
/** Props that only mean something on a `rig` layer. */
export const RIG_PROPS = ['cycle', 'period', 'phase', 'pose', 'poses', 'build'] as const;
/** The default size of an orbit, as a shape and as the path of the `orbit` behavior. */
export const ORBIT_SIZE = { rx: 40, ry: 14 };
/** The reusable skeletons (geometry/rigs.ts). */
export const RIGS = ['biped', 'quadruped', 'bird', 'fish'] as const;
export const STAGGER_FROM = ['start', 'center', 'edges'] as const;
/** Light texture of the material (default: `grain` on volume; named materials bring their own); `false` turns it off. */
export const TEXTURES = ['grain', 'brushed', 'glare'] as const;
export const DISTRIBUTIONS = ['disc', 'ring', 'sunflower', 'band', 'cloud'] as const;
export const SIDES = ['top', 'bottom', 'left', 'right', 'center', 'inside-top', 'inside-bottom'] as const;
/** Where the light comes from (degrees: 0 at the top, clockwise); a number also works. */
export const LIGHTS = { 'top-left': -45, top: 0, 'top-right': 45, left: -90, right: 90 } as const;
export const lightDegrees = (v: unknown): number => (typeof v === 'number' ? v : typeof v === 'string' && v in LIGHTS ? LIGHTS[v as keyof typeof LIGHTS] : -45);

export type RigName = (typeof RIGS)[number];
/**
 * A pose: feet and hands as targets [x, y] (fractions of the leg or the arm), the rest as numbers (degrees or
 * fractions). Which fields exist depends on the rig.
 */
export type Pose = Record<string, number | [number, number]>;
/** A pose of a cycle, `at` the fraction of the period (0 to 1); `ease` shapes the way to it. */
export type PoseKey = { at: number; ease?: string; [field: string]: number | [number, number] | string | undefined };

/** A behavior: everything is a function of the time since the piece entered; `phase` (0 to 1) shifts the cycle. */
export type Animation = {
  type: (typeof BEHAVIORS)[number];
  phase?: number;
  /** spin: degrees per second (30); spin and sway: center [x, y] (the layer origin) */
  speed?: number;
  center?: [number, number];
  /** orbit: the ellipse (rx, ry, rot in degrees), seconds per turn and direction (1 or −1) */
  rx?: number;
  ry?: number;
  rot?: number;
  period?: number;
  direction?: number;
  /** pulse: fraction of the scale (0.06); float: offset in the box (1.5); sway: degrees (12) */
  amplitude?: number;
  /** rise: how far it rises in the box (20) every `period` (3), growing and fading */
  distance?: number;
  /** seconds of the change: draw (1), color (0.6), blink (0.2, closing and opening), enter (0.38), exit (0.3), follow (2), morph (0.6) */
  duration?: number;
  /** enter and draw: seconds until the layer starts */
  delay?: number;
  /** color: the new color */
  to?: string;
  /** when a timed change starts, in seconds after the entrance: color (0.8), exit, follow (0), morph (0.8) */
  at?: number;
  /** one of EASES: shapes the progress of a change, or each swing or turn of a cycle */
  ease?: string;
  /** follow: the smooth curve the layer travels, added to its x and y; `closed` returns to the start */
  points?: [number, number][];
  closed?: boolean;
  /** follow: turns the layer (drawn facing right) along the way */
  orient?: boolean;
  /** morph: the shape to become. With `period`, follow and morph loop (morph goes there and back) */
  into?: MorphTarget;
};

/** The geometry of the shape a morph arrives at. */
export type MorphTarget = Pick<Layer, (typeof MORPH_PROPS)[number]>;

/**
 * An event of a layer's `sequence`, `at` seconds after the entrance. `to`: move [x, y]; scale, rotate (degrees) and
 * fade (opacity), a number. `amplitude`: how much pop swells (0.18).
 */
export type Step = { at: number; do: (typeof ACTIONS)[number]; to?: number | [number, number]; duration?: number; ease?: string; amplitude?: number };

/** Delay between copies in seconds (a number), or with where it starts and an ease over the whole group. */
export type Stagger = number | { each?: number; from?: (typeof STAGGER_FROM)[number]; ease?: string };

/** Trail of an orbiting layer: a stroke that thins out behind the body. */
export type Trail = { arc?: number; width?: number; color?: string; opacity?: number };

/**
 * Spot on the sphere (continent, cloud, crater, sunspot): center at lon/lat (degrees), radius in degrees, `stretch`
 * (width/height), `irregular` (0 to 1), `drift` (extra degrees/s: clouds). With `n`, it scatters n spots (seed, size [min, max]).
 */
export type Spot = { lon?: number; lat?: number; r?: number; stretch?: number; irregular?: number; color?: string; opacity?: number; drift?: number; points?: [number, number][]; n?: number; seed?: number; size?: [number, number] };
/** Latitude band (gas planet): center and width in degrees; `wave` (degrees) makes the edge wave and shows the spin. */
export type Band = { lat: number; width?: number; color?: string; opacity?: number; wave?: number };
/** Copies of the layer: `n`, the step from one to the next (rot around the parent origin, x, y, multiplied scale) and the phase. */
export type Repeat = { n: number; step?: { rot?: number; x?: number; y?: number; scale?: number }; phaseStep?: number };
/** Relative position: places the layer on the `side` of the box of the sibling layer `to` (its id), `gap` away; x and y add up. */
export type Anchor = { to: string; side?: (typeof SIDES)[number]; gap?: number };

export type Layer = {
  /** defaults to "group" with `use` */
  shape?: (typeof SHAPES)[number];
  /** name for the siblings' `anchor` and `clip` */
  id?: string;
  anchor?: Anchor;
  /** instantiates a kit part (geometry/kit.ts): its layers without a color inherit this `color` */
  use?: string;
  /** a character on a skeleton (geometry/rigs.ts); its children are drawn with it, on a `bone` if they name one */
  rig?: RigName;
  /** rig: which of its cycles (the first one), seconds per cycle and where in it to start (0 to 1) */
  cycle?: string;
  period?: number;
  phase?: number;
  /** rig: fields held fixed on top of the cycle ("this hand here") */
  pose?: Pose;
  /** rig: your own cycle, in place of a ready one */
  poses?: PoseKey[];
  /** rig: proportions and secondary colors to change */
  build?: Record<string, number | string>;
  /** child of a rig layer: the bone it hangs on (x and y count from there) */
  bone?: string;
  /** mirrors the layer left to right (a figure looking the other way); the light stays where it is */
  flip?: boolean;
  /** only shows inside the shape of the sibling layer with this id */
  clip?: string;
  x?: number;
  y?: number;
  /** fixed rotation in degrees (on the orbit, the ellipse angle) */
  rot?: number;
  scale?: number;
  r?: number;
  rx?: number;
  ry?: number;
  w?: number;
  h?: number;
  radius?: number;
  points?: [number, number][];
  /** curve: closed (true) */
  closed?: boolean;
  /** path: the box comes from the control points of `d` and the arc extremes (rotated arc: no box and no finish) */
  d?: string;
  /** leaf: bend (fraction of the width); arrow: how much it arches (fraction of the length) */
  bend?: number;
  /** arrow: from and to [x, y]; gradient: the colors; arc: from and until in degrees (0 at the top, clockwise) */
  from?: [number, number] | string | number;
  to?: [number, number] | string;
  until?: number;
  /** arrow: head size (4) */
  head?: number;
  /** trapezoid: top (12) and bottom (20) widths */
  top?: number;
  bottom?: number;
  /** gear: teeth (8) and hole (fraction of the radius, 0.3) */
  teeth?: number;
  hole?: number;
  /** gradient: direction in degrees as in CSS (180 = top to bottom) */
  angle?: number;
  /** text: what to write, `size` (20) and weight (700) */
  text?: string;
  weight?: number;
  thickness?: number;
  tips?: number;
  /** star: inner radius, as a fraction of r (0.45); gear: the bottom of the teeth (0.78) */
  inner?: number;
  color?: string;
  /** particles and spiral: one random color per particle */
  colors?: string[];
  /** glow: the color of the core (the `shine` material uses white) */
  core?: string;
  /** one of MATERIALS or a named material (geometry/kit.ts: shine, glass, metal) */
  material?: string;
  /** TEXTURES (grain on volume, brushed stripes on metal, diagonal glare on glass) or false to turn it off */
  texture?: (typeof TEXTURES)[number] | false;
  outline?: string;
  lineWidth?: number;
  opacity?: number;
  z?: number;
  /** orbit: the back half goes behind the z 0 layers and the front half in front; particles: far is smaller and darker */
  depth?: boolean;
  trail?: boolean | Trail;
  /** sphere: pole tilt (degrees, 15), axis in the screen plane (degrees), spin (degrees/s, 6; also particles and spiral) */
  tilt?: number;
  axis?: number;
  spin?: number;
  spots?: Spot[];
  bands?: Band[];
  night?: number;
  atmosphere?: string;
  /** particles: how many, seed, where, size [min, max]; cloud: n bubbles (7) and seed */
  n?: number;
  seed?: number;
  distribution?: (typeof DISTRIBUTIONS)[number];
  /** particles: [min, max]; text: the font size */
  size?: [number, number] | number;
  /** disc, ring and spiral seen edge-on: height/width (1 = face-on) */
  flatten?: number;
  /** spiral: arms (2), turns (1.2), spread (0.12) and how much faster the inside spins (0.35) */
  arms?: number;
  turns?: number;
  spread?: number;
  differential?: number;
  repeat?: Repeat;
  /** with `repeat`, particles or spiral: each copy starts its timed changes a bit later than the one before */
  stagger?: Stagger;
  /** a timeline of events: appear, move, grow, pop, leave */
  sequence?: Step[];
  animate?: Animation[];
  children?: Layer[];
};

/**
 * A layer as the engine's own expansions leave it, with marks that data cannot set: `lag` (a staggered copy runs this
 * many seconds late), `dim` (a darker far side of a figure) and `rounded` (round knees and elbows).
 */
export type Marked = Layer & { lag?: number; dim?: number; rounded?: boolean };
export const MARKS: string[] = Object.keys({ lag: true, dim: true, rounded: true } satisfies Record<Exclude<keyof Marked, keyof Layer>, true>);

/** A — lead; B — good as support, lacks finish; C — weak, needs work. */
export type Grade = 'A' | 'B' | 'C';

/**
 * A library drawing. `grade` and `note`: the quality, shown in the showcase.
 * `light`: LIGHTS or degrees. `groundShadow`: a soft ellipse below the box (an object resting on the ground).
 */
export type Drawing = { purpose: string; grade: Grade; note: string; light?: keyof typeof LIGHTS | number; groundShadow?: boolean; layers: Layer[] };
