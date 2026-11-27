// Template 3: your own drawing, as data. Copy this file, change the layers and watch it in the Studio.
// The full format is in docs/illustration.md; mistakes show on screen with a "did you mean" suggestion.
import React, { useState } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

import { DataDrawing, drawingErrors, getPalette, loadFonts, type Drawing } from '../src/library/index.ts';

/** A box from −50 to 50, centered on 0. */
const trophy: Drawing = {
  purpose: 'a trophy for the winner',
  grade: 'B',
  note: 'template',
  groundShadow: true,
  layers: [
    { id: 'cup', shape: 'trapezoid', y: -8, top: 46, bottom: 22, h: 36, color: '#F4C04E', material: 'volume', texture: 'brushed' },
    { shape: 'arc', x: -22, y: -12, r: 10, from: 180, until: 360, color: '#D99A2B', lineWidth: 4, z: -1 },
    { shape: 'arc', x: 22, y: -12, r: 10, from: 0, until: 180, color: '#D99A2B', lineWidth: 4, z: -1 },
    { id: 'stem', shape: 'rectangle', w: 9, h: 14, color: '#D99A2B', material: 'volume', anchor: { to: 'cup', side: 'bottom', gap: -1 } },
    { shape: 'rectangle', w: 34, h: 10, radius: 3, color: '#7A4E2D', material: 'volume', anchor: { to: 'stem', side: 'bottom', gap: -1 } },
    { shape: 'star', y: -9, r: 9, color: '#FFFFFF', animate: [{ type: 'enter', delay: 0.7, ease: 'elastic.out', duration: 0.9 }, { type: 'pulse', amplitude: 0.08 }] },
    { shape: 'star', y: -38, r: 3, color: 'accent', repeat: { n: 5, step: { x: 12 }, phaseStep: 0.2 }, stagger: { each: 0.12, from: 'center' }, x: -24, animate: [{ type: 'enter', delay: 1.1 }, { type: 'twinkle' }] },
  ],
};

export const MyDrawing: React.FC = () => {
  useState(() => loadFonts());
  const t = useCurrentFrame() / useVideoConfig().fps;
  const { width, height } = useVideoConfig();
  const palette = getPalette('light');
  const errors = drawingErrors(trophy);
  return (
    <AbsoluteFill style={palette.background}>
      <svg width={width} height={height}>
        {errors.map((error, i) => (
          <text key={error} x={40} y={60 + i * 40} fontFamily={palette.mono} fontSize={28} fill={palette.red}>
            {error}
          </text>
        ))}
        {errors.length ? null : (
          <g transform={`translate(${width / 2} ${height / 2})`}>
            <DataDrawing d={trophy} t={t} tc={t} size={Math.min(width, height) * 0.75} palette={palette} options={{}} id="mine" />
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
