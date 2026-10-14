// Renders a 3D model (a .glb with one plain mesh) into a pixel-art sprite for the game:
//   node scripts/model-sprite.mjs <model.glb> <out.png> [yaw degrees] [pitch degrees] [width in pixels] [debug]
// The model has no colours of its own, so they are given here by what each surface is: roofs
// (facing up) cream, walls brick red and shaded by which way they face, with a dark outline
// wherever the depth jumps. It is drawn large, then each sprite pixel takes the commonest
// colour under it, so edges stay hard.
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const [file, out, yawDeg = '0', pitchDeg = '38', widthPx = '132', debug] = process.argv.slice(2);
const buf = readFileSync(file);
const jsonLen = buf.readUInt32LE(12); const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString());
const bin = buf.subarray(20 + jsonLen + 8);
const view = (i) => { const a = json.accessors[i], v = json.bufferViews[a.bufferView]; return { a, off: (v.byteOffset || 0) + (a.byteOffset || 0) }; };
const prim = json.meshes[0].primitives[0];
const pv = view(prim.attributes.POSITION), iv = view(prim.indices);
const pos = new Float32Array(bin.buffer, bin.byteOffset + pv.off, pv.a.count * 3);
const idx = iv.a.componentType === 5125 ? new Uint32Array(bin.buffer, bin.byteOffset + iv.off, iv.a.count) : new Uint16Array(bin.buffer, bin.byteOffset + iv.off, iv.a.count);

const yaw = (+yawDeg * Math.PI) / 180, pitch = (+pitchDeg * Math.PI) / 180;
const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
// world (x right, y up, z towards the viewer) -> screen x, screen y (down), depth (larger is nearer)
const proj = (x, y, z) => { const X = x * cy + z * sy, Z = -x * sy + z * cy; return [X, -(y * cp - Z * sp), y * sp + Z * cp]; };

