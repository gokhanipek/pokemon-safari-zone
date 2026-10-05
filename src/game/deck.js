// Pure deck model and constraints for the memory duel.
// A deck is { pokemon: string[] } of up to MAX_DISTINCT distinct Pokemon names.
// The concrete card list is derived as COPIES_PER_POKEMON copies of each name.

export const MAX_DISTINCT = 5;
export const COPIES_PER_POKEMON = 2;

// Fixed starter deck given to the player at the start of a session.
// Names must match image files under public/img/<name>.png.
export const STARTER_POKEMON = [
  'pikachu',
  'bulbasaur',
  'charmander',
  'squirtle',
  'jigglypuff',
];

// A fixed opponent deck for Phase 1. Overlaps with the starter on purpose
// (charmander/squirtle) so that eligible steals are a strict subset.
export const DEFAULT_OPPONENT_POKEMON = [
  'eevee',
  'psyduck',
  'snorlax',
  'charmander',
  'squirtle',
];

/**
 * Create the fixed starter deck.
 * @returns {{pokemon: string[]}}
 */
export function createStarterDeck() {
  return { pokemon: [...STARTER_POKEMON] };
}

/**
 * Create the default opponent deck.
 * @returns {{pokemon: string[]}}
 */
export function createOpponentDeck() {
  return { pokemon: [...DEFAULT_OPPONENT_POKEMON] };
}

/**
 * Expand a deck into its concrete card list: COPIES_PER_POKEMON copies per name.
 * @param {{pokemon: string[]}} deck
 * @returns {string[]} card names (length = distinct * COPIES_PER_POKEMON)
 */
export function deckToCards(deck) {
  const cards = [];
  deck.pokemon.forEach((name) => {
    for (let i = 0; i < COPIES_PER_POKEMON; i += 1) {
      cards.push(name);
    }
  });
  return cards;
}

/**
 * Whether a Pokemon may be added to the deck.
 * Rejects a name already owned, and rejects going beyond MAX_DISTINCT.
 * @param {{pokemon: string[]}} deck
 * @param {string} name
 * @returns {boolean}
 */
export function canAddPokemon(deck, name) {
  if (deck.pokemon.includes(name)) {
    return false;
  }
  return deck.pokemon.length < MAX_DISTINCT;
}

/**
 * Return a new deck with the Pokemon added, or the unchanged deck if it cannot be added.
 * @param {{pokemon: string[]}} deck
 * @param {string} name
 * @returns {{pokemon: string[]}}
 */
export function addPokemon(deck, name) {
  if (!canAddPokemon(deck, name)) {
    return deck;
  }
  return { pokemon: [...deck.pokemon, name] };
}

/**
 * Return a new deck with `removeName` swapped out for `addName`.
 * Keeps the deck at the same distinct count. If addName is already owned or
 * removeName is not present, the deck is returned unchanged.
 * @param {{pokemon: string[]}} deck
 * @param {string} removeName
 * @param {string} addName
 * @returns {{pokemon: string[]}}
 */
export function swapPokemon(deck, removeName, addName) {
  if (!deck.pokemon.includes(removeName)) {
    return deck;
  }
  if (deck.pokemon.includes(addName)) {
    return deck;
  }
  return {
    pokemon: deck.pokemon.map((name) => (name === removeName ? addName : name)),
  };
}

/**
 * Return the opponent Pokemon the player does not already own - the eligible steals.
 * @param {{pokemon: string[]}} playerDeck
 * @param {{pokemon: string[]}} opponentDeck
 * @returns {string[]}
 */
export function eligibleSteals(playerDeck, opponentDeck) {
  return opponentDeck.pokemon.filter(
    (name) => !playerDeck.pokemon.includes(name)
  );
}

/**
 * Whether the deck is at its maximum distinct capacity.
 * @param {{pokemon: string[]}} deck
 * @returns {boolean}
 */
export function isDeckFull(deck) {
  return deck.pokemon.length >= MAX_DISTINCT;
}
