// Obstacles and corn: what the turkey jumps, ducks and grabs.
import { pickInt, pickOne } from './rng.js';

// Kinds: fence (jump), hay (jump, tall), puddle (jump or wade slow),
// oven (kitchen: tall, glowing), knife (flies at head height: slide under).
export const KINDS = {
  fence:  { w: 26, h: 46, deadly: true },
  hay:    { w: 52, h: 62, deadly: true },
  puddle: { w: 90, h: 12, deadly: false },
  oven:   { w: 64, h: 96, deadly: true },
  knife:  { w: 56, h: 10, deadly: true, flies: true },
};

export class Obstacle {
  constructor(kind, x, y) {
    this.kind = kind;
    this.x = x;
    this.y = y; // ground line for the obstacle
    this.w = KINDS[kind].w;
    this.h = KINDS[kind].h;
    this.hit = false;
    this.passed = false;
    this.spin = 0;
  }

  // Hit box, slightly forgiving.
  box() {
    const k = KINDS[this.kind];
    if (this.kind === 'knife') {
      return { x: this.x - this.w / 2, y: this.y - 16, w: this.w, h: 10 };
    }
    if (this.kind === 'puddle') {
      return { x: this.x - this.w / 2, y: this.y - 10, w: this.w, h: 10 };
    }
    return { x: this.x - this.w / 2 + 4, y: this.y - this.h + 4, w: this.w - 8, h: this.h - 4 };
  }

  update(dt, speed) {
    this.x -= speed * dt;
    if (this.kind === 'knife') this.spin += dt * 14;
  }

  get offscreen() { return this.x < -120; }

  draw(ctx) {
    const k = KINDS[this.kind];
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.kind === 'fence') {
      ctx.fillStyle = '#7a4a21';
      ctx.fillRect(-13, -46, 5, 46);
      ctx.fillRect(8, -46, 5, 46);
      ctx.fillRect(-16, -44, 32, 6);
      ctx.fillRect(-16, -26, 32, 6);
      ctx.fillStyle = '#96622f';
      ctx.fillRect(-16, -44, 32, 2);
    } else if (this.kind === 'hay') {
      ctx.fillStyle = '#d9a441';
      ctx.beginPath();
      ctx.arc(0, -30, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b57f22';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -30, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-24, -44);
      ctx.lineTo(24, -16);
      ctx.moveTo(-24, -16);
      ctx.lineTo(24, -44);
      ctx.stroke();
    } else if (this.kind === 'puddle') {
      ctx.fillStyle = '#5b8fc9';
      ctx.beginPath();
      ctx.ellipse(0, -4, 45, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9cc3e8';
      ctx.beginPath();
      ctx.ellipse(-14, -6, 16, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.kind === 'oven') {
      // A hot oven, door glowing, waiting for a turkey.
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(-32, -96, 64, 96);
      ctx.fillStyle = '#555';
      ctx.fillRect(-32, -96, 64, 10);
      ctx.fillStyle = '#ff7b24';
      ctx.fillRect(-24, -78, 48, 40);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-20, -74, 40, 14);
      ctx.fillStyle = '#222';
      ctx.fillRect(-24, -30, 48, 6);
      ctx.fillStyle = '#c9c9c9';
      ctx.fillRect(-6, -26, 12, 4);
      // Heat shimmer.
      ctx.strokeStyle = 'rgba(255,123,36,0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-18, -104);
      ctx.quadraticCurveTo(-12, -116, -18, -126);
      ctx.moveTo(14, -104);
      ctx.quadraticCurveTo(20, -116, 14, -126);
      ctx.stroke();
    } else if (this.kind === 'knife') {
      ctx.save();
      ctx.translate(0, -14);
      ctx.rotate(this.spin);
      ctx.fillStyle = '#d7dde3';
      ctx.beginPath();
      ctx.moveTo(-28, -4);
      ctx.lineTo(14, -4);
      ctx.lineTo(28, 0);
      ctx.lineTo(14, 4);
      ctx.lineTo(-28, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#5b3a1e';
      ctx.fillRect(-28, -5, 12, 10);
      ctx.restore();
    }
    ctx.restore();
  }
}

export class Corn {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.taken = false;
    this.bob = Math.random() * Math.PI * 2;
  }

  update(dt, speed) {
    this.x -= speed * dt;
    this.bob += dt * 5;
  }

  get offscreen() { return this.x < -40; }

  box() { return { x: this.x - 14, y: this.y - 14, w: 28, h: 28 }; }

  draw(ctx) {
    const y = this.y + Math.sin(this.bob) * 3;
    ctx.save();
    ctx.translate(this.x, y);
    // Cob.
    ctx.fillStyle = '#f2c531';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 13, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9a41f';
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5 - 2, -10);
      ctx.lineTo(i * 5 + 2, 10);
      ctx.stroke();
    }
    // Husk leaves.
    ctx.fillStyle = '#5da24a';
    ctx.beginPath();
    ctx.moveTo(-8, 6);
    ctx.lineTo(-14, 16);
    ctx.lineTo(-2, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// Spawn the next obstacle (or a corn trail) for a stage.
export function spawnForStage(rnd, stage, x) {
  const table = {
    farmyard: ['fence', 'fence', 'hay', 'puddle', 'fence'],
    garden: ['fence', 'hay', 'hay', 'knife', 'puddle'],
    kitchen: ['oven', 'knife', 'oven', 'knife', 'hay'],
  }[stage];
  const kind = pickOne(rnd, table);
  // Knives fly at neck height: a standing turkey is hit, a sliding one ducks under.
  const y = kind === 'knife' ? 470 - 30 : 470;
  const ob = new Obstacle(kind, x, y);
  // Sometimes trail corn after an obstacle, at jump-arc height.
  const corns = [];
  if (rnd() < 0.55) {
    const n = pickInt(rnd, 2, 4);
    for (let i = 0; i < n; i++) {
      corns.push(new Corn(x + 70 + i * 34, 470 - pickOne(rnd, [46, 96, 130])));
    }
  }
  return { ob, corns };
}
