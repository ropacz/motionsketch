// Template 4: a short story with characters. One person walks in, stops by a friend and they talk.
// The scene is data built from `t`: who is walking, who is waving and who has the word.
import React, { useState } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

import { DRAWINGS, DataDrawing, clamp, face, getPalette, groundSpeed, loadFonts, type Drawing, type Layer } from '../src/library/index.ts';

const START = -44;
const STOP = -10;
const walkingIn: Layer = { rig: 'biped', cycle: 'walk', y: 22, scale: 0.34, children: face('#5A3A24') };
/** Walking at the speed of the feet, so they do not slide on the ground. */
const SPEED = groundSpeed(walkingIn) * walkingIn.scale!;
const ARRIVAL = (STOP - START) / SPEED;

/** The scene at `t` seconds, in a box 100 units wide (the 16:9 frame shows y from −28 to 28). */
function scene(t: number): Drawing {
  const arrived = t >= ARRIVAL;
  const talk = t >= ARRIVAL + 1.2;
  const walker: Layer = { ...walkingIn, x: Math.min(STOP, START + SPEED * t), cycle: arrived ? (talk ? 'talk' : 'wave') : 'walk' };
  const friend: Layer = {
    rig: 'biped', x: 10, y: 22, scale: 0.34, flip: true, cycle: talk ? 'talk' : arrived ? 'wave' : 'idle', phase: 0.5,
    color: '#2E9E5B', build: { skin: '#C98A63', legs: '#4A3B52' }, children: face('#1F1712'),
  };
  return {
    purpose: 'two friends meet', grade: 'B', note: 'template',
    layers: [
      { shape: 'rectangle', y: 28, w: 104, h: 12, color: '#8CCB8A', material: 'gradient', to: '#5E9E62' },
      { shape: 'group', x: 31, y: 8, scale: 0.34, children: DRAWINGS.house.layers },
      { shape: 'group', x: -34, y: 10, scale: 0.3, children: DRAWINGS.tree.layers },
      { shape: 'circle', x: 38, y: -19, r: 5, color: 'accent', material: 'shine', animate: [{ type: 'pulse' }] },
      { shape: 'cloud', x: -22, y: -18, w: 18, h: 9, color: '#FFFFFF', animate: [{ type: 'float', amplitude: 3, period: 9 }] },
      friend,
      walker,
    ],
  };
}

export const Story: React.FC = () => {
  useState(() => loadFonts());
  const t = useCurrentFrame() / useVideoConfig().fps;
  const { width, height } = useVideoConfig();
  const palette = getPalette('light');
  const line = t < ARRIVAL + 1.2 ? '' : t < ARRIVAL + 3.6 ? 'Hi! I drew all of this with data.' : 'No SVG by hand?';
  return (
    <AbsoluteFill style={palette.background}>
      <svg width={width} height={height}>
        <g transform={`translate(${width / 2} ${height / 2})`}>
          <DataDrawing d={scene(t)} t={t} tc={t} size={width} palette={palette} options={{}} id="story" />
        </g>
        <text x={width / 2} y={130} textAnchor="middle" fontFamily={palette.sans} fontWeight={700} fontSize={58} fill={palette.ink} opacity={clamp((t - ARRIVAL - 1.2) * 3)}>
          {line}
        </text>
      </svg>
    </AbsoluteFill>
  );
};
