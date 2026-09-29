// Player-selected global difficulty.
// The difficulty is a level rank: 0 easy, 1 normal, 2 hard. It feeds the
// opponent's memory capacity (see memoryCapacity in opponent.js) and can be
// reused by any other difficulty-scaled behavior later.

export const EASY = 0;
export const NORMAL = 1;
export const HARD = 2;

// The level selected when the player has not chosen one yet.
export const DEFAULT_DIFFICULTY = NORMAL;

// Ordered options for a difficulty selector (rank ascending).
export const DIFFICULTY_OPTIONS = [
  { level: EASY, label: 'Easy' },
  { level: NORMAL, label: 'Normal' },
  { level: HARD, label: 'Hard' },
];

/**
 * Clamp an arbitrary value into a valid difficulty level (0..2).
 * @param {number} level
 * @returns {number}
 */
export function clampDifficulty(level) {
  if (!Number.isFinite(level) || level < EASY) return EASY;
  if (level > HARD) return HARD;
  return Math.floor(level);
}
