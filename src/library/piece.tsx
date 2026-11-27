// A library drawing on screen: position, entrance with overshoot, speed and a unique id. The drawing itself only draws.
import { pop } from '../engine/motion.ts';
import type { Palette } from '../engine/palette.ts';
import { getEntry } from './catalog.tsx';

export type PieceProps = {
  name: string;
  /** seconds since the entrance */
  t: number;
  palette: Palette;
  x: number;
  y: number;
  /** width */
  size: number;
  /** tells two pieces apart on the same screen (SVG ids) */
  instance: string | number;
  /** drawing options: speed (1, multiplies the cycles), light, groundShadow, night... */
  options?: Record<string, unknown>;
};

export function Piece({ name, t, palette, x, y, size, instance, options = {} }: PieceProps) {
  const { Draw } = getEntry(name);
  const { scale, opacity } = pop(t);
  const tc = t * (typeof options.speed === 'number' ? options.speed : 1);
  return (
    <g opacity={opacity} transform={`translate(${x} ${y}) scale(${scale})`}>
      <Draw t={t} tc={tc} size={size} palette={palette} options={options} id={`p${instance}`} />
    </g>
  );
}
