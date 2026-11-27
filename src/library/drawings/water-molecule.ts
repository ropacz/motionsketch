// Water molecule (H2O): a red oxygen and two white hydrogens with volume, bonds at ~104°;
// the whole molecule floats and sways, and the hydrogens vibrate slightly.
import type { Layer, Drawing } from '../../engine/geometry/schema.ts';

const h = (x: number, phase: number): Layer => ({ shape: 'circle', x, y: 20, r: 12, color: '#F2F4F8', material: 'volume', animate: [{ type: 'pulse', amplitude: 0.035, period: 1.3, phase }] });

export const waterMolecule: Drawing = {
  purpose: 'floating water molecule (H2O)', grade: 'B', note: 'balls and bonds with volume; no idea of charge yet (+ and − poles)',
  layers: [
    { shape: 'circle', r: 50, color: 'blue', material: 'glow', opacity: 0.18, z: -2 },
    {
      shape: 'group', animate: [{ type: 'float', amplitude: 2, period: 5 }, { type: 'sway', amplitude: 7, period: 6 }],
      children: [
        { shape: 'path', d: 'M-32 20L0 -4L32 20', material: 'stroke', color: '#B4BECC', lineWidth: 6, z: -1 },
        { shape: 'circle', y: -4, r: 19, color: '#E5484D', material: 'volume' },
        h(-32, 0), h(32, 0.5),
      ],
    },
  ],
};
