// Compares two renders pixel by pixel: node tools/compare.mjs before.png after.png
// Exits with 1 when any pixel differs. No dependencies.
import { readPng } from './png.mjs';

const files = process.argv.slice(2);
if (files.length !== 2) {
  console.error('usage: node tools/compare.mjs before.png after.png');
  process.exit(2);
}
const [a, b] = files.map(readPng);
if (a.width !== b.width || a.height !== b.height) {
  console.log(`different sizes: ${a.width}x${a.height} and ${b.width}x${b.height}`);
  process.exit(1);
}
let [different, largest] = [0, 0];
for (let i = 0; i < a.width * a.height; i++) {
  let gap = 0;
  const channel = (image, k) => (k < image.channels ? image.pixels[i * image.channels + k] : 255); // no alpha: opaque
  for (let k = 0; k < 4; k++) gap = Math.max(gap, Math.abs(channel(a, k) - channel(b, k)));
  if (gap) different++;
  largest = Math.max(largest, gap);
}
console.log(`different pixels: ${different} of ${a.width * a.height}, largest difference ${largest}`);
process.exit(different ? 1 : 0);
