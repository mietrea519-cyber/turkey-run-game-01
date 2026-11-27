// Seeded random numbers so screenshot scenes and runs are reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick an integer in [min, max] from a random function.
export function pickInt(rnd, min, max) {
  return min + Math.floor(rnd() * (max - min + 1));
}

// Pick one element of an array from a random function.
export function pickOne(rnd, arr) {
  return arr[Math.floor(rnd() * arr.length)];
}

// Clamp a value between lo and hi.
export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// Smooth approach: move v toward target by at most step.
export function approach(v, target, step) {
  if (v < target) return Math.min(v + step, target);
  if (v > target) return Math.max(v - step, target);
  return v;
}
