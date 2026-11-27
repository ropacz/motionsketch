// The data drawings, by name. These files import only the engine's pure `.ts` modules, never an index or a `.tsx`:
// the tests load them with plain Node, which cannot read TSX.
import type { Drawing } from '../../engine/geometry/schema.ts';
import { atom } from './atom.ts';
import { bird, cat, dog, fish, walker } from './characters.ts';
import { cell } from './cell.ts';
import { brain, dna, rocket, rainCloud, thermometer, virus, volcano } from './science.ts';
import { battery, phone, book, coin, clock } from './everyday.ts';
import { checklist, mapPin, paperPlane, playButton } from './explainer.ts';
import { galaxy } from './galaxy.ts';
import { mars } from './mars.ts';
import { tree, car, house, waterGlass, lightbulb } from './objects.ts';
import { waterMolecule } from './water-molecule.ts';
import { radioWave } from './radio-wave.ts';
import { saturn } from './saturn.ts';
import { conversation, dogWalk, frontYard, schoolOfFish } from './scenes.ts';
import { solarSystem } from './solar-system.ts';

export const DRAWINGS = {
  atom,
  mars,
  saturn,
  galaxy,
  'water-molecule': waterMolecule,
  cell,
  'radio-wave': radioWave,
  'solar-system': solarSystem,
  house,
  car,
  tree,
  bird,
  fish,
  lightbulb,
  'water-glass': waterGlass,
  coin,
  phone,
  battery,
  clock,
  book,
  rocket,
  'rain-cloud': rainCloud,
  volcano,
  thermometer,
  brain,
  dna,
  virus,
  checklist,
  'paper-plane': paperPlane,
  'play-button': playButton,
  'map-pin': mapPin,
  walker,
  dog,
  cat,
  'dog-walk': dogWalk,
  conversation,
  'front-yard': frontYard,
  'school-of-fish': schoolOfFish,
} satisfies Record<string, Drawing>;
