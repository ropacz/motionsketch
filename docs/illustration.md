# Drawing guide

A drawing is **data**: layers that are cheap to write, which the engine (`engine/render/data-drawing.tsx`) draws and animates. Use data before writing a component by hand; components are for what data cannot do yet.

## The format

- **Piece:** `<Piece name="atom" x y size t palette instance options={{ speed, light, groundShadow }} />` (`src/library/piece.tsx`). Data drawings live in `src/library/drawings/` (`index.ts` maps name → definition; each one with `purpose`, `grade` and `note`). `speed` (1) multiplies the cycles.
- **Coordinates:** a box from −50 to 50, centered on 0, scaled to `size`. Stroke widths use the same scale (1 ≈ 1% of the size).
- **Layer:** `{ shape, id, x, y, rot, ...geometry, color, material, texture, outline, lineWidth, opacity, z, anchor, use, clip, animate: [...], children: [...] }`. Children inherit the parent's position and animation.
- **Drawing light:** `light` on the piece (or on the library drawing): `top-left` (default) | `top` | `top-right` | `left` | `right` | degrees (0 at the top, clockwise). The light side of `volume`, the rim light, the highlight and the sphere's shading and night follow it. **Ground shadow:** `groundShadow: true` on the drawing (or the piece) puts a soft ellipse under the drawing's box (a resting object: house, car, coin).
- **Simple shapes:** `circle` (r), `ellipse` (rx, ry), `rectangle` (w, h, radius), `polygon` (points [[x, y]...]), `path` (SVG d), `ring` (r, thickness), `star` (r, tips, inner: 0.45), `orbit` (rx, ry, rot: the ellipse as a stroke), `group` (children only). Every layer accepts a fixed `scale`.
- **Parametric shapes** (prefer them to `curve` and `path`): `drop` (r; h: tip to bottom, 2.6r; center on the ball, tip up), `leaf` (w 10, h 24, bend; **the base sits at the origin** and grows upward: turn it with `rot`), `cloud` (w 40, h 22, n bubbles 7, seed; almost flat at the bottom), `heart` (r), `arrow` (from [x, y], to [x, y], bend: arches, head 4, lineWidth; always a stroke), `bolt` (w, h), `triangle` (w, h; tip up), `diamond` (w, h), `trapezoid` (top 12, bottom 20, h 14), `gear` (r, teeth 8, inner 0.78, hole 0.3), `arc` (r, from, until: clock degrees, 0 at the top; a stroke by default, a slice with `flat`/`volume`), `text` (text, size 20, weight 700; palette font: H, O, +, −).
- **`curve`:** `points` [[x, y]...] joined by a smooth curve (Catmull-Rom) through them; `closed` (true; open becomes a stroke). For organic silhouettes (fish body, crooked leaf) instead of a hand-written `path`.
- **Relative position:** `"id": "wall"` on a layer and, on a sibling, `"anchor": { "to": "wall", "side": "top" | "bottom" | "left" | "right" | "center" | "inside-top" | "inside-bottom", "gap": 0 }`: the engine places this box against that one (without rotation or animation); `x` and `y` add as an adjustment. Works between siblings (the same list); the reference may be anchored too. Group and `use`: the box is the children's.
- **Parts (`use`):** `{ "use": "window", "x": -15, "scale": 1, "rot": 0, "color": "#FFF" }` instantiates a kit part as a group; its layers **without a color** inherit the `color` (or the part's own). Kit (`engine/geometry/kit.ts`, ~20 units): `wheel` (spins), `window`, `door`, `eye` (blinks), `wing` (`curve` with feathers), `fin`, `tree-leaf`, `clock-hand` (these four with the base at the origin), `flame` (flickers; tip up).
- **Clip:** `"clip": "glass"`: the layer (and its children) only shows inside the shape of the sibling `glass` (liquid in a glass, a stripe on a fish, a terminator on a ball). The reference must be a simple shape (not a group, arrow, part, figure, particles or spiral).
- **Composed shapes** (they use the building blocks in `engine/render/blocks.tsx`):
  - `sphere`: `r` (30), `tilt` (degrees, 15: the north pole comes toward us), `axis` (degrees in the screen plane), `spin` (degrees/s, 6; positive moves left to right), `color`, `material` (`volume` default; `flat` without shading). `spots`: a list of `{ lon, lat, r (degrees, 15), stretch (width/height), irregular (0 to 1, 0.3), color (white), opacity, drift (extra degrees/s: clouds) }`, or with `points` ([[lon, lat]...], smoothed: continents), or `{ n, seed, size: [min, max] }` to scatter (craters, clouds). `bands`: `{ lat, width (degrees, 10), color, opacity, wave (degrees: the edge waves and shows the spin) }`; a band past 90° becomes a polar cap. `night` (0 to 1: a terminator from top left to bottom right), `atmosphere` (color: thin halo and rim light). Spots fade by depth as they go behind.
  - `particles`: `n` (40), `seed`, `distribution` (`disc` | `ring` (thickness) | `sunflower` (golden angle) | `band` (w, h) | `cloud`), `radius` (40), `size` [min, max], `color` or `colors` (one random per particle), `material` (per particle; one gradient per color), `flatten` (1 = face-on; 0.5 = a disc seen edge-on), `spin` (degrees/s) and `differential` (0; above 0, the inside spins faster), `depth` (far is smaller, darker and dimmer; edge-on, far is up). `animate` applies to **each** particle, with a random phase (only `enter` and `color` apply to the set).
  - `spiral`: the particle props plus `arms` (2), `turns` (1.2) and `spread` (0.12); defaults `n` 240, `spin` 8 and `differential` 0.35. With `material: "stroke"`, each arm is a line (`lineWidth`).
- **Repeat** (any layer): `"repeat": { "n": 8, "step": { "rot": 45, "x": 0, "y": 0, "scale": 1 }, "phaseStep": 0.125 }` makes n copies; the k-th gets k steps (rot around the parent origin, scale multiplied) and each behavior's phase + k × phaseStep. Row: `step.x`; circle: a layer at `x` with `step.rot`; successive waves: no step, only `phaseStep`.
- **Color:** a palette name (`blue`, `accent`, `ink`, `red`, `green`, `orange`, `lilac`, `muted`) or `#hex`. Without a color, the palette blue.
- **Materials:** `flat` (default); `gradient` (linear from `from` (the color) to `to` (the color darkened), `angle` as in CSS: 180 top to bottom); `volume` (3 tones derived from the color: light on the `light` side, midtone and shadow on the other side; **automatic finish** on every shape with a known box: a thin `RimLight` opposite the light and a small `Highlight` on its side, both clipped by the shape; also for `glass` and `metal`; `path` has a box from the control points of `d` and the arc extremes (only a rotated arc has no box); left out on `text`, `arrow`, `orbit`, `arc` and group, which has no silhouette of its own); `glow` (a halo fading to transparent; `core` gives the color of the center; on a circle, the building block `Halo`); `stroke` (outline only; default on `orbit`; with a box of 4 or more, the stroke gets volume: a gradient from light, on the light side, to dark, also on a straight line; except `arrow` and `orbit`). `outline` + `lineWidth` add a stroke to any material.
- **Texture** (`texture`, light, by pattern and gradient, no filter): `grain` (very subtle dots; default on `volume` and `sphere`), `brushed` (stripes and fibers of light; comes with `metal`), `glare` (a diagonal band in the light direction; comes with `glass`); `"texture": false` turns it off on the layer.
- **Named materials** (`NAMED_MATERIALS` in `engine/geometry/kit.ts`, prop shortcuts; the layer's props win): `shine` (glow with a white core: star, core, lightbulb), `glass` (translucent volume with a light outline: bubble, cell), `metal` (gray volume).
- **Behaviors** (`animate: [{ "type": ..., "phase": 0-1, "ease": ... }]`, all functions of t):
  - `spin` (speed in degrees/s, 30; center [x, y]); `sway` (back-and-forth rotation: amplitude in degrees, 12; period 3; center [x, y]: the base of a trunk);
  - `blink` (period 3.5, duration 0.2): closes the height and opens (eye); slow and inside a group lying down (`rot` 90, the inner one −90), it closes the width: a spinning coin, a turning page; `rise` (distance 20, period 3): rises, grows and fades, in a loop (smoke, bubble; negative falls: a falling leaf); on particles, each one in its own phase;
  - `orbit` (rx, ry, rot, period in s, direction 1 or −1): moves the layer along the ellipse, with perspective (smaller and dimmer behind);
  - `pulse` (amplitude 0.06, period 2); `float` (amplitude 1.5, period 4; X and Y at 0.22 : 0.35); `twinkle` (period 1.6);
  - `ripple` (period 2): born small, grows and fades, in a loop (radio wave, ripple); with `repeat` and `phaseStep`, successive waves;
  - `draw` (duration 1, delay): the stroke appears (`pathLength`) and the fill lights up with it; `enter` (delay, duration 0.38): the layer pops in; `exit` (`at`, required; duration 0.3): the counterpart, it shrinks accelerating and fades in the last third;
  - `follow` (`points`: a smooth curve like `curve`, added to the layer's x and y; `closed` returns to the start): the layer travels it at constant speed along the length. With `period` it loops; without, it travels once from `at` (0) in `duration` (2). `orient: true` turns the layer (drawn facing right) along the way. An open curve with `period` jumps back to the start;
  - `morph` (`into`: the geometry of the new shape, e.g. `{ "shape": "star", "r": 20 }`): from the layer's shape to the new one, once from `at` (0.8) in `duration` (0.6), or, with `period`, looping (hold, go, hold, come back, a quarter each). Both shapes must be closed and simple: circle, ellipse, rectangle, triangle, diamond, trapezoid, polygon, star, bolt or closed `curve`. One morph per layer; `anchor` and the box use the first shape;
  - `color` (`to`, `duration` 0.6): the color (and that of spots, bands and particles) moves to `to` on an S curve, `at` seconds after the piece entrance (0.8).
  - **Second rhythm, automatic:** a layer with a continuous behavior (`spin`, `orbit`, `float`, `twinkle`, `sway`, `blink`, and `follow` or `morph` with `period`) breathes (scale ±1.5% every 7 s, with a phase taken from the position); one that already changes the scale (`pulse`, `ripple`, `rise`) stays as is. `metal` and `glass` on a living layer (or inside a living group) get a glint that crosses diagonally every 6 s. Without `animate`, the drawing stays still.
- **Ease** (`ease`, on behaviors, `sequence` events and `stagger`): `linear`, `steps(n)` or a family with a direction: `power1` to `power4` (quadratic to quintic), `sine`, `expo`, `circ`, `back` (overshoot), `elastic`, `bounce`, each as `.in`, `.out` or `.inOut` (a bare family is `.out`). On a timed change (`enter`, `exit`, `draw`, `color`, `follow` once, `morph`) it shapes the progress; on a cycle, each swing (`sway`, `pulse`, `float`, `twinkle`: `sine.inOut` is the default look) or each turn (`spin`, `orbit`, `follow` and `rise`, `ripple`, `blink`). Without `ease`, each behavior keeps its own curve.
  - **Pick by intent:** things arrive easing **out** (`power2.out`, `expo.out`) and leave easing **in** (`power2.in`); moves between two places use `inOut`. Overshoot (`back`, `elastic`) is a choice for one lead moment, not the default for everything.
- **Stagger** (with `repeat`, `particles` or `spiral`): `"stagger": 0.07` or `{ "each": 0.07, "from": "start" | "center" | "edges", "ease": ... }`. Each copy runs its timed changes (and its children's, and its `sequence`) that much later; cycles are shifted by `repeat.phaseStep`, not by this. On particles it spreads `enter`, `exit` and `color` particle by particle (without it they apply to the set). Start around 0.07 s for small items and let each move last about twice the gap, so they overlap; rows meant to be read one by one go slower (0.2 to 0.4).
- **Sequence** (`sequence`, any layer): a short timeline. `[{ "at": 0.2, "do": "enter" }, { "at": 0.45, "do": "move", "to": [0, 1], "duration": 0.7, "ease": "bounce.out" }, { "at": 1.5, "do": "pop" }]`. Actions: `enter`, `exit`, `move` (`to` [x, y], replaces x and y), `scale`, `rotate` (degrees) and `fade` (opacity), with a number in `to` (0.6 s, `power2.inOut`), and `pop` (a momentary swell, `amplitude` 0.18). Each event starts where the earlier ones left the layer; behaviors add on top. Of `enter` and `exit` only the latest one counts, so a layer can leave and come back (a speech bubble). `pop` and `enter` multiply the size that `scale` set.
- **Figures** (`rig`): a character on a skeleton, in one layer. `{ "rig": "biped", "cycle": "walk", "y": 38 }`. Rigs and cycles (the first is the default, so say `walk` when you want walking):

  | Rig | Cycles | Pose fields | Bones | Origin |
  |---|---|---|---|---|
  | `biped` | `idle`, `walk`, `run`, `wave`, `talk` | `footNear`, `footFar`, `handNear`, `handFar` (targets); `bob`, `lean`, `nod` | `head`, `chest`, `hip`, `handNear`, `handFar`, `footNear`, `footFar` | the ground under the hips |
  | `quadruped` | `idle`, `walk`, `run` | `frontNear`, `frontFar`, `backNear`, `backFar` (targets); `bob`, `nod`, `tail` | `head`, `neck`, `back`, `tail`, the four paws | the ground under the middle |
  | `bird` | `fly`, `glide`, `perch` | `wing`, `tail` (degrees), `bob` | `head`, `body`, `belly`, `tail` | the middle of the body |
  | `fish` | `swim`, `hover` | `tail`, `mid` (the wave, fraction of the height) | `head`, `back`, `belly`, `tail` | the middle of the body |

  - **Targets** `[x, y]` say where a foot or hand goes; the knee or elbow is solved and bones never stretch. A foot counts from the point under its hip, in fractions of the leg; `y` 0 is the ground, negative is up. A hand counts from the shoulder, in fractions of the arm: `[0, 0.93]` hangs, `[0.9, 0]` points ahead, `[0.5, -0.5]` is raised. All figures face right; `"flip": true` turns one around (the light stays put).
  - `period` (seconds per cycle) and `phase` (0 to 1) set the rhythm, so two figures do not move in step. `pose` holds fields fixed on top of the cycle (`"pose": { "handNear": [0.62, 0.5] }`: holding a leash while walking). `poses` writes your own cycle: `[{ "at": 0, "handNear": [0.5, -0.5] }, { "at": 0.5, "handNear": [0.86, -0.28] }]`; a key says only what it changes, the way between keys is smooth, and `ease` on a key blends straight to it.
  - **A new character** is a rig plus `color`, `build` (proportions and secondary colors: see `build` in `engine/geometry/rigs.ts`) and **parts on bones**: children with `"bone": "head"` count `x`, `y` from that bone and move and tilt with it (hair, eyes, hat, collar, spots). Children without `bone` stay in the figure space. Attached parts are drawn over the figure. The `cat` in `library/drawings/characters.ts` is the dog's rig with another build and five parts.
  - **Walking without sliding:** the planted foot goes back at a steady speed, `groundSpeed(layer)` box units per second (times the layer `scale`). Move the ground back at that speed (`road` in `library/drawings/characters.ts`), or move the figure forward with `follow` (`ease: "linear"`) at that speed.
- **Scenes** (several figures in one drawing): each figure is a layer with its own `x`, `y`, `scale`, `cycle`, `phase` and `flip`; layers are drawn in order, later on top. Another library drawing comes in as a group: `{ "shape": "group", "x": -20, "scale": 0.78, "children": house.layers }`. Examples in `library/drawings/scenes.ts`: `dog-walk` (a leash from the hand bone to the collar), `conversation` (turns by `phase` and bubbles by `sequence`), `front-yard` (a reused house and three figures), `school-of-fish`.
- **Depth:** each layer becomes chunks with a `z` (0 default), and **the `z` adds to the parent's**; the whole drawing is sorted at once, so `z` works across groups (ties: the layer order). An orbiting layer counts as `z − 0.5` on the back half of the orbit and `z + 0.5` on the front (children go with it); an `orbit` shape with `"depth": true` draws the back half before `z` 0 and the front half after (a planet ring: thick stroke). `trail` (true or {arc 0.9 rad, width 4.5, color, opacity 0.22}) on an orbiting layer: a stroke that thins out behind the body, split by the same sides.
- **Validation** (`drawingErrors` in `engine/geometry/validate.ts`, run in the test for the whole library): flags `use` that is not a kit part, an unknown shape, material, texture, behavior, ease, action, distribution, light, side or prop (of the layer, `animate`, `morph.into`, `sequence`, `stagger`, `anchor`, spot, band and `repeat`), an `anchor`/`clip` that does not point to a sibling id, with a suggestion; a `color` without `to`, an `exit` without `at`, a `follow` without `points`, a `morph` between shapes that cannot morph, a `sequence` event without what it needs, a `stagger` with nothing to stagger, and, on figures, an unknown rig, cycle, pose field, `build` key or bone, or figure props on a layer without `rig`.

**Motion examples** (`library/drawings/explainer.ts`): `checklist` (rows with `repeat` and `stagger`, `back.out`, ticks by `draw` with delay), `paper-plane` (`follow` with `orient`), `play-button` (`morph` looping between a triangle and a square), `map-pin` (`sequence`: appear, drop with `bounce.out`, swell).

## Writing a drawing

**Checklist:**

0. Look for a ready block: `npm run find` (catalog and kit parts), `npm run find -- biped walk` (all words must match a name, a purpose or something the layers use). Read only the lines it points to; reuse a drawing as a group or adapt it.
1. Primitive mold first (the body in 3 to 5 large shapes); details after.
2. Parametric shape before `curve`; `curve` before `path`.
3. `anchor` instead of coordinates ("door inside-bottom of the wall"); `x`/`y` only as an adjustment.
4. `use` for parts (wheel, window, eye...); a new part that repeats goes into the kit.
5. Up to ~30 lines; one rhythm of life (spin, sway, blink, rise) per moving part.
6. One critique round with `npm run look -- name`.

Example (a planet with a moon passing behind it):

```json
{ "purpose": "planet with a moon", "grade": "B", "note": "example", "layers": [
  { "shape": "circle", "r": 45, "color": "blue", "material": "glow", "opacity": 0.2, "z": -1 },
  { "shape": "orbit", "rx": 42, "ry": 10, "rot": -12, "color": "ink", "opacity": 0.4, "depth": true },
  { "shape": "circle", "r": 20, "color": "green", "material": "volume", "animate": [{ "type": "pulse", "amplitude": 0.02 }] },
  { "shape": "circle", "r": 5, "color": "#C9CED6", "material": "volume", "trail": true,
    "animate": [{ "type": "orbit", "rx": 42, "ry": 10, "rot": -12, "period": 5 }] }
] }
```

Example (a Moon with craters that turns red at 2 s, with eight stars around it):

```json
{ "purpose": "moon", "grade": "B", "note": "example", "layers": [
  { "shape": "sphere", "r": 34, "color": "#C9CED6", "spin": 10, "night": 0.4, "atmosphere": "blue",
    "spots": [{ "n": 14, "seed": 2, "size": [3, 7], "color": "#8A909A" }],
    "animate": [{ "type": "color", "to": "red", "at": 2 }] },
  { "shape": "star", "x": 44, "r": 4, "color": "accent", "repeat": { "n": 8, "step": { "rot": 45 }, "phaseStep": 0.125 },
    "animate": [{ "type": "twinkle" }] }
] }
```

In the library, each drawing has fewer than ~40 lines: `mars` (rust sphere, dark seas by points, a stretched canyon, rimmed craters, scattered drifting dust, a cap as a band, thin atmosphere), `atom` (a nucleus of vibrating balls, three `orbit` with depth, electrons with trails), `saturn` (wavy bands and three `orbit` rings with depth), `galaxy` (two `spiral` seen edge-on, a `particles` bulge as a cloud, a `shine` core), `water-molecule` (three `volume` circles, stroke bonds, a floating and swaying group), `cell` (a `path` membrane that spins and pulses both ways, `glass`, organelles as `particles`), `radio-wave` (a `metal` tower, arcs with `ripple` and `repeat`), `solar-system` (a `shine` Sun and four planets in `orbit` with trails). Objects and animals (`library/drawings/objects.ts`, with the kit): `house` (roof and door by `anchor`, windows by `use`, smoke as `particles` with `rise`), `car` (a swaying body, spinning wheels), `tree` (a canopy of two `cloud` swaying at the trunk base, a falling leaf), `bird` (a `drop` body with a clipped belly, a `leaf` tail, dark wings with `sway`, a blinking eye), `fish` (a `curve` body, stripes with `clip`, tail, bubbles), `lightbulb` (a `glass` bulb, a filament that changes `color`, glow and rays entering), `water-glass` (`gradient` water clipped in the glass, swaying). Batch 4 (`everyday.ts` and `science.ts`): `coin` and `book` (the slow `blink` lying down), `battery` and `thermometer` (a wide rectangle that `float`s clipped by the core: the level rises and falls; the thermometer changes `color`), `phone` (a pulsing notification, a badge with `ripple`), `clock` (`clock-hand` with `spin`), `rocket` (`flame`, smoke as `particles`), `rain-cloud` (drops with negative `rise` and `phaseStep`), `volcano` (lava `clip`ped by the mountain), `brain` (two mirrored `curve` hemispheres, sulci as open `curve`, synapses with `ripple`), `dna` (balls in a flattened `orbit` with depth, rungs with `pulse` at twice the phase), `virus` (spikes in a rotation `repeat` pulsing in a wave).

## Camera

A camera directs a whole scene (several pieces on one SVG). It is not part of the drawing data: use it in the composition. `cameraAt(shots, t)` gives the view and `cameraTransform(view, width, height, depth)` the SVG transform of a group.

```tsx
const SHOTS: Shot[] = [
  { at: 0, to: [0, 0], zoom: 2 },                              // close on something
  { at: 4, to: [120, 40], zoom: 0.9, ease: 'power3.inOut' },   // pull back
  { at: 7, to: earthAt, zoom: 11, ease: 'power1.inOut' },      // dive, tracking a moving target: (t) => [x, y]
];
<g transform={cameraTransform(cameraAt(SHOTS, t), width, height)}>{pieces}</g>
```

`to` is the point of the scene at the middle of the frame and `zoom` 1 is one unit per pixel; `ease` shapes the way from the shot before. Zoom changes in equal ratios, and the center follows it, so a dive does not swing off its target. A background group with `depth` below 1 moves less (parallax). Keep captions outside the camera group. The `Cosmos` template (`examples/cosmos.tsx`) shows a dive that carries into the next subject.

## Look before you call it done

- The render is what counts: look at frames (entrance, middle, a later one) before reading the data again, on a **light and a dark** background. `npm run look -- name` puts all of that in one image, `out/look.png`, after checking the data (errors come out as text, without rendering). `--at=0.9,1.1,1.3` picks the moments, to follow a quick event; two names compare two drawings. It also prints motion checks, measured on 8 moments after the entrance: **no movement** (a drawing that only animates on entrance is fine; a 0.2 s blink may fall between the moments) and **solid ink outside the box** (soft glows and shadows do not count; a road or a flame may leave on purpose). A warning is a question to answer, not an error; a clean check does not mean the drawing looks right. The whole library (`npm run still`, `npm run still:night`) is for changes that reach many drawings: it is large, and each drawing gets small when the image is scaled down.
- Fix the 3 worst problems first: shape and reading before finish.
- Few and large details: small ones disappear on a phone.
- One lead, one light, up to 3 moving elements. Things arrive easing out and leave easing in.
- Nothing flashes more than 3 times a second.
- **Grade** each drawing honestly in its definition: **A** ready to be the lead; **B** good as support, lacks finish; **C** weak, needs work.

## Known limits

- The anchor box ignores rotation and animation; a `path` with a rotated arc has no box.
- `anchor` and `clip` only see sibling layers; `clip` needs a simple shape.
- The width of `text` is only estimated.
- Groups have no shared finish: light is not continuous across the parts of a composed object.
- The `brushed` texture is always horizontal.
- `morph`: one per layer, between closed simple shapes (not drop, heart or cloud).
- `stagger` on particles spreads `enter`, `exit` and `color`; a `sequence` still moves the whole set.
- Figures are seen from the side. Parts attached to bones are drawn over the figure.
