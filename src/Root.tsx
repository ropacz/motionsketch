import React from 'react';
import { Composition, Folder } from 'remotion';

import { EXAMPLES } from '../examples/index.ts';

import { Sheet, sheetSize, showcaseHeight, showcaseWidth, SingleDrawing, Showcase, type ShowcaseProps } from './Showcase.tsx';

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
    <Composition
      id="Sheet"
      component={Sheet}
      fps={FPS}
      width={900}
      height={600}
      durationInFrames={1}
      defaultProps={{ names: ['atom'], at: [0.3, 1.5, 4] }}
      calculateMetadata={({ props }) => sheetSize(props)}
    />
    <Folder name="Examples">
      {EXAMPLES.map(({ id, component, width, height, seconds }) => (
        <Composition key={id} id={id} component={component} fps={FPS} width={width} height={height} durationInFrames={FPS * seconds} />
      ))}
    </Folder>
    <Composition id="Drawing" component={SingleDrawing} fps={FPS} width={1080} height={1080} durationInFrames={FPS * 6} defaultProps={{ name: 'earth', palette: 'light' }} />
  </>
);