const n = pos.length / 3; const P = new Float32Array(n * 3); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, hMin = 1e9, hMax = -1e9;
const [cX, cZ] = (process.env.CROP || '9,-9').split(',').map(Number);
for (let i = 0; i < n; i++) { if (pos[i * 3] > cX || pos[i * 3 + 2] < cZ) continue; const [a, b, d] = proj(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]); P[i * 3] = a; P[i * 3 + 1] = b; P[i * 3 + 2] = d; x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b); hMin = Math.min(hMin, pos[i * 3 + 1]); hMax = Math.max(hMax, pos[i * 3 + 1]); }
const SS = 6; const W = +widthPx, k = (W * SS - 2 * SS) / (x1 - x0); const H = Math.ceil(((y1 - y0) * k) / SS) + 2; const BW = W * SS, BH = H * SS;
const zb = new Float32Array(BW * BH).fill(-1e9); const nx = new Float32Array(BW * BH), ny = new Float32Array(BW * BH), nz = new Float32Array(BW * BH), hh = new Float32Array(BW * BH); const hit = new Uint8Array(BW * BH);
// stray pieces of the scan (a strip of road, spikes behind) are left out: CROP="xMax,zMin" in model units
const [cropX, cropZ] = (process.env.CROP || '9,-9').split(',').map(Number);
for (let t = 0; t < idx.length; t += 3) {
  const a = idx[t], b = idx[t + 1], c = idx[t + 2];
  if ([a, b, c].some((i) => pos[i * 3] > cropX || pos[i * 3 + 2] < cropZ)) continue;
  const ax = pos[a * 3], ay = pos[a * 3 + 1], az = pos[a * 3 + 2], ux = pos[b * 3] - ax, uy = pos[b * 3 + 1] - ay, uz = pos[b * 3 + 2] - az, vx = pos[c * 3] - ax, vy = pos[c * 3 + 1] - ay, vz = pos[c * 3 + 2] - az;
  let fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx; const fl = Math.hypot(fx, fy, fz) || 1; fx /= fl; fy /= fl; fz /= fl;
  const X = [a, b, c].map((i) => (P[i * 3] - x0) * k + SS), Y = [a, b, c].map((i) => (P[i * 3 + 1] - y0) * k + SS), Z = [a, b, c].map((i) => P[i * 3 + 2]);
  const area = (X[1] - X[0]) * (Y[2] - Y[0]) - (X[2] - X[0]) * (Y[1] - Y[0]); if (Math.abs(area) < 1e-9) continue;
  const bx0 = Math.max(0, Math.floor(Math.min(...X))), bx1 = Math.min(BW - 1, Math.ceil(Math.max(...X))), by0 = Math.max(0, Math.floor(Math.min(...Y))), by1 = Math.min(BH - 1, Math.ceil(Math.max(...Y)));
  const h = (ay + pos[b * 3 + 1] + pos[c * 3 + 1]) / 3;
  for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
    const px = x + 0.5, py = y + 0.5;
    const w0 = ((X[1] - px) * (Y[2] - py) - (X[2] - px) * (Y[1] - py)) / area, w1 = ((X[2] - px) * (Y[0] - py) - (X[0] - px) * (Y[2] - py)) / area, w2 = 1 - w0 - w1;
    if (w0 < -0.02 || w1 < -0.02 || w2 < -0.02) continue;
    const z = w0 * Z[0] + w1 * Z[1] + w2 * Z[2]; const q = y * BW + x; if (z <= zb[q]) continue;
    zb[q] = z; hit[q] = 1; nx[q] = fx; ny[q] = fy; nz[q] = fz; hh[q] = h;
  }
}
// the model is a closed skin, so a surface seen from behind is its inside: flip those normals
const eye = [-sy * cp, sp, cy * cp];
// colours by surface
const PAL = { roof: [236, 228, 208], roofHi: [246, 241, 228], roofLo: [205, 195, 170], wallHi: [210, 96, 74], wall: [184, 64, 47], wallLo: [147, 48, 31], wallDeep: [110, 32, 25], glass: [39, 49, 76], glassHi: [93, 115, 150], pave: [214, 203, 168], paveLo: [188, 176, 140], line: [26, 28, 44] };
const KEYS = Object.keys(PAL);
const classOf = (q) => {
  let a = nx[q], b = ny[q], c = nz[q]; if (a * eye[0] + b * eye[1] + c * eye[2] < 0) { a = -a; b = -b; c = -c; }
  if (b > 0.75) return hh[q] < hMin + 0.07 ? 'pave' : 'roof'; if (b > 0.45) return hh[q] < hMin + 0.07 ? 'paveLo' : 'roofLo';
  const lit = a * 0.75 * cy + c * 0.75 * sy * 0 + (a * cy - c * sy) * 0; // (kept simple below)
  const side = a * Math.cos(yaw) + c * Math.sin(yaw);      // +1 facing screen right, -1 facing screen left
  const front = -a * Math.sin(yaw) + c * Math.cos(yaw);    // +1 facing the viewer
  const l = side * 0.7 + front * 0.35 + b * 0.3 + lit * 0;
  return l > 0.55 ? 'wallHi' : l > 0.15 ? 'wall' : l > -0.3 ? 'wallLo' : 'wallDeep';
};
const img = new Uint8Array(W * H * 4);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const count = {}; let hits = 0, zMin = 1e9, zMax = -1e9;
  for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) { const q = (y * SS + j) * BW + x * SS + i; if (!hit[q]) continue; hits++; const cl = classOf(q); count[cl] = (count[cl] || 0) + 1; zMin = Math.min(zMin, zb[q]); zMax = Math.max(zMax, zb[q]); }
  if (hits < SS * SS * 0.35) continue;
  let best = KEYS[0], bc = -1; for (const key of KEYS) if ((count[key] || 0) > bc) { bc = count[key] || 0; best = key; }
  const o = (y * W + x) * 4; img.set(PAL[best], o); img[o + 3] = 255;
}
// glass: wall that sits back from what is around it (window strips, the gaps between balcony edges)
{
  const dAt = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return null; let s2 = 0, m = 0; for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) { const q = (y * SS + j) * BW + x * SS + i; if (hit[q]) { s2 += zb[q]; m++; } } return m > SS * SS * 0.35 ? s2 / m : null; };
  const Dm = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) Dm.push(dAt(x, y));
  const px1 = (x1 - x0) / W; const isWall = (o) => img[o + 3] && img[o] > 100 && img[o + 1] < 110;
  const marks = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4, d = Dm[y * W + x]; if (d === null || !isWall(o)) continue;
    let s2 = 0, m = 0; for (const [i, j] of [[-2, 0], [2, 0], [-1, 0], [1, 0], [0, -2], [0, 2]]) { const v = Dm[(y + j) * W + x + i]; if (v !== null && v !== undefined && x + i >= 0 && x + i < W) { s2 += v; m++; } }
    if (m >= 4 && s2 / m - d > px1 * +(process.env.GLASS || 0.45)) marks.push([o, (x + y) % 5 === 0]);
  }
  marks.forEach(([o, hi]) => img.set(hi ? PAL.glassHi : PAL.glass, o));
}
// the outline: any empty pixel that touches the model, and any model pixel where the depth drops away sharply to a neighbour
const depthAt = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H || !img[(y * W + x) * 4 + 3]) return null; let s = 0, m = 0; for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) { const q = (y * SS + j) * BW + x * SS + i; if (hit[q]) { s += zb[q]; m++; } } return m ? s / m : null; };
const D = new Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) D[y * W + x] = depthAt(x, y);
const outImg = new Uint8Array(img);
const step = (x1 - x0) / W; // one pixel, in model units
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const d = D[y * W + x], o = (y * W + x) * 4; const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([i, j]) => (x + i < 0 || y + j < 0 || x + i >= W || y + j >= H ? null : D[(y + j) * W + x + i]));
  if (d === null) { if (nb.some((v) => v !== null)) { outImg.set(PAL.line, o); outImg[o + 3] = 255; } continue; }
  if (nb.some((v) => v !== null && d - v > step * 3.2)) { /* this pixel is well in front of a neighbour: leave it, the edge is drawn on the far side */ }
  if (nb.some((v) => v !== null && v - d > step * 3.2)) outImg.set(PAL.line, o);
}
// PNG
const crcT = new Uint32Array(256).map((_, i) => { let c = i; for (let k2 = 0; k2 < 8; k2++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const scale = debug ? 5 : 1; const OW = W * scale, OH = H * scale; const raw = Buffer.alloc((OW * 4 + 1) * OH);
for (let y = 0; y < OH; y++) { raw[y * (OW * 4 + 1)] = 0; for (let x = 0; x < OW; x++) { const s = ((Math.floor(y / scale)) * W + Math.floor(x / scale)) * 4; raw.set(outImg.subarray(s, s + 4), y * (OW * 4 + 1) + 1 + x * 4); } }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(OW, 0); ihdr.writeUInt32BE(OH, 4); ihdr[8] = 8; ihdr[9] = 6;
writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
if (!debug) {
  const cols = []; const rows = [];
  for (let y = 0; y < H; y++) { let r = ''; for (let x = 0; x < W; x++) { const o = (y * W + x) * 4; if (!outImg[o + 3]) { r += '.'; continue; } const hex = '#' + [0, 1, 2].map((i) => outImg[o + i].toString(16).padStart(2, '0')).join(''); let n = cols.indexOf(hex); if (n < 0) n = cols.push(hex) - 1; r += String.fromCharCode(97 + n); } rows.push(r); }
  writeFileSync(out.replace(/\.png$/, '.js'), `// Made by scripts/model-sprite.mjs from a 3D model: one character per pixel. COLOURS[i] is the colour of the letter 97 + i.
export const COLOURS = ${JSON.stringify(cols)};
export const ROWS = [
${rows.map((r) => `  '${r}',`).join(String.fromCharCode(10))}
];
`);
}
console.log(`${out}: ${W} x ${H}, height range ${hMin.toFixed(2)}..${hMax.toFixed(2)}`);
