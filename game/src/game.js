// Turkey Run — game states, loop, collisions, HUD and screenshot poses.
import { Turkey, GROUND_Y } from './turkey.js';
import { Farmer } from './farmer.js';
import { Obstacle, Corn, spawnForStage } from './obstacles.js';
import { World, stageFor } from './world.js';
import { SoundBank } from './audio.js';
import { mulberry32, clamp } from './rng.js';

const PX_PER_M = 30;
const GOAL_M = 1200;
const GOAL_PX = GOAL_M * PX_PER_M;
const TURKEY_X = 170;

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class Game {
  constructor(canvas, hud) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hud = hud;
    this.sounds = new SoundBank();
    this.turkey = new Turkey();
    this.farmer = new Farmer();
    this.world = new World();
    this.state = 'title';
    this.obstacles = [];
    this.corns = [];
    this.distancePx = 0;
    this.score = 0;
    this.cornCount = 0;
    this.hearts = 3;
    this.speedMul = 1;
    this.staggerT = 0;
    this.wading = false;
    this.spawnIn = 300;
    this.rnd = mulberry32((Math.random() * 1e9) | 0);
    this.lastT = 0;
    this.shotMode = null;
    this.paused = false;
    this.farmerGap = 28;
  }

  get distanceM() { return Math.floor(this.distancePx / PX_PER_M); }
  get stage() { return stageFor(this.distanceM); }

  baseSpeed() {
    return Math.min(480, 300 + this.distanceM * 0.15);
  }

  reset() {
    this.turkey.reset();
    this.farmer.reset();
    this.world.reset();
    this.obstacles = [];
    this.corns = [];
    this.distancePx = 0;
    this.score = 0;
    this.cornCount = 0;
    this.hearts = 3;
    this.speedMul = 1;
    this.staggerT = 0;
    this.wading = false;
    this.spawnIn = 320;
    this.farmerGap = 28;
    this.rnd = mulberry32((Math.random() * 1e9) | 0);
  }

  start() {
    this.reset();
    this.state = 'playing';
    this.sounds.ensure();
    this.sounds.click();
    this.updateHud(true);
    this.lastT = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  toTitle() {
    this.reset();
    this.state = 'title';
    this.updateHud(false);
    this.render();
  }

  loop(t) {
    if (this.state !== 'playing') return;
    const dt = clamp((t - this.lastT) / 1000, 0, 0.05);
    this.lastT = t;
    if (!this.paused) this.update(dt);
    this.render();
    requestAnimationFrame((tt) => this.loop(tt));
  }

  update(dt) {
    // Speed: base, dash burst, stagger after a hit, wading in puddles.
    let mul = 1;
    if (this.turkey.dashing) mul *= 1.7;
    if (this.staggerT > 0) { mul *= 0.55; this.staggerT -= dt; }
    if (this.wading) mul *= 0.6;
    const speed = this.baseSpeed() * mul;

    this.distancePx += speed * dt;
    this.world.update(dt, speed);
    this.turkey.update(dt, speed);
    this.farmer.setPressure(this.hearts);
    this.farmer.update(dt, speed);
    this.farmerGap = 4 + this.hearts * 8;

    // Spawn obstacles ahead.
    this.spawnIn -= speed * dt;
    if (this.spawnIn <= 0) {
      const { ob, corns } = spawnForStage(this.rnd, this.stage.name.toLowerCase(), 1000);
      this.obstacles.push(ob);
      this.corns.push(...corns);
      this.spawnIn = 280 + this.rnd() * 220;
    }

    // Move and cull.
    for (const ob of this.obstacles) ob.update(dt, speed);
    for (const c of this.corns) c.update(dt, speed);
    this.obstacles = this.obstacles.filter((o) => !o.offscreen);
    this.corns = this.corns.filter((c) => !c.offscreen && !c.taken);

    // Collisions.
    const tbox = this.turkey.box();
    this.wading = false;
    for (const ob of this.obstacles) {
      if (ob.kind === 'puddle') {
        if (overlaps(tbox, ob.box()) && this.turkey.onGround) this.wading = true;
        continue;
      }
      if (!ob.passed && ob.x < TURKEY_X - 60) {
        ob.passed = true;
        this.score += 10;
      }
      if (!ob.hit && overlaps(tbox, ob.box())) {
        ob.hit = true;
        this.hitObstacle();
      }
    }
    for (const c of this.corns) {
      if (!c.taken && overlaps(tbox, c.box())) {
        c.taken = true;
        this.cornCount++;
        this.score += 50;
        this.sounds.corn();
      }
    }

    // Score ticks with distance.
    this.score = Math.max(this.score, this.distanceM * 2 + this.cornCount * 50);

    // Reached the forest gate?
    if (this.distancePx >= GOAL_PX) {
      this.state = 'escaped';
      this.sounds.escaped();
      this.updateHud(false);
      this.render();
      return;
    }
    this.updateHud(true);
  }

  hitObstacle() {
    this.hearts--;
    this.turkey.invulnT = 1.5;
    this.staggerT = 0.45;
    this.sounds.hit();
    if (this.hearts <= 0) {
      this.state = 'caught';
      this.sounds.caught();
      this.updateHud(false);
      this.render();
    }
  }

  updateHud(show) {
    if (!this.hud) return;
    this.hud.el.classList.toggle('hidden', !show);
    if (!show) return;
    this.hud.score.textContent = `SCORE ${this.score}`;
    this.hud.distance.textContent = `${this.distanceM} m / ${GOAL_M} m`;
    this.hud.stage.textContent = this.stage.name;
    this.hud.hearts.textContent = '♥'.repeat(this.hearts) + '♡'.repeat(3 - this.hearts);
    this.hud.farmer.textContent = `FARMER ${this.farmerGap} m`;
  }

  // ---- drawing ----
  render() {
    const ctx = this.ctx;
    const gateX = TURKEY_X + (GOAL_PX - this.distancePx);
    this.world.draw(ctx, this.stage, this.state === 'playing' || this.state === 'paused' ? gateX : -999);
    for (const c of this.corns) c.draw(ctx);
    for (const ob of this.obstacles) ob.draw(ctx);
    this.turkey.draw(ctx);
    this.farmer.draw(ctx);
    if (this.state === 'title') this.drawTitle(ctx);
    if (this.state === 'paused') this.drawCenter(ctx, 'PAUSED', 'Press P to keep running');
    if (this.state === 'caught') this.drawEnd(ctx, false);
    if (this.state === 'escaped') this.drawEnd(ctx, true);
  }

  drawTitle(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(43, 29, 18, 0.38)';
    ctx.fillRect(0, 0, 960, 540);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff3d0';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 4;
    ctx.font = '900 84px "Trebuchet MS", sans-serif';
    ctx.fillText('TURKEY RUN', 480, 150);
    ctx.font = '700 30px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffd166';
    ctx.fillText('The Great Thanksgiving Escape', 480, 196);
    ctx.font = '400 21px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#fff8e6';
    ctx.fillText('Outrun the farmer. Dodge the oven and the carving knives.', 480, 250);
    ctx.fillText('Grab the corn. Reach the forest, 1200 m away.', 480, 282);
    ctx.font = '800 26px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffdf8a';
    const blink = Math.floor(performance.now() / 500) % 2 === 0;
    if (blink || this.shotMode) ctx.fillText('PRESS SPACE TO RUN', 480, 360);
    ctx.font = '400 17px "Trebuchet MS", sans-serif';
    ctx.fillStyle = 'rgba(255,248,230,0.9)';
    ctx.fillText('SPACE jump  ·  DOWN slide  ·  SHIFT dash', 480, 400);
    ctx.restore();
  }

  drawCenter(ctx, big, small) {
    ctx.save();
    ctx.fillStyle = 'rgba(43, 29, 18, 0.5)';
    ctx.fillRect(0, 0, 960, 540);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff3d0';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowOffsetY = 4;
    ctx.font = '900 64px "Trebuchet MS", sans-serif';
    ctx.fillText(big, 480, 260);
    ctx.font = '400 22px "Trebuchet MS", sans-serif';
    ctx.fillText(small, 480, 306);
    ctx.restore();
  }

  drawEnd(ctx, escaped) {
    ctx.save();
    ctx.fillStyle = escaped ? 'rgba(20, 60, 25, 0.55)' : 'rgba(60, 15, 10, 0.55)';
    ctx.fillRect(0, 0, 960, 540);
    ctx.textAlign = 'center';
    ctx.fillStyle = escaped ? '#b8f5c0' : '#ffb3a0';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowOffsetY = 4;
    ctx.font = '900 76px "Trebuchet MS", sans-serif';
    ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', 480, 210);
    ctx.font = '400 24px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#fff8e6';
    ctx.fillText(
      escaped
        ? 'You made it to the forest. Thanksgiving is cancelled — for you.'
        : `The farmer got you at ${this.distanceM} m. So close to the forest!`,
      480, 262,
    );
    ctx.font = '800 30px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffd166';
    ctx.fillText(`SCORE ${this.score}   ·   ${this.distanceM} m   ·   ${this.cornCount} corn`, 480, 322);
    ctx.font = '400 22px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#fff8e6';
    ctx.fillText('Press R or SPACE to run again', 480, 372);
    ctx.restore();
  }

  // ---- deterministic poses for screenshots (?shot=title|play|kitchen|end) ----
  poseShot(name, seed) {
    this.shotMode = name;
    this.rnd = mulberry32(seed || 7);
    this.reset();
    if (name === 'title') {
      this.state = 'title';
      this.updateHud(false);
      this.render();
      return;
    }
    if (name === 'play' || name === 'kitchen') {
      const kitchen = name === 'kitchen';
      this.state = 'playing';
      this.distancePx = (kitchen ? 940 : 320) * PX_PER_M;
      this.score = kitchen ? 2680 : 1240;
      this.cornCount = kitchen ? 18 : 9;
      this.hearts = kitchen ? 1 : 2;
      // Turkey mid-jump over a fence (play) or sliding under a knife (kitchen).
      if (kitchen) {
        this.turkey.sliding = true;
        this.turkey.slideT = 9;
        this.obstacles.push(new Obstacle('knife', 420, 440));
        this.obstacles.push(new Obstacle('oven', 640, GROUND_Y));
        this.obstacles.push(new Obstacle('hay', 830, GROUND_Y));
        this.corns.push(new Corn(520, GROUND_Y - 96), new Corn(556, GROUND_Y - 96));
      } else {
        this.turkey.y = GROUND_Y - 120;
        this.turkey.vy = -200;
        this.turkey.onGround = false;
        this.obstacles.push(new Obstacle('fence', 430, GROUND_Y));
        this.obstacles.push(new Obstacle('hay', 700, GROUND_Y));
        this.corns.push(new Corn(560, GROUND_Y - 130), new Corn(596, GROUND_Y - 130), new Corn(632, GROUND_Y - 96));
      }
      this.farmer.setPressure(this.hearts);
      this.farmer.x = this.farmer.targetX;
      this.farmerGap = 4 + this.hearts * 8;
      this.updateHud(true);
      this.render();
      return;
    }
    if (name === 'end') {
      this.state = 'escaped';
      this.distancePx = GOAL_PX;
      this.score = 3120;
      this.cornCount = 24;
      this.hearts = 2;
      this.updateHud(false);
      this.render();
      return;
    }
    // Unknown shot: fall back to the title screen.
    this.state = 'title';
    this.render();
  }
}

// ---- input wiring ----
export function bindInput(game) {
  const canvas = game.canvas;
  function act(code) {
    if (game.state === 'title') {
      if (code === 'Space' || code === 'Enter' || code === 'ArrowUp' || code === 'KeyW') game.start();
      return;
    }
    if (game.state === 'caught' || game.state === 'escaped') {
      if (code === 'KeyR' || code === 'Space' || code === 'Enter') game.start();
      return;
    }
    if (game.state !== 'playing') return;
    if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
      if (game.turkey.jump()) game.sounds.jump();
    } else if (code === 'ArrowDown' || code === 'KeyS') {
      game.turkey.slide();
    } else if (code === 'ShiftLeft' || code === 'ShiftRight') {
      if (game.turkey.dash()) game.sounds.dash();
    } else if (code === 'KeyP') {
      game.paused = !game.paused;
      if (!game.paused) game.lastT = performance.now();
    } else if (code === 'KeyM') {
      game.sounds.toggleMute();
    }
  }
  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    act(e.code);
  });
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (game.state === 'playing') {
      if (game.turkey.jump()) game.sounds.jump();
    } else {
      act('Space');
    }
  });
}
