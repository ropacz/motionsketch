// Template 5: a directed scene with a camera. It starts close on the Sun, pulls back to the Earth in orbit, dives into
// it and lands on an atom. Change SHOTS to direct it your way: each shot says when, where to look and how close.
import React, { useState } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

import { Piece, cameraAt, cameraTransform, easing, getPalette, loadFonts, progress, random, type Shot } from '../src/library/index.ts';

/** The Earth on its orbit around the Sun, which sits at (0, 0) of the scene. */
const ORBIT = { rx: 900, ry: 330 };
const earthAt = (t: number): [number, number] => {
  const angle = 0.5 + 0.075 * t;
  return [ORBIT.rx * Math.cos(angle), ORBIT.ry * Math.sin(angle)];
};

const SHOTS: Shot[] = [
  { at: 0, to: [0, 42], zoom: 1.62 },
  { at: 2.1, to: [16, 40], zoom: 1.8, ease: 'sine.inOut' }, // a slow push on the Sun
  { at: 4.1, to: [120, 40], zoom: 0.9, ease: 'power3.inOut' }, // pull back: there is the Earth
  { at: 5.1, to: [170, 60], zoom: 0.93, ease: 'sine.inOut' },
  { at: 7.35, to: earthAt, zoom: 11, ease: 'power1.inOut' }, // dive, tracking it as it moves
];

/** From the second the world gives way to the atom, and how long it takes. */
const THROUGH = { at: 6.95, duration: 0.45 };

const CAPTIONS = [
  { from: 0.45, until: 2.2, text: 'The Sun' },
  { from: 3.7, until: 5.7, text: 'Earth, 150 million km away' },
  { from: 8.0, until: 11, text: 'and all of it is made of atoms' },
];

const dust = random(41);
const STARS = Array.from({ length: 520 }, () => ({ x: (dust() - 0.5) * 3400, y: (dust() - 0.5) * 2000, r: 0.5 + dust() ** 3 * 2.6, glow: 0.25 + dust() * 0.7, phase: dust() * 6.28 }));

export const Cosmos: React.FC = () => {
  useState(() => loadFonts());
  const { fps, width, height } = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const palette = getPalette('night');
  const view = cameraAt(SHOTS, t);
  const through = progress(t, THROUGH.at, THROUGH.duration, easing('sine.inOut'));
  const arrive = progress(t, THROUGH.at, 1.5, easing('expo.out'));
  const [ex, ey] = earthAt(t);
  const stars = (
    <>
      {STARS.map((star, i) => (
        <circle key={i} cx={star.x} cy={star.y} r={star.r} fill="#FFFFFF" opacity={star.glow * (0.8 + 0.2 * Math.sin(t * 2 + star.phase))} />
      ))}
    </>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: '#070A14' }}>
      <svg width={width} height={height}>
        {through < 1 ? (
          <g opacity={1 - through}>
            {/* far away, the stars barely react to the camera: that is what gives depth */}
            <g transform={cameraTransform(view, width, height, 0.16)}>{stars}</g>
            <g transform={cameraTransform(view, width, height)}>
              <ellipse rx={ORBIT.rx} ry={ORBIT.ry} fill="none" stroke="#7C93C9" strokeWidth={2.2 / view.zoom} opacity={0.35 * progress(t, 2.4, 1.2, easing('sine.out'))} />
              <Piece name="sun" t={t} palette={palette} x={0} y={0} size={520} instance="sun" />
              <Piece name="earth" t={t} palette={palette} x={ex} y={ey} size={170} instance="earth" />
            </g>
          </g>
        ) : null}
        {through > 0 ? (
          <g opacity={through}>
            {/* the same push goes on across the cut: the atom comes at us and settles */}
            <g transform={cameraTransform({ x: 0, y: 0, zoom: 1 + 0.35 * (1 - arrive) + 0.02 * (t - THROUGH.at) }, width, height, 0.4)}>{stars}</g>
            <g transform={`translate(${width / 2} ${height / 2 - 30}) scale(${0.12 + 0.88 * arrive + 0.025 * Math.max(0, t - 8.3)})`}>
              <Piece name="atom" t={t - THROUGH.at + 0.4} palette={palette} x={0} y={0} size={760} instance="atom" />
            </g>
          </g>
        ) : null}
        <defs>
          <clipPath id="caption-line">
            <rect x={0} y={height - 190} width={width} height={96} />
          </clipPath>
        </defs>
        {CAPTIONS.map(({ from, until, text }) => {
          const come = progress(t, from, 0.55, easing('power4.out'));
          const go = progress(t, until, 0.35, easing('power2.in'));
          return come > 0 && go < 1 ? (
            // the line rises out of a mask and leaves upward
            <g key={text} clipPath="url(#caption-line)">
              <text x={width / 2} y={height - 118 + 90 * (1 - come) - 90 * go} textAnchor="middle" fontFamily={palette.sans} fontWeight={700} fontSize={64} fill="#F4F6FF">
                {text}
              </text>
            </g>
          ) : null;
        })}
      </svg>
    </AbsoluteFill>
  );
};
