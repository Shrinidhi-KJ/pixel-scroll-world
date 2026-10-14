# Architecture

How the starter's engine works, why it is built this way, and how to extend it without breaking
the things that make it feel good.

## Contents
1. The page and the layer
2. Scroll → progress → route position
3. The canvas and the camera
4. Scenery and depth
5. Levels, ground and sky
6. Night: the light layer
7. The phone layout
8. Two layouts, one markup
9. Performance
10. Common mistakes

## 1. The page and the layer

The HTML is a normal document: a header, then one `<section id>` per stop, each holding a
`.window`. With `html.game` set, a fixed `<canvas id="world">` sits behind it and every section is
made at least one screen tall, so the page has a screen of scroll per stop. The current stop's
window is fully opaque; the others fade back.

Set `html.game` (and anything else that changes layout) **before first paint**, from a tiny
inline script in `<head>`, if the page should open as the game. Otherwise visitors see a flash of
the plain layout first. The starter sets it from `main.js`, which is fine because its first paint
is the game either way; if you add a heavy plain layout, move the decision inline and hash the
inline script in the CSP (`scripts/csp.mjs` does this automatically).

## 2. Scroll → progress → route position

`scroll.js` measures, for each section, the `scrollY` at which it is centred in the window (its
**anchor**). Progress `p` is the fractional index between anchors: 0 at the first stop, 1 at the
second, 2.5 halfway from the third to the fourth. A damped copy `smooth` chases `exact`, so the
camera glides; with reduced motion, `smooth = exact`.

`route.js` gives each stop a place `x` in route units. `railAt(p)` maps progress to a route
position with a smoothstep between neighbouring stops:

```js
const railAt = (p) => { const i = floor(p); return a.x + (b.x - a.x) * ease(p - i); };
```

The ease is what makes the traveller *rest* while a window is read and *walk* between windows.
Spacing between stops sets how far he walks; a long gap is a long journey (use it for a flight).

To place things relative to the story, think in route units. A building at the "education" stop
goes near that stop's `x`. A level boundary between two stops is where the ground changes.

**Never drive the story from the wheel or from timers.** Everything is a function of the scroll
position. Scrollbar drags, keyboard, touch, `#section` links, reload at depth and the back button
then all land on the right frame for free.

Arrow keys: the page scrolls vertically, but the world moves sideways, so visitors try Left and
Right. Map them to a smooth scroll (`scrollBy` per frame while held), but only in the game layout
and not while focus is in a form field.

## 3. The canvas and the camera

One canvas, `W × H` art pixels, displayed at `scale` screen pixels per art pixel, where `scale` is a
whole number chosen from the window height (about 200 art pixels tall). `imageSmoothingEnabled =
false` and CSS `image-rendering: pixelated` keep it crisp. Never scale by a fraction.

The traveller holds a fixed screen column `HX` (about 62% across on a laptop, so windows on the
left have room). The camera is `cam = round(px) - HX`, where `px` is his route position in canvas
pixels. Because `cam` is rounded once and everything is drawn at `x - cam`, the whole world moves
by whole pixels together and nothing shimmers or jitters against anything else.

He counts as walking until he has been still for a moment (`t - lastMove < 0.14`), and his walk
frame comes from distance travelled (`walk / 15`), not from time, so his legs match his speed. Turn
him round only on a real change of direction (a small dead zone avoids flicker).

## 4. Scenery and depth

Scenery is a flat list: `put(x, img, up, options)`. `x` is a route position; `up` is how far the
sprite's foot sits above the road's top edge (positive is further back). Useful options:

- `far`: a backdrop that moves at half speed (parallax). Use for clouds, mountains, skylines.
- `front`: drawn after the traveller, so it can stand in front of him (lamp posts, a bridge's
  near parapet, a signpost by the near verge).
- `lit`: the sprite's bright pixels glow at night (windows, lamps).
- frames: pass an array of canvases to animate (two frames swapped twice a second reads as life).

Sort by depth (higher `up` first) once, after building the list. If something must sit on top
of something further back (a swan on a lake), give it an explicit `z`.

For anything the traveller passes *behind* (a bridge rail, a counter), draw a separate front
sprite that covers his legs instead of trying to clip him.

## 5. Levels, ground and sky

`LEVELS` in `route.js` are stretches of route with a `ground` (a key of `GROUND` in `art.js`), a
`sky` and optionally `night`. Each tile column takes the ground of the level it falls in, so
levels meet at a clean edge as you walk; blend them by mixing tiles from both sides over a few
columns (pick the level at `x + noise`) if a hard edge looks wrong.

The road is two tiles high. To make it wind, give each column a row offset from a couple of
summed sines, clamped to ±2 tiles, and keep it straight where set pieces need a flat base
(bridges, indoor rooms, the stretch under a flight).

Transitions between levels (dusk to night, night to sunrise) should depend on the traveller's
route position, eased over a few units. Then they reverse when he walks back.

## 6. Night: the light layer

A night level is drawn normally, then washed with translucent dark blue. Lights are kept on a
second canvas the same size:

1. Clear the light layer at the start of the frame.
2. For each sprite, first erase its shape from the light layer (`destination-out`), so it hides
   lights behind it; then draw its lit pixels (`A.lit` style mask) onto the layer.
3. After the wash, draw the light layer over everything.

This gives glowing windows, lamps and neon that are correctly hidden by whatever stands in front
of them. Halos are just big soft discs drawn onto the light layer only. For life, flicker a
failing lamp (hash of a coarse time step) and let a window now and then go dark.

## 7. The phone layout

Below 900 px wide, the world becomes a strip under the nav bar (about 46% of the screen height)
and the windows scroll beneath it, one per stop. Set a CSS variable (`--band`) with the strip's
height so the layout and the conductor (its `offset`) agree on where "centred" is. The strip must
sit *above* the windows (`z-index`) or text slides visibly behind the art.

On a narrow strip there is less sky and less room below the road: let the road bend only
upwards, keep tall set pieces shorter, and move side decorations into the space above.

## 8. Two layouts, one markup

The plain CV is the same HTML without `html.game`. Keep it genuinely good: real headings, a
readable column, pixel decoration in the margins if you like, but no content that only exists
in the game. Offer it from a button in the header; remember the choice for the visit only (a
fresh load opens on the game). Very small screens and assistive technology get a good page.

Reduced motion: keep the world, but snap between stops (`smooth = exact`), stop ambient
animation (weather, bobbing, typing) and show every window's text at once.

## 9. Performance

- Build every sprite once at load; never create canvases inside the frame loop.
- Skip sprites outside the view early (`if (x > W || x + w < 0) return`).
- Pause the loop when the tab is hidden.
- Keep the canvas small (about 200 art pixels tall); the cost is per art pixel, not per screen pixel.
- Load the world module only when the game layout is used (dynamic `import()`), so the plain CV
  is light.

A full frame of a busy level should stay well under 4 ms on a laptop.

## 10. Common mistakes

- **Fractional positions.** One sprite drawn at `x - cam * 0.5` without rounding will shimmer.
  Round every final draw position.
- **Time-based story events.** If a cut-scene runs on a timer, scrolling back mid-way breaks it.
  Make it a function of route position.
- **State that survives a reload.** Secrets found, costumes and flags should reset on reload
  unless the owner asks otherwise; visitors expect a fresh game.
- **History restoration.** Browsers restore the old scroll position on reload; set
  `history.scrollRestoration = 'manual'` and start at the top unless the URL has a `#section`.
- **Hit boxes from stale frames.** Collect tap targets while drawing each frame and test taps
  against that frame's list.
