// Colors in motion: mixing, and a color with the shifts of the `color` behavior applied.
import type { ColorShift } from '../geometry/behaviors.ts';
import { paletteColor, type Palette } from '../palette.ts';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6,8})$/i;

export function mix(c: string, target: string, k: number) {
  const rgb = (h: string) => {
    const s = h.slice(1);
    const x = s.length === 3 ? [...s].map((ch) => ch + ch).join('') : s.slice(0, 6);
    return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16));
  };
  if (!HEX.test(c) || !HEX.test(target) || k <= 0) return c;
  const [a, b] = [rgb(c), rgb(target)];
  return `#${a.map((v, i) => Math.round(v + (b[i] - v) * Math.min(1, k)).toString(16).padStart(2, '0')).join('')}`;
}

export const layerColor = (palette: Palette, color: string | undefined) => paletteColor(palette, color, palette.blue);

export const tint = (palette: Palette, base: string, shifts: ColorShift[]) => shifts.reduce((c, s) => mix(c, paletteColor(palette, s.to), s.k), base);
