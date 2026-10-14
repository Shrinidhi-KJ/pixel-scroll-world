import '@fontsource/press-start-2p';
import './style.css';
import { startWorld } from './world.js';

// Two layouts from one page: the game (the world behind, the CV in dialogue windows) and the
// plain CV (the same sections as an ordinary page). The plain CV is always one click away, and
// it is what visitors get when the screen is tiny. The choice lasts for the visit only.
const html = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const toggle = document.getElementById('view-toggle');
let world = false;

function apply(game) {
  html.classList.toggle('game', game);
  toggle.textContent = game ? 'Plain CV' : 'Play the CV';
  if (game && !world) { world = true; startWorld({ reduced }); }
}
toggle.addEventListener('click', () => { apply(!html.classList.contains('game')); scrollTo({ top: 0, behavior: 'instant' }); });
apply(innerWidth >= 320 && innerHeight >= 480);
