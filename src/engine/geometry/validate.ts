// Errors of a drawing's data, as text and with a suggestion. This changes with every new prop; layout does not. Pure.
import { VALUE_ACTIONS, isEase } from '../motion.ts';
import { behaviorNeeds } from './behaviors.ts';
import { NAMED_MATERIALS, PARTS } from './kit.ts';
import { RIG_LIBRARY } from './rigs.ts';
import { ACTIONS, BEHAVIORS, DISTRIBUTIONS, EASES, LIGHTS, MATERIALS, MORPH_PROPS, RIGS, RIG_PROPS, SHAPES, SIDES, STAGGER_FROM, TEXTURES, type Anchor, type Animation, type Band, type Layer, type Pose, type Repeat, type Spot, type Stagger, type Step } from './schema.ts';
import { traitsOf } from './shapes.ts';
import { figureOf } from './skeleton.ts';
import { suggest } from './suggest.ts';

/** The accepted props of a type, all of them: the compiler asks for the one that is missing or does not exist. */
const keysOf = <T>(keys: Record<keyof T, true>) => Object.keys(keys);

const LAYER_KEYS = keysOf<Layer>({ shape: true, id: true, anchor: true, use: true, rig: true, cycle: true, period: true, phase: true, pose: true, poses: true, build: true, bone: true, flip: true, clip: true, x: true, y: true, rot: true, scale: true, r: true, rx: true, ry: true, w: true, h: true, radius: true, points: true, closed: true, d: true, bend: true, from: true, to: true, until: true, head: true, top: true, bottom: true, teeth: true, hole: true, angle: true, text: true, weight: true, thickness: true, tips: true, inner: true, color: true, colors: true, core: true, material: true, texture: true, outline: true, lineWidth: true, opacity: true, z: true, depth: true, trail: true, tilt: true, axis: true, spin: true, spots: true, bands: true, night: true, atmosphere: true, n: true, seed: true, distribution: true, size: true, flatten: true, arms: true, turns: true, spread: true, differential: true, repeat: true, stagger: true, sequence: true, animate: true, children: true });
const ANIMATION_KEYS = keysOf<Animation>({ type: true, phase: true, speed: true, center: true, rx: true, ry: true, rot: true, period: true, direction: true, amplitude: true, distance: true, duration: true, delay: true, to: true, at: true, ease: true, points: true, closed: true, orient: true, into: true });
const EVENT_KEYS = keysOf<Step>({ at: true, do: true, to: true, duration: true, ease: true, amplitude: true });
const STAGGER_KEYS = keysOf<Exclude<Stagger, number>>({ each: true, from: true, ease: true });
const SPOT_KEYS = keysOf<Spot>({ lon: true, lat: true, r: true, stretch: true, irregular: true, color: true, opacity: true, drift: true, points: true, n: true, seed: true, size: true });
const BAND_KEYS = keysOf<Band>({ lat: true, width: true, color: true, opacity: true, wave: true });
const ANCHOR_KEYS = keysOf<Anchor>({ to: true, side: true, gap: true });
const REPEAT_KEYS = keysOf<Repeat>({ n: true, step: true, phaseStep: true });
const STEP_KEYS = keysOf<NonNullable<Repeat['step']>>({ rot: true, x: true, y: true, scale: true });

const hint = (v: string, list: readonly string[]) => {
  const s = suggest(v, list);
  return s ? ` (did you mean "${s}"?)` : ` (${list.join('|')})`;
};

/**
 * Errors of a drawing, as text and with a suggestion: unknown shape, material, behavior, distribution, light, side, part (`use`)
 * or prop; an `anchor` or `clip` that does not point to the id of a sibling.
 */
