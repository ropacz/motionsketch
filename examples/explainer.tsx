// Template 2: an explainer slide: a title and three drawings that come in one after the other, each with a caption.
// To make your own, edit TITLE and ITEMS.
import React, { useState } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

import { Piece, clamp, getPalette, loadFonts, progress, easing } from '../src/library/index.ts';

const TITLE = 'From a drop to the clouds';
const ITEMS = [
  { name: 'water-glass', caption: 'Water', at: 0.8 },
  { name: 'water-molecule', caption: 'Molecules', at: 1.8 },
  { name: 'rain-cloud', caption: 'Rain', at: 2.8 },
];

export const Explainer: React.FC = () => {
  useState(() => loadFonts());
  const t = useCurrentFrame() / useVideoConfig().fps;
  const { width, height } = useVideoConfig();
  const palette = getPalette('paper');
  const rise = (at: number) => 40 * (1 - progress(t, at, 0.6, easing('power3.out')));
  return (
    <AbsoluteFill style={palette.background}>
      <svg width={width} height={height}>
        <text x={width / 2} y={190 + rise(0.1)} textAnchor="middle" fontFamily={palette.sans} fontWeight={700} fontSize={82} fill={palette.backgroundInk} opacity={clamp((t - 0.1) * 3)}>
          {TITLE}
        </text>
        {ITEMS.map((item, i) => {
          const x = (width / ITEMS.length) * (i + 0.5);
          return (
            <g key={item.name}>
              {/* `t - item.at`: the piece enters when its time comes */}
              <Piece name={item.name} t={t - item.at} palette={palette} x={x} y={560} size={440} instance={i} />
              <text x={x} y={900 + rise(item.at + 0.3)} textAnchor="middle" fontFamily={palette.mono} fontSize={44} fill={palette.backgroundInk} opacity={clamp((t - item.at - 0.3) * 3)}>
                {item.caption}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
