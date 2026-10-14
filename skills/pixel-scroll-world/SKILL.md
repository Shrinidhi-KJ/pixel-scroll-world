---
name: pixel-scroll-world
description: Build a scroll-driven pixel-art world for a personal site, CV or portfolio, in the style of a 16-bit handheld RPG. As the visitor scrolls, a character walks (rides, flies) through levels that tell their story, while the real content reads in game dialogue windows; a plain layout is always one click away. Includes a working vanilla-JS starter (one canvas, no game engine, all art drawn in code), the techniques behind it (scroll-to-route mapping, whole-pixel camera, night lighting, set pieces, reversible scroll cut-scenes, secrets), and a verification and shipping checklist. Use this whenever someone wants a game-like, retro, pixel, RPG, Pokémon-style or "play my CV" website, a scrollytelling portfolio with a walking character, an interactive résumé, or to turn their life story or career journey into levels, even if they never say "pixel art" or "scroll".
---

# Pixel scroll world

A website where scrolling is walking. The visitor scrolls the page as normal; a pixel
character walks along a road through places that tell the owner's story (home town,
university, first job, the city they live in now). Each section of the CV is a stop on the
road, and its text appears in a game dialogue window while the character stands there.

It works because the page underneath is an ordinary, accessible document. The game is a
layer on top that native scroll drives, so everything a browser does with scrolling (the
scrollbar, keys, touch, links to a section, the back button, reloading halfway down) keeps
working without special handling.

## Start from the starter

`assets/starter/` is a small working site: copy it, `npm install`, `npm run dev`. Read its
files before writing new ones; they are short, commented, and already solve the hard parts.

| File | What it is |
|---|---|
| `index.html` | The content. One `<section id>` per stop, each with a `.window`. All text lives here. |
| `src/route.js` | The story as data: stops (section id → place on the route) and levels (ground, sky, night, name). |
| `src/scroll.js` | Scroll → progress between stops, with a damped copy for the camera. |
| `src/world.js` | The canvas, the scenery list, the camera and the traveller. |
| `src/art.js` | Tiles, trees, buildings, the player sprite and a 3×5 pixel font, all drawn in code. |
| `src/style.css` | The two layouts from one markup: `html.game` and the plain CV. |
| `scripts/shots.mjs` | Screenshots of every stop on a laptop and a phone, plus page errors. |
| `scripts/csp.mjs` | A strict Content Security Policy written at build time. |

Most new sites are: rewrite `index.html` with the owner's real content, set the stops and
levels in `route.js`, then draw the places in `art.js` and place them in `world.js`.

## How to work with the owner

These sites are personal, so the owner is the art director and you are the studio.

1. **Get the story first.** Ask for their CV or LinkedIn text, the places that matter (cities,
   universities, workplaces) and anything personal they would like hidden in the world
   (a pet, a local landmark, a running joke). The places become levels; the details become set
   pieces and secrets. The quality of the result comes from how specific these are.
2. **Use only real content.** Every name, date, number and claim comes from what the owner
   gave you. Never invent metrics, roles or achievements to fill a window; leave a clearly
   marked placeholder instead. A CV with one made-up number is worse than a plain one.
3. **Show options before building a new direction.** For a look, a landing screen or a
   redesign, draw two to five small mock-ups (real pixel art rendered to PNG, see
   `references/pixel-art.md`) and let them choose. Clear fixes don't need options; just do them.
4. **Work from references.** When they share photos of a real building or a style they like,
   study its shape, colours and silhouette and redraw it in the house style, then show
   them a screenshot next to the reference. Iterate until they are happy.
5. **Verify by looking.** After every visual change, take screenshots at the affected stops
   on a laptop and a phone and look at them before saying it is done. See
   `references/verify-and-ship.md`.
6. **Ship when asked.** Commit, push and deploy only when the owner says so, and never put
   secrets in the repository.

## The ideas that make it work

Read `references/architecture.md` before changing the engine. In short:

- **Native scroll is the only input.** Never hijack the wheel to drive the story. Sections
  give the page its height; the conductor turns `scrollY` into progress between them.
- **Route units, eased between stops.** Each stop has a place `x` on one long route. The
  traveller eases into and out of each stop, so he rests while a window is read and walks
  between windows.
- **Whole pixels only.** One low-resolution canvas, scaled by an integer. The traveller holds
  one screen column and the world slides under him by whole pixels, so nothing shimmers.
- **Everything drawn in code.** Sprites are tiny canvases built once at load. No image files:
  the art stays editable, tiny over the wire and always crisp.
- **Content stays in the DOM.** Windows are real HTML over the canvas: selectable, readable
  by screen readers and search engines, and the same markup is the plain CV.
- **Reversible by construction.** Anything that happens on the road is a function of where
  the traveller is, not of time since an event, so scrolling back plays it backwards.

## Features to offer, by level of effort

Start with the base walk, then add what suits the story. Details and code patterns for each
are in `references/story-and-features.md`.

- **Base (the starter):** levels with their own ground and sky, scenery, a walking traveller,
  dialogue windows, night levels with glowing windows and lamps, a plain-CV switch, phone layout.
- **Atmosphere:** parallax backdrops, weather (rain, petals), a day-to-night or sunrise
  transition across a level, flickering lights, animated animals.
- **Travel:** rides (an auto-rickshaw, a taxi) that carry the traveller between stops; a
  flight between countries where he climbs, cruises above clouds and lands.
- **Set pieces:** a real building redrawn from photos (or rendered from a 3D model with
  `scripts/model-sprite.mjs`), a bridge he crosses behind its parapet, a shop interior.
- **Game moments:** projects as wild encounters (a battle window whose moves are "What I
  built / How I checked it / Result"), skills as collectible discs on shop shelves, a
  graduation cut-scene driven by scroll, typed dialogue text.
- **A landing screen:** an arcade cabinet whose screen shows the title; Start (or scrolling)
  zooms into the screen and the game begins.
- **Secrets:** small tappable things (pet an animal, take the cone off a statue) with a toast
  and a badge case. They reset on every reload.

## Pixel art

Read `references/pixel-art.md` before drawing. The house style: 16 px tiles, a 1 px
near-black outline (`#1a1c2c`), three or four shades per colour, light from the upper left,
a bright handheld-era palette. Draw with `mk(w, h, draw)` and `fillRect`; build the shading
from a lighting rule rather than placing pixels one by one.

Draw original things. Do not draw trademarked characters, logos or creatures from existing
games (no Pikachu, no Poké Ball logo): make the owner's own creatures and items in the same
spirit. Real places and public landmarks are fine to depict.

## Before you finish any change

- Screenshots at every stop you touched, laptop (1440×900) and phone (390×844), looked at.
- No page errors, no horizontal scroll on the phone (`npm run shots` reports both).
- Reduced motion still works: the world shows each stop, nothing animates.
- The plain CV still has every word of content, and Tab reaches every link and button.
- Text in windows is never covered by the nav bar, the world strip or another window.

## Reference files

- `references/architecture.md`: the engine in depth: conductor, route, camera, depth order,
  lighting layer, phone layout, performance.
- `references/pixel-art.md`: the style rules, drawing helpers, how to redraw a real building
  from photos, rendering a 3D model to a sprite, making mock-up options.
- `references/story-and-features.md`: how to turn a CV into levels, and how to build each
  feature above (rides, flight, cut-scenes, battles, shop, secrets, arcade landing).
- `references/verify-and-ship.md`: screenshot and frame-strip checks, tests, security
  headers, SEO and share cards, analytics, deploying to a static host.
- `references/showreel.md`: making a short video of the site from frame-exact captures of
  the real game, for sharing on social media.

`scripts/model-sprite.mjs` renders a `.glb` 3D model into a pixel-art sprite in the house style.
