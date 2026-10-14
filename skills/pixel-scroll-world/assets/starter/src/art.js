// Every tile and sprite, drawn in code onto small canvases. No image files: the art stays
// editable, tiny over the wire, and always crisp, because it is only ever scaled by whole numbers.
// House style: 16 px tiles, a 1 px near-black outline, three or four shades per colour, light
// from the upper left.
export const T = 16;
export const O = '#1a1c2c'; // the outline colour
// A number that looks random and is the same on every load (so the scenery never shuffles).
export const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
export function mk(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')); return c; }
const px = (c, x, y, col) => { c.fillStyle = col; c.fillRect(x, y, 1, 1); };
export const disc = (c, cx, cy, r, col) => { c.fillStyle = col; for (let y = -r; y <= r; y++) { const w = Math.round(Math.sqrt(r * r - y * y)); c.fillRect(cx - w, cy + y, w * 2 + 1, 1); } };

// ---- ground: three speckled variants of each tile, so a field never looks tiled ----
function speck(c, base, a, b, seed) {
  c.fillStyle = base; c.fillRect(0, 0, T, T);
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const h = hash(x + seed * 17, y + seed * 31); if (h > 0.9) px(c, x, y, a); else if (h < 0.07) px(c, x, y, b); }
}
const set3 = (base, a, b, seed) => [0, 1, 2].map((s) => mk(T, T, (c) => speck(c, base, a, b, seed + s)));
// One entry per kind of ground: [field tiles, road tiles]. Add your own.
export const GROUND = {
  meadow: [set3('#5fb84a', '#4a9c3a', '#86d468', 1), set3('#e6cf94', '#cbb074', '#f4e3b4', 5)],
  moor: [set3('#4f9a52', '#3d7f44', '#74b86a', 11), set3('#6b6f7a', '#565a66', '#858a96', 15)],
  city: [set3('#7a7486', '#655f72', '#928ca0', 21), set3('#3a3f52', '#2b3040', '#4a5068', 25)],
};
export const flower = [0, 1].map((f) => mk(T, T, (c) => {
  c.drawImage(GROUND.meadow[0][0], 0, 0);
  [[4, 5, '#ff5a6e'], [11, 10, '#f8f8f0']].forEach(([fx, y, col]) => { const x = fx + f; c.fillStyle = '#3f8a34'; c.fillRect(x, y + 2, 1, 2); c.fillStyle = col; c.fillRect(x - 1, y, 3, 1); c.fillRect(x, y - 1, 1, 3); px(c, x, y, '#ffd23f'); });
}));

// ---- a round tree, lit from the upper left; four leaf shades, light to dark ----
export function tree(shades = ['#6fcf5e', '#3fa24c', '#2c7a3c', '#1e5a30'], size = 32) {
  const r = size / 2 - 1;
  return mk(size, size + 8, (c) => {
    const tw = Math.round(size / 5);
    c.fillStyle = O; c.fillRect(size / 2 - tw / 2 - 1, size - 4, tw + 2, 11); c.fillStyle = '#8a5a2c'; c.fillRect(size / 2 - tw / 2, size - 4, tw, 10);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const dx = x - (size / 2 - 0.5), dy = (y - r) * 1.08, d = Math.sqrt(dx * dx + dy * dy) + (hash(x >> 1, y >> 1) - 0.5) * 2.2;
      if (d > r) continue;
      if (d > r - 1.4) { px(c, x, y, O); continue; }
      const l = (-dx - dy) / (r * 1.5) + (hash(x, y) - 0.5) * 0.35;
      px(c, x, y, l > 0.42 ? shades[0] : l > 0.05 ? shades[1] : l > -0.35 ? shades[2] : shades[3]);
    }
  });
}
export const oak = tree();
export const blossom = tree(['#ffd6e6', '#ff9ec4', '#f06aa0', '#b8477a'], 40);

// ---- a building: rows of windows (some lit), a door, a parapet ----
export function building(w, floors, wall, wallD, seed = 1) {
  const h = floors * 10 + 14;
  return mk(w, h, (c) => {
    c.fillStyle = O; c.fillRect(0, 2, w, h - 2); c.fillStyle = wall; c.fillRect(1, 3, w - 2, h - 4); c.fillStyle = wallD; c.fillRect(w - 5, 3, 4, h - 4); c.fillRect(1, 3, w - 2, 2);
    for (let f = 0; f < floors; f++) for (let x = 4; x < w - 9; x += 8) { const lit = hash(x + seed * 13, f + seed) > 0.5; c.fillStyle = O; c.fillRect(x - 1, 7 + f * 10, 7, 7); c.fillStyle = lit ? '#ffe9a6' : '#6f8fb8'; c.fillRect(x, 8 + f * 10, 5, 5); }
    const dx = (w >> 1) - 4; c.fillStyle = O; c.fillRect(dx - 1, h - 12, 10, 12); c.fillStyle = '#6a421e'; c.fillRect(dx, h - 11, 8, 11);
  });
}
export const cloud = mk(48, 20, (c) => {
  const blob = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x + 2, y, w - 4, h); c.fillRect(x, y + 2, w, h - 4); };
  blob(0, 6, 48, 14, '#c9d8ee'); blob(8, 0, 20, 14, '#c9d8ee'); blob(24, 3, 18, 12, '#c9d8ee'); blob(1, 6, 46, 11, '#f8fbff'); blob(9, 1, 18, 12, '#f8fbff'); blob(25, 4, 16, 10, '#f8fbff');
});
export const lamp = mk(12, 40, (c) => { c.fillStyle = O; c.fillRect(5, 8, 3, 32); c.fillRect(2, 0, 9, 10); c.fillStyle = '#ffe9a6'; c.fillRect(3, 1, 7, 8); c.fillStyle = '#fff8dc'; c.fillRect(4, 2, 3, 3); });

