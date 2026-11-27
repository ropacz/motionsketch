// The engine's public API: draw and animate data, direct a scene, and the helpers. It knows no drawing of the library.
export { cameraAt, cameraTransform, type Shot, type View } from './camera.ts';
export type { DrawingProps } from './types.ts';
export * from './geometry/schema.ts';
export { MORPHABLE } from './geometry/shapes.ts';
export { NAMED_MATERIALS, PARTS, type Part } from './geometry/kit.ts';
export { layerBox } from './geometry/layout.ts';
export type { Box } from './geometry/path-box.ts';
export { drawingErrors } from './geometry/validate.ts';
export { RIG_LIBRARY, type Bone, type Cycle, type Rig } from './geometry/rigs.ts';
export { figureOf, groundSpeed, poseOf, sampleCycle } from './geometry/skeleton.ts';
export { sphere } from './geometry/sphere.ts';
export { DataDrawing } from './render/data-drawing.tsx';
export { Halo, Highlight, RimLight } from './render/blocks.tsx';
export { PALETTES, getPalette, paletteColor, type Palette } from './palette.ts';
export { arrival, backOut, clamp, easeInOut, easing, leave, oscillate, playSequence, pop, progress, random, staggerDelays, type Curve } from './motion.ts';
