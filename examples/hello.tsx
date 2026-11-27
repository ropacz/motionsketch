// Template 1: one library drawing on screen. Change `name`, the palette or the options.
import React, { useState } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

import { Piece, getPalette, loadFonts } from '../src/library/index.ts';

export const Hello: React.FC = () => {
  useState(() => loadFonts()); // holds the render until the fonts arrive
  const t = useCurrentFrame() / useVideoConfig().fps; // seconds: everything is a function of this
  const { width, height } = useVideoConfig();
  const palette = getPalette('night');
  return (
    <AbsoluteFill style={palette.background}>
      <svg width={width} height={height}>
        <Piece name="earth" t={t} palette={palette} x={width / 2} y={height / 2} size={760} instance="hello" options={{ night: 1, nightAt: 1.5 }} />
      </svg>
    </AbsoluteFill>
  );
};
