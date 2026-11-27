// Showcase: the library drawings side by side, from grade A to C, with the grade and the name, animating over time.
import React, { useState } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

import { LIBRARY, Piece, getPalette, loadFonts, type Grade } from './library/index.ts';

export type ShowcaseProps = { palette?: string; names?: string[]; grade?: Grade };
const SHOWCASE = { columns: 4, w: 270, h: 300, size: 210, center: 130, label: 150 };
export const showcaseWidth = SHOWCASE.columns * SHOWCASE.w;

const showcaseNames = ({ names, grade }: ShowcaseProps = {}) =>
  Object.keys(LIBRARY)
    .filter((n) => (!names?.length || names.includes(n)) && (!grade || LIBRARY[n].grade === grade))
    .sort((a, b) => LIBRARY[a].grade.localeCompare(LIBRARY[b].grade));

export const showcaseHeight = (props: ShowcaseProps = {}) => Math.ceil(showcaseNames(props).length / SHOWCASE.columns) * SHOWCASE.h;

export const Showcase: React.FC<ShowcaseProps> = (props) => {
  useState(() => loadFonts());
  const palette = getPalette(props.palette);
  const t = useCurrentFrame() / useVideoConfig().fps;
  const names = showcaseNames(props);
  return (
    <AbsoluteFill style={palette.background}>
      <svg width={showcaseWidth} height={showcaseHeight(props)}>
        {names.map((name, i) => {
          const x = (i % SHOWCASE.columns) * SHOWCASE.w + SHOWCASE.w / 2;
          const y = Math.floor(i / SHOWCASE.columns) * SHOWCASE.h + SHOWCASE.center;
          return (
            <g key={name}>
              <Piece name={name} t={t} palette={palette} x={x} y={y} size={SHOWCASE.size} instance={i} />
              <text x={x} y={y + SHOWCASE.label} textAnchor="middle" fontFamily={palette.mono} fontSize={20} fill={palette.backgroundInk} opacity={0.8}>
                {LIBRARY[name].grade} · {name}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const SingleDrawing: React.FC<{ name: string; palette?: string; options?: Record<string, unknown> }> = ({ name, palette, options }) => {
  useState(() => loadFonts());
  const p = getPalette(palette);
  const { fps, width, height } = useVideoConfig();
  const t = useCurrentFrame() / fps;
  return (
    <AbsoluteFill style={p.background}>
      <svg width={width} height={height}>
        <Piece name={name} t={t} palette={p} x={width / 2} y={height / 2} size={Math.min(width, height) * 0.7} instance={0} options={options} />
      </svg>
    </AbsoluteFill>
  );
};
