// The farmer: he stalks in from the left as the turkey's luck runs out.
import { clamp, approach } from './rng.js';

export class Farmer {
  constructor() {
    this.x = -160; // off-screen until the turkey stumbles
    this.targetX = -160;
    this.runPhase = 0;
    this.angry = false;
  }

  reset() {
    this.x = -160;
    this.targetX = -160;
    this.angry = false;
  }

  // heartsLeft 3..0 — the fewer hearts, the closer he creeps.
  setPressure(heartsLeft) {
    this.targetX = [-160, 30, 78, 118][clamp(3 - heartsLeft, 0, 3)];
    this.angry = heartsLeft <= 1;
  }

  update(dt, speed) {
    this.x = approach(this.x, this.targetX, dt * 260);
    this.runPhase += dt * (speed * 0.04 + 2);
  }

  // He catches the turkey when he reaches the turkey's x.
  get caughtUp() { return this.x > 120; }

  draw(ctx) {
    if (this.x < -120) return;
    const bob = Math.sin(this.runPhase * 2) * 2;
    ctx.save();
    ctx.translate(this.x, 470 + bob);

    // Legs: overalls, mid-stride.
    const swing = Math.sin(this.runPhase * 2) * 9;
    ctx.strokeStyle = '#3b4a6b';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, -52);
    ctx.lineTo(-6 + swing, 0);
    ctx.moveTo(6, -52);
    ctx.lineTo(6 - swing, 0);
    ctx.stroke();

    // Body: red plaid shirt.
    ctx.fillStyle = '#b3372e';
    ctx.fillRect(-20, -108, 40, 58);
    ctx.fillStyle = '#8f2a24';
    ctx.fillRect(-20, -88, 40, 5);
    ctx.fillRect(-20, -70, 40, 5);
    // Overalls straps.
    ctx.fillStyle = '#3b4a6b';
    ctx.fillRect(-14, -108, 6, 26);
    ctx.fillRect(8, -108, 6, 26);

    // Head + straw hat.
    ctx.fillStyle = '#e8b98a';
    ctx.beginPath();
    ctx.arc(0, -124, 15, 0, Math.PI * 2);
    ctx.fill();
    // Beard.
    ctx.fillStyle = '#e8e0cc';
    ctx.beginPath();
    ctx.arc(0, -112, 10, 0, Math.PI);
    ctx.fill();
    // Eyes: angry slits when close.
    ctx.fillStyle = '#1d1d1d';
    if (this.angry) {
      ctx.fillRect(-10, -128, 7, 2.5);
      ctx.fillRect(3, -128, 7, 2.5);
    } else {
      ctx.beginPath();
      ctx.arc(-6, -127, 2, 0, Math.PI * 2);
      ctx.arc(6, -127, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Straw hat.
    ctx.fillStyle = '#e0b64f';
    ctx.beginPath();
    ctx.ellipse(0, -136, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-13, -152, 26, 17);

    // Reaching arm toward the turkey.
    ctx.strokeStyle = '#e8b98a';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(16, -96);
    ctx.lineTo(38, -84 + Math.sin(this.runPhase * 2) * 3);
    ctx.stroke();

    ctx.restore();
  }
}
