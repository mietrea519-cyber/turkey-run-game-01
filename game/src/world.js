// The farm scenery: parallax hills, barns, trees, and the forest gate.
import { mulberry32 } from './rng.js';

export const STAGES = [
  { name: 'FARMYARD', from: 0, sky: ['#f7c873', '#f2a65a'], hill: '#c98f4e', ground: '#a4713a' },
  { name: 'GARDEN', from: 400, sky: ['#f2b25e', '#e08a4a'], hill: '#b57a3e', ground: '#96622f' },
  { name: 'KITCHEN', from: 800, sky: ['#e89a52', '#c96a3e'], hill: '#9c6234', ground: '#7d4f28' },
];

export function stageFor(distanceM) {
  let cur = STAGES[0];
  for (const s of STAGES) if (distanceM >= s.from) cur = s;
  return cur;
}

function makeDecor(seed) {
  const rnd = mulberry32(seed);
  const trees = [];
  for (let i = 0; i < 26; i++) trees.push({ x: rnd() * 2400, s: 0.7 + rnd() * 0.7, kind: rnd() < 0.6 ? 'tree' : 'bush' });
  const clouds = [];
  for (let i = 0; i < 7; i++) clouds.push({ x: rnd() * 1600, y: 40 + rnd() * 90, s: 0.7 + rnd() * 0.8 });
  const fences = [];
  for (let i = 0; i < 18; i++) fences.push({ x: i * 140 + rnd() * 40 });
  return { trees, clouds, fences };
}

export class World {
  constructor() {
    this.decor = makeDecor(20261127);
    this.scroll = 0;
    this.farScroll = 0;
  }

  reset() {
    this.scroll = 0;
    this.farScroll = 0;
  }

  update(dt, speed) {
    this.scroll += speed * dt;
    this.farScroll += speed * dt * 0.25;
  }

  drawSky(ctx, stage) {
    const g = ctx.createLinearGradient(0, 0, 0, 540);
    g.addColorStop(0, stage.sky[0]);
    g.addColorStop(1, stage.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 960, 540);
    // Low autumn sun.
    ctx.fillStyle = 'rgba(255, 236, 180, 0.9)';
    ctx.beginPath();
    ctx.arc(820, 90, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 236, 180, 0.35)';
    ctx.beginPath();
    ctx.arc(820, 90, 62, 0, Math.PI * 2);
    ctx.fill();
  }

  drawClouds(ctx) {
    ctx.fillStyle = 'rgba(255, 244, 214, 0.85)';
    for (const c of this.decor.clouds) {
      const x = ((c.x - this.farScroll * 0.4) % 1600 + 1600) % 1600 - 200;
      ctx.beginPath();
      ctx.ellipse(x, c.y, 46 * c.s, 16 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 30 * c.s, c.y + 4, 32 * c.s, 12 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawHills(ctx, stage) {
    ctx.fillStyle = stage.hill;
    ctx.beginPath();
    ctx.moveTo(0, 470);
    for (let x = 0; x <= 960; x += 60) {
      const wx = x + this.farScroll;
      const y = 470 - 46 - Math.sin(wx * 0.006) * 22 - Math.sin(wx * 0.013) * 10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(960, 470);
    ctx.closePath();
    ctx.fill();
  }

  drawTrees(ctx) {
    for (const t of this.decor.trees) {
      const x = ((t.x - this.scroll * 0.6) % 2400 + 2400) % 2400 - 200;
      const s = t.s;
      if (t.kind === 'tree') {
        ctx.fillStyle = '#6e4520';
        ctx.fillRect(x - 4 * s, 470 - 52 * s, 8 * s, 52 * s);
        ctx.fillStyle = '#c25e1e';
        ctx.beginPath();
        ctx.arc(x, 470 - 66 * s, 26 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d97b29';
        ctx.beginPath();
        ctx.arc(x - 14 * s, 470 - 54 * s, 15 * s, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#7d8f3a';
        ctx.beginPath();
        ctx.arc(x, 470 - 14 * s, 20 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  drawGround(ctx, stage) {
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, 470, 960, 70);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 12; i++) {
      const x = ((i * 97 - this.scroll) % 960 + 960) % 960;
      ctx.fillRect(x, 486 + (i % 3) * 14, 26, 4);
    }
    // Fence posts marching past.
    ctx.fillStyle = '#7a4a21';
    for (const f of this.decor.fences) {
      const x = ((f.x - this.scroll) % 2520 + 2520) % 2520 - 100;
      ctx.fillRect(x, 440, 5, 30);
    }
    ctx.fillRect(0, 442, 960, 3);
  }

  // The forest gate: the finish line at 1200 m.
  drawGate(ctx, gateX) {
    if (gateX < -160 || gateX > 1100) return;
    ctx.save();
    ctx.translate(gateX, 470);
    // Two pines and a banner.
    for (const px of [-70, 70]) {
      ctx.fillStyle = '#2f6b2f';
      ctx.beginPath();
      ctx.moveTo(px, -190);
      ctx.lineTo(px - 34, -120);
      ctx.lineTo(px + 34, -120);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px, -150);
      ctx.lineTo(px - 26, -96);
      ctx.lineTo(px + 26, -96);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#6e4520';
      ctx.fillRect(px - 5, -96, 10, 96);
    }
    ctx.fillStyle = '#f6e7c8';
    ctx.fillRect(-78, -186, 156, 34);
    ctx.fillStyle = '#2f6b2f';
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FOREST', 0, -162);
    ctx.restore();
  }

  draw(ctx, stage, gateX) {
    this.drawSky(ctx, stage);
    this.drawClouds(ctx);
    this.drawHills(ctx, stage);
    this.drawTrees(ctx);
    this.drawGround(ctx, stage);
    this.drawGate(ctx, gateX);
  }
}
