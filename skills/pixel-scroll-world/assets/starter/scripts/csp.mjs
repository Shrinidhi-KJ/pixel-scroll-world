// Runs after `vite build`: writes a strict Content Security Policy into dist/_headers (the format
// Cloudflare Pages and Netlify read). Any inline <script> in the built page is allowed by its hash,
// so the policy never needs 'unsafe-inline' for scripts. Add an outside host to SCRIPT_HOSTS or
// CONNECT_HOSTS only when the page really loads from it (an analytics tracker, say).
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const SCRIPT_HOSTS = [];
const CONNECT_HOSTS = [];

const html = readFileSync('dist/index.html', 'utf8');
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const hash = (src) => createHash('sha256').update(src.replace(/\r\n?/g, '\n')).digest('base64'); // browsers hash the text with LF line ends
const csp = [
  "default-src 'self'",
  ["script-src 'self'", ...inline.map((s) => `'sha256-${hash(s)}'`), ...SCRIPT_HOSTS].join(' '),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  ["connect-src 'self'", ...CONNECT_HOSTS].join(' '),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');
const headers = readFileSync('dist/_headers', 'utf8').replace(/Content-Security-Policy: .*/, `Content-Security-Policy: ${csp}`);
writeFileSync('dist/_headers', headers);
console.log(`CSP written (${inline.length} inline script hash(es))`);
