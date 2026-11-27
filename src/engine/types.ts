// The contract of every drawing (data or hand-made): it draws centered on (0, 0), `size` wide.
import type { Palette } from './palette.ts';

/**
 * What every drawing receives: `t`, the seconds since the entrance; `tc`, the cycle time (t × the piece speed);
 * the width, the palette, the piece options (light, night...) and a unique id prefix.
 */
export type DrawingProps = { t: number; tc: number; size: number; palette: Palette; options: Record<string, unknown>; id: string };