export function drawingErrors(d: { layers: Layer[]; light?: unknown }): string[] {
  const errors: string[] = [];
  if (d.light !== undefined && typeof d.light !== 'number' && !(String(d.light) in LIGHTS)) errors.push(`unknown light "${String(d.light)}"${hint(String(d.light), Object.keys(LIGHTS))}`);
  const materials = [...MATERIALS, ...Object.keys(NAMED_MATERIALS)];
  const keys = (o: object, list: readonly string[], where: string) => {
    for (const k of Object.keys(o)) if (!list.includes(k)) errors.push(`${where}: unknown prop "${k}"${hint(k, list)}`);
  };
  const checkEase = (v: unknown, where: string) => {
    if (v !== undefined && !isEase(String(v))) errors.push(`${where}: unknown ease "${String(v)}"${hint(String(v), EASES)}`);
  };
  const checkStagger = (c: Layer, here: string) => {
    if (c.stagger === undefined) return;
    if (!c.repeat && !traitsOf(c.shape).scattered) errors.push(`${here}: "stagger" needs "repeat", particles or spiral`);
    if (typeof c.stagger === 'number') return;
    keys(c.stagger, STAGGER_KEYS, `${here}, stagger`);
    if (c.stagger.from !== undefined && !STAGGER_FROM.includes(c.stagger.from)) errors.push(`${here}: unknown stagger from "${c.stagger.from}"${hint(String(c.stagger.from), STAGGER_FROM)}`);
    checkEase(c.stagger.ease, `${here}, stagger`);
  };
  const checkSequence = (c: Layer, here: string) => {
    for (const s of c.sequence ?? []) {
      const where = `${here}, sequence`;
      keys(s, EVENT_KEYS, where);
      checkEase(s.ease, where);
      if (!ACTIONS.includes(s.do)) errors.push(`${where}: unknown action "${s.do}"${hint(String(s.do), ACTIONS)}`);
      if (typeof s.at !== 'number') errors.push(`${where}: "${s.do}" needs "at" (seconds after the entrance)`);
      if (s.do === 'move' && !(Array.isArray(s.to) && s.to.length === 2)) errors.push(`${where}: "move" needs "to": [x, y]`);
      if (s.do in VALUE_ACTIONS && typeof s.to !== 'number') errors.push(`${where}: "${s.do}" needs a number in "to"`);
    }
  };
  const checkBehavior = (c: Layer, a: Animation, here: string) => {
    checkEase(a.ease, `${here}, ${a.type}`);
    for (const missing of behaviorNeeds(a, c)) errors.push(`${here}: ${missing}`);
    if (a.type === 'morph' && a.into) keys(a.into, MORPH_PROPS, `${here}, morph into`);
  };
  /** The props of a figure: the rig, its cycle, pose fields and proportions, and the bones its children hang on. */
  const checkRig = (c: Layer, here: string) => {
    if (c.rig === undefined) {
      for (const k of RIG_PROPS) if (c[k] !== undefined) errors.push(`${here}: "${k}" only works on a layer with "rig"`);
      for (const child of c.children ?? []) if (child.bone !== undefined) errors.push(`${here}: "bone" only works on the children of a layer with "rig"`);
      return;
    }
    if (!RIGS.includes(c.rig)) {
      errors.push(`${here}: unknown rig "${c.rig}"${hint(String(c.rig), RIGS)}`);
      return;
    }
    const rig = RIG_LIBRARY[c.rig];
    const cycles = Object.keys(rig.cycles);
    if (c.cycle !== undefined && !cycles.includes(c.cycle)) errors.push(`${here}: the ${c.rig} has no cycle "${c.cycle}"${hint(c.cycle, cycles)}`);
    const fields = (pose: Pose, where: string) => {
      keys(pose, Object.keys(rig.rest), where);
      for (const [k, v] of Object.entries(pose)) {
        if (!(k in rig.rest)) continue;
        const target = Array.isArray(rig.rest[k]);
        if (target ? !(Array.isArray(v) && v.length === 2) : typeof v !== 'number') errors.push(`${where}: "${k}" needs ${target ? 'a target [x, y]' : 'a number'}`);
      }
    };
    if (c.pose) fields(c.pose, `${here}, pose`);
    for (const key of c.poses ?? []) {
      const { at, ease, ...pose } = key;
      if (typeof at !== 'number') errors.push(`${here}, poses: each pose needs "at" (0 to 1 of the cycle)`);
      checkEase(ease, `${here}, poses`);
      fields(pose as Pose, `${here}, poses`);
    }
    if (c.build) keys(c.build, Object.keys(rig.build), `${here}, build`);
    const bones = Object.keys(figureOf({ rig: c.rig }, 0).bones);
    for (const child of c.children ?? []) if (child.bone !== undefined && !bones.includes(child.bone)) errors.push(`${here}: the ${c.rig} has no bone "${child.bone}"${hint(child.bone, bones)}`);
  };
  const sibling = (v: string, ids: string[]) => (ids.length ? hint(v, ids) : ' (give the reference layer an "id")');
  const check = (cs: Layer[], where: string) => {
    const ids = cs.flatMap((c) => (c.id ? [c.id] : []));
    cs.forEach((c, i) => {
      const here = `layer ${where}${i + 1}`;
      if (c.use !== undefined && !(c.use in PARTS)) errors.push(`${here}: use "${c.use}" is not a kit part${hint(String(c.use), Object.keys(PARTS))}`);
      if (c.shape === undefined ? c.use === undefined && c.rig === undefined : !SHAPES.includes(c.shape)) errors.push(`${here}: unknown shape "${c.shape ?? ''}"${hint(String(c.shape ?? ''), SHAPES)}`);
      keys(c, LAYER_KEYS, here);
      if (c.material !== undefined && !materials.includes(c.material)) errors.push(`${here}: unknown material "${c.material}"${hint(String(c.material), materials)}`);
      if (c.texture !== undefined && c.texture !== false && !TEXTURES.includes(c.texture)) errors.push(`${here}: unknown texture "${c.texture}"${hint(String(c.texture), TEXTURES)}`);
      if (c.distribution !== undefined && !DISTRIBUTIONS.includes(c.distribution)) errors.push(`${here}: unknown distribution "${c.distribution}"${hint(String(c.distribution), DISTRIBUTIONS)}`);
      if (c.anchor) {
        keys(c.anchor, ANCHOR_KEYS, `${here}, anchor`);
        if (!ids.includes(c.anchor.to)) errors.push(`${here}: anchor to "${c.anchor.to}", which is not the id of a sibling layer${sibling(String(c.anchor.to), ids)}`);
        if (c.anchor.side !== undefined && !SIDES.includes(c.anchor.side)) errors.push(`${here}: unknown side "${c.anchor.side}"${hint(String(c.anchor.side), SIDES)}`);
      }
      if (c.clip !== undefined && !ids.includes(c.clip)) errors.push(`${here}: clip "${c.clip}", which is not the id of a sibling layer${sibling(String(c.clip), ids)}`);
      const mold = cs.find((o) => o.id !== undefined && o.id === c.clip);
      if (mold && (mold.use !== undefined || mold.rig !== undefined || traitsOf(mold.shape ?? 'group').noSilhouette)) errors.push(`${here}: clip "${c.clip}", which is ${mold.use ? 'a part' : mold.rig ? 'a figure' : `a ${mold.shape ?? 'group'}`}; clip by a simple shape`);
      for (const a of c.animate ?? []) {
        if (!BEHAVIORS.includes(a.type)) errors.push(`${here}: unknown behavior "${a.type}"${hint(String(a.type), BEHAVIORS)}`);
        keys(a, ANIMATION_KEYS, `${here}, ${a.type}`);
        checkBehavior(c, a, here);
      }
      checkRig(c, here);
      checkStagger(c, here);
      checkSequence(c, here);
      for (const m of c.spots ?? []) keys(m, SPOT_KEYS, `${here}, spot`);
      for (const f of c.bands ?? []) keys(f, BAND_KEYS, `${here}, band`);
      if (c.repeat) {
        if (typeof c.repeat.n !== 'number') errors.push(`${here}: "repeat" needs "n" (how many copies)`);
        keys(c.repeat, REPEAT_KEYS, `${here}, repeat`);
        if (c.repeat.step) keys(c.repeat.step, STEP_KEYS, `${here}, repeat.step`);
      }
      if (c.children) check(c.children, `${where}${i + 1}.`);
    });
  };
  check(d.layers, '');
  return errors;
}
