// Reads the 8-bit PNGs that Remotion writes, without dependencies.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

export function readPng(file) {
  const data = readFileSync(file);
  const parts = [];
  let header = null;
  for (let at = 8; at < data.length; ) {
    const length = data.readUInt32BE(at);
    const type = data.toString('latin1', at + 4, at + 8);
    const body = data.subarray(at + 8, at + 8 + length);
    if (type === 'IHDR') header = { width: body.readUInt32BE(0), height: body.readUInt32BE(4), depth: body[8], color: body[9], interlace: body[12] };
    if (type === 'IDAT') parts.push(body);
    at += length + 12;
  }
  if (!header || header.depth !== 8 || ![2, 6].includes(header.color) || header.interlace) throw new Error(`${file}: only 8-bit RGB or RGBA PNGs without interlace`);
  const channels = header.color === 6 ? 4 : 3;
  const stride = header.width * channels;
  const raw = inflateSync(Buffer.concat(parts));
  const pixels = Buffer.alloc(stride * header.height);
  for (let y = 0; y < header.height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? pixels[y * stride + x - channels] : 0;
      const up = y ? pixels[(y - 1) * stride + x] : 0;
      const corner = y && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0;
      const guess = left + up - corner;
      const [a, b, c] = [Math.abs(guess - left), Math.abs(guess - up), Math.abs(guess - corner)];
      const paeth = a <= b && a <= c ? left : b <= c ? up : corner;
      const predicted = [0, left, up, (left + up) >> 1, paeth][filter];
      pixels[y * stride + x] = (raw[y * (stride + 1) + 1 + x] + predicted) & 255;
    }
  }
  return { ...header, channels, pixels };
}
