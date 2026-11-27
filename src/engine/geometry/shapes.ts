// What each shape can and cannot do. A new shape gets its line here (the compiler asks for it).
import { SHAPES, type Layer } from './schema.ts';

type Shape = (typeof SHAPES)[number];

type Traits = {
  /** the material when none is named (flat) */
  material?: 'volume' | 'stroke';
  /** a stroke when open (`closed: false`) */
  strokeWhenOpen?: true;
  /** always a stroke, whatever the material says */
  onlyStroke?: true;
  /** its stroke takes the plain color, without the light-to-dark gradient */
  plainStroke?: true;
  /** gets no rim light, highlight or texture */
  noFinish?: true;
  /** has no single outline, so it cannot clip its siblings */
  noSilhouette?: true;
  /** closed and simple enough to morph from and into */
  morphable?: true;
  /** made of many particles: the animation applies to each one */
  scattered?: true;
};

const TRAITS: Record<Shape, Traits> = {
  circle: { morphable: true },
  ellipse: { morphable: true },
  rectangle: { morphable: true },
  polygon: { morphable: true },
  path: {},
  ring: {},
  star: { morphable: true },
  orbit: { material: 'stroke', plainStroke: true, noFinish: true },
  sphere: { material: 'volume' },
  particles: { scattered: true, noSilhouette: true },
  spiral: { scattered: true, noSilhouette: true },
  group: { noFinish: true, noSilhouette: true },
  drop: {},
  leaf: {},
  cloud: {},
  heart: {},
  arrow: { onlyStroke: true, plainStroke: true, noFinish: true, noSilhouette: true },
  bolt: { morphable: true },
  triangle: { morphable: true },
  diamond: { morphable: true },
  trapezoid: { morphable: true },
  gear: {},
  arc: { material: 'stroke', noFinish: true },
  curve: { strokeWhenOpen: true, morphable: true },
  text: { noFinish: true },
};

export const traitsOf = (shape: Layer['shape']): Traits => (shape ? TRAITS[shape] : undefined) ?? {};

export const MORPHABLE: Shape[] = SHAPES.filter((s) => TRAITS[s].morphable);

export function materialOf(c: Layer) {
  const traits = traitsOf(c.shape);
  if (traits.onlyStroke) return 'stroke';
  return c.material ?? (traits.strokeWhenOpen && c.closed === false ? 'stroke' : (traits.material ?? 'flat'));
}
