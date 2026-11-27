// The reusable rigs and their cycles. A pose says where the feet and hands go (a skeleton solves the knees and elbows);
// angles are kept for what has no target: lean, tail, wings and the swimming wave. Each rig turns a pose into ordinary
// layers and names its bones, where parts can be attached. Pure (no React).
import { solveLimb } from './ik.ts';
import { DEG, TURN, type Point } from './math.ts';
import type { Layer, Marked, Pose, PoseKey, RigName } from './schema.ts';

export type Bone = { x: number; y: number; angle: number };
export type Build = Record<string, number | string>;
/** What a pose gives a rig: the layers to draw and where each bone ended up. */
export type Figure = { layers: Layer[]; bones: Record<string, Bone> };
export type Cycle = { period: number; poses: PoseKey[] };
export type Rig = {
  /** the main color (shirt, coat, feathers, scales) */
  color: string;
  /** proportions in box units and secondary colors; a layer's `build` overrides any of them */
  build: Build;
  /** every pose field, with its value when a cycle does not say */
  rest: Pose;
  /** the first one is the default */
  cycles: Record<string, Cycle>;
  /** the foot whose step sets the ground speed of a gait; without it the rig does not walk */
  gaitFoot?: string;
  figure: (pose: Pose, build: Build, color: string) => Figure;
};

const n = (v: unknown) => v as number;
const pt = (v: unknown) => v as Point;
const s = (v: unknown) => v as string;
const f = (v: number) => +v.toFixed(2);
/** `length` from a point, at `degrees` clockwise from straight up. */
const reachUp = ([x, y]: Point, length: number, degrees: number): Point => [x + length * Math.sin(degrees * DEG), y - length * Math.cos(degrees * DEG)];
const bone = ([x, y]: Point, angle = 0): Bone => ({ x: f(x), y: f(y), angle: f(angle) });

