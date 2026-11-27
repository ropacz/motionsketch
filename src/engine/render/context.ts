import type { Clock } from '../geometry/behaviors.ts';
import type { Palette } from '../palette.ts';

/** What drawing a layer needs: the clock, the colors, the id prefix and where the light comes from (degrees: 0 at the top, clockwise; −45 is top-left). */
export type Ctx = Clock & { palette: Palette; id: string; light: number };
