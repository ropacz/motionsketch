// A layer with `rig` at a moment: sample its cycle into a pose, let the rig draw the pose, and hang the attached
// parts on the bones. The result is an ordinary group, so the renderer knows nothing about skeletons. Pure.
import { easing } from '../motion.ts';
import { catmull } from './math.ts';
import { RIG_LIBRARY, type Build, type Figure } from './rigs.ts';
import { RIG_PROPS, type Layer, type Pose, type PoseKey } from './schema.ts';

type Value = number | [number, number];

/**
 * The pose at the fraction `p` of a looping cycle. A key says only what it changes from `rest`. Between keys the
 * motion is a smooth curve through them; a key with `ease` is arrived at in a straight blend shaped by that ease.
 */
export function sampleCycle(keys: PoseKey[], rest: Pose, p: number): Pose {
  const sorted = [...keys].sort((a, b) => a.at - b.at);
  const count = sorted.length;
  if (!count) return { ...rest };
  const turn = p - Math.floor(p);
  let i = count - 1;
  for (let k = 0; k < count; k++) if (sorted[k].at <= turn) i = k;
  const key = (k: number) => sorted[((k % count) + count) % count];
  const [from, to] = [key(i), key(i + 1)];
  const span = (((to.at - from.at) % 1) + 1) % 1 || 1;
  const u = ((((turn - from.at) % 1) + 1) % 1) / span;
  return Object.fromEntries(Object.entries(rest).map(([field, still]) => {
    const value = (k: number) => (key(k)[field] ?? still) as Value;
    const blend = (pick: (v: Value) => number) =>
      to.ease ? pick(value(i)) + (pick(value(i + 1)) - pick(value(i))) * easing(to.ease)(u) : catmull(pick(value(i - 1)), pick(value(i)), pick(value(i + 1)), pick(value(i + 2)), u);
    return [field, Array.isArray(still) ? ([blend((v) => (v as [number, number])[0]), blend((v) => (v as [number, number])[1])] as [number, number]) : blend((v) => v as number)];
  }));
}

function cycleOf(c: Layer) {
  const { cycles } = RIG_LIBRARY[c.rig!];
  const name = c.cycle ?? Object.keys(cycles)[0];
  return { name, period: c.period ?? cycles[name].period, poses: c.poses ?? cycles[name].poses };
}

export function poseOf(c: Layer, tc: number): Pose {
  const { period, poses } = cycleOf(c);
  return { ...sampleCycle(poses, RIG_LIBRARY[c.rig!].rest, tc / period + (c.phase ?? 0)), ...c.pose };
}

export function figureOf(c: Layer, tc: number): Figure {
  const rig = RIG_LIBRARY[c.rig!];
  return rig.figure(poseOf(c, tc), { ...rig.build, ...c.build } as Build, c.color ?? rig.color);
}

export function expandFigure(c: Layer, tc: number): Layer {
  if (!c.rig) return c;
  const { layers, bones } = figureOf(c, tc);
  const attached = (c.children ?? []).map((child): Layer => {
    const at = child.bone ? bones[child.bone] : undefined;
    if (!at) return child;
    const { bone: _, ...part } = child;
    return { shape: 'group', x: at.x, y: at.y, rot: at.angle, children: [part] };
  });
  const group: Layer = { ...c, shape: 'group', children: [...layers, ...attached] };
  for (const key of ['rig', ...RIG_PROPS] as const) delete group[key];
  return group;
}

/**
 * How fast a walking or running figure should travel (box units per second, before `scale`) so that the foot on the
 * ground does not slide: what that foot goes back while it is planted.
 */
export function groundSpeed(c: Layer): number {
  const rig = RIG_LIBRARY[c.rig!];
  const { name, period, poses } = cycleOf(c);
  const x = (p: number) => (rig.gaitFoot ? (sampleCycle(poses, rig.rest, p)[rig.gaitFoot] as [number, number])[0] : 0);
  // a gait plants the foot during the first half of its step
  const back = x(0) - x(0.5);
  if (back < 1e-6) throw new Error(`the ${c.rig} cycle "${name}" is not a gait: it has no ground speed`);
  return (back * ((c.build?.leg as number | undefined) ?? (rig.build.leg as number))) / (period / 2);
}
