// The fonts (files in public/fonts, OFL licenses next to them), loaded once per tab, holding the render until they arrive.
import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';

import { FAMILIES } from '../engine/palette.ts';

const FONTS: [string, string, string][] = [
  [FAMILIES.sans, '500', 'fonts/space-grotesk-latin-500-normal.woff2'],
  [FAMILIES.sans, '700', 'fonts/space-grotesk-latin-700-normal.woff2'],
  [FAMILIES.mono, '500', 'fonts/jetbrains-mono-latin-500-normal.woff2'],
  [FAMILIES.mono, '700', 'fonts/jetbrains-mono-latin-700-normal.woff2'],
];
let loading: Promise<void> | null = null;

export function loadFonts() {
  if (loading) return;
  const h = delayRender('fonts');
  loading = Promise.all(
    FONTS.map(([family, weight, file]) => new FontFace(family, `url(${staticFile(file)})`, { weight }).load().then((f) => document.fonts.add(f))),
  )
    .then(() => continueRender(h))
    .catch((error) => cancelRender(error));
}
