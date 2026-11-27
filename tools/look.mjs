// One image to check a drawing: three moments of it, on light and dark. Few tokens for an agent to read.
//   node tools/look.mjs name [other-name] [--at=0.3,1.5,4]
// Data errors are printed before anything is rendered.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { drawingErrors } from '../src/engine/geometry/validate.ts';
import { unknownName } from '../src/engine/geometry/suggest.ts';
import { DRAWINGS } from '../src/library/drawings/index.ts';

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const names = args.filter((a) => !a.startsWith('--'));
const at = (args.find((a) => a.startsWith('--at='))?.slice(5) ?? '0.3,1.5,4').split(',').map(Number);
// more than two drawings, or four moments, and the image is scaled down until it cannot be read
if (!names.length || names.length > 2 || at.length > 4 || !at.every((t) => t >= 0)) fail('usage: npm run look -- name [other-name] [--at=0.3,1.5,4]  (up to 2 names and 4 moments in seconds)');

// the hand-made drawings are TSX, which Node cannot import: their names are their file names
const handmade = readdirSync('src/library/handmade').filter((f) => f.endsWith('.tsx')).map((f) => f.slice(0, -4));
for (const name of names) {
  if (handmade.includes(name)) continue;
  if (!Object.hasOwn(DRAWINGS, name)) fail(unknownName('drawing', name, [...Object.keys(DRAWINGS), ...handmade]).message);
  const errors = drawingErrors(DRAWINGS[name]);
  if (errors.length) fail(`${name}:\n${errors.join('\n')}`);
}

mkdirSync('out', { recursive: true });
writeFileSync('out/look.json', JSON.stringify({ names, at }));
const cli = 'node_modules/@remotion/cli/remotion-cli.js';
const run = spawnSync(process.execPath, [cli, 'still', 'src/index.ts', 'Sheet', 'out/look.png', '--props=out/look.json'], { encoding: 'utf8' });
const log = `${run.stdout}${run.stderr}`;
writeFileSync('out/look.log', log);
if (run.status !== 0) fail(`${log.split('\n').slice(-25).join('\n')}\nrender failed; full log in out/look.log`);

const png = readFileSync('out/look.png');
console.log(`out/look.png ${png.readUInt32BE(16)}x${png.readUInt32BE(20)} · rows: ${names.join(', ')} (light, night) · columns: t = ${at.join(', ')} s`);
