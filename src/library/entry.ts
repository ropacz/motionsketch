import type React from 'react';

import type { Drawing } from '../engine/geometry/schema.ts';
import type { DrawingProps } from '../engine/types.ts';

export type Entry = Pick<Drawing, 'purpose' | 'grade' | 'note'> & { Draw: (p: DrawingProps) => React.ReactNode };
