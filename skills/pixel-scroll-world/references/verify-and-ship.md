# Verify and ship

## Contents
1. Look at it: screenshots per stop
2. Frame strips for motion
3. Tests worth having
4. Security headers
5. SEO and share cards
6. Visitor statistics
7. Deploying

## 1. Look at it: screenshots per stop

`npm run shots` (from the starter) scrolls to each section on a 1440×900 laptop and a 390×844
phone, waits for the camera to settle, saves a screenshot, and reports page errors and horizontal
overflow. Open the images and check, at every stop you changed:

- Nothing important is hidden behind the nav bar, the phone strip or a window.
- Sprites stand on the ground (no floating plazas, no feet in the road).
- Nothing bleeds where it shouldn't (reflections onto land, lights through walls).
- Text in windows is legible and not clipped.
- The phone strip shows the traveller and the place, not just sky.

## 2. Frame strips for motion

Motion bugs (a one-frame jump at a cut, a sprite drawn in front for a frame) don't show in still
screenshots. Capture a run of frames and tile them into one image:

```js
// in Playwright: step the scroll in small increments, screenshot a clip each time
for (let i = 0; i < 60; i++) { await page.evaluate(() => scrollBy(0, innerHeight * 0.02)); await page.waitForTimeout(60); await page.screenshot({ path: `f-${i}.png`, clip }); }
```

then `ffmpeg -i f-%d.png -vf tile=6x10 strip.png`. For frame-exact captures, take over the page's
clock (see `showreel.md`).

Expose a tiny debug handle on `window` (the route position, the current tap targets) so scripts
can drive and check the world without guessing.

## 3. Tests worth having

With Playwright against a production build:

- No console errors while loading.
- No horizontal overflow at 320, 390, 768 and 1440 px wide.
- The world canvas becomes ready on desktop and on a phone.
- Nav links scroll their sections into view.
- The plain-CV switch works, and a fresh load opens on the game again.
- In the plain layout every link and button is reachable with Tab and at least 44 px tall.
- Reduced motion: all content visible, nothing animating.
- The production Content Security Policy allows everything the page runs (load the built page with
  the real header and fail on any CSP violation in the console).

## 4. Security headers

A static site has little attack surface, but set these in `public/_headers` (Cloudflare Pages and
Netlify read it):

- `Content-Security-Policy`: `default-src 'self'`, scripts only from `'self'` plus hashes of any
  inline script (`scripts/csp.mjs` computes them at build), `frame-ancestors 'none'`,
  `base-uri 'self'`, `form-action 'none'`. Add an outside host only for something the page really
  loads (an analytics script and the address it sends to).
- `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Cross-Origin-Opener-Policy: same-origin`.
- A real `404.html`, so made-up paths return 404 instead of the home page.
- `rel="noopener"` on every `target="_blank"` link. No secrets in the repository: an analytics
  site ID is public by design; an API key is not.

## 5. SEO and share cards

The content is real HTML, so search engines can read it. Add: a descriptive `<title>` and meta
description, a canonical URL, Open Graph tags with a 1200×630 share image (a still of the world
with the owner's name works well), `twitter:card` `summary_large_image`, a JSON-LD `Person` block
(name, job title, location, education, links: only facts already on the page), `robots.txt` and a
one-URL `sitemap.xml`. Realistic goal: the owner's name finds the site, and shared links show a
proper card.

## 6. Visitor statistics

A cookie-free tracker (Umami, GoatCounter, Plausible, or Cloudflare Web Analytics) needs no cookie
banner in most cases. Load it only on the production hostname, never in development or tests.
Custom events make a single-page game measurable: which layout it opened in, how far people got
(a section counts after it has held the middle of the screen for about a second), project views,
secrets found, email copied, links opened, and tagged links (`?ref=name`) per job application.
Give the owner a way to exclude their own visits (`?notrack` setting a local flag).

If the dashboard shows zeros while real-time shows visitors, check the computer's clock: dashboards
compute "last 24 hours" from it.

## 7. Deploying

Any static host works. With Cloudflare Pages: `vite build && node scripts/csp.mjs`, then
`wrangler pages deploy dist --project-name <name> --branch main`. Check the live site after each
deploy (headers present, 404 works, share image served). Deploy only when the owner asks.
