// Small math shared by the whole engine. No dependencies.

export type Point = [number, number];

export const DEG = Math.PI / 180;
export const TURN = 2 * Math.PI;

export const num = (v: unknown, fallback: number) => (typeof v === 'number' ? v : fallback);
export const frac = (v: number) => v - Math.floor(v);

export const catmull = (a: number, b: number, c: number, d: number, u: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
