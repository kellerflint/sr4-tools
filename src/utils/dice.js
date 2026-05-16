// SR4 dice mechanics: roll N d6, count 5s and 6s as hits.
// Glitch = half or more of the dice rolled show 1s.
// Critical glitch = glitch with zero hits.
// Rule of Six (exploding 6s) only applies when the roll uses Edge.

export function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

// Pure: given an array of d6 results and the size of the original pool
// (before any explosions), return the hits/glitch summary. Extracted from
// rollPool so the deterministic logic can be unit-tested without mocking
// Math.random.
export function summarizeRolls(rolls, originalPoolSize) {
  const hits = rolls.filter((d) => d >= 5).length;
  const ones = rolls.filter((d) => d === 1).length;
  // Glitch is measured against the ORIGINAL pool size (the dice you
  // started with), not the post-explosion total.
  const isGlitch = originalPoolSize > 0 && ones * 2 >= originalPoolSize;
  const isCriticalGlitch = isGlitch && hits === 0;
  return { hits, ones, isGlitch, isCriticalGlitch };
}

export function rollPool(size, { ruleOfSix = false } = {}) {
  size = Math.max(0, Math.floor(size));
  const rolls = [];
  for (let i = 0; i < size; i++) rolls.push(rollD6());

  if (ruleOfSix) {
    let extras = rolls.filter((d) => d === 6).length;
    while (extras > 0) {
      const next = [];
      for (let i = 0; i < extras; i++) next.push(rollD6());
      rolls.push(...next);
      extras = next.filter((d) => d === 6).length;
    }
  }

  return { rolls, ...summarizeRolls(rolls, size) };
}
