// Seeded random numbers (mulberry32) so the screenshot scenes are deterministic:
// the same seed always deals the same orders and the same kitchen.
export function createRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one element of `items` using the seeded rng. */
export function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

/** Fisher-Yates shuffle that returns a new array, driven by the seeded rng. */
export function shuffle(rng, items) {
  const copy = items.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}