const stroke = (points: Point[], width: number, color: string, dim?: number): Marked => ({
  shape: 'path', rounded: true, d: points.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x)} ${f(y)}`).join(''), material: 'stroke', lineWidth: width, color, dim,
});

/** A two-bone limb from `root` toward `target`: the stroke and where the end got to. `bend` +1 sends the joint forward. */
function limb(root: Point, target: Point, length: number, bend: 1 | -1, width: number, color: string, dim?: number) {
  const { joint, end } = solveLimb(root, target, length / 2, length / 2, bend);
  return { line: stroke([root, joint, end], width, color, dim), joint, end };
}

const FAR = 0.3;

/** Keys per gait cycle: enough for straight blends between them to look smooth. */
const GAIT_KEYS = 24;

/**
 * One step of a foot at the fraction `u` of its cycle: on the ground going back at a steady speed (first half), then
 * lifted and brought forward on an arc. x from 1 to −1, y up as negative.
 */
const step = (u: number): Point => (u < 0.5 ? [1 - 4 * u, 0] : [-Math.cos((u - 0.5) * TURN), -Math.sin((u - 0.5) * TURN)]);

/**
 * A gait: every foot makes the same step, each starting at its own fraction of the cycle (`offsets`). `stride` is half
 * the step and `lift` how high the foot comes, both as a fraction of the leg; `body(p)` adds the other fields. The keys
 * blend in straight lines, so the planted foot never changes speed (it would slide).
 */
function gait(offsets: Record<string, number>, stride: number, lift: number, body: (p: number) => Pose): PoseKey[] {
  return Array.from({ length: GAIT_KEYS }, (_, i) => {
    const p = i / GAIT_KEYS;
    const feet = Object.fromEntries(Object.entries(offsets).map(([foot, offset]) => {
      const [x, y] = step((p - offset + 1) % 1);
      return [foot, [x * stride, y < -1e-9 ? y * lift : 0] as Point];
    }));
    return { at: p, ease: 'linear', ...feet, ...body(p) } as PoseKey;
  });
}

const swing = (p: number, amount: number, hang: number): Pose => {
  const c = Math.cos(p * TURN);
  return { handNear: [-amount * c, hang - 0.06 * c * c], handFar: [amount * c, hang - 0.06 * c * c] };
};
/** The hips: `middle` below standing, rising and falling twice a cycle (`by` more at each contact, when positive). */
const hips = (p: number, middle: number, by: number) => middle + by * Math.cos(2 * p * TURN);
const BIPED_FEET = { footNear: 0, footFar: 0.5 };

const biped: Rig = {
  gaitFoot: 'footNear',
  color: '#3D6BE0',
  build: { leg: 34, torso: 21, neck: 2, head: 10, arm: 27, limb: 6, body: 12, skin: '#F2B98F', legs: '#33415C', shoes: '#1F2430' },
  rest: { bob: 0, lean: 0, nod: 0, footNear: [0.1, 0], footFar: [-0.1, 0], handNear: [0.06, 0.93], handFar: [-0.04, 0.93] },
  cycles: {
    idle: { period: 3, poses: [{ at: 0, bob: 0 }, { at: 0.5, bob: 0.025, nod: 3, handNear: [0.08, 0.91], handFar: [-0.06, 0.91] }] },
    walk: { period: 1, poses: gait(BIPED_FEET, 0.32, 0.18, (p) => ({ ...swing(p, 0.32, 0.92), bob: hips(p, 0.03, 0.016), lean: 4 })) },
    run: { period: 0.66, poses: gait(BIPED_FEET, 0.46, 0.46, (p) => ({ ...swing(p, 0.5, 0.62), bob: hips(p, 0.11, -0.03), lean: 14 })) },
    wave: { period: 1, poses: [{ at: 0, handNear: [0.5, -0.5], nod: -4 }, { at: 0.5, handNear: [0.86, -0.28], nod: 4 }] },
    talk: { period: 2.4, poses: [
      { at: 0, handNear: [0.5, 0.46], handFar: [0.1, 0.88] }, { at: 0.25, handNear: [0.66, 0.24], nod: 5 },
      { at: 0.5, handNear: [0.44, 0.52], handFar: [0.4, 0.58] }, { at: 0.75, handNear: [0.6, 0.38], nod: -3 },
    ] },
  },
  figure(pose, b, color) {
    const [leg, torso, arm, width, head] = [n(b.leg), n(b.torso), n(b.arm), n(b.limb), n(b.head)];
    const hip: Point = [0, -leg * (0.96 - n(pose.bob))];
    const lean = n(pose.lean);
    const shoulder = reachUp(hip, torso, lean);
    const face = reachUp(shoulder, n(b.neck) + head, lean + n(pose.nod));
    const arms = reachUp(hip, torso * 0.9, lean);
    const foot = (target: Point): Point => [target[0] * leg, Math.min(0, target[1]) * leg];
    const hand = (target: Point): Point => [arms[0] + target[0] * arm, arms[1] + target[1] * arm];
    const parts = (['Far', 'Near'] as const).map((side) => {
      const dim = side === 'Far' ? FAR : undefined;
      const down = limb(hip, foot(pt(pose[`foot${side}`])), leg, 1, width, s(b.legs), dim);
      const out = limb(arms, hand(pt(pose[`hand${side}`])), arm, -1, width * 0.85, color, dim);
      return {
        leg: [down.line, { shape: 'ellipse', x: f(down.end[0] + width * 0.45), y: f(down.end[1] - width * 0.15), rx: width * 0.95, ry: width * 0.55, color: s(b.shoes), dim } as Layer],
        arm: [out.line, { shape: 'circle', x: f(out.end[0]), y: f(out.end[1]), r: width * 0.55, color: s(b.skin), material: 'volume', dim } as Layer],
        hand: out.end,
        foot: down.end,
      };
    });
    const [far, near] = parts;
    return {
      layers: [
        ...far.arm, ...far.leg, ...near.leg,
        stroke([hip, shoulder], n(b.body), color),
        { shape: 'circle', x: f(face[0]), y: f(face[1]), r: head, color: s(b.skin), material: 'volume' },
        ...near.arm,
      ],
      bones: {
        head: bone(face, lean + n(pose.nod)), chest: bone(reachUp(hip, torso * 0.62, lean), lean), hip: bone(hip, lean),
        handNear: bone(near.hand), handFar: bone(far.hand), footNear: bone(near.foot), footFar: bone(far.foot),
      },
    };
  },
};

const PAWS = ['backFar', 'frontFar', 'backNear', 'frontNear'] as const;

const quadruped: Rig = {
  gaitFoot: 'backNear',
  color: '#C98B4E',
  build: { leg: 22, length: 36, body: 21, neck: 12, head: 10, snout: 7, ear: 10, tail: 18, limb: 6, belly: '#F1D9B5', dark: '#7A4E2D', nose: '#1F2430' },
  rest: { bob: 0, nod: 0, tail: 40, frontNear: [0.08, 0], frontFar: [-0.08, 0], backNear: [0.08, 0], backFar: [-0.08, 0] },
  cycles: {
    idle: { period: 0.9, poses: [{ at: 0, tail: 22 }, { at: 0.5, tail: 66, bob: 0.015 }] },
    walk: { period: 0.9, poses: gait({ backNear: 0, frontNear: 0.25, backFar: 0.5, frontFar: 0.75 }, 0.3, 0.22, (p) => ({ bob: hips(p * 2, 0.022, 0.01), tail: 40 + 14 * Math.sin(2 * p * TURN), nod: 3 * Math.sin(2 * p * TURN) })) },
    run: { period: 0.56, poses: gait({ backNear: 0, backFar: 0.125, frontNear: 0.5, frontFar: 0.625 }, 0.46, 0.46, (p) => ({ bob: hips(p, 0.12, -0.035), tail: 12 + 10 * Math.sin(p * TURN), nod: 6 * Math.sin(p * TURN) })) },
  },
  figure(pose, b, color) {
    const [leg, length, tall, width, head] = [n(b.leg), n(b.length), n(b.body), n(b.limb), n(b.head)];
    const low = -leg * (0.96 - n(pose.bob));
    const middle: Point = [0, low - tall * 0.14];
    const roots = { front: [length / 2 - 4, low] as Point, back: [-length / 2 + 4, low] as Point };
    const paws = Object.fromEntries(PAWS.map((name) => {
      const front = name.startsWith('front');
      const root = roots[front ? 'front' : 'back'];
      const [x, y] = pt(pose[name]);
      const dim = name.endsWith('Far') ? FAR : undefined;
      // the front wrist breaks forward, the hind hock backward
      const down = limb(root, [root[0] + x * leg, Math.min(0, y) * leg], leg, front ? 1 : -1, width, color, dim);
      const paw: Marked = { shape: 'ellipse', x: f(down.end[0] + width * 0.3), y: f(down.end[1] - width * 0.2), rx: width * 0.75, ry: width * 0.5, color: s(b.belly), dim };
      return [name, { layers: [down.line, paw], end: down.end }];
    }));
    const rump: Point = [-length / 2 + 1, middle[1] - tall * 0.22];
    const tip = reachUp(rump, n(b.tail), -90 + n(pose.tail));
    const chest: Point = [length / 2 - 3, middle[1] - tall * 0.18];
    const face = reachUp(chest, n(b.neck), 34 + n(pose.nod));
    const nose: Point = [face[0] + head * 0.75 + n(b.snout) * 0.6, face[1] + head * 0.3];
    return {
      layers: [
        ...paws.backFar.layers, ...paws.frontFar.layers,
        stroke([rump, reachUp(rump, n(b.tail) * 0.6, -90 + n(pose.tail) * 0.55), tip], width * 0.8, color),
        ...paws.backNear.layers, ...paws.frontNear.layers,
        { shape: 'ellipse', y: f(middle[1]), rx: length / 2 + 4, ry: tall / 2, color, material: 'volume' },
        { shape: 'ellipse', x: 4, y: f(middle[1] + tall * 0.27), rx: length * 0.34, ry: tall * 0.2, color: s(b.belly), opacity: 0.85 },
        stroke([chest, face], head * 1.05, color),
        { shape: 'circle', x: f(face[0]), y: f(face[1]), r: head, color, material: 'volume' },
        { shape: 'ellipse', x: f(face[0] + head * 0.75), y: f(face[1] + head * 0.35), rx: n(b.snout), ry: n(b.snout) * 0.68, color: s(b.belly), material: 'volume' },
        { shape: 'circle', x: f(nose[0]), y: f(nose[1]), r: n(b.snout) * 0.3, color: s(b.nose) },
        { shape: 'leaf', x: f(face[0] - head * 0.35), y: f(face[1] - head * 0.55), w: n(b.ear) * 0.62, h: n(b.ear), rot: f(-150 - n(pose.nod) * 2), bend: -0.25, color: s(b.dark), material: 'volume' },
      ],
      bones: {
        head: bone(face, n(pose.nod)), neck: bone([chest[0] + (face[0] - chest[0]) * 0.32, chest[1] + (face[1] - chest[1]) * 0.32]), back: bone([0, middle[1] - tall / 2]), tail: bone(tip),
        ...Object.fromEntries(PAWS.map((name) => [name, bone(paws[name].end)])),
      },
    };
  },
};

const bird: Rig = {
  color: '#3E7CC9',
  build: { body: 15, head: 10, wing: 1.35, tail: 18, belly: '#FFE7C2', back: '#2A5FA8', beak: '#F58A2E' },
  rest: { bob: 0, wing: -125, tail: 0 },
  cycles: {
    fly: { period: 0.55, poses: [{ at: 0, wing: -8, bob: 2, tail: -5, ease: 'sine.inOut' }, { at: 0.5, wing: -128, bob: -2, tail: 6, ease: 'sine.inOut' }] },
    glide: { period: 2.6, poses: [{ at: 0, wing: -58, bob: -1 }, { at: 0.5, wing: -70, bob: 1, tail: 4 }] },
    perch: { period: 3, poses: [{ at: 0, wing: -132 }, { at: 0.5, wing: -128, tail: 8, bob: 0.4 }] },
  },
  figure(pose, b, color) {
    const [body, head, y, wing] = [n(b.body), n(b.head), n(pose.bob), n(pose.wing)];
    const face: Point = [body * 0.93, y - body * 0.6];
    return {
      layers: [
        { use: 'wing', x: -2, y: f(y - body * 0.4), rot: f(wing - 12), scale: n(b.wing), color: s(b.back) },
        { shape: 'leaf', x: -body * 1.33, y: f(y + 1), w: 9, h: n(b.tail), rot: f(-105 + n(pose.tail)), color: s(b.back), material: 'volume', repeat: { n: 2, step: { rot: 18 } } },
        { id: 'body', shape: 'drop', y: f(y), rot: -90, r: body, h: body * 2.93, color, material: 'volume' },
        { shape: 'ellipse', x: body * 0.33, y: f(y + body * 0.47), rx: body * 0.73, ry: body * 0.4, color: s(b.belly), clip: 'body' },
        { shape: 'circle', x: f(face[0]), y: f(face[1]), r: head, color, material: 'volume' },
        { use: 'eye', x: f(face[0] + head * 0.3), y: f(face[1] - head * 0.2), scale: head * 0.075 },
        { shape: 'triangle', x: f(face[0] + head * 1.05), y: f(face[1] + head * 0.1), w: head * 0.7, h: head * 0.9, rot: 90, color: s(b.beak) },
        { use: 'wing', x: 0, y: f(y - body * 0.4), rot: f(wing), scale: n(b.wing), color },
      ],
      bones: { head: bone(face), body: bone([0, y]), belly: bone([body * 0.2, y + body]), tail: bone([-body * 1.9, y]) },
    };
  },
};

/** Half height of a fish body along it, from the nose (0) to the root of the tail (1). */
const PROFILE: Point[] = [[0, 0.1], [0.1, 0.36], [0.3, 0.52], [0.52, 0.48], [0.76, 0.29], [1, 0.1]];

const fish: Rig = {
  color: '#F08A4B',
  build: { length: 54, height: 29, stripes: 2, stripe: '#FFFFFF', fins: '#F4C04E' },
  rest: { tail: 0, mid: 0 },
  cycles: {
    swim: { period: 1, poses: [{ at: 0, tail: 0.24 }, { at: 0.25, mid: 0.12 }, { at: 0.5, tail: -0.24 }, { at: 0.75, mid: -0.12 }] },
    hover: { period: 2.4, poses: [{ at: 0, tail: 0.08 }, { at: 0.25, mid: 0.03 }, { at: 0.5, tail: -0.08 }, { at: 0.75, mid: -0.03 }] },
  },
  figure(pose, b, color) {
    const [length, height] = [n(b.length), n(b.height)];
    const spine = (u: number) => height * (n(pose.tail) * u * u + n(pose.mid) * 4 * u * u * (1 - u));
    const at = (u: number, side: number, half: number): Point => [f(length / 2 - u * length), f(spine(u) + side * half * height)];
    const outline = [...PROFILE.map(([u, half]) => at(u, -1, half)), ...[...PROFILE].reverse().map(([u, half]) => at(u, 1, half))];
    const slope = Math.atan2(spine(1) - spine(0.82), length * 0.18) / DEG;
    const root: Point = [-length / 2 + 3, spine(0.95)];
    const head: Point = [length * 0.3, spine(0.2) - height * 0.1];
    return {
      layers: [
        ...[-28, 28].map((open): Layer => ({ use: 'fin', x: f(root[0]), y: f(root[1]), rot: f(-90 + open - slope * 1.5), scale: height / 18, color })),
        { use: 'fin', x: 2, y: f(spine(0.46) - height * 0.42), rot: f(-42 - slope), color: s(b.fins) },
        { id: 'body', shape: 'curve', points: outline, color, material: 'volume' },
        ...(n(b.stripes) > 0 ? [{ shape: 'rectangle', x: -length * 0.12, y: f(spine(0.55)), w: length * 0.09, h: height * 1.6, rot: 8, color: s(b.stripe), opacity: 0.85, clip: 'body', repeat: { n: n(b.stripes), step: { x: length * 0.24 } } } as Layer] : []),
        { use: 'eye', x: f(head[0]), y: f(head[1]), scale: height / 32 },
        { use: 'fin', x: 0, y: f(spine(0.5) + height * 0.2), rot: f(-150 - slope), scale: 0.8, color: s(b.fins) },
      ],
      bones: { head: bone(head), back: bone(at(0.42, -1, 0.5)), belly: bone(at(0.42, 1, 0.5)), tail: bone(at(1, 0, 0), slope) },
    };
  },
};

export const RIG_LIBRARY: Record<RigName, Rig> = { biped, quadruped, bird, fish };
