// Closed points economy: card point values and scoring helpers.

// Point value per Pokemon (by image-key name). Every Pokemon has a value.
export const CARD_VALUES = {
  pikachu: 5,
  bulbasaur: 3,
  charmander: 3,
  squirtle: 3,
  jigglypuff: 2,
  eevee: 4,
  psyduck: 2,
  snorlax: 6,
};

// Fallback value for any Pokemon not explicitly listed above.
export const DEFAULT_CARD_VALUE = 3;

// Fixed price to buy a tier-1 modifier (Phase 2 minimal shop). Retained as the
// tier-1 price so prior behavior is preserved by the tiered pricing below.
export const MODIFIER_PRICE = 12;

// Per-tier modifier prices (index 0 = tier 1). Higher tiers cost more.
export const MODIFIER_TIER_PRICES = [12, 20, 30];

// Multiplier applied to a card's value to get its marketplace price.
export const CARD_PRICE_MULTIPLIER = 3;

// Pokemon offered for purchase in the marketplace (image-key names).
export const MARKET_CARDS = [
  'pikachu', 'bulbasaur', 'charmander', 'squirtle',
  'jigglypuff', 'eevee', 'psyduck', 'snorlax',
];

/**
 * Price to buy a modifier at a given tier (1..3).
 * @param {number} tier
 * @returns {number}
 */
export function modifierPrice(tier) {
  const idx = Math.max(1, Math.min(3, tier)) - 1;
  return MODIFIER_TIER_PRICES[idx];
}

/**
 * Price to buy a Pokemon card, derived from its value.
 * @param {string} name
 * @returns {number}
 */
export function cardPrice(name) {
  return cardValue(name) * CARD_PRICE_MULTIPLIER;
}

/**
 * The point value of a single Pokemon.
 * @param {string} name
 * @returns {number}
 */
export function cardValue(name) {
  return Object.prototype.hasOwnProperty.call(CARD_VALUES, name)
    ? CARD_VALUES[name]
    : DEFAULT_CARD_VALUE;
}

/**
 * Sum the point value of a list of claimed Pokemon names (one entry per pair).
 * @param {string[]} claimedNames
 * @returns {number}
 */
export function scoreClaimedNames(claimedNames) {
  if (!claimedNames) return 0;
  return claimedNames.reduce((total, name) => total + cardValue(name), 0);
}
