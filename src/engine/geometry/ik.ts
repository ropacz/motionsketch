// Two-bone inverse kinematics: from where a hand or foot should go to the elbow or knee. Pure.
import type { Point } from './math.ts';

/**
 * The joint and the end of a limb with bones `a` and `b` from `root` toward `target`. Bones never stretch: a target
 * out of reach leaves the limb straight, pointing at it. `bend` +1 sends the joint of a hanging limb toward +x.
 */
export function solveLimb(root: Point, target: Point, a: number, b: number, bend: 1 | -1): { joint: Point; end: Point } {
  const [dx, dy] = [target[0] - root[0], target[1] - root[1]];
  const wanted = Math.hypot(dx, dy);
  const distance = Math.max(Math.abs(a - b) + 1e-6, Math.min(a + b, wanted));
  // a target on the root has no direction: the limb folds downward
  const [ux, uy] = wanted > 1e-9 ? [dx / wanted, dy / wanted] : [0, 1];
  const along = (a * a - b * b + distance * distance) / (2 * distance);
  const out = Math.sqrt(Math.max(0, a * a - along * along)) * bend;
  return {
    joint: [root[0] + ux * along + uy * out, root[1] + uy * along - ux * out],
    end: [root[0] + ux * distance, root[1] + uy * distance],
  };
}
