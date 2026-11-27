import React from 'react';
import { Composition, Folder } from 'remotion';

import { EXAMPLES } from '../examples/index.ts';

import { showcaseHeight, showcaseWidth, SingleDrawing, Showcase, type ShowcaseProps } from './Showcase.tsx';

const FPS = 30;

export const Root: React.FC = () => (
  <>
    <Composition
      id="Showcase"
      component={Showcase}
      fps={FPS}
      width={showcaseWidth}
      height={showcaseHeight()}
      durationInFrames={FPS * 10}
      defaultProps={{ palette: 'light' } as ShowcaseProps}
      calculateMetadata={({ props }) => ({ height: showcaseHeight(props as ShowcaseProps) })}
    />
    <Folder name="Examples">
      {EXAMPLES.map(({ id, component, width, height, seconds }) => (
        <Composition key={id} id={id} component={component} fps={FPS} width={width} height={height} durationInFrames={FPS * seconds} />
      ))}
    </Folder>
    <Composition id="Drawing" component={SingleDrawing} fps={FPS} width={1080} height={1080} durationInFrames={FPS * 6} defaultProps={{ name: 'earth', palette: 'light' }} />
  </>
);
