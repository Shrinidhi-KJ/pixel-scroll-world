// Native scroll is the only input. The page scrolls as normal (scrollbar, keys, touch, links,
// back button, reload halfway down: all of it just works), and this turns the scroll position
// into progress between stops: 0 at the first section, 1 at the second, 2.5 halfway from the
// third to the fourth. A damped copy follows it, so the camera glides instead of jumping.
export function createConductor(sections, { damping = 4, reduced = false, offset = () => 0 } = {}) {
  let anchors = [];
  let exact = 0, smooth = 0, last = 0, raf = 0;

  // Where each section sits when it is centred in the window.
  function measure() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    anchors = sections.map((el, i) => {
      if (i === 0) return 0;
      if (i === sections.length - 1) return max;
      return Math.min(max, Math.max(0, el.offsetTop + el.offsetHeight / 2 - innerHeight / 2 - offset()));
    });
    for (let i = 1; i < anchors.length; i++) anchors[i] = Math.max(anchors[i], anchors[i - 1] + 1);
    read();
  }
  function read() {
    const y = scrollY;
    let p = anchors.length - 1;
    for (let i = 0; i < anchors.length - 1; i++) if (y <= anchors[i + 1]) { p = i + Math.max(0, (y - anchors[i]) / (anchors[i + 1] - anchors[i])); break; }
    exact = p;
  }
  function tick(now) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(1 / 30, (now - (last || now)) / 1000); last = now;
    smooth = reduced ? exact : smooth + (exact - smooth) * (1 - Math.exp(-damping * dt));
    if (Math.abs(smooth - exact) < 1e-4) smooth = exact;
  }
  addEventListener('scroll', read, { passive: true });
  addEventListener('resize', measure);
  new ResizeObserver(measure).observe(document.body);
  measure(); smooth = exact; raf = requestAnimationFrame(tick);
  return {
    measure,
    state: () => ({ exact, smooth, anchors }),
    stop: () => cancelAnimationFrame(raf),
  };
}
