// The colors and fonts a drawing uses, and the backgrounds to check a drawing on light and dark.
// Color names in the layers (`color: 'blue'`) come from here; any `#hex` works too.
import type React from 'react';

import { unknownName } from './geometry/suggest.ts';

export type Palette = {
  background: React.CSSProperties;
  /** stroke and text on the piece */
  ink: string;
  /** stroke and label loose on the background (light on a dark background) */
  backgroundInk: string;
  muted: string;
  accent: string;
  blue: string;
  red: string;
  green: string;
  orange: string;
  lilac: string;
  sans: string;
  mono: string;
};

/** The font families the palettes name; whoever renders loads them (library/fonts.ts). */
export const FAMILIES = { sans: 'Space Grotesk', mono: 'JetBrains Mono' };
const FONTS = { sans: `"${FAMILIES.sans}", sans-serif`, mono: `"${FAMILIES.mono}", monospace` };

const grid = (background: string, line: string): React.CSSProperties => ({
  background,
  backgroundImage: `linear-gradient(${line} 2px, transparent 2px), linear-gradient(90deg, ${line} 2px, transparent 2px)`,
  backgroundSize: '54px 54px',
  backgroundPosition: 'center center',
});
const vignette = (center: string, middle: string, edge: string): React.CSSProperties => ({
  background: `radial-gradient(ellipse 90% 70% at 50% 38%, ${center} 0%, ${middle} 55%, ${edge} 100%)`,
});

const light: Palette = {
  ...FONTS,
  background: grid('#F3F3F7', 'rgba(22,22,40,0.06)'),
  ink: '#16161D',
  backgroundInk: '#16161D',
  muted: '#8A8A99',
  accent: '#FFD60A',
  blue: '#2B44D6',
  red: '#E0413A',
  green: '#4CAF5A',
  orange: '#F28C28',
  lilac: '#8F7BD8',
};
const darkTable: Palette = {
  ...FONTS,
  background: vignette('#2E3038', '#1C1D22', '#111215'),
  ink: '#1A1A1A',
  backgroundInk: '#EAE4D3',
  muted: '#6E6A60',
  accent: '#C8352E',
  blue: '#2F4C8C',
  red: '#C8352E',
  green: '#3F7D4E',
  orange: '#D97A2B',
  lilac: '#6B5AA8',
};
const chalkboard: Palette = {
  ...FONTS,
  background: { background: '#2A2C32' },
  ink: '#E6E6EA',
  backgroundInk: '#E6E6EA',
  muted: '#9A9CA6',
  accent: '#F2C04E',
  blue: '#7FA8E8',
  red: '#EE7B6E',
  green: '#7FD18B',
  orange: '#F2A45E',
  lilac: '#9C8AE0',
};

export const PALETTES: Record<string, Palette> = {
  light,
  night: {
    ...light,
    background: grid('#12141C', 'rgba(255,255,255,0.06)'),
    ink: '#EDEDF3',
    backgroundInk: '#EDEDF3',
    muted: '#8D90A3',
    blue: '#6E8BFF',
    red: '#FF6B5E',
    green: '#4FD08A',
    orange: '#FFA040',
    lilac: '#B49CFF',
  },
  black: { ...light, background: { background: '#060606' }, ink: '#F4F4F4', backgroundInk: '#F4F4F4', muted: '#8C8C8C', blue: '#5AA9FF', red: '#FF5A4E', green: '#5BD67E', orange: '#FF9F3A', lilac: '#C29BFF' },
  pastel: { ...light, background: grid('#FFF6EA', 'rgba(60,40,20,0.06)'), ink: '#2B2240', backgroundInk: '#2B2240', muted: '#9A8FA8', accent: '#FFB3C1', blue: '#6B7BFF', red: '#FF7A7A', green: '#5CC8A0', orange: '#FFB067', lilac: '#A98BFF' },
  table: darkTable,
  wood: { ...darkTable, background: vignette('#8A6A4A', '#5E4430', '#33241A'), backgroundInk: '#F6F1E6' },
  blueprint: { ...darkTable, background: vignette('#23395A', '#16253D', '#0B1424'), backgroundInk: '#EEF1F5', muted: '#5F6B7A', accent: '#D9443A', red: '#D9443A' },
  chalkboard,
  'green-chalkboard': { ...chalkboard, background: { background: '#1F3A2E' }, ink: '#F0F0E8', backgroundInk: '#F0F0E8', muted: '#A7B8AE', accent: '#F6D365', green: '#B5EBC0', blue: '#9CC4F2', lilac: '#D2C4FF' },
  paper: { ...chalkboard, background: { background: '#FAFAF5' }, ink: '#2B2B33', backgroundInk: '#2B2B33', muted: '#8A8A96', accent: '#2350C8', blue: '#2350C8', green: '#2E9E5B', lilac: '#8A5CC8', red: '#D23C3C', orange: '#D9782B' },
};

export function getPalette(name = 'light'): Palette {
  const p = PALETTES[name];
  if (p) return p;
  throw unknownName('palette', name, Object.keys(PALETTES));
}

export const paletteColor = (p: Palette, c: string | undefined, fallback = p.ink) =>
  !c ? fallback : c.startsWith('#') ? c : ((p as Record<string, unknown>)[c] as string | undefined) ?? fallback;
