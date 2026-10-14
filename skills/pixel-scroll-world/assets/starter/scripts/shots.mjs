// Screenshots of every stop, on a laptop and a phone, plus any page errors. Run the dev server
// first (npm run dev), then: npm run shots   (or: node scripts/shots.mjs http://localhost:5173)
// Look at the pictures. A pixel world can pass every test and still look wrong.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const url = process.argv[2] || 'http://localhost:5173';
mkdirSync('shots', { recursive: true });
const browser = await chromium.launch();
const errors = [];
for (const [tag, viewport] of [['laptop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport, isMobile: tag === 'phone', hasTouch: tag === 'phone' });
  page.on('pageerror', (e) => errors.push(`${tag}: ${e}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${tag}: ${m.text()}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const ids = await page.$$eval('main > section[id]', (els) => els.map((e) => e.id));
  for (const id of ids) {
    await page.evaluate((id) => { const el = document.getElementById(id); const band = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--band')) || 0; scrollTo({ top: el.offsetTop + el.offsetHeight / 2 - innerHeight / 2 - band / 2, behavior: 'instant' }); }, id);
    await page.waitForTimeout(1600); // let the camera glide in
    await page.screenshot({ path: `shots/${tag}-${id}.png` });
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (overflow > 0) errors.push(`${tag}: the page is ${overflow}px wider than the screen`);
  await page.close();
}
await browser.close();
console.log(errors.length ? errors.join('\n') : 'no errors; screenshots are in shots/');
