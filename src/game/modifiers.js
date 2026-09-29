// Modifier cards and their pure effects.
//
// A modifier instance is { id, tier } where tier is 1..3.
// Each modifier defines its own per-tier values; tier 3 is always the
// strongest tier of a given modifier, regardless of whether its underlying
// parameter increases or decreases across tiers.

import { shuffle } from './match';

export const BLIND_SPOT = 'blindSpot';
export const SPEED_ROUND = 'speedRound';
export const CHAOS = 'chaos';

export const MIN_TIER = 1;
export const MAX_TIER = 3;

// Per-modifier catalog.
// - kind: how the effect targets ('opponentNextTurn' | 'instant')
// - values: index 0..2 maps to tier 1..3
// - lowerIsStronger: whether a smaller `values` entry is the stronger effect
//   (informational; tier number is the canonical strength ordering)
export const MODIFIERS = {
  [BLIND_SPOT]: {
    id: BLIND_SPOT,
    label: 'Blind Spot',
    kind: 'opponentNextTurn',
    // reveal duration in seconds applied to the opponent's next turn
    values: [0.7, 0.5, 0.3],
    lowerIsStronger: true,
  },
  [SPEED_ROUND]: {
    id: SPEED_ROUND,
    label: 'Speed Round',
    kind: 'opponentNextTurn',
    // time limit in seconds for the opponent's next turn
    values: [6, 4, 2],
    lowerIsStronger: true,
  },
  [CHAOS]: {
    id: CHAOS,
    label: 'Chaos',
    kind: 'instant',
    // no per-tier parameter for the effect itself; tier kept for uniformity
    values: [1, 2, 3],
    lowerIsStronger: false,
  },
};

export const MODIFIER_IDS = [BLIND_SPOT, SPEED_ROUND, CHAOS];

/**
 * Whether an id is a known modifier.
 * @param {string} id
 */
export function isModifier(id) {
  return Object.prototype.hasOwnProperty.call(MODIFIERS, id);
}

/**
 * Clamp a tier into the valid 1..3 range.
 * @param {number} tier
 */
export function clampTier(tier) {
  if (tier < MIN_TIER) return MIN_TIER;
  if (tier > MAX_TIER) return MAX_TIER;
  return tier;
}

/**
 * The per-tier value for a modifier (e.g. Blind Spot reveal seconds).
 * @param {string} id
 * @param {number} tier - 1..3
 * @returns {number|undefined}
 */
export function modifierTierValue(id, tier) {
  const def = MODIFIERS[id];
  if (!def) return undefined;
  return def.values[clampTier(tier) - 1];
}

/**
 * Whether tierA is a stronger tier than tierB for the same modifier.
 * Strength is defined by the tier number: higher tier = stronger.
 * @param {number} tierA
 * @param {number} tierB
 * @returns {boolean}
 */
export function isStrongerTier(tierA, tierB) {
  return clampTier(tierA) > clampTier(tierB);
}

/**
 * The reveal duration (seconds) Blind Spot imposes at a given tier.
 * @param {number} tier
 */
export function blindSpotRevealSeconds(tier) {
  return modifierTierValue(BLIND_SPOT, tier);
}

/**
 * The turn time limit (seconds) Speed Round imposes at a given tier.
 * @param {number} tier
 */
export function speedRoundLimitSeconds(tier) {
  return modifierTierValue(SPEED_ROUND, tier);
}

/**
 * Pure Chaos effect: return a new grid where the positions of unclaimed cards
 * are randomized while claimed cards remain exactly in place.
 *
 * The grid is an array of { cardId, name, faceUp, claimedBy }. Reshuffling
 * moves the (name, faceUp) payload between unclaimed slots but preserves each
 * slot's cardId, so position identity (cardId) is stable and only contents move.
 *
 * @param {Array<{cardId:number,name:string,faceUp:boolean,claimedBy:(string|null)}>} grid
 * @returns {Array} new grid
 */
export function reshuffleUnclaimed(grid) {
  const unclaimedIndexes = [];
  grid.forEach((pos, index) => {
    if (pos.claimedBy === null) {
      unclaimedIndexes.push(index);
    }
  });

  // Collect the movable payloads and shuffle them.
  const payloads = unclaimedIndexes.map((i) => ({
    name: grid[i].name,
    // any face-up unclaimed card is reset face-down by a reshuffle
    faceUp: false,
  }));
  const shuffledPayloads = shuffle(payloads);

  const next = grid.map((pos) => ({ ...pos }));
  unclaimedIndexes.forEach((gridIndex, k) => {
    next[gridIndex].name = shuffledPayloads[k].name;
    next[gridIndex].faceUp = shuffledPayloads[k].faceUp;
  });
  return next;
}
