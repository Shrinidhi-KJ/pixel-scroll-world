# Pixel art

## Contents
1. The house style
2. Drawing helpers
3. Recipes (trees, buildings, characters, water, signs)
4. Redrawing a real place from photos
5. A 3D model as a sprite
6. Mock-up options for the owner
7. Text in the art
8. What not to draw

## 1. The house style

- **Tiles are 16×16.** The road is two tiles high. Most sprites are 10 to 130 px wide.
- **Outline:** 1 px of near-black (`#1a1c2c`) around every shape. It is what makes sprites read
  against any background, including night.
- **Shading:** three or four shades per colour (light, base, dark, deepest). Light comes from the
  upper left: lighter tops and left faces, darker right faces and undersides.
- **Palette:** saturated, warm handheld-era colours. Grass `#5fb84a / #4a9c3a / #86d468`, path
  `#e6cf94`, sky `#7cc4f0`, night `#131d47`, gold `#ffd23f`, warm light `#ffe9a6`.
- **No anti-aliasing, no gradients inside sprites, no rotation by odd angles.** Gradients are for
  skies and light washes only.
- **Detail density** should be even across the world. One hyper-detailed building next to flat
  boxes looks wrong; raise the plainer neighbours instead.

## 2. Drawing helpers

Everything is drawn with `fillRect` onto small canvases made by `mk(w, h, draw)`. Write a local
`R(colour, x, y, w, h)` shorthand in each sprite. Useful helpers in `art.js`:

- `hash(x, y)`: a stable pseudo-random number, for speckles and variation that never shuffle.
- `disc(c, cx, cy, r, colour)`: a filled circle row by row (for balls, moons, lamp halos).
- `text(c, str, x, y, colour, k)` and `tw(str)`: the 3×5 pixel font and its width.
- `withSign(img, 'NAME')`: a copy of a building with a lit signboard across it.

Build shading from a rule rather than by hand. The tree recipe below computes, for every pixel
inside the crown, a lighting value from its offset to the upper-left and picks one of four shades.
That gives consistent light across every tree size for free.

## 3. Recipes

**Tree.** A circle of radius r with jittered edges (`d + (hash - 0.5) * 2`), an outline ring,
shades from `l = (-dx - dy) / (1.5 r) + noise`. Pass four shades to make blossom, pine or autumn
trees.

**Building.** Outline rectangle, wall colour, a darker right-hand strip (the shaded face), rows of
windows each a 7×7 outlined square with a 5×5 pane, lit or dark by `hash(x, floor)`, a door
centred at the bottom. Add a parapet, a roof tank or a sign to tell buildings apart. Lit panes in
`#ffe9a6` glow at night automatically.

**Character.** Draw from string maps, one letter per pixel, with a palette object:

```js
const TOP = ['....oooooo....', '...ohHhhHho...', /* ... */];
const LEGS = [standing, stepLeft, stepRight];
hero = LEGS.map((legs) => mk(14, 18, (c) => TOP.concat(legs).forEach(drawRow)));
```

Costumes (a graduation cap and gown, a hat) are separate sprites drawn over the same frames.

**Water.** Two frames of a mid blue with short light dashes that shift by a few pixels between
frames. Reflections are the sprite flipped vertically, at 60% opacity, with every third row
removed, clipped to the water's width.

**Animals.** Two frames (legs apart, legs together) and a slow walk back and forth a few units
around their spot, flipping when they turn.

## 4. Redrawing a real place from photos

Owners love seeing their real university, office or landmark. To redraw one:

1. Find its **silhouette** and the two or three features that make it recognisable (a tower
   with a crown, a curved block, a glass atrium, a red-brick drum). Ignore everything else.
2. Pick its **palette** from the photo: wall, wall shadow, trim, glass, roof. Then push it a
   little brighter to match the world.
3. Decide the **viewing angle.** Most of the world is seen straight on; a building whose plan
   is its point (a curved block, a stadium shape) reads better from a raised three-quarter view.
4. Draw it at the **world's scale**: doors about 8×12, windows 5×5, so it sits beside its
   neighbours without looking like a different game.
5. Put a screenshot of it in the world next to the reference and let the owner compare.

Keep the building on the ground line of its neighbours: cut away any plaza or forecourt from
the bottom of the sprite, or it will look as if it floats.

## 5. A 3D model as a sprite

When an owner has a 3D model (`.glb`, for example from a photogrammetry or image-to-3D tool),
`scripts/model-sprite.mjs` renders it into a sprite in the house style: it rasterises the mesh
from a chosen angle at high resolution, colours each surface by what it is (roofs facing up are
cream, walls are brick shaded by which way they face, recessed walls become glass), draws a
dark outline where depth jumps, and downsamples by majority vote so edges stay hard.

```bash
node scripts/model-sprite.mjs model.glb out.png 45 22 118          # yaw, pitch, width in pixels
CROP="0.06,-0.37" node scripts/model-sprite.mjs model.glb out.png 45 22 118   # cut stray scan pieces
```

It writes `out.js` beside the PNG: the sprite as rows of characters plus a colour list, which
`art.js` can draw pixel for pixel. Paint doors, signs and windows on top by hand; scans have none.
Change the colours in its `PAL` object to match a building that is not red brick.

## 6. Mock-up options for the owner

Before building a new look, render options as images the owner can compare:

1. Write the option as a drawing function (for example `decorations(ctx, layout)` or a whole
   `roomVariant(W, H)`) in a new module, using the same helpers and sprites as the site.
2. Make a temporary page (`options.html`) that imports it and draws each option onto its own
   canvas at the site's real resolution.
3. Screenshot each canvas with Playwright, scaled by a whole number, and show the images.

Because the options use the real sprites, the chosen one can be wired straight into the site.
Delete the temporary page afterwards.

## 7. Text in the art

The 3×5 font is for short signs, labels and titles inside the art (a shop name, a street sign,
"ARCADE"). Anything a visitor needs to read (content, buttons) is HTML text in a pixel web font
such as Press Start 2P, never pixels in the canvas.

Check every pixel font at the size you use it. Some display faces make capital B look like G or
5 look like S; avoid those for numbers and names.

## 8. What not to draw

Make original creatures, items and characters. Do not draw trademarked characters or logos
from existing games or brands (Pikachu, the Poké Ball's exact design, Nintendo marks), even as a
homage on a personal site. Generic ideas (a collectible ball, a badge case, a monster you befriend)
are fine in your own design. Real places, public landmarks and the owner themselves are fine.
