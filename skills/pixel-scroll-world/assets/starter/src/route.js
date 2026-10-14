// The journey, as data. Everything the world needs to know about the story lives here, so a new
// site is mostly a matter of editing this file, the sections in index.html, and the scenery list
// in world.js.
//
// The route is one long line measured in "route units". Each stop is a section of the page and
// the place on the route where the traveller stands while that section is read. Scrolling from
// one section to the next walks him from one stop to the next.

// Stops in page order: the id of the section, and where it stands on the route.
export const STOPS = [
  { id: 'top', x: 0 },
  { id: 'about', x: 40 },
  { id: 'education', x: 90 },
  { id: 'projects', x: 140 },
  { id: 'contact', x: 190 },
];

// Levels: stretches of the route with their own ground, sky, light and name (shown in the HUD).
// `from` is where the level starts. `night` washes the stretch in dark blue and lets lamps glow.
export const LEVELS = [
  { from: -1e9, name: 'Level 1 · Hometown', ground: 'meadow', sky: ['#7cc4f0', '#c4e8fa'] },
  { from: 70, name: 'Level 2 · University', ground: 'moor', sky: ['#5a6fb0', '#a8b8e0'] },
  { from: 165, name: 'Level 3 · The city', ground: 'city', sky: ['#131d47', '#2f478c'], night: 0.45 },
];
export const levelAt = (x) => LEVELS.findLast((l) => l.from <= x) ?? LEVELS[0];
