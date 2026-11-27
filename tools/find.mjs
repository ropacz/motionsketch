// Finds ready examples by what they use, so that only their lines need to be read.
//   node tools/find.mjs [word...]    all words must match; without words, the whole catalog
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { PARTS } from '../src/engine/geometry/kit.ts';
import { DRAWINGS } from '../src/library/drawings/index.ts';

const folder = 'src/library/drawings';
process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const files = readdirSync(folder).map((file) => [`${folder}/${file}`, readFileSync(`${folder}/${file}`, 'utf8').split(/\r?\n/)]);

/** "path:first-last" of the definition: `dog-walk` is `export const dogWalk`. */
const where = (name) => {
  const start = new RegExp(`^export const ${name.replace(/-(\w)/g, (_, c) => c.toUpperCase())}\\b`);
  for (const [path, lines] of files) {
    const first = lines.findIndex((line) => start.test(line));
    if (first < 0) continue;
    const last = lines.findIndex((line, i) => i >= first && /^\S?\};/.test(line));
    return `${path}:${first + 1}-${last + 1}`;
  }
  return folder;
};

/** What the layers use, in the words of the format. */
const features = (layers, found = new Set()) => {
  for (const c of layers) {
    for (const value of [c.shape, c.use, c.rig, c.cycle, c.material, c.distribution]) if (value) found.add(value);
    for (const prop of ['repeat', 'stagger', 'sequence', 'anchor', 'clip', 'trail', 'bone', 'poses']) if (c[prop] !== undefined) found.add(prop);
    for (const a of c.animate ?? []) found.add(a.type);
    features(c.children ?? [], found);
  }
  return found;
};

const words = process.argv.slice(2).map((w) => w.toLowerCase());
const matches = Object.entries(DRAWINGS)
  .map(([name, d]) => ({ name, d, uses: [...features(d.layers)] }))
  .filter(({ name, d, uses }) => words.every((w) => `${name} ${d.purpose}`.toLowerCase().includes(w) || uses.includes(w)))
  .sort((a, b) => a.d.grade.localeCompare(b.d.grade));

// the catalog is names and purposes; a search also says what each match uses and where it is
for (const { name, d, uses } of matches) console.log(words.length ? `${d.grade} ${name}: ${d.purpose}\n  ${where(name)} · ${uses.join(' ')}` : `${d.grade} ${name}: ${d.purpose}`);
if (!matches.length) console.log('no drawing matches all the words; try fewer');
if (!words.length) console.log(`kit parts (use): ${Object.keys(PARTS).join(' ')}`);
