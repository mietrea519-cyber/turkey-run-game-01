// Boot Turkey Run: wire the canvas, HUD and input, then show the title.
import { Game, bindInput } from './game.js';

const canvas = document.getElementById('game');
const hud = {
  el: document.getElementById('hud'),
  score: document.getElementById('score') || document.getElementById('hud-score'),
  distance: document.getElementById('hud-distance'),
  stage: document.getElementById('hud-stage'),
  hearts: document.getElementById('hud-hearts'),
  farmer: document.getElementById('hud-farmer'),
};

const game = new Game(canvas, hud);
bindInput(game);
// Exposed for automated playtesting (and debugging in the browser console).
window.__turkeyRun = game;

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  // Deterministic screenshot pose: render one frozen frame, no loop.
  document.getElementById('hint').style.display = 'none';
  const seed = parseInt(params.get('seed') || '7', 10);
  game.poseShot(shot, seed);
} else {
  game.toTitle();
}
