# A showreel of the site

A 15-second video of the world makes a strong post. Don't screen-record it: recordings drop
frames and blur pixel art. Film the real game frame by frame instead, then edit the shots together.

## Filming frame-exact plates

Open the built site in Playwright with its clock taken over before any script runs:

```js
await page.addInitScript(() => {
  let now = 0, id = 0, vy = 0; const q = new Map();
  window.requestAnimationFrame = (cb) => { q.set(++id, cb); return id; };
  window.cancelAnimationFrame = (i) => q.delete(i);
  performance.now = () => now;
  Object.defineProperty(window, 'scrollY', { get: () => vy, configurable: true });
  window.__vt = {
    step(dt = 1000 / 60) { now += dt; const cbs = [...q.values()]; q.clear(); cbs.forEach((cb) => cb(now)); },
    setY(y) { vy = y; dispatchEvent(new Event('scroll')); },
  };
});
```

Now nothing moves until you say so. For each frame of a shot: set the scroll position that puts
the traveller where you want him (invert the eased route mapping to find it), step the clock one
sixtieth of a second, and save the world canvas with `canvas.toDataURL()`. The plates are
pixel-for-pixel what the site draws, at its art resolution (for example 720×250), and the game's
own state carries through (costumes, confetti, the cone).

Film shots in story order in one browser session. Keep a few spare frames after each shot for
transitions. Use the same trick to film any looping UI (an arcade screen) as numbered PNGs.

## Editing

Remotion (React, frame-based) is a good fit: each bar of music is a scene; each scene shows a plate
sequence scaled by a whole number (`image-rendering: pixelated`), with type and cards laid over it.

- **Cut on the beat.** At 144 BPM and 60 fps a beat is exactly 25 frames.
- **Use the site's own interface** for overlays: its dialogue windows, chips, HUD and fonts, so the
  video is recognisably the site.
- **Hits:** a white flash, a slight camera punch-in, a brief colour split on the downbeat.
- **Transitions with meaning:** dive into the arcade screen, a cloud wipe for a flight, an iris on
  the traveller, a whip-pan along a river.
- **End card:** name, role, one line, the address.
- **Quote only real text and numbers from the site.**

## Music

A short chiptune can be synthesised in code (pulse waves with band-limited edges, a triangle bass,
noise drums, a simple echo) and written to a WAV, so there are no licensing questions. Check the
loudness (around -14 LUFS for social video) and leave headroom. You can't listen to it yourself, so
tell the owner to listen before posting.

## Export

Render 1920×1080 at 60 fps, H.264, a high-quality master (CRF ~14) and a web copy (CRF ~22,
`-movflags +faststart`), plus a poster frame. Pixel art suffers from heavy compression; prefer
higher bitrate over smaller files.