// ---- the player: a 14 x 18 map, a standing frame and two walking frames, facing right ----
// Change the letters' colours in PAL to dress them; change the maps to change them.
const PAL = { o: O, h: '#1b1b26', H: '#3d3d5c', s: '#b8734a', d: '#8f5235', e: '#141420', w: '#eceaf2', t: '#2f6fe0', j: '#2b3a67', J: '#1e2a4d', p: '#252d4a', k: '#0e0f16' };
const TOP = ['....oooooo....', '...ohHhhHho...', '..ohhHhhhhho..', '..ohhhhhhhho..', '..ohssssssho..', '..ossessesso..', '..osssssssso..', '...odssssdo...', '..ojjwttwjjo..', '.ojjjwttwjjjo.', '.ojJjjttjjJjo.', '.osJjjjjjjJso.', '..oJjjjjjjJo..', '..oppppppppo..'];
const LEGS = [
  ['..opppoopppo..', '..oppo..oppo..', '..okko..okko..', '..oooo..oooo..'],
  ['..opppoopppo..', '..oppo..oppo..', '..oooo..okko..', '........oooo..'],
  ['..opppoopppo..', '..oppo..oppo..', '..okko..oooo..', '..oooo........'],
];
export const hero = LEGS.map((legs) => mk(14, 18, (c) => TOP.concat(legs).forEach((r, y) => { for (let x = 0; x < 14; x++) if (r[x] !== '.') px(c, x, y, PAL[r[x]]); })));
export const shadow = mk(12, 4, (c) => { c.fillStyle = 'rgba(26,28,44,.35)'; c.fillRect(2, 0, 8, 4); c.fillRect(0, 1, 12, 2); });

// ---- the game's own letters: 3 x 5 dots, variable width, for signs drawn into the art ----
const GLYPHS = Object.fromEntries(Object.entries({
  A: '010/101/111/101/101', B: '110/101/110/101/110', C: '011/100/100/100/011', D: '110/101/101/101/110', E: '111/100/110/100/111', F: '111/100/110/100/100',
  G: '0111/1000/1011/1001/0111', H: '101/101/111/101/101', I: '111/010/010/010/111', J: '001/001/001/101/010', K: '1001/1010/1100/1010/1001', L: '100/100/100/100/111',
  M: '10001/11011/10101/10001/10001', N: '1001/1101/1011/1001/1001', O: '111/101/101/101/111', P: '110/101/110/100/100', Q: '111/101/101/111/001', R: '110/101/110/101/101',
  S: '011/100/010/001/110', T: '111/010/010/010/010', U: '101/101/101/101/111', V: '101/101/101/101/010', W: '10001/10001/10101/11011/10001', X: '101/101/010/101/101',
  Y: '101/101/010/010/010', Z: '111/001/010/100/111', '.': '0/0/0/0/1', '!': '1/1/1/0/1', "'": '1/1/0/0/0', '/': '001/001/010/100/100', '?': '110/001/010/000/010', '-': '000/000/111/000/000',
  0: '010/101/101/101/010', 1: '010/110/010/010/111', 2: '110/001/010/100/111', 3: '110/001/010/001/110', 4: '101/101/111/001/001', 5: '111/100/110/001/110', 6: '011/100/110/101/010', 7: '111/001/010/010/010', 8: '010/101/010/101/010', 9: '010/101/011/001/110',
}).map(([ch, rows]) => [ch, rows.split('/')]));
const gw = (ch) => GLYPHS[ch]?.[0].length ?? 3;
export const tw = (str) => [...str].reduce((n, ch) => n + gw(ch) + 1, 0); // width at scale 1
export function text(c, str, x, y, col, k = 1) {
  c.fillStyle = col; let at = x;
  for (const ch of str.toUpperCase()) { GLYPHS[ch]?.forEach((row, r) => { for (let n = 0; n < row.length; n++) if (row[n] === '1') c.fillRect(at + n * k, y + r * k, k, k); }); at += (gw(ch) + 1) * k; }
}
// A copy of any sprite with a lit signboard across it.
export function withSign(img, str, bg = O, fg = '#ffe9a6', y = 2) {
  return mk(img.width, img.height, (c) => { c.drawImage(img, 0, 0); const w = tw(str) + 3, x = Math.round((img.width - w) / 2); c.fillStyle = O; c.fillRect(x - 1, y - 1, w + 2, 9); c.fillStyle = bg; c.fillRect(x, y, w, 7); text(c, str, x + 2, y + 1, fg); });
}
// A signpost on a pole.
export const signpost = (str) => { const w = tw(str) + 7; return mk(w, 26, (c) => { c.fillStyle = O; c.fillRect((w >> 1) - 2, 9, 4, 17); c.fillRect(0, 0, w, 11); c.fillStyle = '#2f7a54'; c.fillRect(1, 1, w - 2, 9); text(c, str, 4, 3, '#f8f8f0'); }); };
