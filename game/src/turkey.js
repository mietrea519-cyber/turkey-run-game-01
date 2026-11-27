// The turkey: a plump runaway with a jump, a slide and a dash.
import { clamp } from './rng.js';

export const GROUND_Y = 470;
const GRAVITY = 2600;
const JUMP_V = -880;

export class Turkey {
  constructor() {
    this.x = 170;
    this.y = GROUND_Y;
    this.vy = 0;
    this.w = 58;
    this.h = 52;
    this.sliding = false;
    this.slideT = 0;
    this.dashT = 0;
    this.dashCooldown = 0;
    this.invulnT = 0;
    this.runPhase = 0;
    this.onGround = true;
  }

  reset() {
    this.y = GROUND_Y;
    this.vy = 0;
    this.sliding = false;
    this.slideT = 0;
    this.dashT = 0;
    this.dashCooldown = 0;
    this.invulnT = 0;
    this.runPhase = 0;
    this.onGround = true;
  }

  get jumping() { return !this.onGround; }
  get dashing() { return this.dashT > 0; }

  jump() {
    if (!this.onGround) return false;
    this.vy = JUMP_V;
    this.onGround = false;
    this.sliding = false;
    this.slideT = 0;
    return true;
  }

  slide() {
    if (!this.onGround || this.sliding) return false;
    this.sliding = true;
    this.slideT = 0.55;
    return true;
  }

  dash() {
    if (this.dashCooldown > 0 || this.dashT > 0) return false;
    this.dashT = 0.28;
    this.dashCooldown = 1.6;
    return true;
  }

  // Hit box, forgiving at the edges so near-misses feel fair.
  box() {
    if (this.sliding) return { x: this.x - 26, y: this.y - 26, w: 58, h: 26 };
    return { x: this.x - 24, y: this.y - 48, w: 48, h: 48 };
  }

  update(dt, speed) {
    this.runPhase += dt * (this.onGround ? speed * 0.045 : 4);
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.dashT > 0) this.dashT -= dt;
    if (this.invulnT > 0) this.invulnT -= dt;
    if (this.slideT > 0) {
      this.slideT -= dt;
      if (this.slideT <= 0) this.sliding = false;
    }
    if (!this.onGround) {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.vy = 0;
        this.onGround = true;
      }
    }
    this.y = clamp(this.y, 120, GROUND_Y);
  }

  draw(ctx) {
    const bob = this.onGround ? Math.sin(this.runPhase * 2) * 2 : 0;
    const blink = this.invulnT > 0 && Math.floor(this.invulnT * 14) % 2 === 0;
    ctx.save();
    ctx.translate(this.x, this.y + bob);
    if (blink) ctx.globalAlpha = 0.35;
    if (this.sliding) ctx.scale(1.25, 0.62);

    // Tail feathers: a fan of autumn browns.
    const tailCols = ['#b5541e', '#d97b29', '#8a5a2b'];
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.rotate((i * 0.38) - 0.5);
      ctx.fillStyle = tailCols[(i + 2) % 3];
      ctx.beginPath();
      ctx.ellipse(-26, -16, 9, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Body: plump brown oval.
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath();
    ctx.ellipse(0, -20, 30, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    // Belly patch.
    ctx.fillStyle = '#c89b6a';
    ctx.beginPath();
    ctx.ellipse(6, -14, 18, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing.
    ctx.fillStyle = '#6e4520';
    ctx.beginPath();
    ctx.ellipse(-6, -22, 15, 10, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Head + beak + wattle.
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath();
    ctx.arc(24, -48, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2a007';
    ctx.beginPath();
    ctx.moveTo(35, -50);
    ctx.lineTo(47, -45);
    ctx.lineTo(35, -42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d9382b';
    ctx.beginPath();
    ctx.ellipse(33, -38, 3.5, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Eye.
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(27, -52, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d1d1d';
    ctx.beginPath();
    ctx.arc(28.5, -52, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Legs: scurry when running.
    ctx.strokeStyle = '#f2a007';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    const legSwing = this.onGround ? Math.sin(this.runPhase * 2) * 8 : 4;
    ctx.beginPath();
    ctx.moveTo(-8, -2);
    ctx.lineTo(-8 + legSwing, 0);
    ctx.moveTo(8, -2);
    ctx.lineTo(8 - legSwing, 0);
    ctx.stroke();

    ctx.restore();
  }
}
