// The templates, as compositions of the Studio. To add yours: a file here and a line in this list.
import type React from 'react';

import { Cosmos } from './cosmos.tsx';
import { Explainer } from './explainer.tsx';
import { Hello } from './hello.tsx';
import { MyDrawing } from './my-drawing.tsx';
import { Story } from './story.tsx';

export const EXAMPLES: { id: string; component: React.FC; width: number; height: number; seconds: number }[] = [
  { id: 'Hello', component: Hello, width: 1080, height: 1080, seconds: 6 },
  { id: 'Explainer', component: Explainer, width: 1920, height: 1080, seconds: 7 },
  { id: 'MyDrawing', component: MyDrawing, width: 1080, height: 1080, seconds: 6 },
  { id: 'Story', component: Story, width: 1920, height: 1080, seconds: 10 },
  { id: 'Cosmos', component: Cosmos, width: 1920, height: 1080, seconds: 10 },
];
