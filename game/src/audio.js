// Tiny synthesized sound effects: no audio files, no network, pure WebAudio.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  ensure() {
    if (this.ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // A short oscillator blip that slides from f0 to f1.
  blip(f0, f1, dur, type = 'sine', vol = 1) {
    if (this.muted || !this.ensure()) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(30, f0), t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // Filtered noise burst (whoosh / thud).
  noise(dur, freq, vol = 1) {
    if (this.muted || !this.ensure()) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t);
  }

  jump() { this.blip(320, 640, 0.16, 'square', 0.5); }
  corn() { this.blip(880, 1320, 0.12, 'sine', 0.7); this.blip(1320, 1760, 0.1, 'sine', 0.4); }
  dash() { this.noise(0.18, 2400, 0.6); }
  hit() { this.noise(0.25, 300, 1); this.blip(160, 60, 0.3, 'sawtooth', 0.7); }
  caught() { this.blip(392, 370, 0.3, 'triangle', 0.7); this.blip(330, 262, 0.45, 'triangle', 0.7); }
  escaped() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.blip(f, f, 0.22, 'triangle', 0.7), i * 110);
    });
  }
  click() { this.blip(660, 660, 0.06, 'square', 0.35); }
}
